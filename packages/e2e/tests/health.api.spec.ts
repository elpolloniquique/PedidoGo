import { test, expect } from '@playwright/test';

test('GET /api/health responde ok', async ({ request, baseURL }) => {
  const res = await request.get(`${baseURL}/api/health`);
  expect(res.ok()).toBeTruthy();

  const body = (await res.json()) as { ok: boolean; app: string };
  expect(body.ok).toBe(true);
  expect(body.app).toBeTruthy();
});
