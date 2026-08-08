import { defineConfig } from '@playwright/test'

const previewUrl = 'http://127.0.0.1:4180'

export default defineConfig({
  testDir: './tests/integration',
  testMatch: 'character-performance.spec.js',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    baseURL: previewUrl,
    channel: 'chrome',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm.cmd run preview -- --host 127.0.0.1 --port 4180',
    url: previewUrl,
    reuseExistingServer: false,
    timeout: 30_000,
  },
})
