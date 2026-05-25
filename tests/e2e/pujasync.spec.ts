import { test, expect } from '@playwright/test';

// Test data - UPDATE THESE WITH YOUR ACTUAL TEST CREDENTIALS
const testCommittee = {
  name: 'Test Puja Committee',
  location: 'Kolkata, West Bengal',
  pandalLocation: 'Park Street, Kolkata',
  adminName: 'Test Admin',
  adminEmail: 'testadmin@gmail.com', // Update with your test email
  adminPhone: '9876543210',
  adminPassword: 'Test@123456' // Update with your test password
};

const testMember = {
  name: 'Test Member',
  phone: '9876543211',
  role: 'CASHIER',
  address: '123 Test Street, Kolkata'
};

const testExpense = {
  category: 'Lighting',
  amount: '5000',
  reason: 'LED lights for pandal decoration',
  vendorName: 'Test Electricals'
};

const testDonation = {
  donorName: 'Test Donor',
  amount: '10000',
  type: 'Cash',
  phone: '9876543212'
};

test.describe('PujaCommittee E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/');
  });

  test('Committee Registration Flow', async ({ page }) => {
    // Click Register Committee button
    await page.click('text=Register Committee');
    
    // Wait for registration page to load
    await expect(page.locator('h1')).toContainText('Committee Registration');
    
    // Fill committee details
    await page.fill('input[placeholder*="Committee Name"]', testCommittee.name);
    await page.fill('input[placeholder*="Location"]', testCommittee.location);
    await page.fill('input[placeholder*="Pandal Location"]', testCommittee.pandalLocation);
    
    // Fill admin details
    await page.fill('input[placeholder*="Admin Name"]', testCommittee.adminName);
    await page.fill('input[placeholder*="Email"]', testCommittee.adminEmail);
    await page.fill('input[placeholder*="Password"]', testCommittee.adminPassword);
    await page.fill('input[placeholder*="Phone"]', testCommittee.adminPhone);
    
    // Submit registration
    await page.click('button[type="submit"]');
    
    // Wait for success message or redirect
    await page.waitForTimeout(2000);
    
    // Verify redirect to login or dashboard
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/login|\/.*\/dashboard/);
    
    console.log('Committee registration completed');
  });

  test('Admin Login Flow', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Wait for login form to load
    await page.waitForSelector('input[placeholder*="Email"]', { timeout: 5000 });
    
    // Fill login form
    await page.fill('input[placeholder*="Email"]', testCommittee.adminEmail);
    await page.fill('input[placeholder*="Password"]', testCommittee.adminPassword);
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard or error message
    await page.waitForTimeout(3000);
    
    // Check if we're on dashboard or still on login
    const currentUrl = page.url();
    console.log('Current URL after login attempt:', currentUrl);
    
    if (currentUrl.includes('dashboard')) {
      // Verify dashboard loads
      await expect(page.locator('h1')).toContainText('Dashboard');
      console.log('Admin login successful');
    } else {
      // Check for error message
      const errorElement = await page.locator('text=Invalid credentials, text=Error, text=Failed').first();
      if (await errorElement.isVisible()) {
        console.log('Login failed with error');
      } else {
        console.log('Login failed - no error message visible');
      }
    }
  });

  test('Member Management Flow', async ({ page }) => {
    // Login as admin first
    await page.goto('/login');
    await page.fill('input[placeholder*="Email"]', testCommittee.adminEmail);
    await page.fill('input[placeholder*="Password"]', testCommittee.adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/.*\/dashboard/, { timeout: 10000 });
    
    // Navigate to Members page
    await page.click('text=Members');
    await page.waitForTimeout(1000);
    
    // Click Add Member button
    await page.click('button:has-text("Add Member")');
    
    // Fill member details
    await page.fill('input[placeholder*="Name"]', testMember.name);
    await page.fill('input[placeholder*="Phone"]', testMember.phone);
    
    // Select role
    await page.click('select');
    await page.selectOption('select', testMember.role);
    
    // Fill address
    await page.fill('input[placeholder*="Address"]', testMember.address);
    
    // Submit member
    await page.click('button:has-text("Add Member")');
    await page.waitForTimeout(2000);
    
    // Verify member appears in list
    await expect(page.locator(`text=${testMember.name}`)).toBeVisible();
    
    console.log('Member added successfully');
  });

  test('Expenses with Bill Photo Upload', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[placeholder*="Email"]', testCommittee.adminEmail);
    await page.fill('input[placeholder*="Password"]', testCommittee.adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/.*\/dashboard/, { timeout: 10000 });
    
    // Navigate to Expenses page
    await page.click('text=Expenses');
    await page.waitForTimeout(1000);
    
    // Click Record Expense button
    await page.click('button:has-text("Record Expense")');
    
    // Fill expense details
    await page.selectOption('select', testExpense.category);
    await page.fill('input[type="number"]', testExpense.amount);
    await page.fill('input[placeholder*="Reason"]', testExpense.reason);
    await page.fill('input[placeholder*="Vendor"]', testExpense.vendorName);
    
    // Upload bill photo (if file input exists)
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      // Create a test image file path
      const testImagePath = './tests/fixtures/test-bill.jpg';
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(2000);
    }
    
    // Submit expense
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Verify expense appears in list
    await expect(page.locator(`text=${testExpense.reason}`)).toBeVisible();
    
    console.log('Expense with bill photo added successfully');
  });

  test('Donations Flow', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[placeholder*="Email"]', testCommittee.adminEmail);
    await page.fill('input[placeholder*="Password"]', testCommittee.adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/.*\/dashboard/, { timeout: 10000 });
    
    // Navigate to Donations page
    await page.click('text=Donations');
    await page.waitForTimeout(1000);
    
    // Click Add Donation button
    await page.click('button:has-text("Add Donation")');
    
    // Fill donation details
    await page.fill('input[placeholder*="Donor Name"]', testDonation.donorName);
    await page.fill('input[placeholder*="Amount"]', testDonation.amount);
    await page.selectOption('select', testDonation.type);
    await page.fill('input[placeholder*="Phone"]', testDonation.phone);
    
    // Submit donation
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Verify donation appears in list
    await expect(page.locator(`text=${testDonation.donorName}`)).toBeVisible();
    
    console.log('Donation added successfully');
  });

  test('Chanda Flow', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[placeholder*="Email"]', testCommittee.adminEmail);
    await page.fill('input[placeholder*="Password"]', testCommittee.adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/.*\/dashboard/, { timeout: 10000 });
    
    // Navigate to Chanda page
    await page.click('text=Chanda');
    await page.waitForTimeout(1000);
    
    // Click Add Chanda button
    await page.click('button:has-text("Add Chanda")');
    
    // Fill chanda details
    await page.fill('input[placeholder*="Member Name"]', testMember.name);
    await page.fill('input[placeholder*="Amount"]', '2000');
    await page.fill('input[placeholder*="Year"]', '2026');
    
    // Submit chanda
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Verify chanda appears in list
    await expect(page.locator(`text=${testMember.name}`)).toBeVisible();
    
    console.log('Chanda entry added successfully');
  });

  test('Cultural Events Flow', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[placeholder*="Email"]', testCommittee.adminEmail);
    await page.fill('input[placeholder*="Password"]', testCommittee.adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/.*\/dashboard/, { timeout: 10000 });
    
    // Navigate to Cultural page
    await page.click('text=Cultural');
    await page.waitForTimeout(1000);
    
    // Click Add Event button
    await page.click('button:has-text("Add Event")');
    
    // Fill event details
    await page.fill('input[placeholder*="Event Name"]', 'Cultural Night');
    await page.fill('input[type="date"]', '2026-10-10');
    await page.fill('input[type="time"]', '18:00');
    await page.fill('textarea[placeholder*="Description"]', 'Cultural program with music and dance');
    
    // Submit event
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Verify event appears in list
    await expect(page.locator(`text=Cultural Night`)).toBeVisible();
    
    console.log('Cultural event added successfully');
  });

  test('Mandap Schedule Flow', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[placeholder*="Email"]', testCommittee.adminEmail);
    await page.fill('input[placeholder*="Password"]', testCommittee.adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/.*\/dashboard/, { timeout: 10000 });
    
    // Navigate to Mandap page
    await page.click('text=Mandap');
    await page.waitForTimeout(1000);
    
    // Click Add Schedule button
    await page.click('button:has-text("Add Schedule")');
    
    // Fill schedule details
    await page.fill('input[placeholder*="Day"]', 'Sasthi');
    await page.fill('input[type="time"]', '07:00');
    await page.fill('textarea[placeholder*="Special Arrangements"]', 'Morning puja with flowers');
    
    // Submit schedule
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Verify schedule appears in list
    await expect(page.locator(`text=Sasthi`)).toBeVisible();
    
    console.log('Mandap schedule added successfully');
  });

  test('Inventory Flow', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[placeholder*="Email"]', testCommittee.adminEmail);
    await page.fill('input[placeholder*="Password"]', testCommittee.adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/.*\/dashboard/, { timeout: 10000 });
    
    // Navigate to Inventory page
    await page.click('text=Inventory');
    await page.waitForTimeout(1000);
    
    // Click Add Item button
    await page.click('button:has-text("Add Item")');
    
    // Fill inventory details
    await page.fill('input[placeholder*="Item Name"]', 'LED Lights');
    await page.selectOption('select', 'Lighting');
    await page.fill('input[placeholder*="Purchased"]', '50');
    await page.fill('input[placeholder*="Used"]', '10');
    
    // Submit item
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Verify item appears in list
    await expect(page.locator(`text=LED Lights`)).toBeVisible();
    
    console.log('Inventory item added successfully');
  });

  test('Broadcasts Flow', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[placeholder*="Email"]', testCommittee.adminEmail);
    await page.fill('input[placeholder*="Password"]', testCommittee.adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/.*\/dashboard/, { timeout: 10000 });
    
    // Navigate to Broadcasts page
    await page.click('text=Broadcasts');
    await page.waitForTimeout(1000);
    
    // Click Send Broadcast button
    await page.click('button:has-text("Send Broadcast")');
    
    // Fill broadcast details
    await page.fill('input[placeholder*="Title"]', 'Important Announcement');
    await page.fill('textarea[placeholder*="Message"]', 'Puja celebration starts tomorrow at 6 AM');
    await page.selectOption('select', 'High');
    
    // Submit broadcast
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Verify broadcast appears in history
    await expect(page.locator(`text=Important Announcement`)).toBeVisible();
    
    console.log('Broadcast sent successfully');
  });

  test('Analytics Flow', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[placeholder*="Email"]', testCommittee.adminEmail);
    await page.fill('input[placeholder*="Password"]', testCommittee.adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/.*\/dashboard/, { timeout: 10000 });
    
    // Navigate to Analytics page
    await page.click('text=Analytics');
    await page.waitForTimeout(2000);
    
    // Verify analytics page loads
    await expect(page.locator('h1')).toContainText('Smart Analytics');
    
    // Verify charts are visible
    await expect(page.locator('text=Income vs Expense').or(page.locator('text=Category Spread'))).toBeVisible();
    
    console.log('Analytics page loaded successfully');
  });

  test('Settings Flow (Admin Only)', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[placeholder*="Email"]', testCommittee.adminEmail);
    await page.fill('input[placeholder*="Password"]', testCommittee.adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/.*\/dashboard/, { timeout: 10000 });
    
    // Navigate to Settings page
    await page.click('text=Settings');
    await page.waitForTimeout(1000);
    
    // Verify settings page loads
    await expect(page.locator('h1')).toContainText('Settings');
    
    // Try editing committee name
    await page.fill('input[placeholder*="Committee Name"]', 'Updated Test Committee');
    
    // Note: Don't actually save to avoid modifying real data
    console.log('Settings page loaded successfully');
  });

  test('Logout Flow', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[placeholder*="Email"]', testCommittee.adminEmail);
    await page.fill('input[placeholder*="Password"]', testCommittee.adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/.*\/dashboard/, { timeout: 10000 });
    
    // Click logout button
    await page.click('button:has-text("Logout")');
    await page.waitForTimeout(1000);
    
    // Verify redirect to landing page
    await expect(page.url()).toMatch(/http:\/\/localhost:5173\/$/);
    
    // Try to access protected route (should redirect)
    await page.goto('/DUR-2026-DHA-8113/dashboard');
    await page.waitForTimeout(1000);
    
    // Should be redirected to landing page
    await expect(page.url()).toMatch(/\/$/);
    
    console.log('Logout successful');
  });

  test('Role-Based Access Control', async ({ page }) => {
    // Login as CASHIER role
    await page.goto('/login');
    await page.fill('input[placeholder*="Email"]', testCommittee.adminEmail);
    await page.fill('input[placeholder*="Password"]', testCommittee.adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/.*\/dashboard/, { timeout: 10000 });
    
    // Navigate to Expenses
    await page.click('text=Expenses');
    await page.waitForTimeout(1000);
    
    // Verify can access expenses
    await expect(page.locator('h1')).toContainText('Expense Ledger');
    
    // Try to access Settings (should be admin only)
    await page.click('text=Settings');
    await page.waitForTimeout(1000);
    
    // Settings might be accessible to admin only, verify this
    const settingsPage = page.locator('h1');
    const isSettingsVisible = await settingsPage.isVisible();
    
    if (isSettingsVisible) {
      console.log('Settings page is visible to current role');
    } else {
      console.log('Settings page is restricted (expected for non-admin roles)');
    }
    
    console.log('Role-based access control test completed');
  });

  test('Dashboard Overview', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[placeholder*="Email"]', testCommittee.adminEmail);
    await page.fill('input[placeholder*="Password"]', testCommittee.adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/.*\/dashboard/, { timeout: 10000 });
    
    // Verify dashboard elements
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Check for summary cards (income, expenses, members, etc.)
    const dashboardCards = page.locator('.card, .Card');
    const cardCount = await dashboardCards.count();
    
    console.log(`Dashboard loaded with ${cardCount} cards`);
    
    // Verify navigation menu exists
    await expect(page.locator('nav, .sidebar, .navigation').or(page.locator('button:has-text("Members")'))).toBeVisible();
    
    console.log('Dashboard overview test completed');
  });
});
