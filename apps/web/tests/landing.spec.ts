import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load and display main elements', async ({ page }) => {
    await page.goto('/');

    // Check main heading
    await expect(page.locator('h1')).toContainText('Plan your next expedition');
    
    // Check CTA buttons
    await expect(page.getByRole('link', { name: 'Start Planning' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Try Demo' })).toBeVisible();
    
    // Check feature sections
    await expect(page.locator('text=Collaborative')).toBeVisible();
    await expect(page.locator('text=Intelligent')).toBeVisible();
    await expect(page.locator('text=Exportable')).toBeVisible();
  });

  test('should navigate to trips page from CTA', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('link', { name: 'Start Planning' }).click();
    await expect(page).toHaveURL('/app/trips');
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/Trailwright/);
    
    // Check meta description
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toContain('Adventure planning');
  });
});