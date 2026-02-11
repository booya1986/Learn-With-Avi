# Admin API Reference

This document outlines the API routes needed for the admin panel. Use this as a reference when building the admin UI.

## Authentication

All admin API routes should check authentication using:

```typescript
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... rest of handler
}
```

## Course Management

### List All Courses (including unpublished)
```
GET /api/admin/courses
```

Response:
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

### Get Single Course
```
GET /api/admin/courses/[courseId]
```

Response:
```json
{
  "id": "cuid123",
  "title": "Course Title",
  "description": "Description",
  "difficulty": "beginner",
  "topics": ["AI", "No-Code"],
  "thumbnail": "https://...",
  "order": 0,
  "published": true,
  "videos": [
    {
      "id": "video123",
      "youtubeId": "abc123",
      "title": "Video Title",
      "order": 0,
      "published": true,
      "chapterCount": 5
    }
  ],
  "createdAt": "2026-01-16T10:00:00Z",
  "updatedAt": "2026-01-16T10:00:00Z"
}
```

### Create Course
```
POST /api/admin/courses
Content-Type: application/json

{
  "title": "New Course",
  "description": "Course description",
  "difficulty": "beginner",
  "topics": ["AI", "Automation"],
  "thumbnail": "https://...",
  "published": false
}
```

Response: Created course object with 201 status

### Update Course
```
PUT /api/admin/courses/[courseId]
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description",
  "difficulty": "intermediate",
  "topics": ["AI", "Advanced"],
  "thumbnail": "https://...",
  "published": true
}
```

Response: Updated course object

### Delete Course
```
DELETE /api/admin/courses/[courseId]
```

Response: 204 No Content (cascades to delete all videos)

### Reorder Courses
```
PATCH /api/admin/courses/reorder
Content-Type: application/json

{
  "courseIds": ["course1", "course2", "course3"]
}
```

Response: Updated courses with new order

## Video Management

### List All Videos
```
GET /api/admin/videos?courseId=optional
```

Response:
```json
{
  "videos": [
    {
      "id": "video123",
      "youtubeId": "abc123",
      "title": "Video Title",
      "description": "Description",
      "duration": 600,
      "thumbnail": "https://...",
      "topic": "AI",
      "tags": ["automation", "no-code"],
      "courseId": "course123",
      "courseName": "Course Title",
      "order": 0,
      "published": true,
      "hasTranscript": true,
      "chapterCount": 5,
      "createdAt": "2026-01-16T10:00:00Z"
    }
  ]
}
```

### Get Single Video
```
GET /api/admin/videos/[videoId]
```

Response:
```json
{
  "id": "video123",
  "youtubeId": "abc123",
  "title": "Video Title",
  "description": "Description",
  "duration": 600,
  "thumbnail": "https://...",
  "topic": "AI",
  "tags": ["automation"],
  "courseId": "course123",
  "order": 0,
  "published": true,
  "chapters": [
    {
      "id": "chapter123",
      "title": "Introduction",
      "startTime": 0,
      "endTime": 60,
      "order": 0
    }
  ],
  "transcript": {
    "id": "transcript123",
    "source": "youtube",
    "language": "he",
    "chunkCount": 50
  },
  "createdAt": "2026-01-16T10:00:00Z"
}
```

### Create Video
```
POST /api/admin/videos
Content-Type: application/json

{
  "youtubeId": "dQw4w9WgXcQ",
  "title": "Video Title",
  "description": "Description",
  "courseId": "course123",
  "topic": "AI",
  "tags": ["automation", "no-code"],
  "published": false
}
```

Response: Created video object with 201 status

Note: Duration and thumbnail auto-fetched from YouTube

### Update Video
```
PUT /api/admin/videos/[videoId]
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description",
  "courseId": "course123",
  "topic": "AI",
  "tags": ["updated"],
  "published": true
}
```

Response: Updated video object

### Delete Video
```
DELETE /api/admin/videos/[videoId]
```

Response: 204 No Content (cascades to delete chapters and transcript)

### Reorder Videos
```
PATCH /api/admin/videos/reorder
Content-Type: application/json

{
  "courseId": "course123",
  "videoIds": ["video1", "video2", "video3"]
}
```

Response: Updated videos with new order

### Import from YouTube
```
POST /api/admin/videos/import
Content-Type: application/json

{
  "youtubeId": "dQw4w9WgXcQ",
  "courseId": "course123",
  "importTranscript": true,
  "importChapters": true
}
```

Response:
```json
{
  "video": { /* created video object */ },
  "transcript": { /* transcript if imported */ },
  "chapters": [ /* chapters if imported */ ]
}
```

## Chapter Management

### List Chapters for Video
```
GET /api/admin/videos/[videoId]/chapters
```

Response:
```json
{
  "chapters": [
    {
      "id": "chapter123",
      "videoId": "video123",
      "title": "Introduction",
      "startTime": 0,
      "endTime": 60,
      "order": 0
    }
  ]
}
```

### Create Chapter
```
POST /api/admin/videos/[videoId]/chapters
Content-Type: application/json

{
  "title": "New Chapter",
  "startTime": 60,
  "endTime": 120
}
```

Response: Created chapter object

### Update Chapter
```
PUT /api/admin/chapters/[chapterId]
Content-Type: application/json

{
  "title": "Updated Chapter",
  "startTime": 60,
  "endTime": 130
}
```

Response: Updated chapter object

### Delete Chapter
```
DELETE /api/admin/chapters/[chapterId]
```

Response: 204 No Content

### Reorder Chapters
```
PATCH /api/admin/videos/[videoId]/chapters/reorder
Content-Type: application/json

{
  "chapterIds": ["chapter1", "chapter2", "chapter3"]
}
```

Response: Updated chapters with new order

## Transcript Management

### Get Transcript for Video
```
GET /api/admin/videos/[videoId]/transcript
```

Response:
```json
{
  "id": "transcript123",
  "videoId": "video123",
  "source": "youtube",
  "language": "he",
  "chunks": [
    {
      "id": "chunk123",
      "text": "שלום, ברוכים הבאים לסרטון",
      "startTime": 0,
      "endTime": 3,
      "order": 0
    }
  ],
  "createdAt": "2026-01-16T10:00:00Z"
}
```

### Create/Update Transcript
```
POST /api/admin/videos/[videoId]/transcript
Content-Type: application/json

{
  "source": "manual",
  "language": "he",
  "chunks": [
    {
      "text": "Text chunk 1",
      "startTime": 0,
      "endTime": 5
    },
    {
      "text": "Text chunk 2",
      "startTime": 5,
      "endTime": 10
    }
  ]
}
```

Response: Created/updated transcript object

### Import Transcript from YouTube
```
POST /api/admin/videos/[videoId]/transcript/import
Content-Type: application/json

{
  "language": "he"
}
```

Response: Imported transcript object

### Transcribe with Whisper
```
POST /api/admin/videos/[videoId]/transcript/whisper
Content-Type: application/json

{
  "language": "he"
}
```

Response: Transcribed transcript object

Note: This downloads audio from YouTube and transcribes with OpenAI Whisper

### Delete Transcript
```
DELETE /api/admin/videos/[videoId]/transcript
```

Response: 204 No Content (cascades to delete all chunks)

## Admin User Management

### List Admins
```
GET /api/admin/users
```

Response:
```json
{
  "admins": [
    {
      "id": "admin123",
      "email": "admin@learnwithavi.com",
      "name": "Admin User",
      "createdAt": "2026-01-16T10:00:00Z",
      "lastLogin": "2026-01-16T12:00:00Z"
    }
  ]
}
```

### Create Admin
```
POST /api/admin/users
Content-Type: application/json

{
  "email": "new-admin@learnwithavi.com",
  "password": "secure-password",
  "name": "New Admin"
}
```

Response: Created admin object (without passwordHash)

### Update Admin
```
PUT /api/admin/users/[adminId]
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "updated@learnwithavi.com"
}
```

Response: Updated admin object

### Change Password
```
PATCH /api/admin/users/[adminId]/password
Content-Type: application/json

{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

Response: 204 No Content

### Delete Admin
```
DELETE /api/admin/users/[adminId]
```

Response: 204 No Content

## Analytics & Stats

### Dashboard Stats
```
GET /api/admin/stats
```

Response:
```json
{
  "totalCourses": 5,
  "totalVideos": 25,
  "totalTranscripts": 20,
  "publishedCourses": 4,
  "publishedVideos": 22,
  "recentVideos": [ /* 5 most recent videos */ ],
  "coursesWithoutVideos": [ /* courses with 0 videos */ ],
  "videosWithoutTranscripts": [ /* videos missing transcripts */ ]
}
```

### Course Analytics
```
GET /api/admin/courses/[courseId]/analytics
```

Response:
```json
{
  "courseId": "course123",
  "videoCount": 10,
  "totalDuration": 3600,
  "avgDuration": 360,
  "transcriptCoverage": 0.8,
  "publishedVideos": 8,
  "draftVideos": 2
}
```

## Error Responses

All endpoints return consistent error format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* optional additional context */ }
  }
}
```

Common status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Unprocessable Entity (invalid input)
- `500` - Internal Server Error

## Validation

Use Zod for request validation:

```typescript
import { z } from 'zod';

const CreateCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  topics: z.array(z.string()).min(1).max(10),
  thumbnail: z.string().url().optional(),
  published: z.boolean().default(false),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const validated = CreateCourseSchema.parse(body);

    const course = await prisma.course.create({
      data: {
        ...validated,
        order: 0,
      },
    });

    return Response.json(course, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.errors,
        },
      }, { status: 422 });
    }
    throw error;
  }
}
```

## Rate Limiting

Consider adding rate limiting to admin API routes:

```typescript
import rateLimit from '@/lib/rate-limit';

export async function POST(request: Request) {
  // Check rate limit
  const rateLimitResult = await rateLimit(request);
  if (!rateLimitResult.success) {
    return Response.json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
      },
    }, { status: 429 });
  }

  // ... rest of handler
}
```

## Testing

Example API test with Jest/Vitest:

```typescript
import { POST } from '@/app/api/admin/courses/route';

describe('POST /api/admin/courses', () => {
  it('should create course when authenticated', async () => {
    const request = new Request('http://localhost:3000/api/admin/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Course',
        description: 'Test description',
        difficulty: 'beginner',
        topics: ['AI'],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('id');
    expect(data.title).toBe('Test Course');
  });

  it('should return 401 when not authenticated', async () => {
    // Mock no session
    const response = await POST(mockRequest);
    expect(response.status).toBe(401);
  });
});
```

## Next Steps

1. Create the API routes following these specifications
2. Add request validation with Zod
3. Implement error handling
4. Add rate limiting for security
5. Write tests for critical endpoints
6. Build the admin UI to consume these APIs

All database models and relationships are already set up in Prisma, so you can start implementing these routes immediately.
