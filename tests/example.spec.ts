import { expect, test } from '@playwright/test';

test('landing page exposes the main entry points', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/SamitiBook/i);
  await expect(page.getByText('SamitiBook').first()).toBeVisible();
  await expect(page.getByText('Transparent Festival Management').first()).toBeVisible();
  await expect(page.getByLabel('Language').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /register committee/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /admin portal access/i }).first()).toBeVisible();
});

test('registration entry explains rules before opening the form', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /register committee/i }).click();
  await expect(page.getByRole('dialog', { name: /before you register/i })).toBeVisible();
  await expect(page.getByText(/one primary admin/i)).toBeVisible();
  await expect(page.getByText(/should not be registered more than once/i)).toBeVisible();

  await page.getByRole('button', { name: /i understand, continue/i }).click();
  await expect(page).toHaveURL(/\/register$/);
});

test('member login entry explains member access before opening login', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /member login/i }).click();
  await expect(page.getByRole('dialog', { name: /before member login/i })).toBeVisible();
  await expect(page.getByText(/phone number added by your committee admin/i)).toBeVisible();
  await expect(page.getByText(/do not share your permanent login code/i)).toBeVisible();

  await page.getByRole('button', { name: /i understand, continue/i }).click();
  await expect(page).toHaveURL(/\/member-login$/);
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

test('member login uses mobile number and permanent code', async ({ page }) => {
  await page.goto('/member-login');

  await expect(page.getByRole('heading', { name: /member sync/i })).toBeVisible();
  await expect(page.getByText(/mobile number and permanent code/i)).toBeVisible();
  await expect(page.getByLabel('Phone Number')).toBeVisible();
  await expect(page.getByLabel('Permanent Login Code')).toBeVisible();
  await expect(page.getByRole('button', { name: /access member dashboard/i })).toBeVisible();
});

test('member can access dashboard with permanent code', async ({ page }) => {
  await page.goto('/member-login');

  await page.getByLabel('Phone Number').fill('9876500002');
  await page.getByLabel('Permanent Login Code').fill('SEC2026');
  await page.getByRole('button', { name: /access member dashboard/i }).click();

  await page.waitForURL(/\/DUR-2026-KOL-0001\/dashboard$/, { timeout: 30_000 });
  await expect(page.getByText('Madhumita Sen')).toBeVisible();
  await expect(page.getByText('SECRETARY').first()).toBeVisible();
});

test('registration uses OpenLayers map without Google Maps setup', async ({ page }) => {
  await page.goto('/register');

  await expect(page.getByText(/OpenLayers map powered by OpenStreetMap/i)).toBeVisible();
  await expect(page.getByPlaceholder(/Search for pandal location/i)).toBeVisible();
});
