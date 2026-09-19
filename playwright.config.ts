import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir:'./tests/e2e', fullyParallel:false, workers:1, retries:0,
  use: { baseURL:'http://127.0.0.1:3173', trace:'retain-on-failure', channel: process.env.PLAYWRIGHT_CHANNEL || undefined },
  projects:[{name:'desktop',use:{...devices['Desktop Chrome']}},{name:'mobile',use:{...devices['iPhone 13'],defaultBrowserType:'chromium'}}],
  webServer:{ command:'node node_modules/next/dist/bin/next start apps/web --hostname 127.0.0.1 --port 3173',url:'http://127.0.0.1:3173/api/health',reuseExistingServer:false,timeout:60000,
    env:{ENABLE_FICTIONAL_PREVIEW:'true',MED_ASSISTANT_PREVIEW_ONLY:'true',SUPABASE_URL:'',SUPABASE_PUBLISHABLE_KEY:''} },
});
