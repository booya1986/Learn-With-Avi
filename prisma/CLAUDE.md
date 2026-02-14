# Database (Prisma + PostgreSQL)

## Schema Models

| Model | Purpose |
|-------|---------|
| `Course` | Course with title, description, difficulty, topics, thumbnail |
| `Video` | YouTube video linked to course (youtubeId, chapters, transcript) |
| `Chapter` | Video chapter with startTime/endTime (seconds) |
| `Transcript` | Full transcript text per video |
| `TranscriptChunk` | Chunked transcript for RAG (with pgvector embedding) |
| `UserProgress` | Per-user video watch progress |
| `QuizAttempt` | Adaptive quiz attempt tracking |

## Rules

- Always run `npx prisma generate` after schema changes
- Run `npx prisma migrate dev --name descriptive_name` for migrations
- Use `@default(cuid())` for IDs
- Add `@@index` for frequently queried fields
- `@db.Text` for long strings (description, transcript content)
- Cascade deletes: Course -> Video -> Chapter/Transcript/TranscriptChunk
- pgvector extension enabled for `TranscriptChunk.embedding` field

## Commands

```bash
npx prisma migrate dev     # Create and apply migration
npx prisma generate        # Regenerate client after schema change
npx prisma studio          # Open database GUI browser
npx prisma migrate reset   # Reset database (dev only!)
```

## Seed

`seed.ts` contains sample course/video data for development.
