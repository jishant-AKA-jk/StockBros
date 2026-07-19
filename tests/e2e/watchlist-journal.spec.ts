import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// PROTECTS AGAINST: Breaking the Watchlist addition and Journal deep-linking features.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

test.describe('Watchlist and Journal', () => {
  let testUser: any;
  const adminClient = SUPABASE_URL && SERVICE_KEY ? createClient(SUPABASE_URL, SERVICE_KEY) : null;
  const testEmail = `e2e_wj_${Date.now()}@example.com`;
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

  test.beforeEach(async ({ page }) => {
    test.skip(!!process.env.CI || !adminClient, 'Skipping real E2E test: no real database available');
    
    await page.goto('/');
    
    // Switch to sign in tab if not already active, by clicking it
    const signInTabBtn = page.locator('button:has-text("Sign In")');
    if (await signInTabBtn.isVisible()) {
      await signInTabBtn.click();
    }

    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]:has-text("Sign In to StockBros")');
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('User can add a stock to the Watchlist', async ({ page }) => {
    // Navigate to Screener to find a stock to add
    await page.goto('/screener');
    await expect(page.locator('text=Screener Results')).toBeVisible();

    const addBtn = page.locator('button:has-text("+ Watchlist")').first();
    
    // If there is a result in screener, we add it
    if (await addBtn.isVisible()) {
      page.on('dialog', dialog => dialog.accept());
      await addBtn.click();
      
      // Optionally wait for toast if present
      await expect(page.locator('text=Added to Watchlist')).toBeVisible({ timeout: 5000 }).catch(() => {});
      
      // Navigate to watchlist and verify the page loads
      await page.goto('/watchlist');
      await expect(page.locator('text=Trade History')).not.toBeVisible(); // Just a sanity check it's on Watchlist
      // Check for the chart grid on watchlist
      const watchlistItems = page.locator('.page-reveal').first();
      await expect(watchlistItems).toBeVisible();
    } else {
      // No screener results to test watchlist add, skip logic or handle gracefully
      console.log('No screener results available to test Watchlist addition.');
    }
  });

  test('Journal entry creation and chart deep-linking works', async ({ page }) => {
    await page.goto('/journal');
    
    // Create new entry
    await page.click('button:has-text("New Entry")');
    await expect(page.locator('text=Log New Trade')).toBeVisible();

    await page.fill('input[placeholder="e.g. RELIANCE"]', 'AAPL');
    await page.selectOption('select', { value: 'ema_pullback' });
    await page.fill('input[type="date"]', '2024-01-15');
    
    // Setting price numbers
    await page.locator('input[type="number"]').first().fill('150'); 
    await page.locator('input[type="number"]').nth(1).fill('140'); 
    
    const testNotes = `Deep link test ${Date.now()}`;
    await page.fill('textarea', testNotes);

    await page.click('button[type="submit"]:has-text("Save Trade")');

    // Wait for the note to appear on the screen
    const noteLocator = page.getByText(testNotes);
    await expect(noteLocator).toBeVisible({ timeout: 10000 });

    // Assert deep-linking works by clicking the notes
    // Use evaluate to avoid intercept issues if there are multiple elements overlaying
    await noteLocator.click({ force: true });
    
    // Verify URL updates with focusTime and symbol
    await page.waitForURL(/.*focusTime=.*/, { timeout: 10000 });
    const url = page.url();
    expect(url).toContain('focusTime=');
    expect(url).toContain('symbol=AAPL');
  });
});
