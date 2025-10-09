import { test, expect } from '@playwright/test';

test.describe('Filter Visibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the facet configuration API to return empty configuration
    // This simulates a vendor who hasn't configured any facets
    await page.route('**/v1/facets*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]) // Empty facet configuration
      });
    });

    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');
  });

  test('1. No filters should be visible when vendor has not configured any facets', async ({ page }) => {
    // Wait for the component to load and fetch facet configuration
    await page.waitForTimeout(2000);
    
    // Check that no filter sections are visible in the sidebar
    const sidebar = page.locator('aside');
    
    // All filter sections should be hidden
    await expect(sidebar.locator('text=Category')).not.toBeVisible();
    await expect(sidebar.locator('text=Brand')).not.toBeVisible();
    await expect(sidebar.locator('text=Color')).not.toBeVisible();
    await expect(sidebar.locator('text=Size')).not.toBeVisible();
    await expect(sidebar.locator('text=Tags')).not.toBeVisible();
    await expect(sidebar.locator('text=Price')).not.toBeVisible();
    await expect(sidebar.locator('text=Stock Status')).not.toBeVisible();
    await expect(sidebar.locator('text=Featured Products')).not.toBeVisible();
    await expect(sidebar.locator('text=Sale Status')).not.toBeVisible();
    
    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/filter-visibility-no-config.png', fullPage: true });
  });

  test('2. Only configured filters should be visible', async ({ page }) => {
    // Mock the facet configuration API to return specific configured facets
    await page.route('**/v1/facets*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { field: 'category', visible: true, label: 'Category' },
          { field: 'brand', visible: true, label: 'Brand' },
          { field: 'price', visible: true, label: 'Price' }
        ])
      });
    });

    // Reload the page to get the new configuration
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const sidebar = page.locator('aside');
    
    // Only configured filters should be visible
    await expect(sidebar.locator('text=Category')).toBeVisible();
    await expect(sidebar.locator('text=Brand')).toBeVisible();
    await expect(sidebar.locator('text=Price')).toBeVisible();
    
    // Other filters should not be visible
    await expect(sidebar.locator('text=Color')).not.toBeVisible();
    await expect(sidebar.locator('text=Size')).not.toBeVisible();
    await expect(sidebar.locator('text=Tags')).not.toBeVisible();
    await expect(sidebar.locator('text=Stock Status')).not.toBeVisible();
    await expect(sidebar.locator('text=Featured Products')).not.toBeVisible();
    await expect(sidebar.locator('text=Sale Status')).not.toBeVisible();
    
    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/filter-visibility-configured.png', fullPage: true });
  });

  test('3. Mobile drawer should also respect filter configuration', async ({ page }) => {
    // Mock empty facet configuration
    await page.route('**/v1/facets*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Click on the filter button to open mobile drawer
    const filterButton = page.locator('button[aria-label="Open filters"]');
    await filterButton.click();
    
    // Wait for drawer to open
    await page.waitForTimeout(500);
    
    // Check that no filter sections are visible in the mobile drawer
    const drawer = page.locator('[role="dialog"]');
    
    await expect(drawer.locator('text=Categories')).not.toBeVisible();
    await expect(drawer.locator('text=Brand')).not.toBeVisible();
    await expect(drawer.locator('text=Color')).not.toBeVisible();
    await expect(drawer.locator('text=Size')).not.toBeVisible();
    await expect(drawer.locator('text=Tags')).not.toBeVisible();
    await expect(drawer.locator('text=Price')).not.toBeVisible();
    await expect(drawer.locator('text=Stock Status')).not.toBeVisible();
    await expect(drawer.locator('text=Featured Products')).not.toBeVisible();
    await expect(drawer.locator('text=Sale Status')).not.toBeVisible();
    
    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/filter-visibility-mobile-no-config.png', fullPage: true });
  });
});
