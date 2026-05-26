import { expect, test } from '@playwright/test';

test('landing page exposes the main entry points', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/SamitiBook/i);
  await expect(page.getByText('SamitiBook').first()).toBeVisible();
  await expect(page.getByText('Transparent Festival Management').first()).toBeVisible();
  await expect(page.getByLabel('Language').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /register committee/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /admin portal access/i }).first()).toBeVisible();
});

test('admin login screen renders without external dependencies', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByText('SamitiBook').first()).toBeVisible();
  await expect(page.getByText('Transparent Festival Management').first()).toBeVisible();
  await expect(page.getByLabel('Language').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /admin portal/i })).toBeVisible();
  await expect(page.getByLabel('Email Address')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
});
