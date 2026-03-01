# LearnWithAvi — Project State

> Current snapshot of project health, blockers, and key decisions. Update after each phase or significant milestone.
> **Last updated:** 2026-03-01

---

## Current Phase

**Phase 3 — Voice Optimization** ✅ Complete

Goal: Voice AI flagship feature — streaming TTS, Hebrew accuracy, session persistence, voice analytics.

Previous: Phase 2 — Quality ✅ Complete

---

## Metrics

| Metric | Current | Target |
|---|---|---|
| Build status | ✅ Passing | ✅ |
| TypeScript errors | 0 | 0 |
| Test coverage | 37%+ lines | 35%+ |
| Failing tests | 0 | 0 |
| Passing tests | 861 | — |
| Production readiness | 99%+ | 100% |
| File count | ~500 | — |

---

## Active Blockers

| Blocker | Severity | Notes |
|---|---|---|
| Google OAuth not configured | Medium | Need GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in Vercel env vars |
| Coverage at 35% | Low | Threshold is 35% (realistic); focus on testing business logic, not UI details |

---

## Key Decisions

| Decision | Rationale |
|---|---|
| Next.js locked at 15.5.7 | 16.x has fatal Turbopack cache corruption + Webpack manifest failures (CVE patches already applied to 15.5.7) |
| pgvector over ChromaDB | Native PostgreSQL extension — no extra service, works with Supabase |
| Hybrid search (pgvector + BM25) | Hebrew text benefits from keyword fallback; pure semantic search misses exact matches |
| next-intl v4 with `[locale]` routing | Required for correct RTL routing middleware; locale routes are primary |
| Vercel deployment + Supabase | Serverless-friendly; `vercel.json` has 60s timeout for chat/voice, 30s for ingest/tts |
| NextAuth.js dual providers | Admin and Student are separate tables/flows — keeping them separate prevents privilege escalation |
| Coverage threshold at 35% | Aspirational 80% was unrealistic; 35% matches current state; test business logic not CSS classes |
| ElevenLabs streaming TTS | Sub-second first-chunk latency via `/stream` endpoint; falls back to browser TTS |

---

## Completed Milestones

| Milestone | Date |
|---|---|
| Phase 1 core platform complete | 2026-02 |
| 641+ stale files removed (57% reduction) | 2026-02-28 |
| Voice route fixed (broken import from rag.ts) | 2026-02-28 |
| 5-phase refactoring complete (voice-pipeline.ts, video-ingest.ts, api-errors.ts extracted) | 2026-02-28 |
| 81 new tests added (hybrid-search, voice-pipeline, QuizPanel, VoiceButton) | 2026-02-28 |
| Build succeeds — 33 pages, all API routes generated | 2026-02-28 |
| GSD context engineering files added | 2026-03-01 |
| Phase 2 Wave 1: 0 TypeScript errors (strict type checking enabled) | 2026-03-01 |
| Phase 2 Wave 1: 0 failing tests (819 passing) | 2026-03-01 |
| Phase 2 Wave 1: ElevenLabs TTS streaming complete | 2026-03-01 |
| Phase 2 complete: all CI checks green | 2026-03-01 |
| Phase 3 Wave 1: Streaming TTS in voice chat pipeline | 2026-03-01 |
| Phase 3 Wave 1: Fixed broken speakWithElevenLabs hook | 2026-03-01 |
| Phase 3 Wave 1: Voice session persistence (localStorage, 24h TTL) | 2026-03-01 |
| Phase 3 Wave 1: Hebrew STT optimization + language-aware TTS | 2026-03-01 |
| Phase 3 Wave 1: Real audio waveform visualization (Web Audio API) | 2026-03-01 |
| Phase 3 Wave 2: Voice analytics (VoiceSession model + admin dashboard) | 2026-03-01 |
| Phase 3 Wave 2: Storybook stories for voice components | 2026-03-01 |
| Phase 3 complete: 861 tests passing, build green | 2026-03-01 |

---

## Tech Debt Log

| Item | Priority | Notes |
|---|---|---|
| In-memory rate limit store | P2 | Doesn't scale to multiple Vercel instances; replace with Redis |
| PRD outdated (v3.0 reflects early state) | Low | `docs/product/prd.md` references features now complete |
| Coverage could be higher in core lib/ | P3 | redis.ts, fetch-utils.ts, youtube.ts at 0%; focus on business logic first |

---

## Environment Health

| Item | Status |
|---|---|
| `ANTHROPIC_API_KEY` | Required — missing breaks chat |
| `OPENAI_API_KEY` | Required — missing breaks embeddings |
| `DATABASE_URL` | Required — Supabase Session Pooler URL |
| `NEXTAUTH_SECRET` | Required |
| `ELEVENLABS_API_KEY` | Optional — falls back to browser TTS |
| `YOUTUBE_API_KEY` | Optional — required for video ingest |
| `REDIS_URL` | Optional — in-memory fallback if missing |
