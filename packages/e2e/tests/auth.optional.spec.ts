import { test, expect } from '@playwright/test';

/**
 * Solo corre si defines credenciales en .env.local o en CI:
 * E2E_MERCHANT_EMAIL, E2E_MERCHANT_PASSWORD
 */
test('merchant login (opcional)', async ({ page }) => {
  test.skip(test.info().project.name !== 'merchant', 'Solo proyecto merchant');

  const email = process.env.E2E_MERCHANT_EMAIL;
  const password = process.env.E2E_MERCHANT_PASSWORD;
  test.skip(!email || !password, 'Sin E2E_MERCHANT_EMAIL / E2E_MERCHANT_PASSWORD');

  await page.goto('/login');
  await page.locator('input[name="email"]').fill(email!);
  await page.locator('input[name="password"]').fill(password!);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  await expect(page).toHaveURL(/\/(orders)?$/, { timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Pedidos' })).toBeVisible();
});
