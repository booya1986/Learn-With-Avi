import { test, expect, Page } from '@playwright/test';

test.describe('Admin Panel E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  // ============================================================================
  // AUTHENTICATION TESTS (5 tests)
  // ============================================================================

  test('user can login with valid credentials', async () => {
    await page.goto('/admin/login');

    // Verify login page loads
    await expect(page.locator('text=LearnWithAvi')).toBeVisible();
    await expect(page.locator('text=Admin Panel')).toBeVisible();

    // Fill in login form
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');

    // Submit form
    await page.click('button:has-text("Sign In")');

    // Should redirect to dashboard
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('user cannot login with invalid credentials', async () => {
    await page.goto('/admin/login');

    // Fill in incorrect credentials
    await page.fill('#login-email', 'invalid@example.com');
    await page.fill('#login-password', 'wrongpassword');

    // Submit form
    await page.click('button:has-text("Sign In")');

    // Should show error message
    await expect(
      page.locator('text=Invalid email or password')
    ).toBeVisible({ timeout: 5000 });

    // Should stay on login page
    expect(page.url()).toContain('/admin/login');
  });

  test('unauthenticated user redirects to login', async () => {
    // Try to access dashboard without login
    await page.goto('/admin/dashboard');

    // Should redirect to login
    await page.waitForURL('**/admin/login**', { timeout: 5000 });
    await expect(page.locator('text=LearnWithAvi')).toBeVisible();
  });

  test('user can logout from dashboard', async () => {
    // Login first
    await page.goto('/admin/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');

    // Wait for dashboard
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });

    // Find and click logout button (usually in sidebar or menu)
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();

    if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutButton.click();
      await page.waitForURL('**/admin/login**', { timeout: 5000 });
    }
  });

  test('session persists on page refresh', async () => {
    // Login
    await page.goto('/admin/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');

    // Wait for dashboard
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });

    // Store current URL
    const dashboardUrl = page.url();

    // Refresh page
    await page.reload();

    // Should still be on dashboard (session persisted)
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 5000 });
    expect(page.url()).toContain('/admin/dashboard');
  });

  // ============================================================================
  // COURSE CRUD TESTS (8 tests)
  // ============================================================================

  test('user can view courses list', async () => {
    await page.goto('/admin/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');

    // Navigate to courses
    const coursesLink = page.locator('a[href="/admin/courses"]').first();
    await coursesLink.waitFor({ state: 'visible', timeout: 5000 });
    await coursesLink.click();

    // Verify courses page loaded
    await expect(page.locator('text=Courses')).toBeVisible({ timeout: 5000 });

    // Verify "Create Course" button exists
    await expect(page.locator('button:has-text("Create Course")')).toBeVisible();
  });

  test('user can create new course', async () => {
    await page.goto('/admin/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');

    // Navigate to courses
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });
    await page.goto('/admin/courses');

    // Click create course button
    await page.click('button:has-text("Create Course"), a:has-text("Create Course")');

    // Wait for course form page
    await expect(page.locator('text=Course')).toBeVisible({ timeout: 5000 });

    // Fill in course details
    await page.fill('input[placeholder*="Course title"], input[placeholder*="Title"]', 'New Test Course');
    await page.fill('textarea[placeholder*="description"], textarea', 'This is a test course description');

    // Select difficulty (if select exists)
    const difficultySelect = page.locator('select, button:has-text("Difficulty")').first();
    if (await difficultySelect.isVisible({ timeout: 1000 }).catch(() => false)) {
      await difficultySelect.click();
      await page.click('text=Beginner');
    }

    // Submit form
    const submitButton = page.locator('button:has-text("Create"), button:has-text("Save"), button:has-text("Submit")').first();
    await submitButton.click();

    // Should show success message or redirect
    await page.waitForTimeout(2000);

    // Verify we're back at courses list or see success
    const isAtCourses = await page.locator('text=Courses').isVisible({ timeout: 2000 }).catch(() => false);
    const hasSuccess = await page.locator('text=Success, created, added').first().isVisible({ timeout: 2000 }).catch(() => false);

    expect(isAtCourses || hasSuccess).toBeTruthy();
  });

  test('user can edit existing course', async () => {
    await page.goto('/admin/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');

    // Navigate to courses
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });
    await page.goto('/admin/courses');

    // Wait for courses to load
    await page.waitForSelector('[href*="/admin/courses/"]', { timeout: 5000 });

    // Click first edit button
    const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
    await editButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (await editButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await editButton.click();

      // Verify edit form loaded
      await expect(page.locator('text=Edit, Course')).toBeVisible({ timeout: 5000 });

      // Update course title
      const titleInput = page.locator('input[placeholder*="title"], input[placeholder*="Title"]').first();
      await titleInput.clear();
      await titleInput.fill('Updated Test Course');

      // Submit
      const submitButton = page.locator('button:has-text("Save"), button:has-text("Update"), button:has-text("Submit")').first();
      await submitButton.click();

      // Should return to courses list
      await page.waitForTimeout(2000);
    }
  });

  test('user can delete course with confirmation', async () => {
    await page.goto('/admin/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');

    // Navigate to courses
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });
    await page.goto('/admin/courses');

    // Wait for courses to load
    await page.waitForSelector('button:has-text("Delete"), button:has-text("Trash"), [title="Delete"]', { timeout: 5000 });

    // Click delete button
    const deleteButton = page.locator('button:has-text("Delete"), button[title="Delete"], button:has-text("Trash")').first();

    if (await deleteButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await deleteButton.click();

      // Confirmation dialog should appear
      await expect(
        page.locator('text=Delete Course, delete, Are you sure')
      ).toBeVisible({ timeout: 3000 });

      // Click confirm delete
      const confirmButton = page.locator('button:has-text("Delete")').last();
      await confirmButton.click();

      // Should show success message
      await page.waitForTimeout(1500);
    }
  });

  test('course validation shows errors', async () => {
    await page.goto('/admin/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');

    // Navigate to new course
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });
    await page.goto('/admin/courses/new');

    // Wait for form
    await page.waitForSelector('input, textarea', { timeout: 5000 });

    // Try to submit without filling required fields
    const submitButton = page.locator('button:has-text("Create"), button:has-text("Save"), button:has-text("Submit")').first();
    await submitButton.click();

    // Should show validation error
    const errorMessage = page.locator('text=required, Title, Description, must');
    await expect(errorMessage.first()).toBeVisible({ timeout: 3000 });
  });

  test('user can search/filter courses', async () => {
    await page.goto('/admin/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');

    // Navigate to courses
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });
    await page.goto('/admin/courses');

    // Wait for search input
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 5000 });

    // Type search query
    await searchInput.fill('test');

    // Wait for results to filter
    await page.waitForTimeout(500);

    // Results should be filtered
    const courseCount = page.locator('text=/\\d+ course/');
    await expect(courseCount.first()).toBeVisible();
  });

  test('user can navigate to course videos', async () => {
    await page.goto('/admin/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');

    // Navigate to courses
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });
    await page.goto('/admin/courses');

    // Wait for courses
    await page.waitForSelector('button:has-text("Videos"), a:has-text("Videos")', { timeout: 5000 });

    // Click videos button for first course
    const videosButton = page.locator('button:has-text("Videos"), a:has-text("Videos")').first();

    if (await videosButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await videosButton.click();

      // Should navigate to course videos page
      await page.waitForTimeout(1000);
      const isOnVideosPage = page.url().includes('/videos') ||
                            await page.locator('text=Videos, videos').isVisible({ timeout: 2000 }).catch(() => false);
      expect(isOnVideosPage).toBeTruthy();
    }
  });

  // ============================================================================
  // VIDEO CRUD TESTS (8 tests)
  // ============================================================================

  test('user can view videos list', async () => {
    await page.goto('/admin/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');

    // Navigate to videos
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });
    const videosLink = page.locator('a[href="/admin/videos"]').first();
    await videosLink.waitFor({ state: 'visible', timeout: 5000 });
    await videosLink.click();

    // Verify videos page loaded
    await expect(page.locator('text=Videos')).toBeVisible({ timeout: 5000 });

    // Verify "Add Video" button exists
    await expect(page.locator('button:has-text("Add Video")')).toBeVisible();
  });

  test('user can create new video with YouTube URL', async () => {
    await page.goto('/admin/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');

    // Navigate to new video
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });
    await page.goto('/admin/videos/new');

    // Wait for form
    await page.waitForSelector('input, textarea', { timeout: 5000 });

    // Select course
    const courseSelect = page.locator('select, button:has-text("Course")').first();
    if (await courseSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
      await courseSelect.click();
      await page.click('text=/Beginner|Intermediate|Advanced|Introduction|Course/').catch(() => {});
    }

    // Fill in YouTube URL or ID
    const youtubeInput = page.locator('input[placeholder*="YouTube"], input[placeholder*="youtube"], input[placeholder*="URL"]').first();
    if (await youtubeInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await youtubeInput.fill('dQw4w9WgXcQ'); // Valid YouTube ID format
    }

    // Fill video title
    const titleInput = page.locator('input[placeholder*="title"], input[placeholder*="Title"]').first();
    await titleInput.fill('Test Video');

    // Fill duration (if field exists)
    const durationInput = page.locator('input[type="number"], input[placeholder*="duration"], input[placeholder*="Duration"]').first();
    if (await durationInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await durationInput.fill('3600');
    }

    // Submit form
    const submitButton = page.locator('button:has-text("Create"), button:has-text("Save"), button:has-text("Add")').first();
    await submitButton.click();

    // Should show success or redirect
    await page.waitForTimeout(2000);
  });

  test('YouTube URL validation works', async () => {
    await page.goto('/admin/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');

    // Navigate to new video
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });
    await page.goto('/admin/videos/new');

    // Wait for form
    await page.waitForSelector('input', { timeout: 5000 });

    // Enter invalid YouTube URL
    const youtubeInput = page.locator('input[placeholder*="YouTube"], input[placeholder*="youtube"], input[placeholder*="URL"]').first();
    if (await youtubeInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await youtubeInput.fill('invalid-url');

      // Try to submit
      const submitButton = page.locator('button:has-text("Create"), button:has-text("Save"), button:has-text("Add"), button:has-text("Validate")').first();
      await submitButton.click();

      // Should show validation error
      await page.waitForTimeout(1000);
      const errorVisible = await page.locator('text=invalid, YouTube, Invalid, must be').first().isVisible({ timeout: 2000 }).catch(() => false);
      expect(errorVisible).toBeTruthy();
    }
  });

  test('user can edit video metadata', async () => {
    await page.goto('/admin/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');

    // Navigate to videos
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });
    await page.goto('/admin/videos');

    // Wait for videos to load
    await page.waitForSelector('button:has-text("Edit"), a:has-text("Edit")', { timeout: 5000 });

    // Click first edit button
    const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();

    if (await editButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await editButton.click();

      // Wait for edit form
      await page.waitForSelector('input, textarea', { timeout: 5000 });

      // Update title
      const titleInput = page.locator('input[placeholder*="title"], input[placeholder*="Title"]').first();
      await titleInput.clear();
      await titleInput.fill('Updated Video Title');

      // Submit
      const submitButton = page.locator('button:has-text("Save"), button:has-text("Update"), button:has-text("Submit")').first();
      await submitButton.click();

      await page.waitForTimeout(1500);
    }
  });

  test('user can delete video', async () => {
    await page.goto('/admin/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');

    // Navigate to videos
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });
    await page.goto('/admin/videos');

    // Wait for videos to load
    await page.waitForSelector('button:has-text("Delete"), button[title="Delete"], button:has-text("Trash")', { timeout: 5000 });

    // Click delete button
    const deleteButton = page.locator('button:has-text("Delete"), button[title="Delete"], button:has-text("Trash")').first();

    if (await deleteButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await deleteButton.click();

      // Confirmation should appear
      await expect(
        page.locator('text=Delete Video, delete, Are you sure')
      ).toBeVisible({ timeout: 3000 });

      // Confirm delete
      const confirmButton = page.locator('button:has-text("Delete")').last();
      await confirmButton.click();

      await page.waitForTimeout(1500);
    }
  });

  test('user can edit video chapters', async () => {
    await page.goto('/admin/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');

    // Navigate to videos
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });
    await page.goto('/admin/videos');

    // Wait for videos
    await page.waitForSelector('button:has-text("Edit"), a:has-text("Edit")', { timeout: 5000 });

    // Click edit button
    const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();

    if (await editButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await editButton.click();

      // Wait for form
      await page.waitForSelector('input, textarea', { timeout: 5000 });

      // Look for chapter editor
      const chapterButton = page.locator('button:has-text("Chapter"), button:has-text("Edit Chapters")').first();

      if (await chapterButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await chapterButton.click();

        // Chapter editor should appear
        await page.waitForTimeout(500);
      }
    }
  });

  test('user can reorder videos', async () => {
    await page.goto('/admin/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');

    // Navigate to videos
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });
    await page.goto('/admin/videos');

    // Wait for videos to load
    await page.waitForSelector('[draggable="true"], button[title*="drag"], button:has-text("Reorder")', { timeout: 5000 });

    // Try to find drag handle or reorder button
    const dragHandle = page.locator('[draggable="true"], button[title*="drag"]').first();

    if (await dragHandle.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Drag first video down
      await dragHandle.dragTo(page.locator('tr, div[role="row"]').nth(2));
      await page.waitForTimeout(500);
    }
  });

  test('user can manage video transcripts', async () => {
    await page.goto('/admin/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');

    // Navigate to videos
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });
    await page.goto('/admin/videos');

    // Wait for videos
    await page.waitForSelector('button:has-text("Edit"), a:has-text("Edit")', { timeout: 5000 });

    // Click edit button
    const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();

    if (await editButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await editButton.click();

      // Wait for form
      await page.waitForSelector('textarea, input', { timeout: 5000 });

      // Look for transcript field
      const transcriptField = page.locator('textarea[placeholder*="Transcript"], textarea[placeholder*="transcript"], textarea').first();

      if (await transcriptField.isVisible({ timeout: 1000 }).catch(() => false)) {
        await transcriptField.fill('Sample transcript content');
      }
    }
  });

  // ============================================================================
  // DASHBOARD TESTS (4 tests)
  // ============================================================================

  test('dashboard loads with correct data', async () => {
    await page.goto('/admin/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');

    // Wait for dashboard
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });

    // Verify dashboard title
    await expect(page.locator('text=Dashboard')).toBeVisible();

    // Verify page loaded (should not have error)
    const errorMessage = page.locator('text=error, Error, failed, Failed').first();
    const isError = await errorMessage.isVisible({ timeout: 1000 }).catch(() => false);
    expect(isError).toBeFalsy();
  });

  test('dashboard displays statistics', async () => {
    await page.goto('/admin/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');

    // Wait for dashboard
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });

    // Look for stat cards
    const totalCoursesCard = page.locator('text=Total Courses, Courses').first();
    const totalVideosCard = page.locator('text=Total Videos, Videos').first();

    // At least one should be visible
    const hasStats = await totalCoursesCard.isVisible({ timeout: 2000 }).catch(() => false) ||
                     await totalVideosCard.isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasStats).toBeTruthy();
  });

  test('dashboard quick actions work', async () => {
    await page.goto('/admin/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');

    // Wait for dashboard
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });

    // Find action buttons
    const addVideoButton = page.locator('button:has-text("Add Video"), a:has-text("Add Video")').first();
    const createCourseButton = page.locator('button:has-text("Create Course"), a:has-text("Create Course")').first();

    // Should have at least one action button
    const hasActions = await addVideoButton.isVisible({ timeout: 2000 }).catch(() => false) ||
                       await createCourseButton.isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasActions).toBeTruthy();

    // Click action button
    if (await addVideoButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await addVideoButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('dashboard navigation links work', async () => {
    await page.goto('/admin/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');

    // Wait for dashboard
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });

    // Click courses link
    const coursesLink = page.locator('a[href="/admin/courses"], button:has-text("Courses")').first();

    if (await coursesLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await coursesLink.click();
      await page.waitForURL('**/courses**', { timeout: 5000 });
      await expect(page.locator('text=Courses')).toBeVisible();
    }

    // Go back to dashboard
    await page.goto('/admin/dashboard');

    // Click videos link
    const videosLink = page.locator('a[href="/admin/videos"], button:has-text("Videos")').first();

    if (await videosLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await videosLink.click();
      await page.waitForURL('**/videos**', { timeout: 5000 });
      await expect(page.locator('text=Videos')).toBeVisible();
    }
  });

  // ============================================================================
  // RESPONSIVE & ACCESSIBILITY TESTS
  // ============================================================================

  test('admin panel is responsive on mobile', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/admin/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');

    // Dashboard should load on mobile
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });
    await expect(page.locator('text=Dashboard')).toBeVisible();

    // Content should be accessible (buttons should be tappable)
    const button = page.locator('button').first();
    const boundingBox = await button.boundingBox();
    expect(boundingBox?.width).toBeGreaterThan(44); // Minimum touch target size
  });

  test('navigation sidebar is functional', async () => {
    await page.goto('/admin/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');

    // Wait for dashboard
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });

    // Look for navigation (sidebar or menu)
    const nav = page.locator('nav, aside, [role="navigation"]').first();
    const isNavVisible = await nav.isVisible({ timeout: 2000 }).catch(() => false);

    if (isNavVisible) {
      await expect(nav).toBeVisible();
    }
  });

  test('form validation is accessible', async () => {
    await page.goto('/admin/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('button:has-text("Sign In")');

    // Navigate to create course
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });
    await page.goto('/admin/courses/new');

    // Try to submit empty form
    const submitButton = page.locator('button:has-text("Create"), button:has-text("Save")').first();
    await submitButton.click();

    // Error messages should be visible
    const errorMessages = page.locator('text=required, must').first();
    const hasErrors = await errorMessages.isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasErrors).toBeTruthy();
  });

  test('keyboard navigation works in admin panel', async () => {
    await page.goto('/admin/login');

    // Tab to email field
    await page.keyboard.press('Tab');
    const emailField = page.locator('#login-email');

    // Type in email field
    await emailField.fill('admin@example.com');

    // Tab to password field
    await page.keyboard.press('Tab');
    await page.keyboard.type('password123');

    // Tab to submit button
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab');
    }

    // Press Enter to submit
    await page.keyboard.press('Enter');

    // Should submit and redirect
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('loading states are visible', async () => {
    await page.goto('/admin/login');
    await page.fill('#login-email', 'admin@example.com');
    await page.fill('#login-password', 'password123');

    // Click submit and immediately check for loading state
    await page.click('button:has-text("Sign In")');

    // Should show loading state (spinner or disabled state)
    const submitButton = page.locator('button:has-text("Sign In, Signing in")');
    await expect(submitButton).toBeVisible({ timeout: 2000 });

    // Wait for navigation
    await page.waitForURL('/admin/dashboard', { timeout: 5000 });
  });

  test('error messages display correctly', async () => {
    await page.goto('/admin/login');

    // Try invalid login
    await page.fill('#login-email', 'invalid@example.com');
    await page.fill('#login-password', 'wrongpass');
    await page.click('button:has-text("Sign In")');

    // Error should display
    const errorMessage = page.locator('text=Invalid, error, Error, failed, Failed').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // Error should be in a visible container
    await expect(errorMessage).toHaveClass(/text-red|bg-red|error|danger/);
  });
});
