# API Versioning Guide

**Version:** 1.0
**Status:** Active
**Last Updated:** February 13, 2026

## Overview

LearnWithAvi API uses **URL-based versioning** to enable breaking changes without disrupting existing clients.

### Version Format

```
/api/{version}/{endpoint}
```

**Examples:**
- `/api/v1/chat`
- `/api/v1/voice/chat`
- `/api/v1/quiz/generate`

## Current Version

**Current Version:** `v1`
**Status:** Stable
**Released:** February 13, 2026

### v1 Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/chat` | POST | Claude chat with RAG context (SSE streaming) |
| `/api/v1/voice/chat` | POST | Voice-to-voice AI tutoring |
| `/api/v1/voice/tts` | POST | Text-to-speech synthesis |
| `/api/v1/quiz/generate` | POST | Adaptive quiz generation |
| `/api/v1/health` | GET | System health check |

## Backward Compatibility

### Automatic Redirects

**Unversioned routes are automatically rewritten to v1:**

```
/api/chat → /api/v1/chat (rewrite)
/api/voice/chat → /api/v1/voice/chat (rewrite)
/api/quiz/generate → /api/v1/quiz/generate (rewrite)
```

**Implementation:** Middleware rewrites (not redirects) to preserve original URL in browser.

**Deprecation:** Unversioned routes are **deprecated** and will be removed in v2.

### Excluded Routes

**These routes are NOT versioned:**

- `/api/admin/*` - Admin panel CRUD operations
- `/api/auth/*` - NextAuth.js authentication
- `/api/debug/*` - Development debugging tools

## Client Usage

### TypeScript Client (Recommended)

Use the provided API client for type-safe, versioned requests:

```typescript
import { apiClient } from '@/lib/api-client'

// Chat API
const response = await apiClient.chat({
  message: 'Explain this concept',
  context: { chunks: [...] },
  conversationHistory: []
})

// Voice Chat API
const voiceResponse = await apiClient.voiceChat({
  audio: audioBlob,
  language: 'he',
  videoId: 'abc123'
})

// Quiz Generation API
const quizResponse = await apiClient.generateQuiz({
  videoId: 'abc123',
  bloomLevel: 2,
  count: 5,
  language: 'he'
})

// Health Check API
const healthResponse = await apiClient.health()
```

### Manual Fetch (Explicit Versioning)

```typescript
// ✅ Recommended - Explicit version
const response = await fetch('/api/v1/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello' })
})

// ⚠️ Deprecated - Unversioned (will be rewritten to v1)
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ message: 'Hello' })
})
```

### Version Headers

All API responses include version information:

```http
HTTP/1.1 200 OK
X-API-Version: v1
Content-Type: application/json
```

**Check version from response:**

```typescript
const response = await fetch('/api/v1/chat', { ... })
const apiVersion = response.headers.get('X-API-Version') // 'v1'
```

## Migration Strategy

### Deprecation Policy

1. **Deprecation Notice** - 3 months before removal
   - Add `Deprecation: true` header to responses
   - Log warnings in development environment
   - Update documentation

2. **Sunset Warning** - 1 month before removal
   - Add `Sunset: {date}` header (ISO 8601)
   - Send email notifications to API users
   - Display console warnings

3. **Removal** - After sunset date
   - Remove deprecated endpoints
   - Return `410 Gone` for removed routes

### Breaking Changes

**What constitutes a breaking change:**

- Removing fields from responses
- Changing field types (string → number)
- Changing HTTP status codes
- Renaming endpoints
- Adding required request parameters
- Changing authentication mechanism

**Non-breaking changes (same version):**

- Adding new optional fields to responses
- Adding new optional request parameters
- Adding new endpoints
- Performance improvements
- Bug fixes

### Version Coexistence

**Multiple versions can run simultaneously:**

```
src/app/api/
├── v1/
│   ├── chat/route.ts       # Current version
│   └── voice/chat/route.ts
├── v2/                      # Future version
│   ├── chat/route.ts       # New implementation
│   └── voice/chat/route.ts # Breaking changes allowed
└── admin/                   # Unversioned
```

**Shared logic can be reused:**

```typescript
// src/lib/chat-logic.ts
export async function processChatMessage(message: string) {
  // Shared business logic
}

// src/app/api/v1/chat/route.ts
import { processChatMessage } from '@/lib/chat-logic'

// src/app/api/v2/chat/route.ts
import { processChatMessage } from '@/lib/chat-logic'
```

## Version Lifecycle

### v1 (Current)

**Status:** Stable
**Released:** February 13, 2026
**Sunset:** TBD (minimum 12 months)

**Features:**
- Claude Sonnet 4 chat with RAG
- Voice AI tutoring (Whisper + ElevenLabs)
- Adaptive quiz generation (Bloom's Taxonomy)
- SSE streaming responses
- Hebrew + English support

### v2 (Future)

**Status:** Planned
**Estimated Release:** Q3 2026

**Planned Changes:**
- TBD based on user feedback
- Potential breaking changes to request/response formats
- New features requiring schema changes

## Error Handling

### Version-Aware Errors

**Unsupported version:**

```json
{
  "error": "Unsupported API version",
  "message": "API version 'v3' is not supported. Use 'v1' or 'v2'.",
  "supportedVersions": ["v1", "v2"]
}
```

**Deprecated version:**

```http
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sun, 01 Jun 2026 00:00:00 GMT
Link: <https://docs.learnwithavi.com/migration>; rel="deprecation"
X-API-Version: v1
```

**Removed version:**

```json
{
  "error": "API version removed",
  "message": "API version 'v1' was removed on 2027-01-01. Please upgrade to 'v2'.",
  "migrationGuide": "https://docs.learnwithavi.com/migration/v1-to-v2"
}
```

## Testing

### Test Both Versions

```typescript
import { describe, it, expect } from 'vitest'

describe('API Versioning', () => {
  it('should support v1 endpoints', async () => {
    const response = await fetch('/api/v1/chat', { ... })
    expect(response.ok).toBe(true)
    expect(response.headers.get('X-API-Version')).toBe('v1')
  })

  it('should redirect unversioned to v1', async () => {
    const response = await fetch('/api/chat', { ... })
    expect(response.ok).toBe(true)
    expect(response.headers.get('X-API-Version')).toBe('v1')
  })

  it('should reject unsupported versions', async () => {
    const response = await fetch('/api/v99/chat', { ... })
    expect(response.status).toBe(404)
  })
})
```

### Version Header Validation

```typescript
it('should include version header in all responses', async () => {
  const endpoints = ['/api/v1/chat', '/api/v1/health', '/api/v1/quiz/generate']

  for (const endpoint of endpoints) {
    const response = await fetch(endpoint, { method: 'GET' })
    const version = response.headers.get('X-API-Version')
    expect(version).toBeTruthy()
  }
})
```

## Monitoring

### Metrics to Track

1. **Version Usage**
   - Request count per version
   - Active clients per version
   - Deprecated endpoint usage

2. **Migration Progress**
   - Percentage of traffic on latest version
   - Clients still using deprecated versions
   - Error rate by version

3. **Performance**
   - Response time by version
   - Error rate by version
   - Cache hit rate by version

### Logging

```typescript
// Middleware logs deprecated route usage
warnDeprecatedRoute('/api/chat', '/api/v1/chat')

// Console output (development):
// ⚠️ API Deprecation Warning
//   Path: /api/chat is deprecated
//   Use: /api/v1/chat instead
```

## Best Practices

### For API Developers

1. **Always add version header** to responses
2. **Never break existing versions** - create new version instead
3. **Maintain deprecation schedule** - communicate clearly
4. **Share logic across versions** - avoid duplication
5. **Write migration guides** before deprecating
6. **Monitor version usage** before removing old versions

### For API Consumers

1. **Use explicit versioning** - don't rely on redirects
2. **Use the API client** - type-safe and versioned
3. **Check version headers** - validate responses
4. **Handle deprecation headers** - plan migrations early
5. **Test against new versions** before they become required
6. **Subscribe to changelog** - stay informed

## Resources

- **API Client:** `/src/lib/api-client.ts`
- **Version Utilities:** `/src/lib/api-version.ts`
- **Middleware:** `/middleware.ts`
- **Changelog:** `/CHANGELOG.md`
- **Migration Guides:** `/docs/api/migrations/`

## FAQ

### Why URL versioning instead of header versioning?

**Pros:**
- Easier to test (just change URL in browser)
- Better caching (different URLs = different cache keys)
- Simpler routing (Next.js file-based routing)
- More discoverable (visible in URLs)

**Cons:**
- Slightly longer URLs
- Multiple routes to maintain

### Can I use both v1 and v2 simultaneously?

Yes! Different parts of your app can use different versions during migration.

### What happens when v1 is removed?

Requests to `/api/v1/*` will return `410 Gone` with a migration guide link.

### How do I know when a version will be removed?

Check the `Sunset` header in API responses or subscribe to the API changelog.

### Are admin routes versioned?

No. Admin routes (`/api/admin/*`) are not versioned as they're internal tools.

### How are rate limits applied across versions?

Rate limits are shared across all versions and count toward the same quota.

---

**Questions?** Open an issue or consult the API documentation.
