-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable: VectorChunk for pgvector-based semantic search
CREATE TABLE "VectorChunk" (
    "id" TEXT NOT NULL,
    "transcriptId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "startTime" INTEGER NOT NULL,
    "endTime" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VectorChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Regular indexes for filtering
CREATE INDEX "VectorChunk_transcriptId_idx" ON "VectorChunk"("transcriptId");
CREATE INDEX "VectorChunk_videoId_idx" ON "VectorChunk"("videoId");

-- CreateIndex: pgvector index for cosine similarity search
-- Using HNSW (Hierarchical Navigable Small World) for better performance
-- For smaller datasets (<10k vectors), this will be fast enough
CREATE INDEX "VectorChunk_embedding_idx" ON "VectorChunk"
USING hnsw (embedding vector_cosine_ops);

-- AddForeignKey
ALTER TABLE "VectorChunk" ADD CONSTRAINT "VectorChunk_transcriptId_fkey"
FOREIGN KEY ("transcriptId") REFERENCES "Transcript"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Note: For production with >100k vectors, consider using IVFFlat index instead:
-- CREATE INDEX "VectorChunk_embedding_idx" ON "VectorChunk"
-- USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- The migration script can optimize this automatically.
