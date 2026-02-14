# LearnWithAvi - Project Rules

AI-powered interactive learning platform with voice AI tutoring, RAG-based Q&A, and personalized learning paths.

## Critical Constraints

- **DO NOT upgrade Next.js beyond 15.5.7** - 16.x has fatal bundler incompatibilities (Turbopack cache corruption, Webpack manifest failures). Current version is security-patched (CVE-2025-66478, CVE-2025-55182).
- **Never commit API keys** - use `.env.local` for all secrets, sanitize error messages to prevent leakage.
- **Hebrew/RTL is mandatory** - all UI must support `dir="rtl"`, use Tailwind logical properties (`ps-4` not `pl-4`), test with mixed Hebrew-English content.

## Tech Stack

- **Frontend**: Next.js 15.5.7, TypeScript (strict), React 19, Tailwind CSS
- **AI**: Claude Sonnet 4 (chat), OpenAI Embeddings, ElevenLabs TTS
- **Database**: PostgreSQL + Prisma ORM + pgvector (vector search with keyword fallback)
- **Auth**: NextAuth.js
- **Testing**: Vitest (unit), Playwright (E2E), axe-core (a11y)

## Quick Start

```bash
npm install && cp .env.example .env.local && npm run dev
```

Required: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`. Optional: `ELEVENLABS_API_KEY`, `YOUTUBE_API_KEY`.

## Code Style Rules

- **TypeScript**: Strict mode, explicit types, never `any`
- **Components**: Functional with hooks, PascalCase filenames
- **Utilities**: camelCase filenames, `@/` import alias for `src/`
- **Routes**: kebab-case folders (`/api/chat`, `/api/voice/tts`)
- **Server Components by default**, `'use client'` only when needed
- **API routes stay thin** - move logic to `src/lib/`

## Component Rules

- **Max 300 lines** per component - extract if larger
- **Single responsibility** - one component, one job
- **Custom hooks** for complex state (`src/hooks/`)
- **Error boundaries** wrap major sections (Chat, Video, Materials)
- **Loading skeletons** for all async data
- **80%+ test coverage** required on all components
- **New components** must include tests and a Storybook story

## API Versioning

**All public API routes use URL-based versioning** (`/api/v1/endpoint`):

- **Current version**: v1 (stable)
- **Versioned routes**: `/api/v1/chat`, `/api/v1/voice/*`, `/api/v1/quiz/generate`, `/api/v1/health`
- **Unversioned routes**: Automatically rewritten to v1 (backward compatible, but deprecated)
- **Excluded from versioning**: `/api/admin/*`, `/api/auth/*`, `/api/debug/*`

**Usage:**

```typescript
import { apiClient } from '@/lib/api-client'

// Type-safe, versioned API calls
const response = await apiClient.chat({ message: '...' })
const health = await apiClient.health()
```

See [docs/api/VERSIONING.md](docs/api/VERSIONING.md) for full guide.

## Error Handling

- Always catch and log errors with graceful fallbacks
- Fallback chain: pgvector -> keyword search, ElevenLabs -> browser TTS
- API routes return proper HTTP status codes
- Rate limiting: 10 requests/minute per IP (chat), 5/min (voice, quiz)

## Caching Rules

- Embeddings: 1-hour LRU cache (maintain this for cost savings)
- Prompt caching: 50-90% cost reduction (see rag-pipeline-optimizer skill)
- Never bypass caches without explicit reason

## Project Structure

```
src/
  app/           # Next.js app router (pages + API routes)
  components/    # React components (UI, video, chat, voice)
  lib/           # Core utilities (RAG, embeddings, auth)
  data/          # Video configs & transcripts
  hooks/         # Custom React hooks
  types/         # TypeScript type definitions
prisma/          # Database schema & migrations
e2e/             # Playwright E2E tests
docs/            # Documentation (hub: docs/README.md)
skills/          # Custom Claude Code skills
scripts/         # Utility scripts
```

## Key Commands

```bash
npm run dev                # Dev server (Webpack)
npm run build              # Production build
npm run clean              # Clean caches
npm run test:unit          # Vitest unit tests
npm run test:e2e           # Playwright E2E tests
npm run test:a11y          # Accessibility tests
npm run test:coverage      # Coverage report (target: 80%+)
npx prisma migrate dev     # Run DB migrations
npx prisma generate        # Regenerate Prisma client
```

## Troubleshooting

Port 3000 in use: `lsof -ti:3000 | xargs kill -9`
Server won't start: `npm run clean && npm run dev`
Database issues: `npx prisma migrate reset && npx prisma generate`

## Documentation

- [docs/README.md](docs/README.md) - Documentation hub
- [docs/VIDEO_SYSTEM_RULES.md](docs/VIDEO_SYSTEM_RULES.md) - Video player behavior rules
- [docs/architecture/component-extraction-initiative.md](docs/architecture/component-extraction-initiative.md) - Component patterns
