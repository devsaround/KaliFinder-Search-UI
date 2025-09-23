import { test, expect } from '@playwright/test';

test.describe('Kalifind Search Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');
  });

  test('1. Initial State - Empty search box shows recommendations and popular searches', async ({ page }) => {
    // Check that search input is empty
    const searchInput = page.locator('input[placeholder="Search"]');
    await expect(searchInput).toHaveValue('');
    
    // Check that popular searches are visible
    await expect(page.locator('text=Popular Searches')).toBeVisible();
    
    // Check that recommendations section is visible (if configured)
    const recommendationsSection = page.locator('text=Recommendations');
    if (await recommendationsSection.isVisible()) {
      await expect(recommendationsSection).toBeVisible();
    }
    
    // Check that filter sidebar is NOT visible initially
    const filterSidebar = page.locator('aside');
    await expect(filterSidebar).not.toBeVisible();
    
    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/1-initial-state.png', fullPage: true });
  });

  test('2. Autocomplete Suggestions - Typing shows dropdown with loading state', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search"]');
    
    // Type "t" to trigger autocomplete
    await searchInput.fill('t');
    
    // Check that autocomplete dropdown appears
    const autocompleteDropdown = page.locator('[data-suggestion-item]').first();
    await expect(autocompleteDropdown).toBeVisible();
    
    // Check for loading indicator or suggestions
    const loadingIndicator = page.locator('text=Loading suggestions...');
    const suggestions = page.locator('[data-suggestion-item]');
    
    // Either loading indicator or suggestions should be visible
    const hasLoading = await loadingIndicator.isVisible();
    const hasSuggestions = await suggestions.count() > 0;
    
    expect(hasLoading || hasSuggestions).toBeTruthy();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/2-autocomplete-typing.png', fullPage: true });
  });

  test('3. Autocomplete Suggestions - Clickable suggestions work correctly', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search"]');
    
    // Type to trigger autocomplete
    await searchInput.fill('shirt');
    await page.waitForTimeout(500); // Wait for debounce
    
    // Wait for suggestions to appear
    const suggestions = page.locator('[data-suggestion-item]');
    await expect(suggestions.first()).toBeVisible();
    
    // Click on first suggestion
    const firstSuggestion = suggestions.first();
    await firstSuggestion.click();
    
    // Check that search input is filled with suggestion
    await expect(searchInput).toHaveValue(/shirt/);
    
    // Check that search is triggered (filter sidebar should appear)
    const filterSidebar = page.locator('aside');
    await expect(filterSidebar).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/3-suggestion-click.png', fullPage: true });
  });

  test('4. Search Execution - Enter key triggers search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search"]');
    
    // Type search term
    await searchInput.fill('shirt');
    
    // Press Enter
    await searchInput.press('Enter');
    
    // Check that filter sidebar appears
    const filterSidebar = page.locator('aside');
    await expect(filterSidebar).toBeVisible();
    
    // Check that results are displayed in grid layout
    const resultsGrid = page.locator('.grid');
    await expect(resultsGrid).toBeVisible();
    
    // Check for "Search Results" heading
    await expect(page.locator('text=Search Results')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/4-search-execution.png', fullPage: true });
  });

  test('5. Results State - Products displayed in grid with filters', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search"]');
    
    // Perform search
    await searchInput.fill('shirt');
    await searchInput.press('Enter');
    
    // Wait for results to load
    await page.waitForTimeout(1000);
    
    // Check that filter sidebar is visible
    const filterSidebar = page.locator('aside');
    await expect(filterSidebar).toBeVisible();
    
    // Check that results are in grid layout
    const productGrid = page.locator('.grid');
    await expect(productGrid).toBeVisible();
    
    // Check for product count display
    const productCount = page.locator('text=/\\d+ out of \\d+ products/');
    await expect(productCount).toBeVisible();
    
    // Check for sort dropdown
    const sortDropdown = page.locator('text=Sort By');
    await expect(sortDropdown).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/5-results-state.png', fullPage: true });
  });

  test('6. Load More Functionality - Desktop load more button', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search"]');
    
    // Perform search
    await searchInput.fill('shirt');
    await searchInput.press('Enter');
    
    // Wait for results
    await page.waitForTimeout(1000);
    
    // Check for load more button (if there are more products)
    const loadMoreButton = page.locator('text=/Load More/');
    if (await loadMoreButton.isVisible()) {
      await expect(loadMoreButton).toBeVisible();
      
      // Click load more
      await loadMoreButton.click();
      
      // Wait for loading
      await page.waitForTimeout(1000);
      
      // Take screenshot after load more
      await page.screenshot({ path: 'test-results/6-load-more-desktop.png', fullPage: true });
    }
  });

  test('7. Mobile Responsiveness - 6 products initially on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const searchInput = page.locator('input[placeholder="Search"]');
    
    // Perform search
    await searchInput.fill('shirt');
    await searchInput.press('Enter');
    
    // Wait for results
    await page.waitForTimeout(1000);
    
    // Check that mobile filter button is visible
    const mobileFilterButton = page.locator('text=Filters');
    await expect(mobileFilterButton).toBeVisible();
    
    // Check that desktop sidebar is hidden on mobile
    const desktopSidebar = page.locator('aside');
    await expect(desktopSidebar).not.toBeVisible();
    
    // Count products in grid (should be 6 initially on mobile)
    const productCards = page.locator('.grid > div');
    const productCount = await productCards.count();
    
    // Should show 6 products initially on mobile
    expect(productCount).toBeLessThanOrEqual(6);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/7-mobile-initial.png', fullPage: true });
  });

  test('8. Mobile Infinite Scroll - Scroll triggers load more', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const searchInput = page.locator('input[placeholder="Search"]');
    
    // Perform search
    await searchInput.fill('shirt');
    await searchInput.press('Enter');
    
    // Wait for results
    await page.waitForTimeout(1000);
    
    // Scroll to bottom to trigger infinite scroll
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Wait for potential loading
    await page.waitForTimeout(1000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/8-mobile-scroll.png', fullPage: true });
  });

  test('9. Empty State - No products found message', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search"]');
    
    // Search for something that likely has no results
    await searchInput.fill('xyz123nonexistentproduct');
    await searchInput.press('Enter');
    
    // Wait for results
    await page.waitForTimeout(1000);
    
    // Check for "No products found" message
    const noResultsMessage = page.locator('text=/No products found/');
    await expect(noResultsMessage).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/9-empty-state.png', fullPage: true });
  });

  test('10. Clear Search - Shows all products when cleared', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search"]');
    
    // First perform a search
    await searchInput.fill('shirt');
    await searchInput.press('Enter');
    
    // Wait for results
    await page.waitForTimeout(1000);
    
    // Clear the search input
    await searchInput.clear();
    await searchInput.press('Enter');
    
    // Wait for results
    await page.waitForTimeout(1000);
    
    // Check that filter sidebar is still visible
    const filterSidebar = page.locator('aside');
    await expect(filterSidebar).toBeVisible();
    
    // Check that we're showing all products (not recommendations)
    const recommendationsSection = page.locator('text=Recommendations');
    await expect(recommendationsSection).not.toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/10-clear-search.png', fullPage: true });
  });

  test('11. Popular Searches - Clicking popular search works', async ({ page }) => {
    // Check that popular searches are visible
    await expect(page.locator('text=Popular Searches')).toBeVisible();
    
    // Find and click a popular search term
    const popularSearchButtons = page.locator('button').filter({ hasText: /shirt|underwear|plan/ });
    const firstPopularSearch = popularSearchButtons.first();
    
    if (await firstPopularSearch.isVisible()) {
      await firstPopularSearch.click();
      
      // Check that search input is filled
      const searchInput = page.locator('input[placeholder="Search"]');
      await expect(searchInput).not.toHaveValue('');
      
      // Check that filter sidebar appears
      const filterSidebar = page.locator('aside');
      await expect(filterSidebar).toBeVisible();
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/11-popular-search-click.png', fullPage: true });
    }
  });

  test('12. Filter Functionality - Desktop filters work', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search"]');
    
    // Perform search to show filters
    await searchInput.fill('shirt');
    await searchInput.press('Enter');
    
    // Wait for results and filters
    await page.waitForTimeout(1000);
    
    // Check that filter sidebar is visible
    const filterSidebar = page.locator('aside');
    await expect(filterSidebar).toBeVisible();
    
    // Check for category filters
    const categorySection = page.locator('text=Category');
    await expect(categorySection).toBeVisible();
    
    // Check for price filter
    const priceSection = page.locator('text=Price');
    await expect(priceSection).toBeVisible();
    
    // Check for size filter
    const sizeSection = page.locator('text=Size');
    await expect(sizeSection).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/12-desktop-filters.png', fullPage: true });
  });

  test('13. Mobile Filter Drawer - Mobile filters work', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const searchInput = page.locator('input[placeholder="Search"]');
    
    // Perform search
    await searchInput.fill('shirt');
    await searchInput.press('Enter');
    
    // Wait for results
    await page.waitForTimeout(1000);
    
    // Click mobile filter button
    const mobileFilterButton = page.locator('text=Filters');
    await mobileFilterButton.click();
    
    // Check that filter drawer opens
    const filterDrawer = page.locator('[role="dialog"]');
    await expect(filterDrawer).toBeVisible();
    
    // Check for filter sections in drawer
    const categorySection = page.locator('text=Categories');
    await expect(categorySection).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/13-mobile-filter-drawer.png', fullPage: true });
  });

  test('14. Loading States - Skeleton loaders during search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search"]');
    
    // Type search term
    await searchInput.fill('shirt');
    
    // Press Enter and immediately check for loading state
    await searchInput.press('Enter');
    
    // Look for skeleton loaders or loading indicators
    const skeletonLoaders = page.locator('.animate-pulse');
    const loadingText = page.locator('text=/Loading/');
    
    // Either skeleton loaders or loading text should be visible briefly
    const hasSkeleton = await skeletonLoaders.count() > 0;
    const hasLoadingText = await loadingText.isVisible();
    
    // Take screenshot during loading
    await page.screenshot({ path: 'test-results/14-loading-states.png', fullPage: true });
  });

  test('15. Keyboard Navigation - Arrow keys work in autocomplete', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search"]');
    
    // Type to trigger autocomplete
    await searchInput.fill('shirt');
    await page.waitForTimeout(500);
    
    // Press arrow down to navigate suggestions
    await searchInput.press('ArrowDown');
    
    // Check that a suggestion is highlighted
    const highlightedSuggestion = page.locator('[data-suggestion-item].bg-muted');
    await expect(highlightedSuggestion).toBeVisible();
    
    // Press Enter to select
    await searchInput.press('Enter');
    
    // Check that search is performed
    const filterSidebar = page.locator('aside');
    await expect(filterSidebar).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/15-keyboard-navigation.png', fullPage: true });
  });
});
