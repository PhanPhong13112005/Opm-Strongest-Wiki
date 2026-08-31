import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import test from 'node:test'

import { getDotnetEnvironmentChecklist } from '../api/_lib/runtimeConfig.js'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = relativePath => readFileSync(join(root, relativePath), 'utf8')

const parseTableAfter = (markdown, heading) => {
  const lines = markdown.split(/\r?\n/)
  const headingIndex = lines.findIndex(line => line.trim() === heading)
  assert.notEqual(headingIndex, -1, `Missing heading: ${heading}`)
  const tableStart = lines.findIndex((line, index) => index > headingIndex && /^\s*\|/.test(line))
  assert.notEqual(tableStart, -1, `Missing table after: ${heading}`)
  const tableLines = []
  for (let index = tableStart; index < lines.length && /^\s*\|/.test(lines[index]); index += 1) {
    tableLines.push(lines[index])
  }
  assert.ok(tableLines.length >= 3, `Incomplete table after: ${heading}`)
  return tableLines.slice(2).map(line => line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map(cell => cell.trim()))
}

test('production deployment contracts never enable startup migration or seed', () => {
  const productionDocs = [
    'backend/DEPLOYMENT.md',
    'docs/PRODUCTION_ARCHITECTURE.md',
    'docs/DEPLOYMENT_RUNBOOK.md',
    'docs/CONFIGURATION.md',
  ]
  const enabledMigration = /Database__MigrateOnStartup\s*=\s*true/i
  const enabledSeed = /Database__SeedWhenEmpty\s*=\s*true/i

  for (const path of productionDocs) {
    const content = read(path)
    assert.doesNotMatch(content, enabledMigration, `${path} enables production startup migration`)
    assert.doesNotMatch(content, enabledSeed, `${path} enables production startup seed`)
    assert.match(content, /Database__MigrateOnStartup\s*=\s*false/i, `${path} must state migration=false`)
    assert.match(content, /Database__SeedWhenEmpty\s*=\s*false/i, `${path} must state seed=false`)
  }
})

test('staging keeps runtime migration and seed disabled and emits defensive API headers', () => {
  const staging = read('backend/src/OpmWiki.Api/appsettings.Staging.json')
  const program = read('backend/src/OpmWiki.Api/Program.cs')

  const parsed = JSON.parse(staging)
  assert.equal(parsed.Database?.MigrateOnStartup, false)
  assert.equal(parsed.Database?.SeedWhenEmpty, false)
  assert.match(program, /AddHsts\(/)
  assert.match(program, /UseHsts\(\)/)
  for (const header of [
    'Content-Security-Policy',
    'Permissions-Policy',
    'Referrer-Policy',
    'X-Content-Type-Options',
    'X-Frame-Options',
  ]) assert.ok(program.includes(header), `Missing non-Development API header: ${header}`)
  assert.match(program, /CancelAfter\(TimeSpan\.FromSeconds\(5\)\)/)
})

test('PublicAppUrl validator matches ASP.NET runtime and documents only the Compose wrapper', () => {
  const program = read('backend/src/OpmWiki.Api/Program.cs')
  const compose = read('backend/docker-compose.yml')
  const configuration = read('docs/CONFIGURATION.md')

  assert.match(program, /builder\.Configuration\["PublicAppUrl"\]/)

  const exactEntry = getDotnetEnvironmentChecklist({ PublicAppUrl: 'configured' })
    .find(entry => entry.name === 'Public application URL')
  assert.deepEqual(exactEntry?.variables, ['PublicAppUrl'])
  assert.equal(exactEntry?.configured, true)

  const wrongEntry = getDotnetEnvironmentChecklist({ PUBLIC_APP_URL: 'wrapper-only' })
    .find(entry => entry.name === 'Public application URL')
  assert.equal(wrongEntry?.configured, false)

  assert.match(compose, /PublicAppUrl:\s*\$\{PUBLIC_APP_URL(?::-[^}]*)?\}/)
  assert.match(configuration, /PUBLIC_APP_URL \(Compose input\) -> PublicAppUrl \(ASP\.NET configuration key\)/)
})

test('architecture authority table freezes ASP.NET, EF, auth, payment and rejects permanent split', () => {
  const architecture = read('docs/PRODUCTION_ARCHITECTURE.md')
  const rows = parseTableAfter(architecture, '## Architecture authority')
  const valueFor = concern => rows.find(row => row[0] === concern)?.[1] || ''

  assert.match(valueFor('Authoritative backend'), /ASP\.NET Core/)
  assert.match(valueFor('Schema and migration owner'), /EF Core only/)
  assert.match(valueFor('Authentication owner'), /ASP\.NET Core only/)
  assert.match(valueFor('Payment and ledger owner'), /ASP\.NET Core only/)
  assert.match(valueFor('Node/Vercel Functions'), /LEGACY.*TRANSITIONAL.*ROLLBACK ONLY/i)
  assert.match(valueFor('Permanent per-feature backend split'), /Rejected/i)
})

test('route matrix covers required groups and assigns every final owner to ASP.NET', () => {
  const ownership = read('docs/API_OWNERSHIP.md')
  const rows = parseTableAfter(ownership, '## Route ownership matrix')
  const required = [
    '/api/auth/*', '/api/characters/*', '/api/events/*', '/api/release-schedule/*',
    '/api/mastery/*', '/api/keepsakes/*', '/api/insignias/*', '/api/backgears/*',
    '/api/tactics/*', '/api/tier-ranking/*', '/api/forum/*', '/api/event-comments/*',
    '/api/admin/*', '/api/top-up/*', '/api/payments/*', '/api/webhooks/sepay', '/api/advisor/*',
  ]

  for (const route of required) {
    const row = rows.find(candidate => candidate[0].includes(route))
    assert.ok(row, `Missing route ownership row: ${route}`)
    assert.match(row[3], /ASP\.NET/, `Final owner drift for ${route}`)
  }

  assert.match(ownership, /current canonical Node path is plural `\/api\/tier-rankings\/\*`/i)
  assert.match(ownership, /`\/api\/events\/\{eventId\}\/comments`/)
  assert.match(ownership, /`PORT REQUIRED`/)
})

test('auth contract matches source JWT and PBKDF2 invariants', () => {
  const contract = read('docs/AUTH_CONTRACT.md')
  const tokenSource = read('backend/src/OpmWiki.Api/Security/AdminAuth.cs')
  const passwordSource = read('backend/src/OpmWiki.Api/Security/PasswordHasher.cs')

  for (const value of ['OpmWiki.Api', 'OpmWiki.Web', 'HS256', 'PBKDF2-HMAC-SHA256', '120,000']) {
    assert.ok(contract.includes(value), `Auth contract missing ${value}`)
  }
  assert.match(tokenSource, /issuer:\s*"OpmWiki\.Api"/)
  assert.match(tokenSource, /audience:\s*"OpmWiki\.Web"/)
  assert.match(tokenSource, /SecurityAlgorithms\.HmacSha256/)
  assert.match(passwordSource, /Iterations\s*=\s*120_000/)
  assert.match(contract, /NOT an access-token refresh endpoint/)
  assert.match(contract, /\/api\/auth\/email-verification\/request/)
  assert.match(contract, /\/api\/auth\/email-verification\/confirm/)
})

test('payment contract enforces one ASP.NET writer and one final webhook', () => {
  const payment = read('docs/PAYMENT_OWNERSHIP.md')
  assert.match(payment, /Final payment writer count:\s*\*\*ONE\*\*/)
  assert.match(payment, /Final payment writer:\s*\*\*ASP\.NET Core\*\*/)
  assert.match(payment, /exactly one `POST \/api\/webhooks\/sepay`/)
  assert.match(payment, /provider plus external transaction identifier/i)
  assert.match(payment, /same PostgreSQL transaction/i)
  assert.match(payment, /no permitted period in which Node and ASP\.NET both write/i)
})

test('Tier and Admin Phase 2 contracts remain frozen and report schema-gated implementation', () => {
  const ownership = read('docs/API_OWNERSHIP.md')
  for (const value of [
    'TierRankingVote', 'TierRankingBaseline', 'Asia/Ho_Chi_Minh',
    'GET /api/admin/tier-ranking/stats',
    'PUT /api/admin/tier-ranking/{characterId}/base-votes',
    'GET /api/admin/community/feed',
    'PUT /api/admin/community/topics/{id}/lock',
    'DELETE /api/admin/community/topics/{id}',
    'DELETE /api/admin/community/comments/{id}',
  ]) assert.ok(ownership.includes(value), `Missing frozen contract: ${value}`)

  assert.match(ownership, /Phase 2 adds the controllers, application services\/contracts, domain models, repositories/)
  assert.match(ownership, /adds or applies no EF migration/)
  assert.match(ownership, /503 SchemaNotReady/)
})

test('production cannot silently activate Admin workspace development mocks', () => {
  const architecture = read('docs/PRODUCTION_ARCHITECTURE.md')
  const adminApi = read('src/services/adminApi.js')
  const mockBackedExports = [
    'getAdminTierRankingStats',
    'updateAdminBaseVotes',
    'getAdminCommunityFeed',
    'toggleAdminForumTopicLock',
    'deleteAdminForumTopic',
    'deleteAdminEventComment',
  ]

  assert.match(architecture, /Production frontend \*\*MUST NOT silently use development mock data\*\*/)
  for (const name of mockBackedExports) {
    const start = adminApi.indexOf(`export const ${name}`)
    assert.notEqual(start, -1, `Missing Admin API export ${name}`)
    const next = adminApi.indexOf('\nexport const ', start + 1)
    const block = adminApi.slice(start, next === -1 ? undefined : next)
    assert.match(block, /import\.meta\.env\?\.DEV/, `${name} mock is not development-guarded`)
    assert.match(block, /throw error/, `${name} silently falls back in production`)
  }
})

test('release runbook contains all four gates and final frontend routing contract', () => {
  const runbook = read('docs/DEPLOYMENT_RUNBOOK.md')
  const architecture = read('docs/PRODUCTION_ARCHITECTURE.md')
  for (const heading of ['## Phase 2 gate', '## Phase 3 gate', '## Staging gate', '## Production cutover gate']) {
    assert.ok(runbook.includes(heading), `Missing release gate: ${heading}`)
  }
  assert.match(runbook, /No dual Node\/ASP\.NET writer/i)
  assert.match(architecture, /VITE_API_BASE_URL/)
  assert.match(architecture, /All dynamic frontend services use one ASP\.NET origin/)
})

test('public staging artifacts keep Vercel static-only and EF migrations separate from the API runtime', () => {
  const apiDockerfile = read('Dockerfile')
  const migratorDockerfile = read('Dockerfile.migrator')
  const vercel = JSON.parse(read('vercel.json'))
  const vercelIgnore = read('.vercelignore')
  const dockerIgnore = read('.dockerignore')
  const viteEnvironmentNames = [...read('.env.example').matchAll(/^\s*(VITE_[A-Z0-9_]+)\s*=/gm)]
    .map(match => match[1])
  const migrations = readdirSync(join(root, 'backend/src/OpmWiki.Infrastructure/Persistence/Migrations'))
    .filter(name => /^\d+_.+\.cs$/.test(name) && !name.endsWith('.Designer.cs'))

  assert.equal(vercel.framework, 'vite')
  assert.equal(vercel.buildCommand, 'npm run build')
  assert.equal(vercel.outputDirectory, 'dist')
  assert.equal(Object.hasOwn(vercel, 'functions'), false)
  assert.equal(vercel.rewrites.length, 1)
  assert.doesNotMatch(JSON.stringify(vercel), /api\/(?:index|migrate|sepay)|\/api\/:path/i)
  assert.match(vercelIgnore, /^\/\*$/m)
  assert.match(vercelIgnore, /^!src\/\*\*$/m)
  assert.doesNotMatch(vercelIgnore, /^!api(?:\/|$)/m)
  assert.deepEqual(viteEnvironmentNames, ['VITE_API_BASE_URL'])

  assert.match(dockerIgnore, /^\.env\.\*$/m)
  assert.match(dockerIgnore, /^api$/m)
  assert.match(dockerIgnore, /^\*\.dump$/m)
  assert.match(apiDockerfile, /ENV PORT=8080/)
  assert.match(apiDockerfile, /127\.0\.0\.1:\$\{PORT\}\/api\/health/)
  assert.match(apiDockerfile, /USER \$APP_UID/)
  assert.match(apiDockerfile, /ENTRYPOINT \["dotnet", "OpmWiki\.Api\.dll"\]/)

  assert.equal(migrations.length, 11)
  assert.match(migratorDockerfile, /dotnet-ef migrations bundle/)
  assert.match(migratorDockerfile, /--self-contained/)
  assert.match(migratorDockerfile, /ENTRYPOINT \["\/app\/efbundle"/)
  assert.match(migratorDockerfile, /ConnectionStrings__OpmWiki/)
  assert.doesNotMatch(migratorDockerfile, /SeedWhenEmpty|--seed-data/)
})
