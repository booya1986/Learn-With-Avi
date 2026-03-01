# LearnWithAvi — Project Hub

> AI-powered interactive learning platform. Developers master AI/ML through personalized, voice-enabled course experiences powered by the very technology they're learning.

---

## Quick Navigation

| Context File | Purpose |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Hard constraints, code style, tech stack rules |
| [REQUIREMENTS.md](REQUIREMENTS.md) | Functional & non-functional requirements (P0/P1/P2) |
| [ROADMAP.md](ROADMAP.md) | Phase-based development roadmap |
| [STATE.md](STATE.md) | Current blockers, decisions, metrics |
| [PLAN.md](PLAN.md) | Active phase task breakdown (GSD XML format) |
| [docs/README.md](docs/README.md) | Full documentation hub |

---

## Stack at a Glance

| Layer | Technology | Note |
|---|---|---|
| Frontend | Next.js **15.5.7** (locked), React 19, TypeScript strict | **Do NOT upgrade** — 16.x has fatal bundler issues |
| Styling | Tailwind CSS | Use logical properties: `ps-4` not `pl-4` |
| AI | Claude Sonnet 4 (chat), OpenAI Embeddings | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` required |
| Voice | ElevenLabs TTS | Optional — falls back to browser TTS |
| Database | PostgreSQL + Prisma ORM + pgvector | Supabase Session Pooler (port 5432) |
| Auth | NextAuth.js — Admin credentials + User credentials + Google OAuth | Two separate user types, never mix |
| i18n | next-intl v4 | Hebrew RTL mandatory everywhere |
| Testing | Vitest, Playwright, axe-core | Target: 80%+ coverage |
| Deployment | Vercel + Supabase | `vercel.json` has timeout config |

---

## Critical Constraints

1. **Next.js locked at 15.5.7** — upgrading breaks Turbopack/Webpack (CVE patches already applied)
2. **Hebrew/RTL mandatory** — `dir="rtl"`, Tailwind logical properties, test with mixed content
3. **Never commit API keys** — `.env.local` only, sanitize error messages
4. **API routes versioned** — all public endpoints under `/api/v1/`

---

## Required Environment Variables

```bash
# Minimum to run
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
DATABASE_URL=            # PostgreSQL (Supabase Session Pooler)
NEXTAUTH_SECRET=
NEXTAUTH_URL=
NEXT_PUBLIC_APP_URL=

# Recommended
YOUTUBE_API_KEY=          # YouTube video ingestion
GOOGLE_CLIENT_ID=         # Google OAuth
GOOGLE_CLIENT_SECRET=

# Optional
ELEVENLABS_API_KEY=       # Voice TTS (falls back to browser TTS)
REDIS_URL=                # Rate limiting store
SENTRY_DSN=               # Error tracking
```

---

## Key File Locations

```
src/app/api/v1/chat/route.ts          # Main AI chat endpoint
src/app/api/v1/voice/chat/route.ts    # Voice chat endpoint
src/lib/rag-pgvector.ts               # Active RAG pipeline
src/lib/hybrid-search.ts              # Hybrid BM25 + pgvector search
src/app/[locale]/course/[courseId]/   # Course page (primary)
src/app/[locale]/admin/               # Admin panel
src/data/transcripts/index.ts         # Transcript registry (auto-updated on ingest)
prisma/schema.prisma                  # DB schema
```

---

## How to Use the GSD Workflow

This project uses the [GSD (Get Shit Done)](https://github.com/gsd-build/get-shit-done) context engineering method.

**GSD prevents context rot** by keeping project state in files (not conversation history) and executing tasks with fresh agent context windows.

### Workflow Commands (via `/gsd` skill)

```
/gsd:plan-phase    — Read ROADMAP.md, create atomic tasks in PLAN.md
/gsd:execute-phase — Execute PLAN.md tasks in dependency waves (fresh agents)
/gsd:update-state  — Sync STATE.md after a phase completes
```

### Available Role Skills

The GSD orchestrator delegates to these existing skills:

| Skill | Trigger |
|---|---|
| `backend-engineer` | API routes, database, auth, server logic |
| `frontend-engineer` | React components, Tailwind, TypeScript |
| `qa-engineer` | Vitest tests, Playwright E2E, coverage |
| `ui-ux-designer` | Accessibility (WCAG), RTL, design system |
| `rag-pipeline-optimizer` | Vector search, embeddings, hybrid search |
| `voice-ai-tutor` | ElevenLabs, Whisper STT, voice pipeline |
| `devops-engineer` | Vercel deployment, CI/CD, env config |

---

## Quick Start

```bash
npm install && cp .env.example .env.local
# Fill required env vars above
npm run dev
```

Troubleshooting: see [CLAUDE.md](CLAUDE.md#troubleshooting)
