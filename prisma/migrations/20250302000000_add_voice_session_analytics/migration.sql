-- CreateTable
CREATE TABLE "VoiceSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT,
    "videoId" TEXT,
    "language" TEXT,
    "sttProvider" TEXT,
    "ttsProvider" TEXT,
    "ttsUsedFallback" BOOLEAN NOT NULL DEFAULT false,
    "sttLatencyMs" INTEGER,
    "llmLatencyMs" INTEGER,
    "ttsLatencyMs" INTEGER,
    "totalLatencyMs" INTEGER,
    "transcriptionLength" INTEGER,
    "responseLength" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoiceSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VoiceSession_createdAt_idx" ON "VoiceSession"("createdAt");

-- CreateIndex
CREATE INDEX "VoiceSession_videoId_idx" ON "VoiceSession"("videoId");
