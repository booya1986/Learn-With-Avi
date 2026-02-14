# E2E Tests (Playwright)

## Test Files

| File | Tests | Focus |
|------|-------|-------|
| `course-page.spec.ts` | ~20 | Course navigation, video player, chat, timestamps |
| `admin-panel.spec.ts` | ~30 | Admin CRUD, auth flow, video ingestion |
| `accessibility.spec.ts` | ~25 | WCAG 2.1 AA compliance, keyboard nav, focus management |

## Running

```bash
npm run test:e2e              # All E2E tests
npm run test:a11y             # Accessibility tests only
npx playwright test --ui      # Interactive UI mode
```

Requires dev server running on `http://localhost:3000`.

## Rules

- Use `page.waitForSelector()` over `page.waitForTimeout()` where possible
- Test Hebrew RTL: verify `dir="rtl"`, text alignment, input direction
- Test both desktop and mobile viewports (config includes Pixel 5, iPhone 12)
- Accessibility tests use axe-core - all pages must pass WCAG 2.1 AA
- Screenshots captured on failure (see `playwright-report/`)
- Use semantic selectors: `getByRole`, `getByText`, `getByLabel` over CSS selectors

## Config

See `playwright.config.ts` in project root. Browsers: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari.
