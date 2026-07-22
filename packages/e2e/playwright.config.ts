import { defineConfig, devices } from '@playwright/test';

const apps = [
  { name: 'admin', port: 3001, filter: '@pedidosgo/admin-web' },
  { name: 'merchant', port: 3002, filter: '@pedidosgo/merchant-web' },
  { name: 'driver', port: 3003, filter: '@pedidosgo/driver-pwa' },
  { name: 'tracking', port: 3004, filter: '@pedidosgo/customer-tracking' },
] as const;

const placeholderEnv = {
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? 'RapideX',
  NEXT_PUBLIC_APP_SHORT_NAME: process.env.NEXT_PUBLIC_APP_SHORT_NAME ?? 'RapideX',
  NEXT_PUBLIC_SUPABASE_URL:
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder_anon_key',
};

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  timeout: 30_000,
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: apps.map((app) => ({
    name: app.name,
    use: {
      ...devices['Desktop Chrome'],
      baseURL: `http://127.0.0.1:${app.port}`,
    },
  })),
  webServer: process.env.SKIP_E2E_SERVERS
    ? undefined
    : apps.map((app) => ({
        command: `pnpm --filter ${app.filter} start`,
        url: `http://127.0.0.1:${app.port}/api/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        cwd: '../..',
        env: {
          ...process.env,
          ...placeholderEnv,
        },
      })),
});
