import { expect, test } from '@playwright/test';

test('landing page exposes the main entry points', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/PujaCommittee|Poojo|React/i);
  await expect(page.getByRole('link', { name: /register committee/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /admin portal access/i })).toBeVisible();
});

test('admin login screen renders without external dependencies', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('heading', { name: /admin portal/i })).toBeVisible();
  await expect(page.getByLabel('Email Address')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
});
