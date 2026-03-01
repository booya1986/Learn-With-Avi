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

## Phase 3 — Voice Optimization (Next)

**Goal:** Voice AI becomes a flagship feature — sub-second latency, streaming, multilingual.

| Deliverable | Notes |
|---|---|
| Whisper STT optimization | Hebrew accuracy improvements |
| Voice session continuity | Maintain conversation context across voice turns |
| Voice analytics (admin) | Usage metrics, fallback rate |

> Note: ElevenLabs streaming TTS already completed in Phase 2.

---

## Phase 4 — Scale (Future)

**Goal:** Multi-course platform with analytics and growth features.

| Deliverable | Notes |
|---|---|
| Redis rate limiting | Replace in-memory store (required for multi-instance) |
| Multi-course catalog | Discovery page, course cards, filtering |
| Quiz auto-generation | `/api/v1/quiz/generate` from transcript |
| Progress analytics dashboard | Admin view of student engagement |
| Mobile-responsive redesign | Current layout is desktop-first |
| Course completion certificates | Auto-generated PDF |

---

## How Phases Map to GSD Workflow

Each phase starts with `/gsd:plan-phase` (creates PLAN.md tasks) and ends with `/gsd:update-state` (refreshes STATE.md). Role skills execute individual tasks with fresh context windows to prevent context rot.
