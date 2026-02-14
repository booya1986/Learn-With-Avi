# Migration Guide: Unversioned → v1

**Migration Date:** February 13, 2026
**Deadline:** Not applicable (backward compatible)
**Breaking Changes:** None

## Overview

This guide helps you migrate from unversioned API endpoints to the new versioned v1 endpoints.

**Good news:** This migration is **completely backward compatible**. Unversioned routes are automatically rewritten to v1, so your existing code will continue to work without changes.

**However**, we recommend updating to explicit versioning for:
- Better clarity and maintainability
- Future-proofing (when v2 is released)
- Avoiding deprecation warnings in development

## What Changed

### Before (Unversioned)

```typescript
// Unversioned endpoints
fetch('/api/chat', { ... })
fetch('/api/voice/chat', { ... })
fetch('/api/voice/tts', { ... })
fetch('/api/quiz/generate', { ... })
fetch('/api/health', { ... })
```

### After (v1)

```typescript
// Versioned endpoints (recommended)
fetch('/api/v1/chat', { ... })
fetch('/api/v1/voice/chat', { ... })
fetch('/api/v1/voice/tts', { ... })
fetch('/api/v1/quiz/generate', { ... })
fetch('/api/v1/health', { ... })
```

## Migration Steps

### Option 1: Use the API Client (Recommended)

The easiest way to migrate is to use the provided `apiClient` utility, which handles versioning automatically.

**Before:**

```typescript
// Manual fetch calls
const chatResponse = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Hello',
    context: { chunks: [] },
    conversationHistory: []
  })
})

const healthResponse = await fetch('/api/health')
```

**After:**

```typescript
import { apiClient } from '@/lib/api-client'

// Type-safe, versioned API calls
const chatResponse = await apiClient.chat({
  message: 'Hello',
  context: { chunks: [] },
  conversationHistory: []
})

const healthResponse = await apiClient.health()
```

**Benefits:**
- Automatic versioning
- TypeScript type safety
- Simpler code
- Better error handling

### Option 2: Update URLs Manually

If you prefer to keep using `fetch` directly, simply add `/v1` to your API paths.

**Search and replace:**

```bash
# Find all unversioned API calls
grep -r "'/api/chat'" src/
grep -r "'/api/voice'" src/
grep -r "'/api/quiz'" src/
grep -r "'/api/health'" src/

# Replace with versioned equivalents
'/api/chat' → '/api/v1/chat'
'/api/voice/chat' → '/api/v1/voice/chat'
'/api/voice/tts' → '/api/v1/voice/tts'
'/api/quiz/generate' → '/api/v1/quiz/generate'
'/api/health' → '/api/v1/health'
```

**Example:**

```typescript
// Before
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ message: 'Hello' })
})

// After
const response = await fetch('/api/v1/chat', {
  method: 'POST',
  body: JSON.stringify({ message: 'Hello' })
})
```

### Option 3: Use Helper Function

Create a helper function to build versioned URLs:

```typescript
import { buildApiUrl } from '@/lib/api-client'

// Before
fetch('/api/chat', { ... })

// After
fetch(buildApiUrl('/chat'), { ... })
```

## Routes Not Affected

The following routes are **NOT versioned** and should remain unchanged:

### Admin Routes

```typescript
// ✅ Correct - no versioning
fetch('/api/admin/courses')
fetch('/api/admin/videos')
fetch('/api/admin/transcripts')
```

### Auth Routes (NextAuth.js)

```typescript
// ✅ Correct - no versioning
fetch('/api/auth/signin')
fetch('/api/auth/signout')
fetch('/api/auth/session')
```

### Debug Routes

```typescript
// ✅ Correct - no versioning
fetch('/api/debug/test-sentry')
```

## Verification

After migration, verify that:

### 1. All API calls work

```bash
npm run dev
# Test your app manually
```

### 2. Version header is present

```typescript
const response = await fetch('/api/v1/chat', { ... })
const version = response.headers.get('X-API-Version')
console.log(version) // Should log: 'v1'
```

### 3. No deprecation warnings

Check your browser console and terminal for deprecation warnings during development.

### 4. Run tests

```bash
npm run test:unit
npm run test:e2e
```

## Examples

### Chat API

**Before:**

```typescript
const encoder = new TextEncoder()
const decoder = new TextDecoder()

const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Explain this concept',
    context: { chunks: transcriptChunks },
    conversationHistory: []
  })
})

const reader = response.body.getReader()
while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const chunk = decoder.decode(value)
  // Process SSE...
}
```

**After (with API client):**

```typescript
import { apiClient } from '@/lib/api-client'

const response = await apiClient.chat({
  message: 'Explain this concept',
  context: { chunks: transcriptChunks },
  conversationHistory: []
})

const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const chunk = decoder.decode(value)
  // Process SSE...
}
```

### Voice Chat API

**Before:**

```typescript
const formData = new FormData()
formData.append('audio', audioBlob)
formData.append('language', 'he')

const response = await fetch('/api/voice/chat', {
  method: 'POST',
  body: formData
})
```

**After (with API client):**

```typescript
import { apiClient } from '@/lib/api-client'

const response = await apiClient.voiceChat({
  audio: audioBlob,
  language: 'he',
  videoId: currentVideoId,
  enableTTS: true
})
```

### Quiz Generation API

**Before:**

```typescript
const response = await fetch('/api/quiz/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    videoId: 'abc123',
    bloomLevel: 2,
    count: 5,
    language: 'he'
  })
})

const { questions } = await response.json()
```

**After (with API client):**

```typescript
import { apiClient } from '@/lib/api-client'

const response = await apiClient.generateQuiz({
  videoId: 'abc123',
  bloomLevel: 2,
  count: 5,
  language: 'he'
})

const { questions } = await response.json()
```

### Health Check API

**Before:**

```typescript
const response = await fetch('/api/health')
const health = await response.json()
```

**After (with API client):**

```typescript
import { apiClient } from '@/lib/api-client'

const response = await apiClient.health()
const health = await response.json()
```

## Testing Checklist

After migration, test the following:

- [ ] Chat functionality works (SSE streaming)
- [ ] Voice chat works (audio upload + transcription)
- [ ] TTS works (Hebrew + English)
- [ ] Quiz generation works
- [ ] Health check endpoint returns correct status
- [ ] All responses include `X-API-Version: v1` header
- [ ] No console errors or warnings
- [ ] Unit tests pass
- [ ] E2E tests pass

## Rollback Plan

If you encounter issues, you can immediately rollback since unversioned endpoints still work:

```typescript
// Rollback: just remove /v1 from URLs
'/api/v1/chat' → '/api/chat'
```

The unversioned routes are automatically rewritten to v1, so there's no difference in behavior.

## FAQ

### Do I need to migrate now?

**No.** Unversioned routes are backward compatible and will continue to work. However, we recommend migrating to avoid future issues when v2 is released.

### Will unversioned routes be removed?

**Eventually, yes.** When v2 is released, unversioned routes will be deprecated with a sunset date (minimum 6 months notice).

### Can I use both v1 and unversioned routes?

**Yes.** During the migration period, you can use both. They behave identically.

### What if I miss some endpoints during migration?

**No problem.** Unversioned endpoints continue to work, so your app won't break.

### How do I know if I'm using unversioned routes?

**Check deprecation warnings** in development console:

```
⚠️ API Deprecation Warning
  Path: /api/chat is deprecated
  Use: /api/v1/chat instead
```

### Does this affect admin routes?

**No.** Admin routes (`/api/admin/*`) are not versioned and remain unchanged.

### Does this affect authentication?

**No.** NextAuth routes (`/api/auth/*`) are not versioned and remain unchanged.

## Support

If you encounter issues during migration:

1. Check the [API Versioning Guide](../VERSIONING.md)
2. Review the [API Client documentation](../../lib/api-client.ts)
3. Run the test script: `./scripts/test-api-versioning.sh`
4. Open an issue on GitHub

---

**Migration completed?** Update your `CHANGELOG.md` and mark this migration as done!
