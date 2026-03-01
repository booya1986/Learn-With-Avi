# LearnWithAvi — Requirements

> Consolidated functional and non-functional requirements. See [ROADMAP.md](ROADMAP.md) for phase mapping.

---

## P0 — Core (MVP, all complete)

### Authentication
- [x] Student login via email/password (`user-credentials` provider)
- [x] Student login via Google OAuth
- [x] Admin login via separate credentials (`admin-credentials` provider)
- [x] Two distinct user roles — Admin and Student — never mixed
- [x] Course pages gate: unauthenticated → redirect to login with `callbackUrl`
- [x] Student signup via `POST /api/auth/signup`

### Video & Content
- [x] YouTube video player with chapter-based timeline
- [x] Chapter progress tracking (90%+ watch = complete; seeking does not count)
- [x] Clickable timestamps in chat responses to seek video
- [x] Live transcript synced to playback position
- [x] Admin can ingest YouTube videos via URL → metadata + transcript auto-fetched

### AI Chat (RAG)
- [x] Text chat with Claude Sonnet 4 grounded in video transcript (RAG)
- [x] Hybrid search: pgvector semantic + BM25 keyword fallback
- [x] Embeddings cached 1-hour LRU (cost savings)
- [x] Prompt caching enabled (50-90% cost reduction)
- [x] Rate limiting: 10 req/min per IP (chat), 5/min (voice, quiz)

### Voice AI
- [x] Voice-to-voice chat with ElevenLabs TTS + Whisper STT
- [x] Graceful fallback: ElevenLabs → browser TTS when no API key

### Hebrew / RTL
- [x] Full Hebrew RTL support (`dir="rtl"`)
- [x] Tailwind logical properties (`ps-4` not `pl-4`)
- [x] Bilingual content (Hebrew + English) in all UI surfaces

### API
- [x] All public endpoints versioned under `/api/v1/`
- [x] Unversioned routes rewritten to v1 (backward-compatible, deprecated)
- [x] Admin routes unversioned at `/api/admin/`

---

## P1 — Quality (Complete)

### Code Quality
- [x] Fix 355 pre-existing TypeScript errors (`npm run type-check`) — 0 errors
- [x] Fix 9 failing test files (25 tests — all mocking issues, not logic bugs) — 819 passing, 0 failing
- [x] Coverage threshold set to 35% (realistic; focus on business logic, not UI details)

### Voice
- [x] Complete ElevenLabs TTS integration (streaming via `/v1/text-to-speech/{voiceId}/stream`, sub-second first-chunk)

---

## P1.5 — Voice Optimization (Complete)

### Voice Pipeline
- [x] Stream TTS audio in voice chat pipeline (shared ElevenLabs lib, SSE audio-chunk events)
- [x] Fix broken `useVoiceOutput.speakWithElevenLabs` (Blob + object URL playback)
- [x] Hebrew STT accuracy improvements (language hints, voice selection)
- [x] Voice conversation persistence (useVoiceHistory hook, localStorage, 24h TTL)
- [x] Real audio waveform visualization (Web Audio API AnalyserNode)

### Voice Analytics
- [x] Voice session analytics tracking (VoiceSession Prisma model, latency metrics)
- [x] Admin dashboard voice metrics view (VoiceAnalytics card)

### Documentation
- [x] GSD context engineering files in place (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, PLAN.md)
- [x] Redundant docs/ files removed

---

## P2 — Scale (Phase 4, Complete)

### Student Progress & Dashboard
- [x] Student progress tracking (UserProgress, CourseEnrollment DB models + APIs)
- [x] Student dashboard page (/[locale]/courses with enrolled courses + progress)
- [x] Video watch progress auto-save (debounced, 15s interval)
- [x] Resume playback from last position

### Quiz Persistence
- [x] Quiz answer submission API (POST /api/v1/quiz/submit)
- [x] Quiz history API (GET /api/v1/quiz/history)
- [x] Quiz results UI with adaptive bloom level progression

### Course Catalog
- [x] Search bar for courses (client-side, debounced)
- [x] Difficulty and topic filter chips
- [x] Course cards with video count + total duration

### Admin Analytics
- [x] Student engagement analytics API (GET /api/admin/analytics)
- [x] Admin dashboard: engagement, course performance, quiz metrics cards
- [x] Recent activity feed

### Mobile & DevOps
- [x] Mobile-responsive admin panel (hamburger menu, stacked cards)
- [x] Google OAuth setup documentation + health check (blocker resolution)

### Completion
- [x] Course completion auto-detection (all videos 90%+ watched)
- [x] PDF certificate generation (GET /api/v1/certificates/[courseId])
- [x] Test coverage boost to 40%+ (blocker resolution)

---

## P3 — Polish & Launch Readiness (Phase 5, Complete)

### Accessibility
- [x] WCAG 2.1 AA compliance across all pages (16 files fixed: landmarks, ARIA tabs, focus traps, skip-to-content)
- [x] 0 critical axe-core violations on course, auth, and admin pages
- [x] Automated a11y testing: axe-core integrated into Playwright E2E suite (@axe-core/playwright)

### Performance
- [x] Dynamic imports for QuizPanel and admin analytics cards (reduce initial bundle)
- [x] React.memo for ChatMessage (prevent unnecessary re-renders)

### Security
- [x] Zod validation on all POST routes (chat max 2000 chars, signup rate-limited)
- [x] Security headers: CSP, X-Frame-Options: DENY, X-Content-Type-Options, Referrer-Policy

### E2E Testing
- [x] Playwright E2E suite: auth flow (sign up, login, logout)
- [x] Playwright E2E suite: course page (video, chat, quiz)
- [x] Playwright E2E suite: quiz submission and history
- [x] Playwright E2E suite: student dashboard and progress
- [x] Playwright E2E suite: admin panel (course + video management)

### CI/CD
- [x] GitHub Actions: type-check + lint + unit tests + build on all PRs
- [x] Dependabot configured with Next.js version lock (no auto-merge for Next.js)

### Monitoring
- [x] Structured logging (context, latency, auto-redaction) on chat, voice, quiz routes
- [x] Enhanced health endpoint with DB connectivity check (`GET /api/v1/health/deep`)

---

## Non-Functional Requirements

### Performance
- TTFB < 2s on course pages
- AI chat first token < 1s (streaming SSE)
- Voice response latency < 1s end-to-end (target)

### Accessibility
- WCAG 2.1 AA compliance
- axe-core automated tests pass on all pages
- RTL layout verified with Hebrew content

### Security
- No API keys in source code or error messages
- Rate limiting on all AI endpoints
- Input sanitization on all user-facing API routes
- HTTPS enforced (Vercel default)
- SQL injection prevented via Prisma ORM (parameterized queries)

### Reliability
- Fallback chain: pgvector → keyword search (hybrid search)
- Fallback chain: ElevenLabs → browser TTS
- API routes return correct HTTP status codes

### Constraints (Hard)
- **Next.js MUST stay at 15.5.7** — 16.x has fatal Turbopack/Webpack issues
- **Hebrew/RTL is mandatory** — never ship without RTL support
- **All secrets in `.env.local`** — never committed
