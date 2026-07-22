import { defineConfig } from '@playwright/test'

const webUrl = 'http://127.0.0.1:4173'

export default defineConfig({
  testDir: './tests/integration',
  globalSetup: './tests/integration/global-setup.mjs',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  reporter: [['list']],
  use: {
    baseURL: webUrl,
    channel: 'chrome',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
})
