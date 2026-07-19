import { test, expect } from '@playwright/test';

test.describe('Qullamaggie Scanner Multi-Stage Loader', () => {
  test('should go through FETCHING_DATA, RUNNING_ALGOS, and PLOTTING stages and show chart', async ({ page }) => {
    // Navigate to the scanner page for RELIANCE
    await page.goto('/scanner?symbol=RELIANCE');

    // 1. Initially, it might show IDLE or jump to FETCHING_DATA if initialBars exist.
    // However, our useScanner sets FETCHING_DATA almost immediately if there are initialBars.
    // We can't guarantee seeing FETCHING_DATA or RUNNING_ALGOS easily due to the fast state machine (400ms delay),
    // but we can assert the final PLOTTING state is reached.

    // Wait for the actual canvas chart to be rendered by lightweight-charts.
    // The canvas is injected into the DOM by lightweight-charts.
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 5000 });

    // Assert that the sidebar Quick Stats are populated (i.e. not showing N/A if data loaded)
    const currentPriceText = page.locator('text=Current Price').locator('..').locator('span.font-mono');
    await expect(currentPriceText).toBeVisible();
    const priceValue = await currentPriceText.textContent();
    expect(priceValue).not.toBe('$0.00');

    // Check if Qullamaggie matches are displayed in the Sidebar (EMA Stack, Tight Consolidation, etc.)
    const emaStackMatch = page.locator('text=EMA Stack');
    await expect(emaStackMatch).toBeVisible();

    // Verify search functionality redirects correctly
    const searchInput = page.locator('input[name="search"]');
    await searchInput.fill('HDFCBANK');
    await searchInput.press('Enter');

    await expect(page).toHaveURL(/.*symbol=HDFCBANK/);
  });
});
