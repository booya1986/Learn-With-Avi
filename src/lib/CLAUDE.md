# Core Libraries

## Files

| File | Purpose |
|------|---------|
| `rag.ts` | RAG system entry point (ChromaDB with keyword fallback) |
| `rag-pgvector.ts` | pgvector implementation (primary vector search) |
| `hybrid-search.ts` | BM25 + vector search with Reciprocal Rank Fusion |
| `embeddings.ts` | OpenAI text-embedding-3-small with 1-hour LRU cache |
| `embeddings-cache.ts` | Embedding cache implementation |
| `auth.ts` | NextAuth.js configuration |
| `auth-config.ts` | Auth provider config |
| `auth-rate-limit.ts` | Auth-specific rate limiting |
| `prisma.ts` | Prisma client singleton |
| `config.ts` | Centralized env var access via `getConfig()` |
| `errors.ts` | Error classes (ValidationError, RateLimitError, ServiceUnavailableError) |
| `rate-limit.ts` | IP-based rate limiting (10 req/min default) |
| `quiz-prompts.ts` | Adaptive quiz prompt templates (Bloom's Taxonomy) |
| `utils.ts` | Shared utilities (generateId, etc.) |
| `youtube.ts` | YouTube metadata extraction |
| `fetch-utils.ts` | HTTP fetch helpers with retry |
| `redis.ts` | Redis client (optional caching layer) |

## Rules

- All env var access goes through `getConfig()` in `config.ts`
- Error handling uses classes from `errors.ts` - never throw raw strings
- `logError()` for all error logging (sanitizes sensitive data)
- Embeddings cache is critical for cost savings - never bypass without reason
- RAG fallback chain: pgvector -> ChromaDB -> keyword search
- Keep functions pure where possible, side effects at boundaries
