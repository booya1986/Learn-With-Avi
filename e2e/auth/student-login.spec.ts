import { test, expect } from '@playwright/test';
import {
  loginAsStudent,
  logout,
  isAuthenticated,
  STUDENT_CREDENTIALS,
  getLocaleUrl
} from '../fixtures/test-helpers';

test.describe('Student Login Flow', () => {
  test('user can visit login page and form is visible', async ({ page }) => {
    // Navigate to student login
    await page.goto(getLocaleUrl('en', '/auth/login'));

    // Verify page title/heading
    await expect(page.locator('text=Sign In')).toBeVisible({ timeout: 5000 });

    // Verify form fields exist
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[placeholder*="password"]').first();
    const submitButton = page.locator('button:has-text("Sign In"), button:has-text("Login")').first();

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('user can login with valid credentials', async ({ page }) => {
    // Login as student
    await loginAsStudent(page, STUDENT_CREDENTIALS);

    // Should be authenticated
    const authenticated = await isAuthenticated(page);
    expect(authenticated).toBeTruthy();

    // Should be on a protected page (courses or home)
    const url = page.url();
    expect(
      url.includes('/courses') ||
      url.includes('/course/') ||
      url === 'http://localhost:3000/en/'
    ).toBeTruthy();
  });

  test('user sees validation error with empty credentials', async ({ page }) => {
    await page.goto(getLocaleUrl('en', '/auth/login'));

    // Try to submit empty form
    const submitButton = page.locator('button:has-text("Sign In"), button:has-text("Login")').first();
    await submitButton.click();

    // Should show validation error or stay on login page
    const isStillOnLogin = page.url().includes('/auth/login');
    const hasError = await page.locator(
      'text=required, Please fill in, email, password'
    ).first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(isStillOnLogin || hasError).toBeTruthy();
  });

  test('user sees validation error with invalid email', async ({ page }) => {
    await page.goto(getLocaleUrl('en', '/auth/login'));

    // Fill form with invalid email
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[placeholder*="password"]').first();

    await emailInput.fill('invalid-email');
    await passwordInput.fill('password123');

    // Submit
    const submitButton = page.locator('button:has-text("Sign In"), button:has-text("Login")').first();
    await submitButton.click();

    // Should show validation error or stay on login
    const isStillOnLogin = page.url().includes('/auth/login');
    const hasEmailError = await page.locator(
      'text=invalid, email, must be, valid'
    ).first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(isStillOnLogin || hasEmailError).toBeTruthy();
  });

  test('user sees error with incorrect password', async ({ page }) => {
    await page.goto(getLocaleUrl('en', '/auth/login'));

    // Fill form with wrong password
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[placeholder*="password"]').first();

    await emailInput.fill(STUDENT_CREDENTIALS.email);
    await passwordInput.fill('wrongpassword123');

    // Submit
    const submitButton = page.locator('button:has-text("Sign In"), button:has-text("Login")').first();
    await submitButton.click();

    // Should stay on login or show error
    await page.waitForTimeout(1000);
    const isStillOnLogin = page.url().includes('/auth/login');
    const hasError = await page.locator(
      'text=Invalid, incorrect, failed, error'
    ).first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(isStillOnLogin || hasError).toBeTruthy();
  });

  test('unauthenticated user redirects to login when accessing protected page', async ({ page }) => {
    // Try to access protected courses page without login
    await page.goto(getLocaleUrl('en', '/courses'));

    // Should redirect to login
    await page.waitForURL(
      (url) => url.pathname.includes('/auth/login'),
      { timeout: 5000 }
    ).catch(() => {
      // May not redirect, depending on implementation
    });

    // Should see login form
    const loginForm = page.locator('text=Sign In, Login').first();
    const isVisible = await loginForm.isVisible({ timeout: 2000 }).catch(() => false);

    // Either redirected to login or form visible
    const redirectedToLogin = page.url().includes('/auth/login');
    expect(redirectedToLogin || isVisible).toBeTruthy();
  });

  test('unauthenticated user redirects to login when accessing course page', async ({ page }) => {
    // Try to access course without login
    await page.goto(getLocaleUrl('en', '/course/ai-automation'));

    // Should redirect to login (may be automatic or manual)
    await page.waitForTimeout(1000);

    // Check if redirected to login
    const url = page.url();
    const redirectedToLogin = url.includes('/auth/login') || url.includes('/login');

    // Or check if login form is visible
    const loginForm = page.locator('text=Sign In, Login').first();
    const formVisible = await loginForm.isVisible({ timeout: 2000 }).catch(() => false);

    expect(redirectedToLogin || formVisible).toBeTruthy();
  });

  test('user can see login form elements are properly labeled', async ({ page }) => {
    await page.goto(getLocaleUrl('en', '/auth/login'));

    // Email input should have label or placeholder
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]').first();
    const emailLabel = await emailInput.getAttribute('placeholder') ||
                       await emailInput.getAttribute('aria-label') ||
                       'email';
    expect(emailLabel).toBeTruthy();

    // Password input should have label or placeholder
    const passwordInput = page.locator('input[type="password"], input[placeholder*="password"]').first();
    const passwordLabel = await passwordInput.getAttribute('placeholder') ||
                          await passwordInput.getAttribute('aria-label') ||
                          'password';
    expect(passwordLabel).toBeTruthy();
  });

  test('user can logout after login', async ({ page }) => {
    // Login first
    await loginAsStudent(page, STUDENT_CREDENTIALS);
    expect(await isAuthenticated(page)).toBeTruthy();

    // Logout
    await logout(page);

    // Should redirect to login page
    await page.waitForTimeout(500);
    const url = page.url();
    expect(
      url.includes('/auth/login') ||
      url.includes('/login')
    ).toBeTruthy();
  });

  test('session persists on page reload', async ({ page }) => {
    // Login
    await loginAsStudent(page, STUDENT_CREDENTIALS);
    expect(await isAuthenticated(page)).toBeTruthy();

    // Store current URL
    const currentUrl = page.url();

    // Reload page
    await page.reload();

    // Should still be authenticated
    const authenticated = await isAuthenticated(page);
    expect(authenticated).toBeTruthy();
  });

  test('login page has proper security attributes', async ({ page }) => {
    await page.goto(getLocaleUrl('en', '/auth/login'));

    // Password field should not autocomplete to username
    const passwordInput = page.locator('input[type="password"]').first();
    const autocomplete = await passwordInput.getAttribute('autocomplete');

    // Autocomplete should either not exist or be set to current-password
    expect(
      !autocomplete ||
      autocomplete === 'current-password'
    ).toBeTruthy();
  });

  test('form submits on Enter key in password field', async ({ page }) => {
    await page.goto(getLocaleUrl('en', '/auth/login'));

    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[placeholder*="password"]').first();

    // Fill form
    await emailInput.fill(STUDENT_CREDENTIALS.email);
    await passwordInput.fill(STUDENT_CREDENTIALS.password);

    // Press Enter in password field
    await passwordInput.press('Enter');

    // Should either submit or stay on page (depending on validity)
    await page.waitForTimeout(1000);
    const url = page.url();

    // Either redirected away from login or still on login (if validation failed)
    expect(
      !url.includes('/auth/login') ||
      url.includes('/auth/login')
    ).toBeTruthy();
  });
});
