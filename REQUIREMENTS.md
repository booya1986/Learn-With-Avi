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

## P1.5 — Voice Optimization (Current Phase)

### Voice Pipeline
- [ ] Stream TTS audio in voice chat pipeline (currently buffers entire response)
- [ ] Fix broken `useVoiceOutput.speakWithElevenLabs` (tries to parse JSON from audio/mpeg)
- [ ] Hebrew STT accuracy improvements (language hints, voice selection)
- [ ] Voice conversation persistence (survives page refresh)
- [ ] Real audio waveform visualization (replace random animation)

### Voice Analytics
- [ ] Voice session analytics tracking (latency, provider usage, fallback rate)
- [ ] Admin dashboard voice metrics view

### Documentation
- [x] GSD context engineering files in place (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, PLAN.md)
- [x] Redundant docs/ files removed

---

## P2 — Scale (Future)

- [ ] Redis-backed rate limiting (replace in-memory store for multi-instance)
- [ ] Multi-course catalog with course discovery page
- [ ] Quiz auto-generation from transcript (`/api/v1/quiz/generate`)
- [ ] Learning progress analytics dashboard (admin)
- [ ] Course completion certificates
- [ ] Mobile-responsive optimization (current: desktop-first)

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
