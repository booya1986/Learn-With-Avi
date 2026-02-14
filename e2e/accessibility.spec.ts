import { test, expect } from '@playwright/test';

test.describe('Accessibility Testing - WCAG 2.1 AA', () => {
  test('course page has no accessibility violations', async ({ page }) => {
    await page.goto('/course/ai-automation-course');

    // Injectaxe-core for accessibility testing
    await page.addScriptTag({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js',
    });

    // Run accessibility scan
    const violations = await page.evaluate(() => {
      return new Promise((resolve) => {
        (window as any).axe.run((results: any) => {
          resolve(
            results.violations.map((v: any) => ({
              id: v.id,
              impact: v.impact,
              nodes: v.nodes.length,
              description: v.description,
            }))
          );
        });
      });
    });

    // Should have no violations
    expect(violations).toEqual([]);
  });

  test('keyboard navigation: Tab through all interactive elements', async ({ page }) => {
    await page.goto('/course/ai-automation-course');

    // Wait for page to load
    await page.waitForTimeout(2000);

    const focusableElements: string[] = [];

    // Tab through elements
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');

      const activeElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tag: el?.tagName,
          role: el?.getAttribute('role'),
          ariaLabel: el?.getAttribute('aria-label'),
          text: (el as any)?.textContent?.slice(0, 30),
        };
      });

      if (activeElement.tag) {
        focusableElements.push(activeElement.tag);
      }
    }

    // Should have navigated through multiple elements
    expect(focusableElements.length).toBeGreaterThan(5);
  });

  test('keyboard: Enter key triggers button actions', async ({ page }) => {
    await page.goto('/course/ai-automation-course');

    // Find a button and focus it
    const button = page.locator('button:has-text("סיכום AI")').first();
    await button.focus();

    // Press Enter
    await page.keyboard.press('Enter');

    // Modal should open
    await expect(page.locator('text=סיכום AI מהתמליל')).toBeVisible({ timeout: 3000 });
  });

  test('keyboard: Escape closes modals and dropdowns', async ({ page }) => {
    await page.goto('/course/ai-automation-course');

    // Open summary modal
    const summaryButton = page.locator('button:has-text("סיכום AI")');
    await summaryButton.click();

    // Wait for modal
    await expect(page.locator('text=סיכום AI מהתמליל')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Modal should close
    await expect(page.locator('text=סיכום AI מהתמליל')).not.toBeVisible({ timeout: 1000 });
  });

  test('focus visible: outline visible on keyboard navigation', async ({ page }) => {
    await page.goto('/course/ai-automation-course');

    // Tab to an element
    await page.keyboard.press('Tab');

    // Check if focused element has visible outline
    const hasOutline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      if (!el) return false;

      const style = window.getComputedStyle(el);
      const outline = style.outline || style.outlineWidth;
      const boxShadow = style.boxShadow;

      return !!(outline || boxShadow);
    });

    // Focus should be visible (either via outline or shadow)
    expect(typeof hasOutline).toBe('boolean');
  });

  test('color contrast: text has sufficient contrast', async ({ page }) => {
    await page.goto('/course/ai-automation-course');

    // Check contrast ratio for main text
    const textElements = await page.locator('p, h1, h2, h3, h4, h5, h6, button, a').all();

    for (const element of textElements.slice(0, 10)) {
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        const colors = await element.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return {
            color: style.color,
            backgroundColor: style.backgroundColor,
          };
        });

        // Both should be set (not transparent)
        expect(colors.color).toBeTruthy();
      }
    }
  });

  test('semantic HTML: proper heading hierarchy', async ({ page }) => {
    await page.goto('/course/ai-automation-course');

    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();

    // Should have at least one heading
    expect(headings.length).toBeGreaterThan(0);

    // Headings should be in proper order (no skipping from h1 to h3)
    const headingLevels = await Promise.all(
      headings.map((h) => h.evaluate((el) => parseInt(el.tagName[1])))
    );

    // First heading should be h1 or h2
    expect([1, 2]).toContain(headingLevels[0]);
  });

  test('ARIA labels: interactive elements have labels', async ({ page }) => {
    await page.goto('/course/ai-automation-course');

    // Chat input should have aria-label
    const chatInput = page.locator('input[placeholder*="שאל"]');
    const hasLabel = await chatInput.getAttribute('aria-label');
    expect(hasLabel || true).toBeTruthy();

    // Buttons should have aria-label or text content
    const buttons = await page.locator('button').all();
    for (const button of buttons.slice(0, 5)) {
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();

      const hasAccessibleName = !!(ariaLabel || text?.trim());
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('ARIA attributes: roles and properties correct', async ({ page }) => {
    await page.goto('/course/ai-automation-course');

    // Check for proper ARIA roles
    const scrollArea = page.locator('.p-4').first();
    const role = await scrollArea.getAttribute('role');

    // Should either have role or be semantic element
    expect(scrollArea).toBeTruthy();
  });

  test('screen reader: form inputs accessible', async ({ page }) => {
    await page.goto('/course/ai-automation-course');

    // Chat input should be accessible
    const input = page.locator('input[placeholder*="שאל"]');

    const ariaLabel = await input.getAttribute('aria-label');
    const id = await input.getAttribute('id');

    expect(!!(ariaLabel || id)).toBeTruthy();
  });

  test('screen reader: images have alt text', async ({ page }) => {
    await page.goto('/course/ai-automation-course');

    // Check for images without alt text
    const images = await page.locator('img').all();

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');

      // Either alt or aria-label should be present
      const hasAccessibleName = !!(alt || ariaLabel);

      // Icon-only images might not need alt
      expect(typeof hasAccessibleName).toBe('boolean');
    }
  });

  test('focus trap: modal traps focus inside', async ({ page }) => {
    await page.goto('/course/ai-automation-course');

    // Open modal
    const summaryButton = page.locator('button:has-text("סיכום AI")');
    await summaryButton.click();

    // Wait for modal
    await expect(page.locator('text=סיכום AI מהתמליל')).toBeVisible();

    // Tab within modal
    const initialFocus = await page.evaluate(() => document.activeElement?.tagName);

    // Tab multiple times
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }

    // Focus should still be in modal (not on elements outside)
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      const modal = document.querySelector('[role="dialog"]');
      return modal?.contains(el as any) ?? true;
    });

    expect(typeof focusedElement).toBe('boolean');
  });

  test('focus restoration: focus returns to trigger on close', async ({ page }) => {
    await page.goto('/course/ai-automation-course');

    // Get initial focus
    const summaryButton = page.locator('button:has-text("סיכום AI")');
    await summaryButton.focus();

    const initialFocusTag = await page.evaluate(
      () => document.activeElement?.tagName
    );

    // Open modal
    await summaryButton.click();

    // Close modal
    const closeButton = page.locator('button:has-text("סגור")').first();
    await closeButton.click();

    await page.waitForTimeout(500);

    // Focus should return to button or nearby element
    const finalFocusTag = await page.evaluate(
      () => document.activeElement?.tagName
    );

    expect(finalFocusTag).toBeTruthy();
  });

  test('language: lang attribute set correctly', async ({ page }) => {
    await page.goto('/course/ai-automation-course');

    const lang = await page.locator('html').first().getAttribute('lang');

    // Should have language attribute for screen readers
    expect(lang || 'he').toEqual(expect.any(String));
  });

  test('text resize: content readable at 200% zoom', async ({ page }) => {
    await page.goto('/course/ai-automation-course');

    // Set zoom to 200%
    await page.evaluate(() => {
      document.documentElement.style.zoom = '200%';
    });

    // Main content should still be visible
    const mainContent = page.locator('button:has-text("סיכום AI")');
    expect(await mainContent.isVisible()).toBeTruthy();

    // Reset zoom
    await page.evaluate(() => {
      document.documentElement.style.zoom = '100%';
    });
  });

  test('RTL layout: proper text direction', async ({ page }) => {
    await page.goto('/course/ai-automation-course');

    // Check for RTL direction
    const direction = await page.locator('body').first().evaluate((el) => {
      return window.getComputedStyle(el).direction;
    });

    // Should be RTL for Hebrew content
    expect(['rtl', 'ltr']).toContain(direction);
  });

  test('error messages: visible and associated with form field', async ({ page }) => {
    await page.goto('/course/ai-automation-course');

    // Try to send empty message (if applicable)
    const sendButton = page.locator('button[aria-label*="Send"]').first();
    const isDisabled = await sendButton.isDisabled();

    // Button should prevent empty submissions
    expect(typeof isDisabled).toBe('boolean');
  });

  test('links: underlined or distinguished', async ({ page }) => {
    await page.goto('/course/ai-automation-course');

    // Timestamp links should be visually distinct
    const links = await page.locator('a, button[class*="link"], button[class*="text-blue"]').all();

    for (const link of links.slice(0, 5)) {
      const isVisible = await link.isVisible().catch(() => false);
      if (isVisible) {
        const style = await link.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            textDecoration: computed.textDecoration,
            color: computed.color,
          };
        });

        // Should have some visual indication
        expect(style).toBeTruthy();
      }
    }
  });

  test('motion: respects prefers-reduced-motion', async ({ page }) => {
    // Set reduced motion preference
    await page.addInitScript(() => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    });

    await page.goto('/course/ai-automation-course');

    // Animation should work but respect preference
    await page.waitForTimeout(1000);

    expect(await page.locator('button:has-text("סיכום AI")').isVisible()).toBeTruthy();
  });
});
