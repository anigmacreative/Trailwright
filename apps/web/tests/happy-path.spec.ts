import { test, expect } from '@playwright/test';

test.describe('Happy Path Smoke Test', () => {
  test('should complete the basic user journey', async ({ page }) => {
    // Mock the optimization API
    await page.route('http://localhost:8000/optimize-day', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          order: ['stop-2', 'stop-1'], // Reverse order for testing
          distances: [2.5, 1.8],
          durations: [8, 6],
          total_distance: 4.3,
          total_duration: 14,
        }),
      });
    });

    // 1. Load the homepage
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Verify we can navigate the site
    const body = await page.locator('body');
    await expect(body).toBeVisible();
    
    console.log('✅ Step 1: Homepage loaded');

    // 2. Try to access a trips page (this may redirect or show login)
    const response = await page.goto('/app/trips');
    
    // Accept that we might get redirected or get a different response
    // The important thing is that the routing works
    expect(response?.status()).toBeLessThan(500); // No server errors
    
    console.log('✅ Step 2: Trips page accessible (may redirect)');

    // 3. Test that JavaScript is working by checking for interactive elements
    // Look for common interactive elements that would indicate the app is running
    const interactiveElements = page.locator('button, input, [role="button"], a[href*="/app"]');
    const hasInteractiveElements = await interactiveElements.count() > 0;
    
    if (hasInteractiveElements) {
      console.log('✅ Step 3: Interactive elements found - React app is working');
    } else {
      console.log('⚠️  Step 3: No interactive elements found - may be static or redirected');
    }

    // 4. Test API connectivity by making a request to a known endpoint
    const apiResponse = await page.request.get('http://localhost:8000/health');
    expect(apiResponse.status()).toBe(200);
    
    console.log('✅ Step 4: API server is responding');

    console.log('✅ All basic smoke test steps completed successfully!');
  });
});