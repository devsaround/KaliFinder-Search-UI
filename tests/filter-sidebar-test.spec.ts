import { test, expect } from "@playwright/test";

test.describe("Filter Sidebar Visibility", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the local development server
    await page.goto("http://localhost:8080");
  });

  test("should show blank space for filter sidebar initially", async ({
    page,
  }) => {
    // Click on the search icon to open the search modal
    const searchIcon = page.locator('button[aria-label="Toggle search"]');
    await expect(searchIcon).toBeVisible();
    await searchIcon.click();

    // Wait for the search modal to open
    await page.waitForSelector(".kalifind-shadow-container", { timeout: 5000 });

    // Check that the main content area exists but filter sidebar is not visible
    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();

    // The filter sidebar should exist in DOM but be invisible (opacity 0)
    const filterSidebar = page.locator("aside");
    await expect(filterSidebar).toBeInViewport();

    // Check that the sidebar has opacity 0 initially
    const sidebarOpacity = await filterSidebar.evaluate((el) => {
      return window.getComputedStyle(el).opacity;
    });
    expect(parseFloat(sidebarOpacity)).toBe(0);

    // Check that pointer events are disabled
    const pointerEvents = await filterSidebar.evaluate((el) => {
      return window.getComputedStyle(el).pointerEvents;
    });
    expect(pointerEvents).toBe("none");
  });

  test("should show filter sidebar when user starts typing", async ({
    page,
  }) => {
    // Click on the search icon to open the search modal
    const searchIcon = page.locator('button[aria-label="Toggle search"]');
    await searchIcon.click();

    // Wait for the search modal to open
    await page.waitForSelector(".kalifind-shadow-container", { timeout: 5000 });

    // Find the search input and type something
    const searchInput = page.locator('input[placeholder="Search"]').first();
    await expect(searchInput).toBeVisible();

    // Type in the search input
    await searchInput.fill("test");

    // Wait a bit for the state to update
    await page.waitForTimeout(500);

    // Check that the filter sidebar becomes visible (opacity 1)
    const filterSidebar = page.locator("aside");
    await expect(filterSidebar).toBeInViewport();

    const sidebarOpacity = await filterSidebar.evaluate((el) => {
      return window.getComputedStyle(el).opacity;
    });
    expect(parseFloat(sidebarOpacity)).toBe(1);

    // Check that pointer events are enabled
    const pointerEvents = await filterSidebar.evaluate((el) => {
      return window.getComputedStyle(el).pointerEvents;
    });
    expect(pointerEvents).toBe("auto");

    // Verify that the filter content is visible
    const categoryFilter = page.locator('aside [data-state="open"]').first();
    await expect(categoryFilter).toBeVisible();
  });

  test("should hide filter sidebar when search is cleared", async ({
    page,
  }) => {
    // Click on the search icon to open the search modal
    const searchIcon = page.locator('button[aria-label="Toggle search"]');
    await searchIcon.click();

    // Wait for the search modal to open
    await page.waitForSelector(".kalifind-shadow-container", { timeout: 5000 });

    // Type in the search input
    const searchInput = page.locator('input[placeholder="Search"]').first();
    await searchInput.fill("test");

    // Wait for sidebar to become visible
    await page.waitForTimeout(500);

    // Clear the search input
    await searchInput.fill("");
    await searchInput.clear();

    // Wait for the state to update
    await page.waitForTimeout(500);

    // Check that the filter sidebar becomes invisible again
    const filterSidebar = page.locator("aside");
    const sidebarOpacity = await filterSidebar.evaluate((el) => {
      return window.getComputedStyle(el).opacity;
    });
    expect(parseFloat(sidebarOpacity)).toBe(0);

    // Check that pointer events are disabled again
    const pointerEvents = await filterSidebar.evaluate((el) => {
      return window.getComputedStyle(el).pointerEvents;
    });
    expect(pointerEvents).toBe("none");
  });

  test("should maintain filter sidebar visibility when filters are applied", async ({
    page,
  }) => {
    // Click on the search icon to open the search modal
    const searchIcon = page.locator('button[aria-label="Toggle search"]');
    await searchIcon.click();

    // Wait for the search modal to open
    await page.waitForSelector(".kalifind-shadow-container", { timeout: 5000 });

    // Type in the search input to make sidebar visible
    const searchInput = page.locator('input[placeholder="Search"]').first();
    await searchInput.fill("test");
    await page.waitForTimeout(500);

    // Apply a filter (if available)
    const categoryCheckbox = page
      .locator('aside input[type="checkbox"]')
      .first();
    if (await categoryCheckbox.isVisible()) {
      await categoryCheckbox.check();
      await page.waitForTimeout(500);

      // Clear the search input
      await searchInput.clear();
      await page.waitForTimeout(500);

      // Sidebar should still be visible because filters are active
      const filterSidebar = page.locator("aside");
      const sidebarOpacity = await filterSidebar.evaluate((el) => {
        return window.getComputedStyle(el).opacity;
      });
      expect(parseFloat(sidebarOpacity)).toBe(1);
    }
  });
});

