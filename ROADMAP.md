# LearnWithAvi — Roadmap

> Phase-based development plan. See [PLAN.md](PLAN.md) for active task breakdown and [STATE.md](STATE.md) for current blockers.

---

## Phase 1 — Core Platform ✅ Complete

**Goal:** Functional MVP — students can watch, chat, and learn.

| Deliverable | Status |
|---|---|
| Next.js app with Hebrew RTL | ✅ |
| NextAuth.js (Admin + Student + Google OAuth) | ✅ |
| YouTube video player with chapter tracking | ✅ |
| AI text chat with RAG (pgvector + BM25 hybrid) | ✅ |
| Voice AI (Whisper STT + ElevenLabs TTS + browser fallback) | ✅ |
| Admin panel — video ingest, transcript management | ✅ |
| API versioning (`/api/v1/`) | ✅ |
| Vercel deployment + Supabase DB | ✅ |
| i18n (next-intl v4) with `/[locale]/` routing | ✅ |
| Prompt caching + embedding LRU cache | ✅ |

**Production readiness:** 95%+ — build passes, all core features functional.

---

## Phase 2 — Quality ✅ Complete

**Goal:** Production-grade codebase — strict types, passing tests, ElevenLabs TTS streaming.

| Task | Owner Skill | Wave | Status |
|---|---|---|---|
| Fix 355→0 TypeScript errors | `backend-engineer` | 1 | ✅ Done |
| Fix 25→0 failing tests (819 passing) | `qa-engineer` | 1 | ✅ Done |
| Complete ElevenLabs TTS streaming | `backend-engineer` | 1 | ✅ Done |
| Coverage threshold set to 35% | `qa-engineer` | 2 | ✅ Done |

**Result:** 0 TS errors, 819 tests passing, 35.88% coverage, CI green.

---

## Phase 3 — Voice Optimization ✅ Complete

**Goal:** Voice AI becomes a flagship feature — streaming TTS, Hebrew accuracy, session persistence, analytics.

| Task | Owner Skill | Wave | Status |
|---|---|---|---|
| Stream TTS in voice chat (eliminate buffering) | `backend-engineer` | 1 | ✅ Done |
| Fix broken speakWithElevenLabs hook | `frontend-engineer` | 1 | ✅ Done |
| Hebrew STT optimization + language-aware TTS | `backend-engineer` | 1 | ✅ Done |
| Voice session persistence (localStorage, 24h TTL) | `frontend-engineer` | 1 | ✅ Done |
| Real audio waveform (Web Audio API AnalyserNode) | `frontend-engineer` | 1 | ✅ Done |
| Voice analytics (VoiceSession model + admin API) | `backend-engineer` | 2 | ✅ Done |
| Storybook stories for voice components | `frontend-engineer` | 2 | ✅ Done |

**Result:** 861 tests passing, 0 failures, build green. Shared ElevenLabs lib, voice analytics in admin dashboard.

---

## Phase 4 — Scale ✅ Complete

**Goal:** Multi-course platform with student progress tracking, quiz persistence, analytics, and growth features.

| Task | Owner Skill | Wave | Status |
|---|---|---|---|
| Student progress backend (DB + API) | `backend-engineer` | 1 | ✅ Done |
| Quiz persistence backend (submit + history) | `backend-engineer` | 1 | ✅ Done |
| Mobile-responsive admin panel | `frontend-engineer` | 1 | ✅ Done |
| Course catalog search + filters | `frontend-engineer` | 1 | ✅ Done |
| Google OAuth setup + health check | `devops-engineer` | 1 | ✅ Done |
| Student dashboard page | `frontend-engineer` | 2 | ✅ Done |
| Video progress auto-save | `frontend-engineer` | 2 | ✅ Done |
| Quiz flow UI (results + history) | `frontend-engineer` | 2 | ✅ Done |
| Admin progress analytics dashboard | `backend-engineer` | 2 | ✅ Done |
| Course completion + certificates | `backend-engineer` | 3 | ✅ Done |
| Phase 4 test coverage (40%+) | `qa-engineer` | 3 | ✅ Done |

**Result:** 1020 tests passing, 0 failures, build green. Student progress tracking, quiz persistence, admin analytics, PDF certificates, mobile admin, course catalog all operational.

---

## Phase 5 — Polish & Launch Readiness ✅ Complete

**Goal:** Validate NFRs — accessibility, performance, security, E2E testing, CI/CD hardening. Ship-ready quality.

| Task | Owner Skill | Wave | Status |
|---|---|---|---|
| Accessibility audit + WCAG 2.1 AA fixes | `frontend-engineer` | 1 | ✅ Done |
| Security hardening (input validation, headers) | `backend-engineer` | 1 | ✅ Done |
| Playwright E2E tests (5 critical flows) | `qa-engineer` | 1 | ✅ Done |
| Performance audit + lazy loading | `frontend-engineer` | 1 | ✅ Done |
| CI/CD hardening (workflows, Dependabot) | `devops-engineer` | 1 | ✅ Done |
| Automated a11y testing (axe-core + Playwright) | `qa-engineer` | 2 | ✅ Done |
| Monitoring & observability (health, logging) | `devops-engineer` | 2 | ✅ Done |
| Documentation & requirements sync | `product-manager` | 2 | ✅ Done |

**Result:** WCAG 2.1 AA compliance (16 files fixed), Zod input validation + CSP headers, 79+ E2E tests across 5 flows, axe-core automation, dynamic imports for QuizPanel + admin cards, CI/CD with Dependabot Next.js lock, structured logging + deep health endpoint. Build green, 1020 tests passing.

---

## How Phases Map to GSD Workflow

Each phase starts with `/gsd:plan-phase` (creates PLAN.md tasks) and ends with `/gsd:update-state` (refreshes STATE.md). Role skills execute individual tasks with fresh context windows to prevent context rot.
