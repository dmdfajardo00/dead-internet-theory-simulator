import { applyD1Migrations, env } from 'cloudflare:test'

declare global {
  interface Env { TEST_MIGRATIONS: import('cloudflare:test').D1Migration[] }
}

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
