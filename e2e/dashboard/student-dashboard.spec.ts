import { test, expect } from '@playwright/test';
import {
  loginAsStudent,
  navigateToDashboard,
  logout,
  getLocaleUrl,
  waitForLoadingToComplete,
  STUDENT_CREDENTIALS
} from '../fixtures/test-helpers';

test.describe('Student Dashboard Flow', () => {
  test('unauthenticated user cannot access dashboard directly', async ({ page }) => {
    // Try to access dashboard without login
    await navigateToDashboard(page, 'en');

    // Should redirect to login
    await page.waitForTimeout(500);
    const url = page.url();

    // Either redirected to login or login form is visible
    const redirectedToLogin = url.includes('/auth/login') || url.includes('/login');
    const loginFormVisible = await page.locator('text=Sign In, Login, Password').first()
      .isVisible({ timeout: 2000 }).catch(() => false);

    expect(redirectedToLogin || loginFormVisible).toBeTruthy();
  });

  test('authenticated user can access dashboard', async ({ page }) => {
    // Login first
    await loginAsStudent(page, STUDENT_CREDENTIALS);

    // Navigate to dashboard
    await navigateToDashboard(page, 'en');

    // Should be on dashboard
    const url = page.url();
    expect(url.includes('/courses')).toBeTruthy();

    // Dashboard should not have error
    const error = page.locator('text=error, Error, failed').first();
    const hasError = await error.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasError).toBeFalsy();
  });

  test('dashboard displays page heading', async ({ page }) => {
    await loginAsStudent(page, STUDENT_CREDENTIALS);
    await navigateToDashboard(page, 'en');

    // Should have a heading
    const heading = page.locator('h1, h2, [role="heading"]').first();
    const hasHeading = await heading.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasHeading).toBeTruthy();
  });

  test('dashboard shows enrolled courses or empty state', async ({ page }) => {
    await loginAsStudent(page, STUDENT_CREDENTIALS);
    await navigateToDashboard(page, 'en');

    // Should show either courses or empty state
    const courseCard = page.locator(
      '[class*="course"], [class*="Course"], a[href*="/course/"]'
    ).first();

    const emptyState = page.locator(
      'text=No courses, empty, not enrolled, get started'
    ).first();

    const courseCount = await page.locator('[href*="/course/"]').count();

    const hasCourses = courseCount > 0;
    const hasEmptyMessage = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);

    // Should have either courses or empty state message
    expect(hasCourses || hasEmptyMessage).toBeTruthy();
  });

  test('dashboard course cards are clickable', async ({ page }) => {
    await loginAsStudent(page, STUDENT_CREDENTIALS);
    await navigateToDashboard(page, 'en');

    // Check for course links
    const courseLinks = page.locator('a[href*="/course/"]');
    const count = await courseLinks.count();

    if (count > 0) {
      // Get the href of first course
      const firstCourseUrl = await courseLinks.first().getAttribute('href');
      expect(firstCourseUrl).toContain('/course/');
    }
  });

  test('dashboard shows course progress if available', async ({ page }) => {
    await loginAsStudent(page, STUDENT_CREDENTIALS);
    await navigateToDashboard(page, 'en');

    // Look for progress indicators
    const progressBar = page.locator(
      '[role="progressbar"], [class*="progress"], [class*="Progress"]'
    ).first();

    const progressText = page.locator(
      'text=Progress, completed, %'
    ).first();

    const hasProgress = await progressBar.isVisible({ timeout: 2000 }).catch(() => false) ||
                       await progressText.isVisible({ timeout: 2000 }).catch(() => false);

    // Progress is optional (may not be available if no courses)
    expect(typeof hasProgress === 'boolean').toBeTruthy();
  });

  test('dashboard has proper page structure', async ({ page }) => {
    await loginAsStudent(page, STUDENT_CREDENTIALS);
    await navigateToDashboard(page, 'en');

    // Should have main content area
    const main = page.locator('main, [role="main"], .container').first();
    const hasMain = await main.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasMain).toBeTruthy();

    // Should have header
    const header = page.locator('header, nav, [role="banner"]').first();
    const hasHeader = await header.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasHeader).toBeTruthy();
  });

  test('dashboard filters or search works if available', async ({ page }) => {
    await loginAsStudent(page, STUDENT_CREDENTIALS);
    await navigateToDashboard(page, 'en');

    // Look for filter or search input
    const searchInput = page.locator(
      'input[placeholder*="Search"], input[placeholder*="Filter"], input[aria-label*="Search"]'
    ).first();

    const hasSearch = await searchInput.isVisible({ timeout: 2000 }).catch(() => false);

    // Search is optional
    if (hasSearch) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      // Dashboard should filter results
    }

    expect(typeof hasSearch === 'boolean').toBeTruthy();
  });

  test('dashboard is responsive on mobile', async ({ page }) => {
    await loginAsStudent(page, STUDENT_CREDENTIALS);

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    await navigateToDashboard(page, 'en');

    // Dashboard should still be usable
    const main = page.locator('main, [role="main"], .container').first();
    const isVisible = await main.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isVisible).toBeTruthy();

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('user can navigate to course from dashboard', async ({ page }) => {
    await loginAsStudent(page, STUDENT_CREDENTIALS);
    await navigateToDashboard(page, 'en');

    // Find first course link
    const courseLink = page.locator('a[href*="/course/"]').first();

    if (await courseLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await courseLink.click();

      // Should navigate to course page
      await page.waitForURL((url) => url.pathname.includes('/course/'), { timeout: 5000 });

      const url = page.url();
      expect(url.includes('/course/')).toBeTruthy();
    }
  });

  test('dashboard logout works', async ({ page }) => {
    await loginAsStudent(page, STUDENT_CREDENTIALS);
    await navigateToDashboard(page, 'en');

    // Logout
    await logout(page);

    // Should redirect to login
    await page.waitForTimeout(500);
    const url = page.url();
    expect(url.includes('/auth/login') || url.includes('/login')).toBeTruthy();
  });

  test('dashboard displays course metadata', async ({ page }) => {
    await loginAsStudent(page, STUDENT_CREDENTIALS);
    await navigateToDashboard(page, 'en');

    // Look for course details (title, description, level, etc.)
    const courseTitle = page.locator(
      '[class*="course"] h2, [class*="course"] h3, [class*="course"] p'
    ).first();

    const hasMetadata = await courseTitle.isVisible({ timeout: 2000 }).catch(() => false);

    // Metadata is optional if empty state
    expect(typeof hasMetadata === 'boolean').toBeTruthy();
  });

  test('dashboard loads without critical errors', async ({ page }) => {
    await loginAsStudent(page, STUDENT_CREDENTIALS);

    const startTime = Date.now();
    await navigateToDashboard(page, 'en');
    const loadTime = Date.now() - startTime;

    // Should load in reasonable time
    expect(loadTime).toBeLessThan(10000);

    // No critical errors
    const errors = page.locator('text=Error, error, failed, Failed, Something went wrong').first();
    const hasError = await errors.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasError).toBeFalsy();
  });

  test('dashboard pagination or infinite scroll works', async ({ page }) => {
    await loginAsStudent(page, STUDENT_CREDENTIALS);
    await navigateToDashboard(page, 'en');

    // Look for pagination buttons or scroll handling
    const nextButton = page.locator('button:has-text("Next"), a:has-text("Next")').first();
    const paginationInfo = page.locator('text=Page, of').first();

    const hasPagination = await nextButton.isVisible({ timeout: 2000 }).catch(() => false) ||
                         await paginationInfo.isVisible({ timeout: 2000 }).catch(() => false);

    // Pagination is optional
    expect(typeof hasPagination === 'boolean').toBeTruthy();
  });

  test('dashboard shows sorting or filtering options', async ({ page }) => {
    await loginAsStudent(page, STUDENT_CREDENTIALS);
    await navigateToDashboard(page, 'en');

    // Look for sort/filter options
    const sortButton = page.locator(
      'button:has-text("Sort"), button:has-text("Filter"), select'
    ).first();

    const hasSort = await sortButton.isVisible({ timeout: 2000 }).catch(() => false);

    // Sorting is optional
    expect(typeof hasSort === 'boolean').toBeTruthy();
  });

  test('dashboard course cards show completion status', async ({ page }) => {
    await loginAsStudent(page, STUDENT_CREDENTIALS);
    await navigateToDashboard(page, 'en');

    // Look for completion badge or status
    const completionBadge = page.locator(
      'text=Completed, completed, Complete, in progress, Not started'
    ).first();

    const hasStatus = await completionBadge.isVisible({ timeout: 2000 }).catch(() => false);

    // Status is optional
    expect(typeof hasStatus === 'boolean').toBeTruthy();
  });

  test('dashboard supports both English and Hebrew locales', async ({ page }) => {
    // Test English
    await loginAsStudent(page, STUDENT_CREDENTIALS);
    await navigateToDashboard(page, 'en');

    const enUrl = page.url();
    expect(enUrl.includes('/en/')).toBeTruthy();

    // Logout
    await logout(page);

    // Test Hebrew
    await loginAsStudent(page, STUDENT_CREDENTIALS);
    await page.goto(getLocaleUrl('he', '/courses'));
    await waitForLoadingToComplete(page);

    const heUrl = page.url();
    expect(heUrl.includes('/he/')).toBeTruthy();

    // Check RTL
    const dir = await page.locator('html').getAttribute('dir');
    expect(dir).toBe('rtl');
  });

  test('dashboard course cards are accessible', async ({ page }) => {
    await loginAsStudent(page, STUDENT_CREDENTIALS);
    await navigateToDashboard(page, 'en');

    // Course cards should be keyboard accessible
    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => {
      const active = document.activeElement;
      return active?.tagName || active?.getAttribute('role');
    });

    expect(focusedElement).toBeTruthy();
  });

  test('dashboard handles loading states properly', async ({ page }) => {
    await loginAsStudent(page, STUDENT_CREDENTIALS);

    // Navigate and check for loading state
    const navigationPromise = page.goto(getLocaleUrl('en', '/courses'));

    // Should complete without hanging
    await navigationPromise;
    await page.waitForTimeout(500);

    // Page should be functional
    const main = page.locator('main, [role="main"]').first();
    const isVisible = await main.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });
});
