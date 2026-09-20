import {
  getDotnetEnvironmentChecklist,
  getNodeConfigurationChecklist,
} from '../api/_lib/runtimeConfig.js'

const targetArgument = process.argv.find(argument => argument.startsWith('--target='))
const target = targetArgument?.split('=')[1]?.toLowerCase() || 'all'

if (!['all', 'node', 'dotnet'].includes(target)) {
  console.error('Unknown target. Use --target=node, --target=dotnet, or --target=all.')
  process.exitCode = 2
} else {
  const groups = [
    ...(target === 'all' || target === 'node' ? [['NODE/VERCEL', getNodeConfigurationChecklist()]] : []),
    ...(target === 'all' || target === 'dotnet' ? [['ASP.NET ENVIRONMENT OVERRIDES', getDotnetEnvironmentChecklist()]] : []),
  ]

  for (const [label, entries] of groups) {
    console.log(label)
    for (const entry of entries) {
      const variables = entry.variables.length ? ` (${entry.variables.join(' / ')})` : ''
      console.log(`${entry.configured ? 'OK' : 'MISSING'} ${entry.name}${variables} — ${entry.requirement}`)
    }
  }
}
