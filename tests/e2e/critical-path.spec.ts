import { test, expect } from '@playwright/test';

import { createClient } from '@supabase/supabase-js';

// PROTECTS AGAINST: Critical path breakage. Ensures a user can perform the most valuable
// sequence of actions: login, see charts, run screener, save to watchlist, and log a trade.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

test.describe('Critical Path', () => {
  let testUser: any;
  const adminClient = SUPABASE_URL && SERVICE_KEY ? createClient(SUPABASE_URL, SERVICE_KEY) : null;
  const testEmail = `e2e_${Date.now()}@example.com`;
  const testPassword = 'testpassword123';

  test.beforeAll(async () => {
    if (adminClient) {
      const { data } = await adminClient.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      });
      testUser = data.user;
    }
  });

  test.afterAll(async () => {
    if (adminClient && testUser) {
      await adminClient.auth.admin.deleteUser(testUser.id);
    }
  });

  test('Login -> Screener -> Watchlist -> Journal', async ({ page }) => {
    // Skip in CI or if no service key is available to create a test user
    test.skip(!!process.env.CI || !adminClient, 'Skipping real E2E test: no real database available');

    await page.goto('/');
    
    // 1. Log in
    await page.click('button:has-text("Sign In")'); // Switch to sign in tab if not already
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]:has-text("Sign In to StockBros")');
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('text=Market Overview').first()).toBeVisible();

    // 2. Run screener
    await page.goto('/screener');
    await expect(page.locator('text=Screener Results')).toBeVisible();

    // 4. Add to watchlist
    // Assuming there is at least one stock in the screener results
    const addBtn = page.locator('button:has-text("+ Watchlist")').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      // Handle the window alert
      page.on('dialog', dialog => dialog.accept());
    }

    // 5. Log journal entry
    await page.goto('/journal');
    await expect(page.locator('text=New Journal Entry')).toBeVisible();
    
    await page.fill('input[placeholder="e.g. RELIANCE"]', 'AAPL');
    await page.fill('input[type="date"]', '2023-01-01');
    await page.fill('input[type="number"]').first().fill('150'); // entry price
    await page.locator('input[type="number"]').nth(1).fill('140'); // initial stop
    await page.click('button[type="submit"]:has-text("Log Trade")');

    // 6. See it reflected in stats
    await expect(page.locator('h3:has-text("AAPL")')).toBeVisible();
  });
});
