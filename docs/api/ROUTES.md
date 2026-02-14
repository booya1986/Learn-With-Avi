# API Routes Reference

**Last Updated:** February 13, 2026
**Current Version:** v1

## Overview

LearnWithAvi exposes a RESTful API with versioned endpoints for chat, voice, and quiz features.

**Base URL:** `http://localhost:3000/api` (development)

**Versioning:** All public API routes use URL-based versioning (e.g., `/api/v1/chat`)

## API Versions

| Version | Status | Released | Sunset Date |
|---------|--------|----------|-------------|
| v1 | ✅ Stable | 2026-02-13 | TBD |

See [API Versioning Guide](./VERSIONING.md) for details.

## Authentication

| Endpoint Pattern | Auth Required | Method |
|-----------------|---------------|--------|
| `/api/v1/*` | No (public) | Rate limiting |
| `/api/admin/*` | Yes | NextAuth JWT |
| `/api/auth/*` | No | NextAuth |

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/v1/chat` | 10 req/min | Per IP |
| `/api/v1/voice/chat` | 5 req/min | Per IP |
| `/api/v1/voice/tts` | 5 req/min | Per IP |
| `/api/v1/quiz/generate` | 5 req/min | Per IP |
| `/api/admin/*` | 100 req/min | Per user |

## Public API Routes (v1)

### Chat API

**Endpoint:** `POST /api/v1/chat`

**Description:** Real-time AI chat with RAG context retrieval. Streams responses using Server-Sent Events (SSE).

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "message": "Explain this concept",
  "context": {
    "chunks": [
      {
        "videoId": "abc123",
        "text": "Transcript text...",
        "startTime": 0,
        "endTime": 10
      }
    ],
    "videoContext": "Optional video title"
  },
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous question"
    },
    {
      "role": "assistant",
      "content": "Previous answer"
    }
  ]
}
```

**Response:** SSE stream

**Success (200):**
```
data: {"type":"content","content":"Here is "}
data: {"type":"content","content":"the answer"}
data: {"type":"done","sources":[...],"fullContent":"..."}
```

**Error (400/429/500):**
```json
{
  "error": "Error type",
  "message": "Human-readable error message"
}
```

**Example:**
```typescript
import { apiClient } from '@/lib/api-client'

const response = await apiClient.chat({
  message: 'What is explained in this video?',
  context: { chunks: transcriptChunks },
  conversationHistory: []
})

const reader = response.body.getReader()
// Process SSE stream...
```

---

### Voice Chat API

**Endpoint:** `POST /api/v1/voice/chat`

**Description:** Voice-to-voice AI tutoring. Transcribes audio → retrieves context → generates response → (optional) TTS.

**Headers:**
- `Content-Type: multipart/form-data`

**Request Body:** FormData
- `audio` (required): Audio blob (webm/wav/mp3)
- `language` (optional): Language code ('he' | 'en')
- `videoId` (optional): Video ID for context
- `enableTTS` (optional): Enable TTS response ('true' | 'false')

**Success (200):**
```json
{
  "transcription": "User's question transcribed",
  "response": "AI's text response",
  "audioUrl": "https://...tts-audio.mp3" // if enableTTS=true
}
```

**Error (400/429/500):**
```json
{
  "error": "Error type",
  "message": "Human-readable error message"
}
```

**Example:**
```typescript
import { apiClient } from '@/lib/api-client'

const response = await apiClient.voiceChat({
  audio: audioBlob,
  language: 'he',
  videoId: 'abc123',
  enableTTS: true
})

const data = await response.json()
console.log(data.transcription) // "מה זה אומר?"
console.log(data.response) // "זה אומר ש..."
```

---

### Text-to-Speech API

**Endpoint:** `POST /api/v1/voice/tts`

**Description:** Convert text to speech audio using ElevenLabs (or browser fallback).

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "text": "Text to speak",
  "provider": "elevenlabs", // 'elevenlabs' | 'browser'
  "voiceId": "21m00Tcm4TlvDq8ikWAM", // ElevenLabs voice ID
  "language": "he" // 'he' | 'en'
}
```

**Success (200) - ElevenLabs:**
```json
{
  "success": true,
  "provider": "elevenlabs",
  "audioUrl": "https://api.elevenlabs.io/..."
}
```

**Success (200) - Browser:**
```json
{
  "success": true,
  "provider": "browser",
  "message": "Use client-side Speech Synthesis API"
}
```

**Error (400/429/500):**
```json
{
  "success": false,
  "provider": "browser",
  "error": "Error message"
}
```

**Example:**
```typescript
import { apiClient } from '@/lib/api-client'

const response = await apiClient.tts({
  text: 'שלום עולם',
  provider: 'elevenlabs',
  language: 'he'
})

const { audioUrl } = await response.json()
const audio = new Audio(audioUrl)
audio.play()
```

---

### Quiz Generation API

**Endpoint:** `POST /api/v1/quiz/generate`

**Description:** Generate adaptive multiple-choice questions using Bloom's Taxonomy levels.

**Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "videoId": "abc123",
  "chapterId": "chapter-1", // optional
  "bloomLevel": 2, // 1-4 (Remember → Analyze)
  "count": 5, // 1-10 questions
  "language": "he", // 'he' | 'en'
  "excludeIds": ["q1", "q2"] // optional
}
```

**Success (200):**
```json
{
  "questions": [
    {
      "id": "uuid-generated",
      "questionText": "השאלה בעברית",
      "options": [
        { "id": "a", "text": "תשובה א", "isCorrect": false },
        { "id": "b", "text": "תשובה ב", "isCorrect": true },
        { "id": "c", "text": "תשובה ג", "isCorrect": false },
        { "id": "d", "text": "תשובה ד", "isCorrect": false }
      ],
      "correctAnswer": "b",
      "explanation": "הסבר עם התייחסות לזמן [timestamp:2:34]",
      "bloomLevel": 2,
      "topic": "נושא מרכזי",
      "sourceTimeRange": { "start": 154, "end": 180 }
    }
  ]
}
```

**Error (400/404/429/500):**
```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": [...] // validation errors
}
```

**Example:**
```typescript
import { apiClient } from '@/lib/api-client'

const response = await apiClient.generateQuiz({
  videoId: 'abc123',
  bloomLevel: 2,
  count: 5,
  language: 'he'
})

const { questions } = await response.json()
// Render quiz UI...
```

---

### Health Check API

**Endpoint:** `GET /api/v1/health`

**Description:** System health check for monitoring and uptime checks.

**Success (200) - Healthy:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-13T10:30:00Z",
  "uptime": 12345,
  "services": [
    {
      "name": "Anthropic Claude API",
      "status": "healthy",
      "message": "API key configured"
    },
    {
      "name": "OpenAI API",
      "status": "healthy",
      "message": "API key configured"
    },
    {
      "name": "ChromaDB",
      "status": "healthy",
      "message": "Vector database operational"
    }
  ],
  "version": "1.0.0",
  "environment": "production"
}
```

**Degraded (200):**
```json
{
  "status": "degraded",
  "services": [
    {
      "name": "ChromaDB",
      "status": "degraded",
      "message": "Using keyword fallback"
    }
  ]
}
```

**Unhealthy (503):**
```json
{
  "status": "unhealthy",
  "services": [
    {
      "name": "Anthropic Claude API",
      "status": "down",
      "message": "API key missing"
    }
  ]
}
```

**Example:**
```typescript
import { apiClient } from '@/lib/api-client'

const response = await apiClient.health()
const { status, services } = await response.json()

if (status === 'unhealthy') {
  console.error('System is down:', services)
}
```

---

## Admin API Routes (Unversioned)

**Authentication:** All admin routes require NextAuth JWT token (except `/signup`).

**Headers:**
- `Authorization: Bearer {jwt-token}`
- `Content-Type: application/json`

### Courses API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/courses` | GET | List all courses |
| `/api/admin/courses` | POST | Create new course |
| `/api/admin/courses/{id}` | GET | Get course by ID |
| `/api/admin/courses/{id}` | PUT | Update course |
| `/api/admin/courses/{id}` | DELETE | Delete course |
| `/api/admin/courses/{id}/reorder` | POST | Reorder videos |

### Videos API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/videos` | GET | List all videos |
| `/api/admin/videos` | POST | Create new video |
| `/api/admin/videos/{id}` | GET | Get video by ID |
| `/api/admin/videos/{id}` | PUT | Update video |
| `/api/admin/videos/{id}` | DELETE | Delete video |
| `/api/admin/videos/ingest` | POST | Ingest YouTube video |

### Transcripts API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/transcripts` | GET | List all transcripts |
| `/api/admin/transcripts` | POST | Create transcript |
| `/api/admin/transcripts/{id}` | GET | Get transcript by ID |
| `/api/admin/transcripts/{id}` | PUT | Update transcript |
| `/api/admin/transcripts/{id}` | DELETE | Delete transcript |

### YouTube API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/youtube/validate` | POST | Validate YouTube URL |

### Auth API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/signup` | POST | Create admin account (no auth required) |

**See:** [Admin API Documentation](./ADMIN.md) for detailed specs.

---

## Auth API Routes (NextAuth.js)

**Managed by NextAuth.js** - see [NextAuth documentation](https://next-auth.js.org/).

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signin` | GET/POST | Sign in page |
| `/api/auth/signout` | GET/POST | Sign out |
| `/api/auth/session` | GET | Get session |
| `/api/auth/callback/*` | GET | OAuth callbacks |
| `/api/auth/csrf` | GET | CSRF token |

---

## Response Headers

All API responses include standard headers:

```http
X-API-Version: v1
Content-Type: application/json
Cache-Control: no-cache (for SSE/streaming)
```

**Deprecated endpoints also include:**

```http
Deprecation: true
Sunset: Sun, 01 Jun 2026 00:00:00 GMT
Link: <https://docs.learnwithavi.com/migration>; rel="deprecation"
```

---

## Error Codes

| Status Code | Meaning | Common Causes |
|-------------|---------|---------------|
| 400 | Bad Request | Invalid request body, validation error |
| 401 | Unauthorized | Missing/invalid JWT token (admin routes) |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Validation failed (detailed errors) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | Critical service down (health check) |

**Error Response Format:**

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "details": [
    {
      "field": "email",
      "message": "Email must be valid"
    }
  ],
  "timestamp": "2026-02-13T10:30:00Z",
  "path": "/api/v1/chat"
}
```

---

## Rate Limiting

**Implementation:** IP-based rate limiting using in-memory store.

**Headers returned when rate limited:**

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
```

**Response:**

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again in 60 seconds."
}
```

**Bypass rate limits:** Set `RATE_LIMIT_BYPASS_TOKEN` env var for testing.

---

## CORS

**Development:** All origins allowed
**Production:** Configure `CORS_ORIGIN` env var

---

## Testing

### Using API Client

```typescript
import { apiClient } from '@/lib/api-client'

// Type-safe calls
const response = await apiClient.chat({ ... })
const health = await apiClient.health()
```

### Using cURL

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Chat (streaming)
curl -X POST http://localhost:3000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "context": { "chunks": [] },
    "conversationHistory": []
  }'

# Quiz generation
curl -X POST http://localhost:3000/api/v1/quiz/generate \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "abc123",
    "bloomLevel": 2,
    "count": 5,
    "language": "he"
  }'
```

### Test Script

```bash
# Run API versioning tests
./scripts/test-api-versioning.sh
```

---

## Migration Guides

- [Unversioned → v1](./migrations/UNVERSIONED_TO_V1.md)
- Future: v1 → v2 (when available)

---

## Resources

- **API Versioning Guide:** [VERSIONING.md](./VERSIONING.md)
- **API Client:** [`/src/lib/api-client.ts`](/src/lib/api-client.ts)
- **Rate Limiting:** [`/src/lib/rate-limit.ts`](/src/lib/rate-limit.ts)
- **Error Handling:** [`/src/lib/errors.ts`](/src/lib/errors.ts)

---

**Questions?** Check the [FAQ](./FAQ.md) or open an issue.
