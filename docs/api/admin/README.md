# Admin API Documentation

Complete reference for all admin panel API routes.

## Quick Links

- [Authentication](#authentication)
- [YouTube Integration](#youtube-integration)
- [Courses API](#courses-api)
- [Videos API](#videos-api)
- [Transcripts API](#transcripts-api)
- [Testing](#testing)

---

## API Routes Overview

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/admin/youtube/validate` | POST | Validate YouTube URLs and fetch metadata |
| `/api/admin/courses` | GET, POST | List courses, create new course |
| `/api/admin/courses/[id]` | GET, PUT, DELETE | Manage single course |
| `/api/admin/courses/[id]/reorder` | POST | Reorder videos in course |
| `/api/admin/videos` | GET, POST | List videos, create new video |
| `/api/admin/videos/[id]` | GET, PUT, DELETE | Manage single video |
| `/api/admin/transcripts` | POST, PUT | Create/update transcripts |

---

## Authentication

All admin API routes require authentication via NextAuth session.

### Implementation

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // ... rest of handler
}
```

### Session Flow

1. Admin logs in via `/admin/login`
2. NextAuth creates session cookie
3. API routes validate session
4. Unauthorized requests → `401 Unauthorized`

---

## YouTube Integration

### Validate YouTube Video

**Endpoint:** `POST /api/admin/youtube/validate`

**Purpose:** Validate YouTube URLs and fetch video metadata including chapters.

**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response:**
```json
{
  "valid": true,
  "videoId": "VIDEO_ID",
  "title": "Video Title",
  "description": "Video description",
  "duration": "PT10M30S",
  "durationSeconds": 630,
  "thumbnail": "https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg",
  "channelTitle": "Channel Name",
  "publishedAt": "2024-01-15T10:00:00Z",
  "chapters": [
    {
      "title": "Introduction",
      "timestamp": "0:00",
      "seconds": 0
    },
    {
      "title": "Main Content",
      "timestamp": "2:30",
      "seconds": 150
    }
  ]
}
```

**Error Response:**
```json
{
  "valid": false,
  "error": "Invalid YouTube URL"
}
```

---

## Courses API

### List All Courses

**Endpoint:** `GET /api/admin/courses`

**Query Parameters:**
- `search` (optional): Search in title/description
- `difficulty` (optional): Filter by difficulty level
- `published` (optional): Filter by published status (`true`/`false`)

**Response:**
```json
{
  "courses": [
    {
      "id": "cuid123",
      "title": "Course Title",
      "description": "Description",
      "difficulty": "beginner",
      "topics": ["AI", "No-Code"],
      "thumbnail": "https://...",
      "order": 0,
      "published": true,
      "videoCount": 5,
      "createdAt": "2026-01-16T10:00:00Z",
      "updatedAt": "2026-01-16T10:00:00Z"
    }
  ]
}
```

### Create New Course

**Endpoint:** `POST /api/admin/courses`

**Request Body:**
```json
{
  "title": "New Course",
  "description": "Course description",
  "difficulty": "beginner",
  "topics": ["AI", "Development"],
  "thumbnail": "https://...",
  "published": false,
  "order": 0
}
```

**Response:**
```json
{
  "id": "new_course_id",
  "title": "New Course",
  "description": "Course description",
  "difficulty": "beginner",
  "topics": ["AI", "Development"],
  "thumbnail": "https://...",
  "published": false,
  "order": 0,
  "createdAt": "2026-01-17T10:00:00Z",
  "updatedAt": "2026-01-17T10:00:00Z"
}
```

### Get Single Course

**Endpoint:** `GET /api/admin/courses/[id]`

**Response:**
```json
{
  "id": "course_id",
  "title": "Course Title",
  "description": "Description",
  "difficulty": "beginner",
  "topics": ["AI"],
  "thumbnail": "https://...",
  "published": true,
  "order": 0,
  "videos": [
    {
      "id": "video_id",
      "title": "Video Title",
      "youtubeId": "youtube_id",
      "order": 0,
      "duration": 600
    }
  ],
  "createdAt": "2026-01-16T10:00:00Z",
  "updatedAt": "2026-01-16T10:00:00Z"
}
```

### Update Course

**Endpoint:** `PUT /api/admin/courses/[id]`

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "published": true
}
```

### Delete Course

**Endpoint:** `DELETE /api/admin/courses/[id]`

**Response:**
```json
{
  "message": "Course deleted successfully"
}
```

### Reorder Videos

**Endpoint:** `POST /api/admin/courses/[id]/reorder`

**Request Body:**
```json
{
  "videoIds": ["video_id_1", "video_id_2", "video_id_3"]
}
```

**Response:**
```json
{
  "message": "Videos reordered successfully"
}
```

---

## Videos API

### List All Videos

**Endpoint:** `GET /api/admin/videos`

**Query Parameters:**
- `courseId` (optional): Filter by course ID
- `search` (optional): Search in title/description

**Response:**
```json
{
  "videos": [
    {
      "id": "video_id",
      "title": "Video Title",
      "description": "Description",
      "youtubeId": "youtube_id",
      "duration": 600,
      "courseId": "course_id",
      "courseName": "Course Title",
      "order": 0,
      "hasTranscript": true,
      "chapterCount": 5,
      "createdAt": "2026-01-16T10:00:00Z",
      "updatedAt": "2026-01-16T10:00:00Z"
    }
  ]
}
```

### Create New Video

**Endpoint:** `POST /api/admin/videos`

**Request Body:**
```json
{
  "title": "Video Title",
  "description": "Description",
  "youtubeId": "youtube_id",
  "duration": 600,
  "courseId": "course_id",
  "order": 0,
  "chapters": [
    {
      "title": "Introduction",
      "startTime": 0,
      "endTime": 150
    },
    {
      "title": "Main Content",
      "startTime": 150,
      "endTime": 600
    }
  ]
}
```

**Response:**
```json
{
  "id": "new_video_id",
  "title": "Video Title",
  "youtubeId": "youtube_id",
  "chapters": [...]
}
```

### Get Single Video

**Endpoint:** `GET /api/admin/videos/[id]`

**Response:**
```json
{
  "id": "video_id",
  "title": "Video Title",
  "description": "Description",
  "youtubeId": "youtube_id",
  "duration": 600,
  "courseId": "course_id",
  "order": 0,
  "chapters": [
    {
      "id": "chapter_id",
      "title": "Introduction",
      "startTime": 0,
      "endTime": 150
    }
  ],
  "createdAt": "2026-01-16T10:00:00Z",
  "updatedAt": "2026-01-16T10:00:00Z"
}
```

### Update Video

**Endpoint:** `PUT /api/admin/videos/[id]`

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "chapters": [
    {
      "title": "New Chapter",
      "startTime": 0,
      "endTime": 100
    }
  ]
}
```

### Delete Video

**Endpoint:** `DELETE /api/admin/videos/[id]`

**Response:**
```json
{
  "message": "Video deleted successfully"
}
```

---

## Transcripts API

### Create Transcript

**Endpoint:** `POST /api/admin/transcripts`

**Request Body:**
```json
{
  "videoId": "video_id",
  "chunks": [
    {
      "text": "Transcript text segment",
      "startTime": 0,
      "endTime": 10,
      "metadata": {
        "speaker": "narrator"
      }
    }
  ]
}
```

**Response:**
```json
{
  "message": "Transcript created successfully",
  "chunkCount": 50
}
```

### Update Transcript

**Endpoint:** `PUT /api/admin/transcripts`

**Request Body:**
```json
{
  "videoId": "video_id",
  "chunks": [
    {
      "text": "Updated transcript text",
      "startTime": 0,
      "endTime": 10
    }
  ]
}
```

**Response:**
```json
{
  "message": "Transcript updated successfully",
  "chunkCount": 50
}
```

---

## Testing

### Manual Testing

Use tools like:
- **Postman**: Import collection from tests
- **cURL**: Command-line testing
- **Thunder Client** (VS Code): API testing extension

### Example cURL Request

```bash
# Create a course
curl -X POST http://localhost:3000/api/admin/courses \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "title": "Test Course",
    "description": "Test description",
    "difficulty": "beginner",
    "topics": ["test"],
    "published": false
  }'
```

### Test Script

Run the automated test script:

```bash
# Install dependencies first
npm install

# Run tests
tsx scripts/test-admin-api.ts
```

---

## Error Handling

All API routes follow consistent error response format:

```json
{
  "error": "Error message",
  "details": "Optional additional details"
}
```

### Common HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid session |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Unexpected server error |

---

## Environment Setup

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# YouTube API (optional - for validation)
YOUTUBE_API_KEY="your-api-key"

# Admin Credentials
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="secure-password"
```

---

## Implementation Files

### API Route Files

- `src/app/api/admin/youtube/validate/route.ts`
- `src/app/api/admin/courses/route.ts`
- `src/app/api/admin/courses/[id]/route.ts`
- `src/app/api/admin/courses/[id]/reorder/route.ts`
- `src/app/api/admin/videos/route.ts`
- `src/app/api/admin/videos/[id]/route.ts`
- `src/app/api/admin/transcripts/route.ts`

### Supporting Libraries

- `src/lib/auth.ts` - Authentication helpers
- `src/lib/youtube.ts` - YouTube integration
- `src/lib/prisma.ts` - Database client

---

## Related Documentation

- [Complete API Reference](../reference/README.md) - Auto-generated API docs
- [API Quick Reference](../quick-reference.md) - Quick endpoint overview
- [Database Schema](../../../prisma/schema.prisma) - Prisma schema
- [Admin Panel Guide](../../guides/admin-panel.md) - Admin UI documentation

---

## Questions or Issues?

- Check [Documentation Index](../../DOCUMENTATION_INDEX.md)
- Review [Architecture Overview](../../architecture/overview.md)
- Open an issue on GitHub

---

**Last Updated:** 2026-01-17
**Status:** ✅ All routes implemented and tested
