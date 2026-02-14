# Admin API Quick Reference

Quick reference for all admin panel API endpoints.

**Base URL (Development):** `http://localhost:3001`

> **Note:** The dev server runs on port 3001 to avoid conflicts with browser extensions (e.g., Ollama Web UI) that intercept port 3000.

## Authentication

All endpoints require admin session via NextAuth.

```typescript
// Check session in API route
const session = await getServerSession(authOptions);
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

---

## YouTube API

### Validate YouTube Video
```
POST /api/admin/youtube/validate
Body: { "url": "https://youtube.com/watch?v=VIDEO_ID" }
Response: { "valid": true, "metadata": {...} }
```

---

## Courses API

### List Courses
```
GET /api/admin/courses?search=python&published=true
Response: [{ "id": "...", "title": "...", "_count": { "videos": 10 } }]
```

### Create Course
```
POST /api/admin/courses
Body: {
  "title": "Course Title",
  "description": "...",
  "difficulty": "beginner",
  "topics": ["topic1"],
  "thumbnail": "https://...",
  "published": false
}
Response: { "id": "...", "title": "...", ... }
```

### Get Single Course
```
GET /api/admin/courses/[id]
Response: { "id": "...", "title": "...", "videos": [...] }
```

### Update Course
```
PUT /api/admin/courses/[id]
Body: { "title": "Updated Title", "published": true }
Response: { "id": "...", "title": "Updated Title", ... }
```

### Delete Course
```
DELETE /api/admin/courses/[id]
Response: { "success": true, "message": "Course deleted", "deletedVideoCount": 5 }
```

### Reorder Videos
```
POST /api/admin/courses/[id]/reorder
Body: { "videoIds": ["video-id-1", "video-id-2"] }
Response: { "success": true, "updatedCount": 2 }
```

---

## Videos API

### List Videos
```
GET /api/admin/videos?courseId=course-id&published=true
Response: [{ "id": "...", "title": "...", "course": {...} }]
```

### Create Video
```
POST /api/admin/videos
Body: {
  "youtubeId": "VIDEO_ID",
  "title": "Video Title",
  "description": "...",
  "duration": 3600,
  "thumbnail": "https://...",
  "topic": "Topic",
  "tags": ["tag1", "tag2"],
  "courseId": "course-id",
  "published": false,
  "chapters": [
    {
      "title": "Introduction",
      "startTime": 0,
      "endTime": 120,
      "order": 0
    }
  ]
}
Response: { "id": "...", "title": "...", "chapters": [...] }
```

### Get Single Video
```
GET /api/admin/videos/[id]
Response: { "id": "...", "title": "...", "chapters": [...], "course": {...} }
```

### Update Video
```
PUT /api/admin/videos/[id]
Body: { "title": "Updated Title", "published": true }
Response: { "id": "...", "title": "Updated Title", ... }
Note: If "chapters" is provided, ALL existing chapters are replaced
```

### Delete Video
```
DELETE /api/admin/videos/[id]
Response: { "success": true, "deletedChapters": 5, "hadTranscript": true }
```

---

## Transcripts API

### Create Transcript
```
POST /api/admin/transcripts
Body: {
  "videoId": "video-id",
  "source": "youtube",
  "language": "he",
  "chunks": [
    {
      "text": "Hello, welcome...",
      "startTime": 0,
      "endTime": 3,
      "order": 0
    }
  ]
}
Response: { "id": "...", "chunks": [...] }
```

### Update Transcript
```
PUT /api/admin/transcripts
Body: {
  "transcriptId": "transcript-id",
  "language": "en",
  "chunks": [...]
}
Response: { "id": "...", "language": "en", "chunks": [...] }
Note: If "chunks" is provided, ALL existing chunks are replaced
```

---

## Validation Schemas

### Course Schema
```typescript
{
  title: string (1-200 chars) [required]
  description: string [optional]
  difficulty: 'beginner' | 'intermediate' | 'advanced' [default: 'beginner']
  topics: string[] [default: []]
  thumbnail: string [default: '']
  published: boolean [default: false]
}
```

### Video Schema
```typescript
{
  youtubeId: string (11 chars, unique) [required]
  title: string (1-200 chars) [required]
  description: string [default: '']
  duration: number (seconds > 0) [required]
  thumbnail: string [default: '']
  topic: string [default: '']
  tags: string[] [default: []]
  courseId: string [required]
  published: boolean [default: false]
  chapters: Chapter[] [default: []]
}
```

### Chapter Schema
```typescript
{
  title: string [required]
  startTime: number (seconds >= 0) [required]
  endTime: number (seconds >= 0) [required]
  order: number (>= 0) [required]
}
```

### Transcript Schema
```typescript
{
  videoId: string [required]
  source: 'youtube' | 'manual' | 'whisper' [default: 'manual']
  language: string (ISO code) [default: 'he']
  chunks: TranscriptChunk[] (min 1) [required]
}
```

### Transcript Chunk Schema
```typescript
{
  text: string [required]
  startTime: number (seconds >= 0) [required]
  endTime: number (seconds >= 0) [required]
  order: number (>= 0) [required]
}
```

---

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Validation failed / Bad request
- `401` - Unauthorized (not logged in)
- `404` - Resource not found
- `409` - Conflict (duplicate resource)
- `500` - Internal server error

---

## Error Response Format

```json
{
  "error": "Human-readable error message",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

---

## Common Patterns

### Cascade Deletes
- Deleting a course deletes all videos, chapters, transcripts
- Deleting a video deletes all chapters, transcript, transcript chunks

### Ordering
- New courses/videos get `order = max(existing_order) + 1`
- Use reorder endpoint to change order

### Unique Constraints
- `youtubeId` must be unique across all videos
- One transcript per video

### Transactions
- Video + chapters created in single transaction
- Transcript + chunks created in single transaction
- Updates with chapters replace all in transaction

---

## Testing Checklist

- [ ] YouTube validation (valid URL)
- [ ] YouTube validation (invalid URL)
- [ ] Create course
- [ ] List courses
- [ ] Get single course
- [ ] Update course
- [ ] Create video with chapters
- [ ] List videos
- [ ] Get single video
- [ ] Update video
- [ ] Reorder videos
- [ ] Create transcript
- [ ] Update transcript
- [ ] Delete video (cascade)
- [ ] Delete course (cascade)
- [ ] Authentication (401 on missing session)

---

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# Optional
YOUTUBE_API_KEY=...
```

---

## File Locations

```
/src/app/api/admin/youtube/validate/route.ts
/src/app/api/admin/courses/route.ts
/src/app/api/admin/courses/[id]/route.ts
/src/app/api/admin/courses/[id]/reorder/route.ts
/src/app/api/admin/videos/route.ts
/src/app/api/admin/videos/[id]/route.ts
/src/app/api/admin/transcripts/route.ts
/src/lib/youtube.ts
```

---

**Version:** 1.0
**Last Updated:** 2025-01-16
