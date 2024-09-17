const argEnvIndex = process.argv.indexOf('--env')
let argEnv = (argEnvIndex !== -1 && process.argv[argEnvIndex + 1]) || ''
const env = {
    UNA_API_KEY: process.env.UNA_API_KEY,

    UNA_URL: process.env.UNA_URL,
    NEXT_PUBLIC_UNA_URL: process.env.NEXT_PUBLIC_UNA_URL,

    APP_URL: process.env.APP_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,

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
      //script: './../../node_modules/next/dist/bin/next',
      script: './node_modules/next/dist/bin/next',
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
