# API Versioning Verification Checklist

**Date:** February 13, 2026
**Feature:** API Versioning (v1)

Use this checklist to verify the API versioning implementation is working correctly.

## Pre-Deployment Checks

### ✅ Code Review

- [ ] All v1 route files exist in `/src/app/api/v1/`
- [ ] Original routes still exist (for now) in `/src/app/api/`
- [ ] Middleware contains version redirection logic
- [ ] API client utilities are complete
- [ ] Version headers are added to all responses
- [ ] Documentation is complete and accurate

### ✅ Unit Tests

Run unit tests for versioning utilities:

```bash
# API version utilities
npm run test:unit -- src/lib/__tests__/api-version.test.ts

# API client
npm run test:unit -- src/lib/__tests__/api-client.test.ts

# All tests
npm run test:unit
```

**Expected Results:**
- [ ] All tests pass (24+ tests)
- [ ] No TypeScript errors
- [ ] Test coverage > 80%

### ✅ Build Verification

Verify the build succeeds:

```bash
npm run build
```

**Expected Results:**
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] No warnings about missing routes
- [ ] All v1 routes included in build manifest

## Manual Testing (Local)

### 1. Start Dev Server

```bash
npm run dev
```

Wait for server to start (typically 3-5 seconds).

### 2. Test Versioned Endpoints

#### Health Check (GET)

```bash
curl -i http://localhost:3000/api/v1/health
```

**Expected:**
- [ ] Status: `200 OK`
- [ ] Header: `X-API-Version: v1`
- [ ] Response body contains `{ "status": "healthy", ... }`

#### Chat (POST) - Requires payload

```bash
curl -X POST http://localhost:3000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test",
    "context": { "chunks": [] },
    "conversationHistory": []
  }' \
  -i
```

**Expected:**
- [ ] Header: `X-API-Version: v1`
- [ ] Content-Type: `text/event-stream` (SSE)
- [ ] Streaming response starts

### 3. Test Backward Compatibility

#### Unversioned Health Check

```bash
curl -i http://localhost:3000/api/health
```

**Expected:**
- [ ] Status: `200 OK`
- [ ] Header: `X-API-Version: v1` (auto-added)
- [ ] Same response as `/api/v1/health`
- [ ] Console shows deprecation warning (dev mode only)

#### Unversioned Chat

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test",
    "context": { "chunks": [] },
    "conversationHistory": []
  }' \
  -i
```

**Expected:**
- [ ] Header: `X-API-Version: v1`
- [ ] Same behavior as `/api/v1/chat`
- [ ] Console shows deprecation warning

### 4. Test Excluded Routes

#### Admin Route (No versioning)

```bash
curl -i http://localhost:3000/api/admin/courses
```

**Expected:**
- [ ] Status: `401 Unauthorized` (no auth token)
- [ ] **NO** `X-API-Version` header
- [ ] Response: `{ "error": "Unauthorized" }`

#### Auth Route (No versioning)

```bash
curl -i http://localhost:3000/api/auth/csrf
```

**Expected:**
- [ ] Status: `200 OK`
- [ ] **NO** `X-API-Version` header
- [ ] CSRF token in response

### 5. Test API Client

Create a test file:

```typescript
// test-api-client.ts
import { apiClient } from './src/lib/api-client'

async function test() {
  try {
    const health = await apiClient.health()
    const data = await health.json()
    console.log('✅ Health check:', data.status)

    const version = health.headers.get('X-API-Version')
    console.log('✅ Version header:', version)
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

test()
```

Run with:

```bash
npx tsx test-api-client.ts
```

**Expected:**
- [ ] Health check returns `{ status: 'healthy', ... }`
- [ ] Version header is `v1`
- [ ] No errors

### 6. Test Deprecation Warnings

With dev server running, check console for deprecation warnings:

```bash
# Make unversioned request
curl http://localhost:3000/api/health

# Check server console
```

**Expected in console:**
- [ ] Warning message appears
- [ ] Contains: "API Deprecation Warning"
- [ ] Suggests: "/api/v1/health"

## Integration Testing

### Run Test Script

```bash
chmod +x scripts/test-api-versioning.sh
./scripts/test-api-versioning.sh
```

**Expected:**
- [ ] All tests pass
- [ ] Green checkmarks for each endpoint
- [ ] No failures reported

### Run E2E Tests

```bash
npm run test:e2e
```

**Expected:**
- [ ] All existing E2E tests pass
- [ ] No new failures introduced
- [ ] API calls in tests work with both versioned/unversioned

## Performance Checks

### Latency Impact

Measure middleware overhead:

```bash
# 10 requests to versioned endpoint
for i in {1..10}; do
  curl -w "%{time_total}\n" -o /dev/null -s http://localhost:3000/api/v1/health
done

# 10 requests to unversioned endpoint (with rewrite)
for i in {1..10}; do
  curl -w "%{time_total}\n" -o /dev/null -s http://localhost:3000/api/health
done
```

**Expected:**
- [ ] Both have similar response times
- [ ] Difference < 5ms (negligible)
- [ ] No performance degradation

### Load Testing (Optional)

```bash
# Install Apache Bench if needed: brew install httpd

# 1000 requests, 10 concurrent
ab -n 1000 -c 10 http://localhost:3000/api/v1/health
```

**Expected:**
- [ ] All requests succeed
- [ ] No errors
- [ ] Stable response times

## Browser Testing

### Test in Browser Console

Open http://localhost:3000 and run in console:

```javascript
// Test versioned endpoint
fetch('/api/v1/health')
  .then(res => {
    console.log('Version:', res.headers.get('X-API-Version'))
    return res.json()
  })
  .then(console.log)

// Test unversioned endpoint (backward compat)
fetch('/api/health')
  .then(res => {
    console.log('Version:', res.headers.get('X-API-Version'))
    return res.json()
  })
  .then(console.log)
```

**Expected:**
- [ ] Both return version header `v1`
- [ ] Both return same data
- [ ] No CORS errors
- [ ] No console errors

## Documentation Checks

### Verify Documentation

- [ ] [docs/api/VERSIONING.md](./VERSIONING.md) is complete
- [ ] [docs/api/ROUTES.md](./ROUTES.md) reflects v1 endpoints
- [ ] [docs/api/migrations/UNVERSIONED_TO_V1.md](./migrations/UNVERSIONED_TO_V1.md) has migration steps
- [ ] [docs/api/API_VERSIONING_IMPLEMENTATION.md](./API_VERSIONING_IMPLEMENTATION.md) summarizes implementation
- [ ] [CLAUDE.MD](/CLAUDE.MD) mentions API versioning
- [ ] All code examples use correct syntax
- [ ] No broken links

### Update Other Docs

- [ ] Update [README.md](/README.md) with API versioning info
- [ ] Update [CHANGELOG.md](/CHANGELOG.md) with new feature
- [ ] Add entry to [docs/README.md](/docs/README.md)

## TypeScript Checks

### Type Safety

Run TypeScript compiler:

```bash
npx tsc --noEmit
```

**Expected:**
- [ ] No type errors
- [ ] All imports resolve correctly
- [ ] API client types are correct

### Import Paths

Verify all imports use correct paths:

```bash
grep -r "from '@/lib/api-" src/
```

**Expected:**
- [ ] All imports use `@/lib/api-client` or `@/lib/api-version`
- [ ] No relative imports (`../lib/api-client`)

## Edge Cases

### Invalid Version

```bash
curl -i http://localhost:3000/api/v99/health
```

**Expected:**
- [ ] Status: `404 Not Found`
- [ ] No special handling needed (Next.js returns 404)

### Missing Endpoint

```bash
curl -i http://localhost:3000/api/v1/nonexistent
```

**Expected:**
- [ ] Status: `404 Not Found`
- [ ] Standard Next.js 404 response

### Malformed Request

```bash
curl -X POST http://localhost:3000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```

**Expected:**
- [ ] Status: `400 Bad Request`
- [ ] Error message about invalid JSON

## Security Checks

### No API Key Leakage

Make a request that triggers an error:

```bash
# Temporarily disable API key
export ANTHROPIC_API_KEY=""

# Make request
curl http://localhost:3000/api/v1/chat -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"test","context":{"chunks":[]},"conversationHistory":[]}'
```

**Expected:**
- [ ] Error response does NOT contain API key
- [ ] Error message is sanitized
- [ ] Only user-friendly error shown

### Rate Limiting

Make rapid requests:

```bash
for i in {1..15}; do
  curl -s http://localhost:3000/api/v1/health
done
```

**Expected:**
- [ ] First 10 requests succeed
- [ ] Remaining requests return `429 Too Many Requests`
- [ ] `Retry-After` header is present

## Post-Deployment Checks

### Production Build

```bash
npm run build
npm run start
```

**Expected:**
- [ ] Production server starts
- [ ] All routes work
- [ ] No console errors
- [ ] Version headers present

### Health Monitoring

```bash
curl http://localhost:3000/api/v1/health
```

**Expected:**
- [ ] Returns healthy status
- [ ] All services operational
- [ ] Version header present

## Rollback Plan

If critical issues are found:

1. **Immediate Rollback:**
   ```bash
   git revert <commit-hash>
   npm run build
   npm run start
   ```

2. **Partial Rollback (keep v1, remove redirects):**
   - Comment out middleware version logic
   - Keep v1 routes functional
   - Remove deprecation warnings

3. **Complete Rollback:**
   - Remove `/src/app/api/v1/` directory
   - Restore middleware to original state
   - Redeploy

## Sign-Off

### Development Team

- [ ] **Backend Engineer** - Implementation verified
- [ ] **Frontend Engineer** - API client tested
- [ ] **QA Engineer** - All tests pass
- [ ] **DevOps** - Deployment strategy approved

### Checklist Complete?

- [ ] All items checked ✅
- [ ] No critical issues found
- [ ] Ready for production deployment

---

**Verification Date:** __________
**Verified By:** __________
**Status:** ☐ Pass ☐ Fail ☐ Needs Review
