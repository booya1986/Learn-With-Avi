# API Routes

## Route Pattern

All routes use Next.js App Router convention: `src/app/api/{name}/route.ts`

## Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/chat` | POST | Claude chat with RAG context (SSE streaming) |
| `/api/voice/tts` | POST | Text-to-speech (ElevenLabs + browser fallback) |
| `/api/voice/chat` | POST | Voice chat (Whisper STT + Claude + TTS) |
| `/api/transcribe` | POST | Audio transcription (Whisper) |
| `/api/health` | GET | Health check endpoint |
| `/api/quiz` | POST | Adaptive quiz generation (Bloom's Taxonomy) |
| `/api/admin/*` | CRUD | Course/video/transcript management (auth required) |
| `/api/auth/*` | * | NextAuth.js endpoints |

## Rules

- Keep routes thin - move business logic to `src/lib/`
- Use `getConfig()` from `@/lib/config` for env vars
- Import error utilities from `@/lib/errors` (logError, sanitizeError, ValidationError, RateLimitError)
- Apply rate limiting via `applyRateLimit()` from `@/lib/rate-limit`
- Return proper HTTP status codes (400 validation, 429 rate limit, 500 server error)
- Never expose API keys in error responses - use `sanitizeError()`
- **Admin routes auth**: Handled by middleware (see `middleware.ts`) - DO NOT add auth checks to individual admin routes
- Chat route uses SSE streaming with `TextEncoder`

## Authentication

All `/api/admin/*` routes (except `/api/admin/signup`) are protected by middleware-level authentication:
- Authentication is checked in `middleware.ts` using NextAuth JWT token
- Returns 401 Unauthorized if token is missing
- Individual admin routes do NOT need to check auth
- Centralized auth prevents duplicate code and ensures consistent security

## Testing

Tests in `src/app/api/__tests__/`:
- `chat.test.ts` - Chat API with mock Claude responses
- `health.test.ts` - Health endpoint
- Run: `npm run test:unit -- --filter api`
