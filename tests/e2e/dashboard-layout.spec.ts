import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

test.describe('Dashboard Layout', () => {
  let testUser: any;
  const adminClient = SUPABASE_URL && SERVICE_KEY ? createClient(SUPABASE_URL, SERVICE_KEY) : null;
  const testEmail = `e2e_dashboard_${Date.now()}@example.com`;
  const testPassword = 'testpassword123';

  test.beforeAll(async () => {
    if (adminClient) {
      const { data } = await adminClient.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      });
      testUser = data.user;
      
      // Insert a watchlist item so the DashboardClient renders instead of empty state
      if (testUser) {
        await adminClient.from('watchlist_items').insert([
          { user_id: testUser.id, symbol: 'RELIANCE' }
        ]);
      }
    }
  });

  test.afterAll(async () => {
    if (adminClient && testUser) {
      await adminClient.auth.admin.deleteUser(testUser.id);
    }
  });

  test('should render main chart panel and ledger panel, and handle resizing boundaries', async ({ page }) => {
    test.skip(!!process.env.CI || !adminClient, 'Skipping real E2E test: no real database available');

    // 1. Log in
    await page.goto('/');
    await page.click('button:has-text("Sign In")');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]:has-text("Sign In to StockBros")');

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. Assert Main Chart Panel is visible
    // We check for the timeframe buttons which are in the main chart panel
    await expect(page.locator('text=1D').first()).toBeVisible();
    await expect(page.locator('text=1W').first()).toBeVisible();
    
    // Also, we can check for "Watchlist Overview" title in the grid bottom section
    await expect(page.locator('text=Watchlist Overview')).toBeVisible();

    // 3. Assert Ledger Panel is visible
    // Wait for ledger text (it should be empty for a new user)
    await expect(page.locator('text=The Ledger is Empty')).toBeVisible();

    // 4. Test Resizing Boundaries
    // The resizable handle has role="separator"
    const separator = page.getByRole('separator').first();
    await expect(separator).toBeVisible();

    // Ensure resizing doesn't crash the UI
    const separatorBox = await separator.boundingBox();
    if (separatorBox) {
      const y = separatorBox.y + separatorBox.height / 2;
      
      // Drag left (shrink main chart, expand ledger)
      await page.mouse.move(separatorBox.x + separatorBox.width / 2, y);
      await page.mouse.down();
      await page.mouse.move(separatorBox.x - 300, y);
      await page.mouse.up();
      
      // UI should still be alive, wait a bit for any re-renders
      await page.waitForTimeout(100);
      await expect(page.locator('text=1D').first()).toBeVisible();

      // Drag right (expand main chart, shrink ledger)
      await page.mouse.move(separatorBox.x - 300, y);
      await page.mouse.down();
      await page.mouse.move(separatorBox.x + 600, y);
      await page.mouse.up();
      
      // UI should still be alive
      await page.waitForTimeout(100);
      await expect(page.locator('text=1W').first()).toBeVisible();
    }
  });
});
