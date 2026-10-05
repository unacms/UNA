const fs = require('fs')
const path = require('path')

// Yarn may hoist `next` to the repo root, or keep it under apps/next.
const nextBin = [
  path.join(__dirname, 'node_modules/next/dist/bin/next'),
  path.join(__dirname, '../../node_modules/next/dist/bin/next'),
].find((candidate) => fs.existsSync(candidate))

if (!nextBin) {
  throw new Error('next binary not found in apps/next/node_modules or the repo root node_modules')
}

const argEnvIndex = process.argv.indexOf('--env')
let argEnv = (argEnvIndex !== -1 && process.argv[argEnvIndex + 1]) || ''
const env = {
    UNA_API_KEY: process.env.UNA_API_KEY,

    UNA_URL: process.env.UNA_URL,
    NEXT_PUBLIC_UNA_URL: process.env.NEXT_PUBLIC_UNA_URL,

    APP_URL: process.env.APP_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,

    GOOGLE_WEB_CLIENT_ID: process.env.GOOGLE_WEB_CLIENT_ID,
    NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID,

    PROTO: process.env.PROTO,
    HOST: process.env.HOST,
    PORT: process.env.PORT,
    HTTPS: process.env.HTTPS,
}

const RUN_ENV_MAP = {
  local: {
    instances: 2,
    max_memory_restart: '250M',
    ...env
  },
  dev: {
    instances: 2,
    max_memory_restart: '250M',
    ...env
  },
  prod: {
    instances: 4,
    max_memory_restart: '1000M',
    ...env
  }
}

if (!(argEnv in RUN_ENV_MAP)) {
  argEnv = 'prod'
}

module.exports = {
  apps: [
    {
      name: 'neoapp',
      script: nextBin,
      args: 'start',
      instances: RUN_ENV_MAP[argEnv].instances,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: RUN_ENV_MAP[argEnv].max_memory_restart,
      env_local: {
        APP_ENV: 'local'
      },
      env_dev: {
        APP_ENV: 'dev'
      },
      env_prod: {
        APP_ENV: 'prod'
      }
    }
  ]
}
