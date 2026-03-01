# LearnWithAvi — Active Phase Plan

> Phase 5 — Polish & Launch Readiness
> Generated: 2026-03-01 | Status: Planned
> See [ROADMAP.md](ROADMAP.md) for phase context and [STATE.md](STATE.md) for current blockers.

---

## Task Status Tracking

| Task | Wave | Skill | Priority | Effort | Status |
|---|---|---|---|---|---|
| a11y-audit-fix | 1 | frontend-engineer | P0 | large | ✅ Done |
| security-audit | 1 | backend-engineer | P1 | medium | ✅ Done |
| e2e-critical-flows | 1 | qa-engineer | P1 | large | ✅ Done |
| perf-lighthouse-audit | 1 | frontend-engineer | P1 | medium | ✅ Done |
| ci-cd-hardening | 1 | devops-engineer | P1 | medium | ✅ Done |
| a11y-e2e-automation | 2 | qa-engineer | P1 | medium | ✅ Done |
| monitoring-observability | 2 | devops-engineer | P2 | medium | ✅ Done |
| docs-requirements-sync | 2 | product-manager | P2 | small | ✅ Done |

---

## Wave 1 — Audit & Harden (independent, no dependencies)

<task
  id="a11y-audit-fix"
  wave="1"
  skill="frontend-engineer"
  priority="P0"
  effort="large"
  depends-on=""
>
  Accessibility audit and fix — achieve WCAG 2.1 AA compliance on all key pages.

  PROBLEM: Accessibility is listed as a non-functional requirement (WCAG 2.1 AA)
  but has never been formally audited. axe-core is installed but not run systematically.

  SCOPE:

  1. AUDIT — Run axe-core programmatically on these pages:
     - Home page (/[locale]/) — course catalog
     - Course page (/[locale]/course/[courseId]) — video player + chat + sidebar
     - Student dashboard (/[locale]/courses) — enrolled courses
     - Login page (/[locale]/auth/login) — student login
     - Admin dashboard (/[locale]/admin) — admin panel

  2. FIX COMMON VIOLATIONS:
     - Missing alt text on images
     - Missing form labels (search, filters, chat input, login forms)
     - Insufficient color contrast (check green #22c55e on dark #1b1b1b bg)
     - Missing landmark roles (main, nav, aside, footer)
     - Missing heading hierarchy (h1 → h2 → h3, no skips)
     - Focus indicators on interactive elements (buttons, links, inputs)
     - Missing aria-labels on icon-only buttons (hamburger, close, play, etc.)

  3. KEYBOARD NAVIGATION:
     - Tab order is logical on course page (video → chat → sidebar)
     - Escape closes modals and drawers
     - Enter/Space activates buttons and links
     - Skip-to-content link on all pages
     - Focus trap in modals (quiz results, summary modal)

  4. SCREEN READER SUPPORT:
     - aria-live regions for dynamic content (chat messages, quiz results, progress updates)
     - aria-expanded on collapsible sections (admin sidebar, chapter groups)
     - aria-current on active navigation items
     - Meaningful link text (not "click here")

  Key files:
  - src/app/[locale]/page.tsx (home page)
  - src/app/[locale]/course/[courseId]/CoursePageClient.tsx (course page)
  - src/app/[locale]/courses/page.tsx (student dashboard)
  - src/app/[locale]/auth/login/page.tsx (login)
  - src/app/[locale]/admin/admin-layout-client.tsx (admin layout)
  - src/components/course/ (all course components)
  - src/components/admin/ (all admin components)

  Constraints:
  - Don't change visual design — only add a11y attributes and fix contrast
  - Use semantic HTML where possible (button not div, nav not div)
  - RTL must still work correctly after changes
  - Don't add new dependencies
  - Focus on high-impact fixes — critical and serious violations first

  Acceptance:
  - axe-core reports 0 critical and 0 serious violations on all 5 key pages
  - All interactive elements are keyboard accessible
  - Skip-to-content link present on main pages
  - aria-live regions on chat message area and quiz results
  - Color contrast ratios meet WCAG AA (4.5:1 for text, 3:1 for large text)
  - No TypeScript errors introduced
</task>

<task
  id="security-audit"
  wave="1"
  skill="backend-engineer"
  priority="P1"
  effort="medium"
  depends-on=""
>
  Security hardening — input validation, header security, and OWASP top 10 review.

  PROBLEM: Security NFRs mention input sanitization on all user-facing API routes,
  but this hasn't been systematically verified. Rate limiting exists but hasn't been
  reviewed for completeness.

  SCOPE:

  1. INPUT VALIDATION — Review and harden all user-facing API routes:
     - POST /api/v1/chat — validate message length (max 2000 chars), sanitize HTML
     - POST /api/v1/voice/chat — validate audio blob size (max 10MB)
     - POST /api/v1/quiz/generate — validate videoId format, bloomLevel range (1-6)
     - POST /api/v1/quiz/submit — validate answers array, score bounds
     - POST /api/v1/progress/watch — validate watchedSeconds, totalSeconds (positive ints)
     - POST /api/auth/signup — validate email format, password strength (min 8 chars)
     - Use Zod for schema validation on all POST request bodies

  2. SECURITY HEADERS — Add via next.config.ts or middleware:
     - X-Content-Type-Options: nosniff
     - X-Frame-Options: DENY
     - Referrer-Policy: strict-origin-when-cross-origin
     - Permissions-Policy: camera=(), microphone=(self), geolocation=()
     - Content-Security-Policy: basic policy (self, trusted CDNs)

  3. ERROR SANITIZATION — Verify no API route leaks:
     - Stack traces in production
     - Database connection strings
     - API keys or secrets
     - Internal file paths
     - Prisma error details (use generic messages)

  4. RATE LIMIT REVIEW:
     - Verify all AI endpoints have rate limits
     - Add rate limit to /api/auth/signup (prevent brute-force registration)
     - Verify rate limit headers are returned (X-RateLimit-Limit, X-RateLimit-Remaining)

  Key files:
  - src/app/api/v1/chat/route.ts
  - src/app/api/v1/voice/chat/route.ts
  - src/app/api/v1/quiz/generate/route.ts
  - src/app/api/v1/quiz/submit/route.ts
  - src/app/api/v1/progress/watch/route.ts
  - src/app/api/auth/signup/route.ts (if exists)
  - src/lib/rate-limit.ts
  - next.config.ts (security headers)
  - src/middleware.ts

  Constraints:
  - Don't break existing API behavior — add validation, don't change response shapes
  - Zod is already a dependency (check package.json) — if not, use manual validation
  - Security headers must not break YouTube embeds or ElevenLabs audio
  - CSP must allow: YouTube iframes, ElevenLabs API, OpenAI API, Anthropic API
  - Rate limit headers are informational — don't expose internal implementation

  Acceptance:
  - All POST endpoints validate input with clear error messages (400 for bad input)
  - Security headers present on all responses (verify with curl -I)
  - No stack traces or internal details in production error responses
  - /api/auth/signup has rate limiting
  - npm run type-check passes
  - Existing tests still pass
</task>

<task
  id="e2e-critical-flows"
  wave="1"
  skill="qa-engineer"
  priority="P1"
  effort="large"
  depends-on=""
>
  Write Playwright E2E tests for the 5 critical user flows.

  PROBLEM: E2E tests exist in e2e/ but the GitHub Actions workflow is disabled
  ("ci: disable E2E workflow until GitHub secrets are configured"). The existing
  tests may be stale. We need reliable E2E coverage for launch-critical flows.

  SCOPE:

  1. STUDENT LOGIN FLOW (e2e/auth/student-login.spec.ts):
     - Visit /en/auth/login
     - Fill email + password → submit → redirect to home page
     - Verify user greeting / authenticated state
     - Try invalid credentials → see error message
     - Verify /en/courses redirects unauthenticated users to login

  2. COURSE VIEWING FLOW (e2e/course/course-viewing.spec.ts):
     - Navigate to a course page
     - Verify video player loads
     - Verify chapter sidebar is visible
     - Click a chapter → video seeks to correct time
     - Verify transcript section loads

  3. QUIZ FLOW (e2e/quiz/quiz-flow.spec.ts):
     - Open quiz panel on course page
     - Generate a quiz (may need to mock API)
     - Select answers for all questions
     - Submit quiz → see results with score
     - Verify quiz history tab shows the attempt

  4. STUDENT DASHBOARD FLOW (e2e/dashboard/student-dashboard.spec.ts):
     - Log in as student
     - Navigate to /en/courses
     - Verify enrolled courses are shown (or empty state)
     - Click a course card → navigates to course page

  5. ADMIN DASHBOARD FLOW (e2e/admin/admin-dashboard.spec.ts):
     - Log in as admin via /en/admin/login
     - Verify admin dashboard loads with analytics cards
     - Navigate to courses management page
     - Navigate to videos management page
     - Verify sidebar navigation works on desktop

  Key files:
  - e2e/ (existing test directory)
  - playwright.config.ts (existing config)
  - e2e/fixtures/ (test helpers, if exists)

  Constraints:
  - Tests should work with a test database (or mock external APIs)
  - Use Playwright best practices: locator-based selectors, not CSS selectors
  - Use data-testid attributes where semantic selectors aren't sufficient
  - Tests must work in CI (headless Chrome)
  - Mock AI API calls (Claude, OpenAI) — don't hit real APIs in tests
  - Each test file should be independent (no shared state between files)
  - Test both English and Hebrew locales where relevant

  Acceptance:
  - 5 E2E test files covering the critical flows
  - All tests pass locally with `npx playwright test`
  - Tests use proper Playwright patterns (page fixtures, expect assertions)
  - data-testid attributes added where needed (minimal, only where semantic selectors fail)
  - README or comments explain how to run E2E tests locally
  - Tests handle loading states (wait for selectors, not arbitrary timeouts)
</task>

<task
  id="perf-lighthouse-audit"
  wave="1"
  skill="frontend-engineer"
  priority="P1"
  effort="medium"
  depends-on=""
>
  Performance audit and optimization — achieve good Lighthouse scores on key pages.

  PROBLEM: NFR targets include TTFB < 2s and AI chat first token < 1s, but
  performance has never been formally measured. Common Next.js performance issues
  (large bundles, unoptimized images, missing lazy loading) haven't been addressed.

  SCOPE:

  1. BUNDLE ANALYSIS:
     - Run `npx @next/bundle-analyzer` or equivalent to identify large chunks
     - Identify components that should be lazy-loaded (heavy, below-the-fold)
     - Check for accidental client-side imports of server-only code

  2. LAZY LOADING:
     - Dynamic import QuizPanel (only loads when quiz tab is opened)
     - Dynamic import voice components (only when user clicks voice button)
     - Dynamic import admin analytics charts (only when admin visits dashboard)
     - Use next/dynamic with { ssr: false } for client-only components

  3. IMAGE OPTIMIZATION:
     - Use next/image for all images (course thumbnails, logos)
     - Add proper width/height to prevent layout shift (CLS)
     - Use WebP format where possible
     - Add loading="lazy" for below-the-fold images

  4. FONT OPTIMIZATION:
     - Verify next/font is used (prevents FOUT/FOIT)
     - Preload critical fonts
     - Font-display: swap for non-critical fonts

  5. CACHING HEADERS:
     - Static assets: immutable, max-age=31536000
     - API responses: appropriate Cache-Control headers
     - Use stale-while-revalidate where appropriate

  6. CORE WEB VITALS:
     - LCP (Largest Contentful Paint) < 2.5s
     - FID (First Input Delay) < 100ms
     - CLS (Cumulative Layout Shift) < 0.1

  Key files:
  - next.config.ts (bundle, image, font config)
  - src/app/[locale]/page.tsx (home page — optimize LCP)
  - src/app/[locale]/course/[courseId]/CoursePageClient.tsx (heaviest page)
  - src/components/course/QuizPanel.tsx (lazy load candidate)
  - src/components/voice/ (lazy load candidate)
  - src/app/layout.tsx (font loading)

  Constraints:
  - Don't break existing functionality — lazy loading must maintain UX
  - Show loading skeletons for dynamically imported components
  - Don't add heavy dependencies (no new analytics libraries)
  - Image optimization must work with YouTube thumbnails (external URLs)
  - next.config.ts already has image remotePatterns — extend, don't replace

  Acceptance:
  - QuizPanel and voice components are dynamically imported
  - Course page bundle size reduced by 20%+ (measure before/after)
  - next/image used for all images with proper dimensions
  - No layout shift from images loading (CLS < 0.1)
  - npm run build succeeds with no increase in route sizes
  - Lighthouse Performance score > 80 on home page (if measurable locally)
</task>

<task
  id="ci-cd-hardening"
  wave="1"
  skill="devops-engineer"
  priority="P1"
  effort="medium"
  depends-on=""
>
  Harden CI/CD pipeline — fix E2E workflow, add build checks, configure Dependabot.

  PROBLEM: E2E workflow is disabled. Build verification only runs locally.
  Dependabot is configured but needs review. No automated deployment validation.

  SCOPE:

  1. GITHUB ACTIONS — Fix CI workflows:
     - Review .github/workflows/ — ensure unit test workflow runs on PRs
     - Fix E2E workflow: document required secrets, add conditional skip if secrets missing
     - Add build verification step (npm run build) to CI
     - Add TypeScript check step (npm run type-check) to CI
     - Ensure CI runs on both push to main and PRs

  2. DEPENDABOT REVIEW:
     - Review .github/dependabot.yml configuration
     - Ensure it covers npm dependencies
     - Set update schedule (weekly)
     - Add ignore rule for Next.js (must stay at 15.5.7)
     - Group minor/patch updates to reduce PR noise

  3. ENVIRONMENT VALIDATION:
     - Create a pre-deployment checklist script (scripts/check-env.sh)
     - Verify required env vars are set before deploy
     - Output warnings for optional missing vars
     - Document secrets needed for GitHub Actions

  4. BRANCH PROTECTION:
     - Document recommended branch protection rules for main:
       - Require status checks (type-check, unit tests) before merge
       - Require PR reviews
     - Add this to docs/deployment/ as a setup guide

  Key files:
  - .github/workflows/ (CI workflow files)
  - .github/dependabot.yml (dependency updates)
  - scripts/check-env.sh (NEW — env validation)
  - docs/deployment/ci-cd-setup.md (NEW — CI/CD documentation)
  - next.config.ts (build config)

  Constraints:
  - Don't add secrets to the repository — document what's needed
  - CI should be fast (< 5 min for unit tests + type check)
  - E2E tests can be optional in CI if secrets aren't configured
  - Dependabot must NOT suggest Next.js upgrades beyond 15.5.7
  - Keep workflows simple — avoid complex matrix builds

  Acceptance:
  - CI workflow runs type-check + unit tests on PRs and pushes to main
  - E2E workflow has clear documentation for required secrets
  - Dependabot ignores Next.js major/minor upgrades
  - scripts/check-env.sh validates all required env vars
  - docs/deployment/ci-cd-setup.md documents the full CI/CD setup
  - All workflows use Node.js 20 and caching for npm
</task>

---

## Wave 2 — Automation & Documentation (depend on Wave 1)

<task
  id="a11y-e2e-automation"
  wave="2"
  skill="qa-engineer"
  priority="P1"
  effort="medium"
  depends-on="a11y-audit-fix,e2e-critical-flows"
>
  Add automated accessibility testing via axe-core integrated into Playwright E2E tests.

  PROBLEM: After a11y fixes in Wave 1, we need automated regression testing
  to prevent future a11y regressions. axe-core should run as part of the
  E2E test suite.

  SCOPE:

  1. INSTALL @axe-core/playwright:
     - Add as dev dependency
     - Create shared helper for a11y checks

  2. A11Y TEST FILE — e2e/accessibility/a11y-audit.spec.ts:
     - Test each key page for axe violations:
       - Home page (/ and /he/)
       - Course page (/en/course/[courseId])
       - Student login (/en/auth/login)
       - Student dashboard (/en/courses)
       - Admin dashboard (/en/admin)
     - Assert 0 critical violations
     - Assert 0 serious violations
     - Log moderate/minor violations as warnings (don't fail)

  3. INTEGRATE INTO E2E WORKFLOW:
     - Add a11y tests as a separate job in the E2E workflow
     - Generate HTML report for a11y results
     - Upload report as GitHub Actions artifact

  Key files:
  - e2e/accessibility/a11y-audit.spec.ts (NEW)
  - e2e/fixtures/a11y-helpers.ts (NEW — shared axe helper)
  - .github/workflows/ (add a11y step to E2E workflow)

  Constraints:
  - Use @axe-core/playwright (official integration)
  - Don't duplicate tests from e2e-critical-flows — a11y tests are separate files
  - Allow moderate/minor violations with logging (avoid false-positive failures)
  - A11y tests should run fast (< 2 min total)

  Acceptance:
  - axe-core runs on all 5 key pages via Playwright
  - 0 critical and 0 serious violations
  - HTML report generated for review
  - Tests integrated into CI workflow
  - Tests pass locally with `npx playwright test e2e/accessibility/`
</task>

<task
  id="monitoring-observability"
  wave="2"
  skill="devops-engineer"
  priority="P2"
  effort="medium"
  depends-on="ci-cd-hardening"
>
  Add basic monitoring and observability for production readiness.

  SCOPE:

  1. ERROR TRACKING — Sentry integration (optional, env-gated):
     - Install @sentry/nextjs
     - Configure with SENTRY_DSN env var (already listed in PROJECT.md)
     - Capture unhandled errors in API routes
     - Capture client-side React error boundaries
     - Filter out expected errors (rate limit 429s, auth redirects)
     - If SENTRY_DSN is not set, all Sentry calls are no-ops

  2. HEALTH ENDPOINT ENHANCEMENT:
     - Extend /api/v1/health with:
       - Database connectivity check (Prisma $queryRaw SELECT 1)
       - Uptime counter
       - Memory usage (process.memoryUsage)
       - Last deployment timestamp (from env or build info)
     - Add a /api/v1/health/deep endpoint for detailed checks
     - Keep /api/v1/health fast (< 100ms, no DB check) for load balancers

  3. STRUCTURED LOGGING:
     - Add consistent log format: [timestamp] [level] [context] message
     - Log API request metadata: method, path, status, duration
     - Ensure sensitive data (tokens, passwords) is never logged
     - Use console.error for errors, console.warn for warnings, console.info for info

  Key files:
  - src/app/api/v1/health/route.ts (enhance)
  - src/lib/logger.ts (NEW — structured logging utility)
  - sentry.client.config.ts (NEW — if Sentry added)
  - sentry.server.config.ts (NEW — if Sentry added)
  - next.config.ts (Sentry webpack plugin, if added)

  Constraints:
  - Sentry is optional — everything must work without SENTRY_DSN
  - Don't add Sentry if it significantly increases bundle size (> 50KB)
  - Health endpoint must remain fast for load balancer checks
  - Structured logging should be lightweight — no heavy logging frameworks
  - Don't log request bodies (may contain PII)

  Acceptance:
  - /api/v1/health returns uptime and deployment info
  - /api/v1/health/deep checks database connectivity
  - Structured logging utility used in at least 3 API routes
  - If Sentry configured: errors captured in dashboard
  - If Sentry not configured: no errors, no performance impact
  - No sensitive data in logs
</task>

<task
  id="docs-requirements-sync"
  wave="2"
  skill="product-manager"
  priority="P2"
  effort="small"
  depends-on=""
>
  Update REQUIREMENTS.md and documentation to reflect Phase 4 completion and Phase 5 goals.

  SCOPE:

  1. REQUIREMENTS.md — Check all P2 items as complete:
     - Student progress tracking ✅
     - Student dashboard page ✅
     - Video watch progress auto-save ✅
     - Resume playback ✅
     - Quiz submission API ✅
     - Quiz history API ✅
     - Quiz results UI ✅
     - Course search + filters ✅
     - Admin analytics ✅
     - Mobile-responsive admin ✅
     - Google OAuth docs ✅
     - Course completion ✅
     - PDF certificates ✅
     - Test coverage boost ✅

  2. Add P3 section to REQUIREMENTS.md for Phase 5 NFR targets:
     - Accessibility: WCAG 2.1 AA, 0 critical axe-core violations
     - Performance: Lighthouse > 80, CLS < 0.1, LCP < 2.5s
     - Security: Zod validation on all POST routes, security headers
     - E2E: 5 critical flow tests passing
     - CI/CD: Automated checks on PRs

  3. Update PROJECT.md testing target (80% → 35% to match reality)

  Key files:
  - REQUIREMENTS.md
  - PROJECT.md (testing target line)
  - docs/README.md (if outdated)

  Constraints:
  - Only update documentation files — no code changes
  - Keep descriptions concise and accurate
  - Don't add aspirational items that aren't planned

  Acceptance:
  - All P2 checkboxes in REQUIREMENTS.md are checked
  - P3 section exists with Phase 5 NFR requirements
  - PROJECT.md has accurate testing target
  - No contradictions between docs and actual state
</task>

---

## Definition of Done (Phase 5)

- [ ] axe-core reports 0 critical/serious violations on key pages
- [ ] All interactive elements are keyboard accessible
- [ ] Input validation (Zod) on all POST API endpoints
- [ ] Security headers present on all responses
- [ ] 5 Playwright E2E tests for critical flows
- [ ] QuizPanel and voice components lazy-loaded
- [ ] CI runs type-check + unit tests on PRs
- [ ] Dependabot configured with Next.js ignore rule
- [ ] axe-core integrated into E2E test suite
- [ ] Health endpoint enhanced with uptime and DB check
- [ ] REQUIREMENTS.md P2 items checked off
- [ ] All existing tests pass (0 failures)
- [ ] No new TypeScript errors (0 total)
- [ ] `npm run build` passes
