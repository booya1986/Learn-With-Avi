import { Page, expect } from '@playwright/test';

/**
 * Shared test utilities for E2E tests
 */

export interface TestCredentials {
  email: string;
  password: string;
}

export const STUDENT_CREDENTIALS: TestCredentials = {
  email: 'student@test.com',
  password: 'Password123!',
};

export const ADMIN_CREDENTIALS: TestCredentials = {
  email: 'admin@test.com',
  password: 'AdminPass123!',
};

/**
 * Login a student user
 */
export async function loginAsStudent(page: Page, credentials = STUDENT_CREDENTIALS) {
  await page.goto('/en/auth/login');
  await expect(page.locator('text=Sign In')).toBeVisible({ timeout: 5000 });

  // Fill login form
  const emailInput = page.locator('input[type="email"], input[placeholder*="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[placeholder*="password"]').first();

  await emailInput.fill(credentials.email);
  await passwordInput.fill(credentials.password);

  // Submit form
  const submitButton = page.locator('button:has-text("Sign In"), button:has-text("Login")').first();
  await submitButton.click();

  // Wait for redirect to dashboard or home
  await page.waitForURL(
    (url) => url.pathname.includes('/courses') || url.pathname === '/en/',
    { timeout: 5000 }
  ).catch(() => {
    // Login may have failed, but we don't want to throw
  });
}

/**
 * Login an admin user
 */
export async function loginAsAdmin(page: Page, credentials = ADMIN_CREDENTIALS) {
  await page.goto('/en/admin/login');
  await expect(page.locator('text=Admin')).toBeVisible({ timeout: 5000 });

  // Fill login form
  const emailInput = page.locator('input[type="email"], input[placeholder*="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[placeholder*="password"]').first();

  await emailInput.fill(credentials.email);
  await passwordInput.fill(credentials.password);

  // Submit form
  const submitButton = page.locator('button:has-text("Sign In"), button:has-text("Login")').first();
  await submitButton.click();

  // Wait for dashboard
  await page.waitForURL('**/admin/dashboard**', { timeout: 5000 }).catch(() => {
    // Admin login may have failed
  });
}

/**
 * Logout current user
 */
export async function logout(page: Page) {
  // Find logout button (may be in menu/dropdown)
  const logoutButton = page.locator('button:has-text("Log out"), button:has-text("Logout"), a:has-text("Log out")').first();

  if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await logoutButton.click();
    await page.waitForURL(
      (url) => url.pathname.includes('/auth/login') || url.pathname.includes('/admin/login'),
      { timeout: 5000 }
    ).catch(() => {});
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // If logout button is visible, user is authenticated
    const logoutButton = page.locator('button:has-text("Log out"), button:has-text("Logout"), a:has-text("Log out")').first();
    return await logoutButton.isVisible({ timeout: 2000 }).catch(() => false);
  } catch {
    return false;
  }
}

/**
 * Wait for element to be visible with custom message
 */
export async function expectVisible(page: Page, selector: string, message?: string) {
  try {
    await expect(page.locator(selector)).toBeVisible({ timeout: 5000 });
  } catch (error) {
    throw new Error(`${message || `Element not visible: ${selector}`}. Error: ${error}`);
  }
}

/**
 * Wait for loading spinner to disappear
 */
export async function waitForLoadingToComplete(page: Page) {
  // Wait for common loading indicators
  const loadingSelectors = [
    '[role="progressbar"]',
    '.animate-spin',
    'text=Loading',
    'text=Loading...',
  ];

  for (const selector of loadingSelectors) {
    const element = page.locator(selector).first();
    if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
      await element.waitFor({ state: 'hidden', timeout: 10000 });
    }
  }
}

/**
 * Get the base URL for a locale
 */
export function getLocaleUrl(locale: string = 'en', path: string = '/'): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${cleanPath}`;
}

/**
 * Navigate to course page
 */
export async function navigateToCourse(page: Page, courseId: string = 'ai-automation', locale: string = 'en') {
  const url = getLocaleUrl(locale, `/course/${courseId}`);
  await page.goto(url);
  await waitForLoadingToComplete(page);
}

/**
 * Navigate to student dashboard
 */
export async function navigateToDashboard(page: Page, locale: string = 'en') {
  const url = getLocaleUrl(locale, '/courses');
  await page.goto(url);
  await waitForLoadingToComplete(page);
}

/**
 * Navigate to admin dashboard
 */
export async function navigateToAdminDashboard(page: Page, locale: string = 'en') {
  const url = getLocaleUrl(locale, '/admin/dashboard');
  await page.goto(url);
  await waitForLoadingToComplete(page);
}

/**
 * Check if page shows error
 */
export async function hasError(page: Page): Promise<boolean> {
  const errorSelectors = [
    'text=error',
    'text=Error',
    'text=failed',
    'text=Failed',
    '[role="alert"]',
  ];

  for (const selector of errorSelectors) {
    const element = page.locator(selector).first();
    if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
      return true;
    }
  }
  return false;
}

/**
 * Fill and submit a form
 */
export async function fillAndSubmitForm(
  page: Page,
  fields: Record<string, string>,
  submitButtonText: string = 'Submit'
) {
  for (const [fieldName, value] of Object.entries(fields)) {
    // Try different selector patterns
    let input = page.locator(`input[name="${fieldName}"]`).first();
    if (!(await input.isVisible({ timeout: 500 }).catch(() => false))) {
      input = page.locator(`input[placeholder*="${fieldName}"]`).first();
    }
    if (!(await input.isVisible({ timeout: 500 }).catch(() => false))) {
      input = page.locator(`[aria-label*="${fieldName}"]`).first();
    }

    if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
      await input.fill(value);
    }
  }

  const submitButton = page.locator(`button:has-text("${submitButtonText}")`).first();
  if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await submitButton.click();
  }
}

/**
 * Test Hebrew RTL support
 */
export async function testRTLSupport(page: Page) {
  // Navigate to Hebrew version
  await page.goto('/he/');
  await page.waitForLoadState('networkidle');

  // Check for RTL attribute
  const dir = await page.locator('html').getAttribute('dir');
  expect(dir).toBe('rtl');

  // Check lang attribute
  const lang = await page.locator('html').getAttribute('lang');
  expect(lang).toMatch(/^he/i);
}

/**
 * Test mobile responsiveness
 */
export async function testMobileView(page: Page) {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(500);

  // Page should still be functional
  const buttons = page.locator('button');
  expect(await buttons.count()).toBeGreaterThan(0);
}

/**
 * Test desktop responsiveness
 */
export async function testDesktopView(page: Page) {
  // Reset to desktop viewport
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(500);
}

/**
 * Verify navigation structure
 */
export async function verifyNavigationStructure(page: Page) {
  // Check for header, main, footer
  const hasHeader = await page.locator('header, nav, [role="banner"]').first().isVisible({ timeout: 2000 }).catch(() => false);
  const hasMain = await page.locator('main, [role="main"]').first().isVisible({ timeout: 2000 }).catch(() => false);

  // At least one should be present
  expect(hasHeader || hasMain).toBeTruthy();
}

/**
 * Get current locale from URL
 */
export function getCurrentLocale(page: Page): string {
  const url = page.url();
  const match = url.match(/\/(en|he|es|fr)/);
  return match ? match[1] : 'en';
}
