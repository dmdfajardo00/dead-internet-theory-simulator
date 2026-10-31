import { defineConfig } from 'vitest/config'
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin'

// Tests run inside workerd with the real D1 + Durable Object bindings from wrangler.jsonc.
export default defineConfig({
  plugins: [
    cloudflareTest(async () => ({
      wrangler: { configPath: './wrangler.jsonc' },
      miniflare: { bindings: { TEST_MIGRATIONS: await readD1Migrations('drizzle') } },
    })),
  ],
  test: { setupFiles: ['./test/setup.ts'] },
})
