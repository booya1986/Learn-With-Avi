Create a new API route following project conventions:

1. Create route file at `src/app/api/{name}/route.ts`
2. Keep the route handler thin - move business logic to `src/lib/`
3. Use `getConfig()` from `@/lib/config` for environment variables
4. Import and use error utilities from `@/lib/errors`:
   - `logError()` for error logging
   - `sanitizeError()` for safe error responses
   - `ValidationError`, `RateLimitError` for typed errors
5. Apply rate limiting with `applyRateLimit()` from `@/lib/rate-limit`
6. Return proper HTTP status codes (400, 401, 429, 500)
7. Never expose API keys in error responses
8. Add a test file at `src/app/api/__tests__/{name}.test.ts`
9. If the route requires authentication, check NextAuth session

Route name: $ARGUMENTS
