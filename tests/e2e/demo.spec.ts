import { expect, test } from '@playwright/test';

test.describe('seeded demo committee', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Demo smoke is enough in one browser.');

  test('logs in and reads the demo dataset without mutating it', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email Address').fill('demo.admin@poojo.app');
    await page.getByLabel('Password').fill('Demo@123456');
    await page.getByRole('button', { name: /access dashboard/i }).click();

    await page.waitForURL(/\/DUR-2026-KOL-0001\/dashboard$/, { timeout: 30_000 });
    await expect(page.getByText('Lakeview Sarbojanin Durga Puja Committee')).toBeVisible();
    await expect(page.getByText('ID: DUR-2026-KOL-0001')).toBeVisible();

    await page.getByRole('link', { name: /^members$/i }).click();
    await expect(page.getByRole('heading', { name: 'Madhumita Sen' })).toBeVisible();

    await page.getByRole('link', { name: /chanda & donations/i }).click();
    await expect(page.getByText('Eastern Hardware Stores')).toBeVisible();

    await page.goto('/DUR-2026-KOL-0001/expenses');
    await expect(page.getByText('LED facade advance')).toBeVisible();
  });
});
