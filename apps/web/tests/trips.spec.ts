import { test, expect } from '@playwright/test';

test.describe('Trips Page', () => {
  test('should display trips list', async ({ page }) => {
    await page.goto('/app/trips');

    // Check page title
    await expect(page.locator('h1')).toContainText('Your Expeditions');
    
    // Check New Trip button
    await expect(page.getByRole('link', { name: 'New Trip' })).toBeVisible();
    
    // Check demo trips
    await expect(page.locator('text=Iceland Volcano Trekking')).toBeVisible();
    await expect(page.locator('text=Diving in the Red Sea')).toBeVisible();
    await expect(page.locator('text=Patagonia Expedition')).toBeVisible();
  });

  test('should navigate to trip detail', async ({ page }) => {
    await page.goto('/app/trips');
    
    // Click on first trip
    await page.locator('text=Iceland Volcano Trekking').click();
    
    // Should navigate to trip detail page
    await expect(page).toHaveURL(/\/app\/trips\/demo-trip-1/);
    await expect(page.locator('h1')).toContainText('Iceland Volcano Trekking');
  });

  test('should show trip metadata', async ({ page }) => {
    await page.goto('/app/trips');
    
    // Check that trip cards show metadata
    await expect(page.locator('text=days')).toBeVisible();
    await expect(page.locator('text=members')).toBeVisible();
  });
});