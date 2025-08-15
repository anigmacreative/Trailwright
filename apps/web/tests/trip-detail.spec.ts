import { test, expect } from '@playwright/test';

test.describe('Trip Detail Page', () => {
  test('should load trip planning interface', async ({ page }) => {
    await page.goto('/app/trips/demo-trip-1');

    // Check trip title
    await expect(page.locator('h1')).toContainText('Iceland Volcano Trekking');
    
    // Check date range
    await expect(page.locator('text=2024-06-15')).toBeVisible();
    
    // Check action buttons
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Share' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Calendar' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
  });

  test('should show day strip', async ({ page }) => {
    await page.goto('/app/trips/demo-trip-1');

    // Check day buttons are visible
    await expect(page.locator('text=Day 1')).toBeVisible();
    await expect(page.locator('text=Day 2')).toBeVisible();
    await expect(page.locator('text=Day 3')).toBeVisible();
  });

  test('should show place search', async ({ page }) => {
    await page.goto('/app/trips/demo-trip-1');

    // Check search input
    await expect(page.getByPlaceholder('Search for places to add...')).toBeVisible();
  });

  test('should show itinerary for selected day', async ({ page }) => {
    await page.goto('/app/trips/demo-trip-1');

    // Should show Day 1 places by default
    await expect(page.locator('text=Keflavik International Airport')).toBeVisible();
    await expect(page.locator('text=Blue Lagoon')).toBeVisible();
    await expect(page.locator('text=Reykjavik Downtown')).toBeVisible();
    
    // Click Day 2
    await page.locator('text=Day 2').click();
    
    // Should show Day 2 places
    await expect(page.locator('text=Gullfoss Waterfall')).toBeVisible();
    await expect(page.locator('text=Geysir Geothermal Area')).toBeVisible();
  });

  test('should show optimize and AI buttons for days with places', async ({ page }) => {
    await page.goto('/app/trips/demo-trip-1');

    // Should show action buttons for Day 1 (has places)
    const optimizeButton = page.getByRole('button').filter({ hasText: /Zap/ }).first();
    const aiButton = page.getByRole('button').filter({ hasText: /Plus/ }).first();
    
    await expect(optimizeButton).toBeVisible();
    await expect(aiButton).toBeVisible();
  });

  test('should handle empty day', async ({ page }) => {
    await page.goto('/app/trips/demo-trip-1');

    // Click Day 3 (empty)
    await page.locator('text=Day 3').click();
    
    // Should show empty state
    await expect(page.locator('text=No places yet')).toBeVisible();
    await expect(page.locator('text=Search for places or click on the map')).toBeVisible();
  });
});