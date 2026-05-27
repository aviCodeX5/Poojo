import { expect, test } from '@playwright/test';

test.describe('seeded demo committee', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Demo smoke is enough in one browser.');

  test('logs in and reads the demo dataset without mutating it', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email Address').fill('demo.admin@poojasamiti.online');
    await page.getByLabel('Password').fill('Demo@123456');
    await page.getByRole('button', { name: /access dashboard/i }).click();

    await page.waitForURL(/\/DUR-2026-KOL-0001\/dashboard$/, { timeout: 30_000 });
    await expect(page.getByRole('dialog', { name: /welcome to pooja samiti/i })).toBeVisible();
    await page.getByRole('button', { name: /skip tour/i }).click();
    await expect(page.getByText('Pooja Samiti').first()).toBeVisible();
    await expect(page.locator('aside').first()).toHaveClass(/bg-blue-700/);
    await expect(page.getByRole('button', { name: /upgrade/i })).toBeVisible();
    const languageSelector = page.getByLabel('Language').first();
    await expect(languageSelector).toBeVisible();
    await expect(page.getByRole('heading', { name: /Lakeview Sarbojanin Durga/i })).toBeVisible();
    await expect(page.getByText('ID: DUR-2026-KOL-0001')).toBeVisible();

    await languageSelector.selectOption('hi');
    await expect(page.getByRole('link', { name: /डैशबोर्ड/i })).toBeVisible();
    await languageSelector.selectOption('en');

    await page.getByRole('link', { name: /^members$/i }).click();
    await expect(page.getByRole('heading', { name: 'Madhumita Sen' })).toBeVisible();
    await expect(page.getByText('Login code').first()).toBeVisible();
    await expect(page.getByText('SEC2026')).toBeVisible();

    await page.getByRole('link', { name: /chanda & donations/i }).click();
    await expect(page.getByText('Eastern Hardware Stores')).toBeVisible();

    await page.goto('/DUR-2026-KOL-0001/expenses');
    await expect(page.getByText('LED facade advance')).toBeVisible();
  });

  test('member sees finance modules in view-only mode and gets the first-run tour', async ({ page }) => {
    await page.goto('/member-login');
    await page.getByLabel('Phone Number').fill('9876500002');
    await page.getByLabel('Permanent Login Code').fill('SEC2026');
    await page.getByRole('button', { name: /access member dashboard/i }).click();

    await page.waitForURL(/\/DUR-2026-KOL-0001\/dashboard$/, { timeout: 30_000 });
    await expect(page.getByRole('dialog', { name: /welcome to pooja samiti/i })).toBeVisible();
    await page.getByRole('button', { name: /skip tour/i }).click();

    await expect(page.getByRole('link', { name: /chanda & donations/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /expenses/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /upgrade/i })).toBeVisible();

    await page.getByRole('link', { name: /expenses/i }).click();
    await expect(page.getByText('LED facade advance')).toBeVisible();
    await expect(page.getByRole('button', { name: /record expense/i })).toHaveCount(0);
    const writeStatus = await page.evaluate(async () => {
      const token = localStorage.getItem('pooja-samiti.d1SessionToken');
      const response = await fetch('/api/d1/committees/DUR-2026-KOL-0001/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: 1, reason: 'member write attempt' }),
      });
      return response.status;
    });
    expect(writeStatus).toBe(403);

    await page.getByRole('link', { name: /chanda & donations/i }).click();
    await expect(page.getByText('Eastern Hardware Stores')).toBeVisible();
    await expect(page.getByRole('button', { name: /add donation/i })).toHaveCount(0);
  });

  test('edition creation carries forward members and uses success dialog', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email Address').fill('demo.admin@poojasamiti.online');
    await page.getByLabel('Password').fill('Demo@123456');
    await page.getByRole('button', { name: /access dashboard/i }).click();
    await page.waitForURL(/\/DUR-2026-KOL-0001\/dashboard$/, { timeout: 30_000 });
    await page.getByRole('button', { name: /skip tour/i }).click();

    await page.goto('/DUR-2026-KOL-0001/puja-editions');
    await page.getByRole('button', { name: /create new edition/i }).click();
    await expect(page.getByText(/carry forward existing committee members/i)).toBeVisible();
    await expect(page.getByText('Madhumita Sen', { exact: true })).toBeVisible();
    await expect(page.getByLabel(/role for Madhumita Sen/i)).toBeVisible();

    await page.getByLabel('Puja Type').fill('Durga');
    await page.getByLabel('Edition Name (Optional)').fill('Automation Preview Edition');
    await page.getByRole('button', { name: /^create edition$/i }).click();
    await expect(page.getByRole('dialog', { name: /edition created/i })).toBeVisible();
    await expect(page.getByText(/committee members were carried forward/i)).toBeVisible();
  });
});
