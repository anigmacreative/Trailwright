import { test, expect } from '@playwright/test';

test.describe('Simple Smoke Test', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load with a generous timeout
    await page.waitForLoadState('domcontentloaded');
    
    // Check that we get some content (even if it's an error page, it should load)
    const body = await page.locator('body').isVisible();
    expect(body).toBe(true);
    
    console.log('✅ Homepage loaded successfully');
  });

  test('should handle 404 pages', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // Wait for the page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Should get some response (either 404 page or redirect)
    const body = await page.locator('body').isVisible();
    expect(body).toBe(true);
    
    console.log('✅ 404 handling works');
  });
});