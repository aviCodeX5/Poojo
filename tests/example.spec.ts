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

test('language selector uses readable Indian scripts and persists selection', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Language').selectOption('hi');
  await expect(page.getByRole('heading', { name: 'एडमिन पोर्टल' })).toBeVisible();
  await expect(page.getByLabel('ईमेल पता')).toBeVisible();
  await expect(page.getByRole('button', { name: /डैशबोर्ड खोलें/i })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
  await expect(page.getByText(/à¤|Ø§|à¦/)).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'एडमिन पोर्टल' })).toBeVisible();

  await page.getByLabel('Language').selectOption('ur');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { name: 'ایڈمن پورٹل' })).toBeVisible();

  await page.getByLabel('Language').selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
});

test('landing page content changes when Bengali is selected', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Language').selectOption('bn');
  await expect(page.getByText('স্বচ্ছ উৎসব ব্যবস্থাপনা').first()).toBeVisible();
  await expect(page.getByText(/উৎসব কমিটির জন্য সহজ/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'কমিটি নিবন্ধন' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'সদস্য লগইন' })).toBeVisible();
  await expect(page.getByText('সরাসরি সারাংশ')).toBeVisible();
  await expect(page.getByText('সংগ্রহ', { exact: true })).toBeVisible();
});

test('landing page has translated hero content for every Indian language option', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Full language matrix is enough in one browser.');

  await page.goto('/');

  const expectedTaglines: Array<[string, string]> = [
    ['hi', 'पारदर्शी उत्सव प्रबंधन'],
    ['bn', 'স্বচ্ছ উৎসব ব্যবস্থাপনা'],
    ['ta', 'வெளிப்படையான விழா மேலாண்மை'],
    ['te', 'పారదర్శక ఉత్సవ నిర్వహణ'],
    ['mr', 'पारदर्शक उत्सव व्यवस्थापन'],
    ['gu', 'પારદર્શક ઉત્સવ વ્યવસ્થાપન'],
    ['kn', 'ಪಾರದರ್ಶಕ ಹಬ್ಬ ನಿರ್ವಹಣೆ'],
    ['ml', 'സുതാര്യ ഉത്സവ മാനേജ്മെന്റ്'],
    ['or', 'ସ୍ୱଚ୍ଛ ଉତ୍ସବ ପରିଚାଳନା'],
    ['pa', 'ਪਾਰਦਰਸ਼ੀ ਤਿਉਹਾਰ ਪ੍ਰਬੰਧਨ'],
    ['as', 'স্বচ্ছ উৎসৱ পৰিচালনা'],
    ['ur', 'شفاف تہوار انتظام'],
  ];

  for (const [code, tagline] of expectedTaglines) {
    await page.getByLabel('Language').selectOption(code);
    await expect(page.getByText(tagline).first()).toBeVisible();
    await expect(page.getByText('A simple, modern operating system for festival committees to manage members, collections, donations, expenses, inventory, and communications with clarity.')).toHaveCount(0);
  }
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

test('registration map offers locate me and searchable place suggestions', async ({ page }) => {
  await page.route('https://nominatim.openstreetmap.org/search*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          lat: '28.564300',
          lon: '77.334200',
          display_name: 'Noida Botanical Garden, Sector 38, Noida, Uttar Pradesh, India',
        },
        {
          lat: '28.567000',
          lon: '77.345000',
          display_name: 'Botanical Garden Metro Station, Noida, Uttar Pradesh, India',
        },
      ]),
    });
  });

  await page.goto('/register');

  await expect(page.getByRole('button', { name: /locate me/i })).toBeVisible();
  await page.getByPlaceholder(/search for pandal location/i).fill('botanical garden');
  await expect(page.getByRole('option', { name: /noida botanical garden/i })).toBeVisible();
  await expect(page.getByRole('option', { name: /botanical garden metro station/i })).toBeVisible();

  await page.getByRole('option', { name: /noida botanical garden/i }).click();
  await expect(page.getByText(/selected location/i)).toBeVisible();
  await expect(page.getByText(/Noida Botanical Garden, Sector 38/i)).toBeVisible();
});
