import { defineConfig } from '@playwright/test'

const previewUrl = 'http://127.0.0.1:4174'

export default defineConfig({
  testDir: './tests/integration',
  testMatch: 'privacy-performance.spec.js',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  reporter: [['list']],
  metadata: { privacyProduction: true },
  use: {
    baseURL: previewUrl,
    channel: 'chrome',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm.cmd run preview -- --host 127.0.0.1 --port 4174',
    url: previewUrl,
    reuseExistingServer: false,
    timeout: 30_000,
  },
})