import { test, expect } from '@playwright/test';

test('página pública principal carga', async ({ page }) => {
  const project = test.info().project.name;

  if (project === 'tracking') {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Seguimiento del Pedido' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ver seguimiento' })).toBeVisible();
    return;
  }

  if (project === 'merchant') {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Panel del Comercio' })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    return;
  }

  if (project === 'admin') {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Panel Superadministrador' })).toBeVisible();
    return;
  }

  if (project === 'driver') {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'App del Repartidor' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Regístrate' })).toBeVisible();
  }
});
