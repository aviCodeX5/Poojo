import { expect, test, type Page } from '@playwright/test';

test.describe.serial('PujaCommittee full role and operations flow', () => {
  test.setTimeout(180_000);
  test.skip(({ browserName }) => browserName !== 'chromium', 'Firebase-backed E2E data setup is exercised in Chromium.');

  const runId = `${Date.now()}`;
  const suffix = runId.slice(-6);
  const committee = {
    name: `E2E Puja Committee ${suffix}`,
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700001',
    pandal: 'Park Street, Kolkata',
    adminPhone: `98${suffix.padStart(8, '0')}`.slice(0, 10),
    adminEmail: `poojo.e2e.${runId}@example.com`,
    password: 'Test@123456',
  };

  const data = {
    cashier: { name: `Cashier ${suffix}`, phone: `97${suffix.padStart(8, '0')}`.slice(0, 10), role: 'CASHIER' },
    donationLead: { name: `Donation Lead ${suffix}`, phone: `96${suffix.padStart(8, '0')}`.slice(0, 10), role: 'DONATION_INCHARGE' },
    culturalLead: { name: `Cultural Lead ${suffix}`, phone: `95${suffix.padStart(8, '0')}`.slice(0, 10), role: 'CULTURAL_INCHARGE' },
    chandaDonor: `Chanda Donor ${suffix}`,
    donationDonor: `Donation Donor ${suffix}`,
    expenseReason: `Lighting advance ${suffix}`,
    inventoryItem: `LED Par Can ${suffix}`,
    culturalEvent: `Cultural Night ${suffix}`,
    pujaName: `Pushpanjali ${suffix}`,
    broadcast: `Morning anjali starts at 8 AM - ${suffix}`,
    customRole: `TREASURER_${suffix}`,
    edition: `Autumn Edition ${suffix}`,
  };

  let committeeId = '';

  test('registers a committee, logs in, creates dataset, exercises role-gated modules, and logs out', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /register committee/i }).click();
    await expect(page.getByRole('heading', { name: /register committee/i })).toBeVisible();

    await page.getByLabel('Committee Name').fill(committee.name);
    await selectByLabel(page, 'Puja Type', 'Durga');
    await page.getByLabel('City').fill(committee.city);
    await page.getByLabel('State').fill(committee.state);
    await page.getByLabel('Pincode').fill(committee.pincode);
    await page.getByLabel('Admin Phone').fill(committee.adminPhone);
    await page.getByPlaceholder('Search for pandal location...').fill(committee.pandal);
    await page.getByRole('button', { name: /^search$/i }).click();
    await expect(page.getByText(/selected location:/i)).toBeVisible({ timeout: 15_000 });
    await page.getByLabel('Admin Email').fill(committee.adminEmail);
    await page.getByLabel('Password').fill(committee.password);
    await page.getByRole('button', { name: /create committee/i }).click();

    await expect(page.getByText('Registration Successful!')).toBeVisible({ timeout: 20_000 });
    committeeId = (await page.locator('.font-mono').filter({ hasText: /^DUR-/ }).first().innerText()).trim();
    expect(committeeId).toMatch(/^DUR-\d{4}-KOL-\d{4}$/);

    await page.getByRole('link', { name: /go to dashboard/i }).click();
    await expect(page.getByText(committee.name)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(`ID: ${committeeId}`)).toBeVisible();

    await logout(page);
    await adminLogin(page);

    await addMember(page, data.cashier);
    await addMember(page, data.donationLead);
    await addMember(page, data.culturalLead);

    await page.getByRole('link', { name: /role management/i }).click();
    await expect(page.getByRole('heading', { name: 'Role Management' })).toBeVisible();
    await page.getByRole('button', { name: /create custom role/i }).click();
    await page.getByLabel('Role Name').fill(data.customRole);
    await page.getByLabel('Description').fill('Handles reconciliation and sponsor reporting');
    await withAcceptedDialog(page, () => page.getByRole('button', { name: /^create role$/i }).click());
    await expect(page.getByText(data.customRole)).toBeVisible();
    await expect(page.getByText(data.cashier.name)).toBeVisible();

    await page.getByRole('link', { name: /puja editions/i }).click();
    await expect(page.getByRole('heading', { name: 'Puja Editions' })).toBeVisible();
    await page.getByRole('button', { name: /create new edition/i }).click();
    await page.getByLabel('Year').fill('2026');
    await page.getByLabel('Puja Type').fill('Durga');
    await page.getByLabel('Edition Name (Optional)').fill(data.edition);
    await page.getByLabel('Budget').fill('750000');
    await withAcceptedDialog(page, () => page.getByRole('button', { name: /^create edition$/i }).click());
    await expect(page.getByText(data.edition)).toBeVisible();

    await page.getByRole('link', { name: /chanda & donations/i }).click();
    await expect(page.getByRole('heading', { name: /donations/i })).toBeVisible();
    await page.getByRole('button', { name: /add donation/i }).click();
    await page.getByLabel('Donor Name').fill(data.donationDonor);
    await page.getByLabel('Donor Phone').fill('9123456780');
    await selectByLabel(page, 'Donation Type', 'Cash');
    await page.getByLabel('Amount').fill('10000');
    await withAcceptedDialog(page, () => page.getByRole('button', { name: /save donation/i }).click());
    await expect(page.getByText(data.donationDonor)).toBeVisible();

    await page.goto(`/${committeeId}/chanda`);
    await expect(page.getByRole('heading', { name: /chanda ledger/i })).toBeVisible();
    await page.getByRole('button', { name: /record collection/i }).click();
    await page.getByLabel('Donor Name').fill(data.chandaDonor);
    await page.getByLabel('Donor Phone').fill('9234567890');
    await page.getByLabel('Address').fill('Ballygunge');
    await page.getByLabel('Amount').fill('2000');
    await withAcceptedDialog(page, () => page.getByRole('button', { name: /save entry/i }).click());
    await expect(page.getByText(data.chandaDonor)).toBeVisible();

    await page.getByRole('link', { name: /expenses/i }).click();
    await expect(page.getByRole('heading', { name: /expense ledger/i })).toBeVisible();
    await page.getByRole('button', { name: /record expense/i }).click();
    await selectByLabel(page, 'Category', 'Lighting');
    await page.getByLabel('Amount').fill('5000');
    await page.getByLabel('Reason / Particulars').fill(data.expenseReason);
    await page.getByLabel('Vendor Name').fill('E2E Electricals');
    if (process.env.CHECK_FIREBASE_STORAGE === '1') {
      await page.locator('input[type="file"]').setInputFiles({
        name: `bill-${suffix}.png`,
        mimeType: 'image/png',
        buffer: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
          'base64'
        ),
      });
      await expect(page.getByAltText('Bill')).toBeVisible({ timeout: 60_000 });
    }
    await withAcceptedDialog(page, () => page.getByRole('button', { name: /submit entry/i }).click());
    await expect(page.getByText(data.expenseReason)).toBeVisible();

    await page.getByRole('link', { name: /inventory/i }).click();
    await expect(page.getByRole('heading', { name: /inventory tracker/i })).toBeVisible();
    await page.getByRole('button', { name: /add item/i }).click();
    await page.getByLabel('Item Name').fill(data.inventoryItem);
    await page.getByLabel('Unit (e.g. Kg, Pcs, Bundle)').fill('pcs');
    await page.getByLabel('Vendor').fill('E2E Supply');
    await page.getByLabel('Qty Purchased').fill('50');
    await page.getByLabel('Qty Used').fill('10');
    await page.getByLabel('Price Per Unit').fill('300');
    await withAcceptedDialog(page, () => page.getByRole('button', { name: /record stock/i }).click());
    await expect(page.getByText(data.inventoryItem)).toBeVisible();

    await page.goto(`/${committeeId}/cultural`);
    await expect(page.getByRole('heading', { name: /cultural programme/i })).toBeVisible();
    await page.getByRole('button', { name: /add event/i }).click();
    await page.getByLabel('Event Name').fill(data.culturalEvent);
    await page.getByLabel('Date').fill('2026-10-10');
    await page.getByLabel('Start Time').fill('18:00');
    await page.getByLabel('End Time').fill('21:00');
    await page.getByLabel('Performers / Artists').fill('E2E Band');
    await page.getByLabel('Participant Names').fill('Asha, Rahul');
    await withAcceptedDialog(page, () => page.getByRole('button', { name: /save event/i }).click());
    await expect(page.getByText(data.culturalEvent)).toBeVisible();

    await page.goto(`/${committeeId}/mandap`);
    await expect(page.getByRole('heading', { name: /mandap schedule/i })).toBeVisible();
    await page.getByRole('button', { name: /add ritual/i }).click();
    await page.getByLabel('Day No.').fill('6');
    await page.getByLabel('Date').fill('2026-10-10');
    await page.getByLabel('Tithi').fill('Maha Sasthi');
    await page.getByLabel('Puja / Ritual Name').fill(data.pujaName);
    await page.getByLabel('Setup Particulars').fill('Flowers and incense');
    await page.getByLabel('Expenses').fill('1500');
    await withAcceptedDialog(page, () => page.getByRole('button', { name: /save schedule/i }).click());
    await expect(page.getByText(data.pujaName)).toBeVisible();

    await page.getByRole('link', { name: /broadcasts/i }).click();
    await expect(page.getByRole('heading', { name: /broadcast center/i })).toBeVisible();
    await page.getByRole('button', { name: /new broadcast/i }).click();
    await fieldByLabel(page, 'Message Content', 'textarea').fill(data.broadcast);
    await selectByLabel(page, 'Broadcast Type', 'General');
    await selectByLabel(page, 'Target Audience', 'specific');
    await page.getByRole('button', { name: /^cashier$/i }).click();
    await page.getByRole('button', { name: /donation incharge/i }).click();
    await withAcceptedDialog(page, () => page.getByRole('button', { name: /send broadcast now/i }).click());
    await expect(page.getByText(data.broadcast)).toBeVisible();

    await page.getByRole('link', { name: /analytics/i }).click();
    await expect(page.getByRole('heading', { name: /smart analytics/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /expense categories/i })).toBeVisible();

    await page.getByRole('link', { name: /settings/i }).click();
    await expect(page.getByRole('heading', { name: /system settings/i })).toBeVisible();
    await expect(page.getByLabel('Committee Name')).toHaveValue(committee.name);
    await page.getByLabel('Committee Name').fill(`${committee.name} Updated`);
    await withAcceptedDialog(page, () => page.getByRole('button', { name: /save profile changes/i }).click());
    await expect(page.getByText(`${committee.name} Updated`)).toBeVisible();

    await logout(page);
    await page.goto(`/${committeeId}/dashboard`);
    await expect(page).toHaveURL(/\/$/);
  });

  async function adminLogin(page: Page) {
    await page.goto('/login');
    await page.getByLabel('Email Address').fill(committee.adminEmail);
    await page.getByLabel('Password').fill(committee.password);
    await page.getByRole('button', { name: /access dashboard/i }).click();
    await page.waitForURL(new RegExp(`/${committeeId}/dashboard$`), { timeout: 15_000 });
    await expect(page.getByText(committee.name)).toBeVisible();
    await expect(page.locator('p').filter({ hasText: /^ADMIN$/ })).toBeVisible();
  }

  async function addMember(page: Page, member: { name: string; phone: string; role: string }) {
    await page.getByRole('link', { name: /^members$/i }).click();
    await expect(page.getByRole('heading', { name: /member management/i })).toBeVisible();
    await page.getByRole('button', { name: /add new member/i }).click();
    await page.getByLabel('Name').fill(member.name);
    await page.getByLabel('Phone Number').fill(member.phone);
    await page.getByLabel('Address').fill('E2E Test Address');
    await selectByLabel(page, 'Assign Role', member.role);
    await withAcceptedDialog(page, () => page.getByRole('button', { name: /submit member/i }).click());
    await expect(page.getByText(member.name)).toBeVisible();
    await expect(page.locator('span').filter({ hasText: new RegExp(`^${member.role.replace('_', ' ')}$`) })).toBeVisible();
  }

  async function logout(page: Page) {
    await page.getByTitle('Logout').click();
    await expect(page).toHaveURL(/\/$/);
  }

  function fieldByLabel(page: Page, label: string | RegExp, control = 'input') {
    return page.locator('label', { hasText: label }).locator('..').locator(control);
  }

  async function selectByLabel(page: Page, label: string | RegExp, value: string) {
    await fieldByLabel(page, label, 'select').selectOption(value);
  }

  async function withAcceptedDialog(page: Page, action: () => Promise<unknown>) {
    const dialogPromise = page.waitForEvent('dialog', { timeout: 10_000 })
      .then(dialog => dialog.accept())
      .catch(() => undefined);
    await action();
    await dialogPromise;
  }
});
