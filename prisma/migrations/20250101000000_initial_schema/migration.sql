-- Initial schema migration
-- Creates all core tables: Course, Video, Chapter, Transcript, TranscriptChunk, Admin

-- CreateTable: Course
CREATE TABLE IF NOT EXISTS "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "topics" TEXT[],
    "thumbnail" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Video
CREATE TABLE IF NOT EXISTS "Video" (
    "id" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "tags" TEXT[],
    "courseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Chapter
CREATE TABLE IF NOT EXISTS "Chapter" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" INTEGER NOT NULL,
    "endTime" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Transcript
CREATE TABLE IF NOT EXISTS "Transcript" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'he',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transcript_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TranscriptChunk
CREATE TABLE IF NOT EXISTS "TranscriptChunk" (
    "id" TEXT NOT NULL,
    "transcriptId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "startTime" INTEGER NOT NULL,
    "endTime" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranscriptChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Admin
CREATE TABLE IF NOT EXISTS "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Video_youtubeId_key" ON "Video"("youtubeId");
CREATE UNIQUE INDEX IF NOT EXISTS "Transcript_videoId_key" ON "Transcript"("videoId");
CREATE UNIQUE INDEX IF NOT EXISTS "Admin_email_key" ON "Admin"("email");

-- CreateIndex: Course
CREATE INDEX IF NOT EXISTS "Course_published_idx" ON "Course"("published");
CREATE INDEX IF NOT EXISTS "Course_order_idx" ON "Course"("order");
CREATE INDEX IF NOT EXISTS "Course_published_order_idx" ON "Course"("published", "order");

-- CreateIndex: Video
CREATE INDEX IF NOT EXISTS "Video_courseId_idx" ON "Video"("courseId");
CREATE INDEX IF NOT EXISTS "Video_published_idx" ON "Video"("published");
CREATE INDEX IF NOT EXISTS "Video_youtubeId_idx" ON "Video"("youtubeId");
CREATE INDEX IF NOT EXISTS "Video_courseId_published_idx" ON "Video"("courseId", "published");

-- CreateIndex: Chapter
CREATE INDEX IF NOT EXISTS "Chapter_videoId_idx" ON "Chapter"("videoId");
CREATE INDEX IF NOT EXISTS "Chapter_order_idx" ON "Chapter"("order");

-- CreateIndex: Transcript
CREATE INDEX IF NOT EXISTS "Transcript_videoId_idx" ON "Transcript"("videoId");

-- CreateIndex: TranscriptChunk
CREATE INDEX IF NOT EXISTS "TranscriptChunk_transcriptId_idx" ON "TranscriptChunk"("transcriptId");
CREATE INDEX IF NOT EXISTS "TranscriptChunk_order_idx" ON "TranscriptChunk"("order");
CREATE INDEX IF NOT EXISTS "TranscriptChunk_transcriptId_order_idx" ON "TranscriptChunk"("transcriptId", "order");

-- CreateIndex: Admin
CREATE INDEX IF NOT EXISTS "Admin_email_idx" ON "Admin"("email");

-- AddForeignKey: Video -> Course
ALTER TABLE "Video" ADD CONSTRAINT "Video_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Chapter -> Video
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_videoId_fkey"
FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Transcript -> Video
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_videoId_fkey"
FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: TranscriptChunk -> Transcript
ALTER TABLE "TranscriptChunk" ADD CONSTRAINT "TranscriptChunk_transcriptId_fkey"
FOREIGN KEY ("transcriptId") REFERENCES "Transcript"("id") ON DELETE CASCADE ON UPDATE CASCADE;
