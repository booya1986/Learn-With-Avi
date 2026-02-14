# pgvector Migration Guide

This guide explains how to migrate from ChromaDB to PostgreSQL with pgvector extension for vector similarity search.

## Why pgvector?

**Benefits over ChromaDB**:
- ✅ **Simplified Infrastructure**: No separate vector database service needed
- ✅ **Unified Data Model**: Transcripts and vectors in the same database
- ✅ **ACID Transactions**: Full database consistency guarantees
- ✅ **Better Integration**: Native Prisma support with raw SQL
- ✅ **Cost Effective**: No additional hosting costs for vector DB
- ✅ **Supabase Native**: Perfect for Supabase deployments

**Performance**:
- Similar query latency to ChromaDB for small-medium datasets (<100k vectors)
- Optimized indexes (HNSW, IVFFlat) for larger datasets
- Native PostgreSQL connection pooling

## Prerequisites

1. **PostgreSQL with pgvector support**:
   - Supabase (includes pgvector by default)
   - Self-hosted PostgreSQL 12+ with pgvector extension installed
   - Local development: Docker with `pgvector/pgvector` image

2. **Environment variables**:
   ```bash
   DATABASE_URL=postgresql://user:pass@host:5432/learnwithavi
   OPENAI_API_KEY=sk-xxxxx  # For generating embeddings
   VECTOR_DB=pgvector        # Set this to enable pgvector
   ```

3. **Existing transcripts in database** (optional for fresh installs)

## Migration Steps

### Step 1: Update Database Schema

Run the Prisma migration to add the `VectorChunk` table:

```bash
# Generate Prisma client with new schema
npx prisma generate

# Run migration (enables pgvector extension + creates VectorChunk table)
npx prisma migrate deploy
```

The migration will:
- Enable pgvector extension
- Create `VectorChunk` table with vector(1536) column
- Add indexes for efficient similarity search
- Set up foreign key relationships

### Step 2: Verify pgvector Installation

Check that pgvector is enabled:

```bash
# Via psql
psql $DATABASE_URL -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';"

# Or via migration script
npx tsx scripts/migrate-to-pgvector.ts --check
```

Expected output:
```
 extname | extversion
---------+------------
 vector  | 0.5.0
```

### Step 3: Run Migration Script

Migrate existing transcript chunks to pgvector:

```bash
# Dry run first (recommended)
DRY_RUN=true npx tsx scripts/migrate-to-pgvector.ts

# Actual migration
npx tsx scripts/migrate-to-pgvector.ts
```

The script will:
1. Check pgvector extension availability
2. Fetch all transcripts and chunks from database
3. Generate embeddings for chunks (cached from OpenAI)
4. Batch insert into `VectorChunk` table
5. Optimize vector indexes
6. Verify migration success

**Migration output**:
```
🚀 Starting pgvector migration...

📋 Step 1: Checking pgvector extension...
   ✅ pgvector extension already enabled

📋 Step 2: Fetching transcripts from database...
   Found 12 transcripts with 3,456 chunks

📋 Step 3: Checking existing vector chunks...
   Found 0 existing vector chunks

📋 Step 4: Migrating transcript chunks...
   [1/12] Processing "Introduction to AI" (285 chunks)...
      Batch 1/6 (50 chunks)...
      ✅ Migrated 50 chunks
      ...
   ✅ Completed "Introduction to AI"

📋 Step 5: Optimizing pgvector index...
   ✅ Index optimization complete

📋 Step 6: Verifying migration...
   Final vector chunk count: 3,456

═══════════════════════════════════════════════════════════
MIGRATION SUMMARY
═══════════════════════════════════════════════════════════
Total Transcripts:  12
Total Chunks:       3,456
Migrated Chunks:    3,456
Skipped Chunks:     0
Failed Chunks:      0
Duration:           245.67s
═══════════════════════════════════════════════════════════

✅ Migration completed successfully!

📝 Next steps:
   1. Set VECTOR_DB=pgvector in your .env.local
   2. Restart your application
   3. Test search functionality
   4. (Optional) Disable ChromaDB if no longer needed
```

### Step 4: Update Environment Configuration

Enable pgvector in your environment:

```bash
# .env.local
VECTOR_DB=pgvector
```

Options:
- `pgvector` - Use PostgreSQL with pgvector (recommended)
- `chroma` - Use ChromaDB (legacy)
- `keyword` - Keyword-only search (no vector DB)

### Step 5: Restart Application

```bash
npm run dev
```

The RAG system will automatically use pgvector for all vector similarity searches.

### Step 6: Verify Migration

Test the search functionality:

1. **Health Check**:
   ```bash
   curl http://localhost:3000/api/health | jq '.services[] | select(.name == "Vector Database")'
   ```

   Expected output:
   ```json
   {
     "name": "Vector Database",
     "status": "healthy",
     "message": "pgvector operational",
     "details": {
       "backend": "pgvector",
       "chunkCount": 3456,
       "error": null
     }
   }
   ```

2. **Chat Search**:
   - Open course page
   - Ask a question in chat
   - Verify relevant chunks are retrieved with timestamps

3. **Compare Results**:
   ```bash
   # Test query
   curl -X POST http://localhost:3000/api/chat \
     -H "Content-Type: application/json" \
     -d '{"query": "What is machine learning?", "videoId": "abc123"}'
   ```

## Rollback (If Needed)

If you need to rollback to ChromaDB:

```bash
# 1. Change environment variable
echo "VECTOR_DB=chroma" >> .env.local

# 2. Optionally delete vector chunks to save space
npx tsx scripts/migrate-to-pgvector.ts rollback

# 3. Restart application
npm run dev
```

The system will gracefully fall back to ChromaDB (if available) or keyword search.

## Performance Tuning

### For Small Datasets (<10k vectors)

The default HNSW index is optimal:
```sql
CREATE INDEX vector_chunk_embedding_idx ON "VectorChunk"
USING hnsw (embedding vector_cosine_ops);
```

**Query performance**: 20-50ms for typical searches

### For Medium Datasets (10k-100k vectors)

Tune HNSW parameters:
```sql
DROP INDEX IF EXISTS vector_chunk_embedding_idx;

CREATE INDEX vector_chunk_embedding_idx ON "VectorChunk"
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

Parameters:
- `m`: Max connections per layer (default 16, higher = better recall, more memory)
- `ef_construction`: Search depth during index build (default 64, higher = better index quality, slower build)

**Query performance**: 30-80ms for typical searches

### For Large Datasets (>100k vectors)

Use IVFFlat index for better performance:
```sql
DROP INDEX IF EXISTS vector_chunk_embedding_idx;

-- Calculate optimal lists (sqrt of row count)
-- For 100k rows: lists = 316
-- For 1M rows: lists = 1000

CREATE INDEX vector_chunk_embedding_idx ON "VectorChunk"
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 316);
```

**Query performance**: 50-150ms for typical searches

The migration script automatically optimizes the index based on dataset size.

### Query-Time Tuning

For IVFFlat index, tune the `probes` parameter:

```sql
-- More probes = better recall, slower queries
SET ivfflat.probes = 10;  -- Default: 1

SELECT * FROM "VectorChunk"
ORDER BY embedding <=> '[...]'::vector
LIMIT 5;
```

## Cost Comparison

### ChromaDB (Self-Hosted)

- **Infrastructure**: $10-50/month (separate server)
- **Maintenance**: Manual updates, monitoring
- **Scaling**: Requires load balancer for HA

### pgvector (Supabase)

- **Infrastructure**: $0 (included in database)
- **Maintenance**: Automatic with PostgreSQL
- **Scaling**: Native with connection pooling

**Savings**: ~$120-600/year per environment

## Troubleshooting

### pgvector extension not found

**Error**: `extension "vector" is not available`

**Solution**:
- Supabase: Extension is pre-installed, just enable it
- Self-hosted: Install pgvector extension
  ```bash
  # Ubuntu/Debian
  sudo apt install postgresql-15-pgvector

  # macOS (Homebrew)
  brew install pgvector

  # Docker
  docker run -d --name postgres \
    -e POSTGRES_PASSWORD=password \
    -p 5432:5432 \
    pgvector/pgvector:pg15
  ```

### Slow queries

**Symptom**: Queries take >500ms

**Solutions**:
1. Check index exists:
   ```sql
   SELECT indexname, indexdef FROM pg_indexes
   WHERE tablename = 'VectorChunk';
   ```

2. Analyze table statistics:
   ```sql
   ANALYZE "VectorChunk";
   ```

3. Optimize index (see Performance Tuning above)

4. Add videoId filter to queries:
   ```typescript
   // Faster: filter by video
   queryVectorChunks(query, 5, videoId);

   // Slower: search all videos
   queryVectorChunks(query, 5);
   ```

### Out of memory

**Error**: `could not extend shared memory segment`

**Solution**: Increase PostgreSQL shared_buffers
```sql
-- Check current setting
SHOW shared_buffers;

-- Increase (requires restart)
ALTER SYSTEM SET shared_buffers = '256MB';
```

### Migration fails partway through

**Symptom**: Script crashes or is interrupted

**Solution**: Re-run migration script
- Script is idempotent
- Skips already-migrated chunks
- Safe to run multiple times

```bash
npx tsx scripts/migrate-to-pgvector.ts
```

## API Reference

### RAG Functions (Automatic Routing)

All existing RAG functions automatically route to pgvector when `VECTOR_DB=pgvector`:

```typescript
import { queryChunks, addChunks } from '@/lib/rag';

// Query (automatically uses pgvector)
const results = await queryChunks('machine learning', 5, videoId);

// Add chunks (automatically uses pgvector)
await addChunks(transcriptChunks);
```

### pgvector-Specific Functions

Direct access to pgvector functionality:

```typescript
import * as pgvector from '@/lib/rag-pgvector';

// Check availability
const available = await pgvector.isPgVectorAvailable();

// Add chunks
await pgvector.addVectorChunks([{
  transcriptId: 'trans_123',
  videoId: 'vid_456',
  text: 'Machine learning is...',
  startTime: 120,
  endTime: 180,
  embedding: [0.1, 0.2, ...], // Optional
}]);

// Query
const results = await pgvector.queryVectorChunks(
  'What is AI?',
  5,
  'vid_456'
);

// Health check
const health = await pgvector.checkPgVectorHealth();
console.log(health);
// {
//   available: true,
//   chunkCount: 3456,
// }
```

## Best Practices

1. **Always use videoId filter** when possible for faster queries
2. **Monitor index size** and tune parameters for dataset growth
3. **Run ANALYZE** after bulk insertions for optimal query planning
4. **Use batching** for inserting multiple chunks (50-100 per batch)
5. **Enable connection pooling** in production (Supabase handles this)
6. **Cache embeddings** with Redis for cost savings

## Next Steps

- [RAG Pipeline Optimization](/skills/rag-pipeline-optimizer/SKILL.md)
- [Hybrid Search (BM25 + Vector)](/skills/rag-pipeline-optimizer/references/HYBRID_SEARCH.md)
- [Prompt Caching with Claude](/skills/rag-pipeline-optimizer/references/PROMPT_CACHING.md)

## Support

If you encounter issues:
1. Check health endpoint: `/api/health`
2. Review server logs for errors
3. Verify environment variables
4. Test with dry run: `DRY_RUN=true npx tsx scripts/migrate-to-pgvector.ts`

For production deployments, consider:
- Regular backups of PostgreSQL
- Monitoring query performance with pg_stat_statements
- Horizontal scaling with read replicas
