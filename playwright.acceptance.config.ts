import { defineConfig, devices } from '@playwright/test';

// The signed-in acceptance run. Separate from playwright.config.ts on purpose: that one
// starts the app with NO backend so it can test the unconfigured and anonymous paths, and
// this one starts it against the real project so a real person can sign in.
//
// Credentials come from the environment the operator sets themselves. Nothing here reads a
// password from a file in the repository, and none is ever printed.
export default defineConfig({
  testDir: './tests/acceptance', fullyParallel: false, workers: 1, retries: 0,
  use: { baseURL: 'http://127.0.0.1:3174', trace: 'retain-on-failure', channel: process.env.PLAYWRIGHT_CHANNEL || undefined },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node --env-file=apps/web/.env.local node_modules/next/dist/bin/next start apps/web --hostname 127.0.0.1 --port 3174',
    url: 'http://127.0.0.1:3174/api/health', reuseExistingServer: false, timeout: 60000,
    env: { ENABLE_FICTIONAL_PREVIEW: 'false' },
  },
});
