const valueOf = (environment, name) => String(environment[name] || '').trim()
const firstValue = (environment, names) => names.map(name => valueOf(environment, name)).find(Boolean) || ''

export const isProductionRuntime = (environment = process.env) =>
  valueOf(environment, 'NODE_ENV').toLowerCase() === 'production' ||
  valueOf(environment, 'VERCEL_ENV').toLowerCase() === 'production'

const item = (name, variables, configured, requirement, target = 'Node/Vercel') => ({
  name,
  variables,
  configured,
  requirement,
  target,
})

export const getNodeConfigurationChecklist = (environment = process.env) => {
  const databaseVariables = [
    'DATABASE_URL',
    'NEON_DATABASE_URL',
    'CONNECTIONSTRINGS__OPMWIKI',
    'ConnectionStrings__OpmWiki',
  ]
  const jwtVariables = ['ADMINAUTH__JWTSIGNINGKEY', 'JWT_SIGNING_KEY']
  const bankVariables = ['BANKTRANSFER__BANKID', 'BANKTRANSFER__ACCOUNTNUMBER', 'BANKTRANSFER__ACCOUNTNAME']

  return [
    item('PostgreSQL connection', databaseVariables, Boolean(firstValue(environment, databaseVariables)), 'required for dynamic API routes'),
    item('JWT signing key', jwtVariables, firstValue(environment, jwtVariables).length >= 32, 'required in production'),
    item('Admin username', ['ADMINAUTH__USERNAME'], Boolean(valueOf(environment, 'ADMINAUTH__USERNAME')), 'required in production'),
    item('Admin password', ['ADMINAUTH__PASSWORD'], Boolean(valueOf(environment, 'ADMINAUTH__PASSWORD')), 'required in production'),
    item('Public application URL', ['PUBLIC_APP_URL'], Boolean(valueOf(environment, 'PUBLIC_APP_URL')), 'required for canonical email links'),
    item('Email delivery', ['EMAIL__RESENDAPIKEY', 'EMAIL__FROM'],
      Boolean(firstValue(environment, ['EMAIL__RESENDAPIKEY', 'RESEND_API_KEY'])) &&
      Boolean(firstValue(environment, ['EMAIL__FROM', 'RESEND_FROM'])),
      'required only when verification/reset delivery is enabled'),
    item('Bank transfer destination', bankVariables, bankVariables.every(name => Boolean(valueOf(environment, name))), 'required only when bank top-up is enabled'),
    item('SePay webhook secret', ['SEPAY__WEBHOOKSECRET'], Boolean(valueOf(environment, 'SEPAY__WEBHOOKSECRET')), 'required only when SePay webhook is enabled'),
    item('CORS', [], true, 'not required for same-origin Vercel Functions'),
  ]
}

export const getDotnetEnvironmentChecklist = (environment = process.env) => {
  const bankVariables = ['BANKTRANSFER__BANKID', 'BANKTRANSFER__ACCOUNTNUMBER', 'BANKTRANSFER__ACCOUNTNAME']
  return [
    item('PostgreSQL connection', ['ConnectionStrings__OpmWiki'], Boolean(valueOf(environment, 'ConnectionStrings__OpmWiki')), 'required in production', 'ASP.NET'),
    item('JWT signing key', ['ADMINAUTH__JWTSIGNINGKEY'], valueOf(environment, 'ADMINAUTH__JWTSIGNINGKEY').length >= 32, 'required outside Development', 'ASP.NET'),
    item('Admin username', ['ADMINAUTH__USERNAME'], Boolean(valueOf(environment, 'ADMINAUTH__USERNAME')), 'required outside Development', 'ASP.NET'),
    item('Admin password', ['ADMINAUTH__PASSWORD'], Boolean(valueOf(environment, 'ADMINAUTH__PASSWORD')), 'required outside Development', 'ASP.NET'),
    item('Public application URL', ['PublicAppUrl'], Boolean(valueOf(environment, 'PublicAppUrl')), 'required for canonical email links', 'ASP.NET'),
    item('Email delivery', ['EMAIL__RESENDAPIKEY', 'EMAIL__FROM'], ['EMAIL__RESENDAPIKEY', 'EMAIL__FROM'].every(name => Boolean(valueOf(environment, name))), 'required only when verification/reset delivery is enabled', 'ASP.NET'),
    item('Bank transfer destination', bankVariables, bankVariables.every(name => Boolean(valueOf(environment, name))), 'required only when bank top-up is enabled', 'ASP.NET'),
    item('SePay webhook secret', ['SEPAY__WEBHOOKSECRET'], Boolean(valueOf(environment, 'SEPAY__WEBHOOKSECRET')), 'required only when SePay webhook is enabled', 'ASP.NET'),
    item('CORS origins', ['CORS__ALLOWEDORIGINS__0'], Boolean(valueOf(environment, 'CORS__ALLOWEDORIGINS__0')), 'required when frontend and API use different origins', 'ASP.NET'),
  ]
}

export const assertNodeJwtConfiguration = (environment = process.env) => {
  if (!isProductionRuntime(environment)) return
  const key = firstValue(environment, ['ADMINAUTH__JWTSIGNINGKEY', 'JWT_SIGNING_KEY'])
  if (key.length < 32) {
    throw new Error('Production authentication configuration is incomplete: ADMINAUTH__JWTSIGNINGKEY must contain at least 32 characters.')
  }
}

export const assertNodeAdminConfiguration = (environment = process.env) => {
  if (!isProductionRuntime(environment)) return
  const missing = ['ADMINAUTH__USERNAME', 'ADMINAUTH__PASSWORD']
    .filter(name => !valueOf(environment, name))
  if (missing.length) {
    throw new Error(`Production admin authentication configuration is incomplete: ${missing.join(', ')}.`)
  }
}
