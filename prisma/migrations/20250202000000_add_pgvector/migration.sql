-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable: VectorChunk for pgvector-based semantic search
-- embedding is nullable: chunks may be stored before embeddings are generated
CREATE TABLE IF NOT EXISTS "VectorChunk" (
    "id" TEXT NOT NULL,
    "transcriptId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "embedding" vector(1536),
    "startTime" INTEGER NOT NULL,
    "endTime" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VectorChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Regular indexes for filtering
CREATE INDEX IF NOT EXISTS "VectorChunk_transcriptId_idx" ON "VectorChunk"("transcriptId");
CREATE INDEX IF NOT EXISTS "VectorChunk_videoId_idx" ON "VectorChunk"("videoId");

-- CreateIndex: pgvector index for cosine similarity search
-- Using HNSW (Hierarchical Navigable Small World) for better performance
-- Only index non-null embeddings (WHERE clause requires pg 15+)
CREATE INDEX IF NOT EXISTS "VectorChunk_embedding_idx" ON "VectorChunk"
USING hnsw (embedding vector_cosine_ops)
WHERE embedding IS NOT NULL;

-- AddForeignKey: VectorChunk -> Transcript
ALTER TABLE "VectorChunk" ADD CONSTRAINT "VectorChunk_transcriptId_fkey"
FOREIGN KEY ("transcriptId") REFERENCES "Transcript"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: VectorChunk -> Video
ALTER TABLE "VectorChunk" ADD CONSTRAINT "VectorChunk_videoId_fkey"
FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Note: For production with >100k vectors, consider using IVFFlat index instead:
-- CREATE INDEX "VectorChunk_embedding_idx" ON "VectorChunk"
-- USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- The migration script can optimize this automatically.
