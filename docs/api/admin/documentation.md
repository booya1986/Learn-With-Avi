# Admin API Documentation

Complete documentation for all admin panel API routes.

## Table of Contents

1. [Authentication](#authentication)
2. [YouTube Integration](#youtube-integration)
3. [Courses API](#courses-api)
4. [Videos API](#videos-api)
5. [Transcripts API](#transcripts-api)
6. [Testing](#testing)
7. [Environment Setup](#environment-setup)

---

## Authentication

All admin API routes require authentication via NextAuth session.

### How It Works

1. Admin logs in via `/admin/login` page
2. NextAuth creates a session cookie
3. All API routes validate session using `getServerSession(authOptions)`
4. Unauthorized requests return `401 Unauthorized`

### Protected Route Example

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const session = await getServerSession(authOptions);
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## YouTube Integration

### Extract & Validate YouTube Videos

**Endpoint:** `POST /api/admin/youtube/validate`

**File:** `/src/app/api/admin/youtube/validate/route.ts`

**Purpose:** Validate YouTube URLs and fetch video metadata

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response (Success):**
```json
{
  "valid": true,
  "metadata": {
    "id": "VIDEO_ID",
    "title": "Video Title",
    "description": "Video description...",
    "thumbnail": "https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg",
    "duration": 3600,
    "channelTitle": "Channel Name",
    "publishedAt": "2025-01-16T00:00:00Z"
  }
}
```

**Response (Error):**
```json
{
  "error": "Video not found or is private"
}
```

**Supported URL Formats:**
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://www.youtube.com/v/VIDEO_ID`
- Direct video ID: `VIDEO_ID`

---

## Courses API

### List All Courses

**Endpoint:** `GET /api/admin/courses`

**File:** `/src/app/api/admin/courses/route.ts`

**Query Parameters:**
- `search` (string): Filter by title (case-insensitive)
- `published` (boolean): Filter by published status

**Example:**
```
GET /api/admin/courses?search=python&published=true
```

**Response:**
```json
[
  {
    "id": "course-id-1",
    "title": "Python Basics",
    "description": "Learn Python programming",
    "difficulty": "beginner",
    "topics": ["programming", "python"],
    "thumbnail": "https://...",
    "order": 0,
    "published": true,
    "createdAt": "2025-01-16T...",
    "updatedAt": "2025-01-16T...",
    "_count": {
      "videos": 10
    }
  }
]
```

---

### Create Course

**Endpoint:** `POST /api/admin/courses`

**Request:**
```json
{
  "title": "Course Title",
  "description": "Course description",
  "difficulty": "beginner",
  "topics": ["topic1", "topic2"],
  "thumbnail": "https://...",
  "published": false
}
```

**Validation Rules:**
- `title`: Required, 1-200 characters
- `description`: Optional, default: empty string
- `difficulty`: Enum: `beginner` | `intermediate` | `advanced`
- `topics`: Array of strings, default: empty array
- `thumbnail`: String, default: empty string
- `published`: Boolean, default: false

**Response:**
```json
{
  "id": "new-course-id",
  "title": "Course Title",
  "description": "Course description",
  "difficulty": "beginner",
  "topics": ["topic1", "topic2"],
  "thumbnail": "https://...",
  "order": 0,
  "published": false,
  "createdAt": "2025-01-16T...",
  "updatedAt": "2025-01-16T...",
  "_count": {
    "videos": 0
  }
}
```

---

### Get Single Course

**Endpoint:** `GET /api/admin/courses/[id]`

**File:** `/src/app/api/admin/courses/[id]/route.ts`

**Response:**
```json
{
  "id": "course-id",
  "title": "Course Title",
  "description": "...",
  "difficulty": "beginner",
  "videos": [
    {
      "id": "video-id",
      "title": "Video Title",
      "youtubeId": "VIDEO_ID",
      "duration": 3600,
      "order": 0,
      "chapters": [
        {
          "id": "chapter-id",
          "title": "Introduction",
          "startTime": 0,
          "endTime": 120,
          "order": 0
        }
      ]
    }
  ]
}
```

---

### Update Course

**Endpoint:** `PUT /api/admin/courses/[id]`

**Request (all fields optional):**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "difficulty": "intermediate",
  "topics": ["new-topic"],
  "thumbnail": "https://...",
  "published": true,
  "order": 1
}
```

**Response:** Updated course object

**Status Codes:**
- `200`: Success
- `400`: Validation failed or no fields to update
- `404`: Course not found

---

### Delete Course

**Endpoint:** `DELETE /api/admin/courses/[id]`

**Warning:** Deletes course and all related videos, chapters, transcripts (CASCADE)

**Response:**
```json
{
  "success": true,
  "message": "Course deleted successfully",
  "deletedVideoCount": 5
}
```

---

### Reorder Videos in Course

**Endpoint:** `POST /api/admin/courses/[id]/reorder`

**File:** `/src/app/api/admin/courses/[id]/reorder/route.ts`

**Request:**
```json
{
  "videoIds": ["video-id-1", "video-id-2", "video-id-3"]
}
```

**Notes:**
- Order in array determines new order (index 0 = order 0)
- All video IDs must belong to the specified course
- No duplicate IDs allowed

**Response:**
```json
{
  "success": true,
  "message": "Videos reordered successfully",
  "updatedCount": 3
}
```

---

## Videos API

### List All Videos

**Endpoint:** `GET /api/admin/videos`

**File:** `/src/app/api/admin/videos/route.ts`

**Query Parameters:**
- `search` (string): Filter by title
- `courseId` (string): Filter by course
- `published` (boolean): Filter by published status

**Example:**
```
GET /api/admin/videos?courseId=course-id&published=true
```

**Response:**
```json
[
  {
    "id": "video-id",
    "youtubeId": "VIDEO_ID",
    "title": "Video Title",
    "description": "...",
    "duration": 3600,
    "thumbnail": "https://...",
    "topic": "Topic Name",
    "tags": ["tag1", "tag2"],
    "order": 0,
    "published": true,
    "createdAt": "2025-01-16T...",
    "updatedAt": "2025-01-16T...",
    "course": {
      "id": "course-id",
      "title": "Course Title"
    }
  }
]
```

---

### Create Video

**Endpoint:** `POST /api/admin/videos`

**Request:**
```json
{
  "youtubeId": "VIDEO_ID",
  "title": "Video Title",
  "description": "Video description",
  "duration": 3600,
  "thumbnail": "https://...",
  "topic": "Topic name",
  "tags": ["tag1", "tag2"],
  "courseId": "course-id",
  "published": false,
  "chapters": [
    {
      "title": "Introduction",
      "startTime": 0,
      "endTime": 120,
      "order": 0
    },
    {
      "title": "Main Content",
      "startTime": 120,
      "endTime": 3600,
      "order": 1
    }
  ]
}
```

**Validation Rules:**
- `youtubeId`: Required, exactly 11 characters, must be unique
- `title`: Required, 1-200 characters
- `description`: Optional, default: empty string
- `duration`: Required, integer > 0 (in seconds)
- `thumbnail`: Optional, default: empty string
- `topic`: Optional, default: empty string
- `tags`: Array of strings, default: empty array
- `courseId`: Required, must reference existing course
- `published`: Boolean, default: false
- `chapters`: Array of chapter objects, default: empty array

**Chapter Schema:**
```typescript
{
  title: string;      // Required, min 1 character
  startTime: number;  // Required, integer >= 0
  endTime: number;    // Required, integer >= 0
  order: number;      // Required, integer >= 0
}
```

**Response:**
```json
{
  "id": "new-video-id",
  "youtubeId": "VIDEO_ID",
  "title": "Video Title",
  "chapters": [...],
  "course": {
    "id": "course-id",
    "title": "Course Title"
  }
}
```

**Status Codes:**
- `201`: Created successfully
- `400`: Validation failed
- `404`: Course not found
- `409`: YouTube ID already exists

---

### Get Single Video

**Endpoint:** `GET /api/admin/videos/[id]`

**File:** `/src/app/api/admin/videos/[id]/route.ts`

**Response:**
```json
{
  "id": "video-id",
  "youtubeId": "VIDEO_ID",
  "title": "Video Title",
  "description": "...",
  "duration": 3600,
  "thumbnail": "https://...",
  "topic": "Topic",
  "tags": ["tag1", "tag2"],
  "order": 0,
  "published": true,
  "chapters": [
    {
      "id": "chapter-id",
      "title": "Introduction",
      "startTime": 0,
      "endTime": 120,
      "order": 0
    }
  ],
  "course": {
    "id": "course-id",
    "title": "Course Title",
    "difficulty": "beginner"
  },
  "transcript": {
    "id": "transcript-id",
    "source": "youtube",
    "language": "he"
  }
}
```

---

### Update Video

**Endpoint:** `PUT /api/admin/videos/[id]`

**Request (all fields optional):**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "duration": 3700,
  "thumbnail": "https://...",
  "topic": "Updated Topic",
  "tags": ["new-tag"],
  "courseId": "new-course-id",
  "published": true,
  "order": 1,
  "chapters": [
    {
      "title": "New Chapter",
      "startTime": 0,
      "endTime": 100,
      "order": 0
    }
  ]
}
```

**Important:** If `chapters` array is provided, ALL existing chapters will be REPLACED.

**Response:** Updated video object with chapters and course info

---

### Delete Video

**Endpoint:** `DELETE /api/admin/videos/[id]`

**Warning:** Deletes video and all related chapters, transcript, transcript chunks (CASCADE)

**Response:**
```json
{
  "success": true,
  "message": "Video deleted successfully",
  "deletedChapters": 5,
  "hadTranscript": true
}
```

---

## Transcripts API

### Create Transcript

**Endpoint:** `POST /api/admin/transcripts`

**File:** `/src/app/api/admin/transcripts/route.ts`

**Purpose:** Add transcript with time-stamped chunks for semantic search and captions

**Request:**
```json
{
  "videoId": "video-id",
  "source": "youtube",
  "language": "he",
  "chunks": [
    {
      "text": "Hello, welcome to this video",
      "startTime": 0,
      "endTime": 3,
      "order": 0
    },
    {
      "text": "Today we'll learn about...",
      "startTime": 3,
      "endTime": 7,
      "order": 1
    }
  ]
}
```

**Validation Rules:**
- `videoId`: Required, must reference existing video
- `source`: Enum: `youtube` | `manual` | `whisper`, default: `manual`
- `language`: String (ISO language code), default: `he`
- `chunks`: Array of chunk objects, minimum 1 chunk required

**Chunk Schema:**
```typescript
{
  text: string;       // Required, min 1 character
  startTime: number;  // Required, integer >= 0 (seconds)
  endTime: number;    // Required, integer >= 0 (seconds)
  order: number;      // Required, integer >= 0
}
```

**Response:**
```json
{
  "id": "transcript-id",
  "videoId": "video-id",
  "source": "youtube",
  "language": "he",
  "createdAt": "2025-01-16T...",
  "updatedAt": "2025-01-16T...",
  "chunks": [
    {
      "id": "chunk-id",
      "text": "Hello, welcome to this video",
      "startTime": 0,
      "endTime": 3,
      "order": 0
    }
  ]
}
```

**Status Codes:**
- `201`: Created successfully
- `400`: Validation failed
- `404`: Video not found
- `409`: Transcript already exists for this video

---

### Update Transcript

**Endpoint:** `PUT /api/admin/transcripts`

**Request (all fields optional except transcriptId):**
```json
{
  "transcriptId": "transcript-id",
  "source": "manual",
  "language": "en",
  "chunks": [
    {
      "text": "Updated text",
      "startTime": 0,
      "endTime": 3,
      "order": 0
    }
  ]
}
```

**Important:** If `chunks` array is provided, ALL existing chunks will be REPLACED.

**Response:** Updated transcript object with chunks

---

## Testing

### Manual Testing with curl

```bash
# 1. Login (get session cookie)
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@learnwithavi.com","password":"admin123"}' \
  -c cookies.txt

# 2. Validate YouTube URL
curl -X POST http://localhost:3000/api/admin/youtube/validate \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"url":"https://youtube.com/watch?v=dQw4w9WgXcQ"}'

# 3. Create Course
curl -X POST http://localhost:3000/api/admin/courses \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Test Course",
    "description": "Test description",
    "difficulty": "beginner",
    "topics": ["testing"]
  }'

# 4. List Courses
curl http://localhost:3000/api/admin/courses \
  -b cookies.txt

# 5. Create Video
curl -X POST http://localhost:3000/api/admin/videos \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "youtubeId": "dQw4w9WgXcQ",
    "title": "Test Video",
    "duration": 212,
    "courseId": "COURSE_ID_HERE",
    "chapters": [
      {
        "title": "Intro",
        "startTime": 0,
        "endTime": 60,
        "order": 0
      }
    ]
  }'
```

### Automated Testing

Run the automated test script:

```bash
# 1. Make sure dev server is running
npm run dev

# 2. Login to admin panel in browser first (to get session cookie)
# Open: http://localhost:3000/admin/login

# 3. Run test script
tsx scripts/test-admin-api.ts
```

**Note:** The test script requires manual login because NextAuth uses HTTP-only cookies for security.

---

## Environment Setup

### Required Environment Variables

Add to `.env.local`:

```bash
# Database (REQUIRED)
DATABASE_URL=postgresql://user:password@localhost:5432/learnwithavi

# NextAuth (REQUIRED)
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# YouTube API (OPTIONAL - for video validation)
YOUTUBE_API_KEY=your-youtube-api-key

# Other APIs (OPTIONAL)
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
```

### Getting YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **YouTube Data API v3**
4. Create credentials (API Key)
5. Restrict key to YouTube Data API v3 (recommended)
6. Add to `.env.local`

### Database Setup

```bash
# 1. Generate Prisma client
npm run db:generate

# 2. Push schema to database
npm run db:push

# 3. Seed admin user (optional)
npm run db:seed
```

---

## Error Handling

All API routes follow consistent error response format:

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

### Common Status Codes

- `200`: Success
- `201`: Resource created
- `400`: Bad request / Validation failed
- `401`: Unauthorized (not logged in)
- `404`: Resource not found
- `409`: Conflict (duplicate resource)
- `500`: Internal server error

---

## File Structure

```
src/app/api/admin/
├── youtube/
│   └── validate/
│       └── route.ts         # YouTube validation API
├── courses/
│   ├── route.ts             # List & create courses
│   └── [id]/
│       ├── route.ts         # CRUD single course
│       └── reorder/
│           └── route.ts     # Reorder videos
├── videos/
│   ├── route.ts             # List & create videos
│   └── [id]/
│       └── route.ts         # CRUD single video
└── transcripts/
    └── route.ts             # Create & update transcripts

src/lib/
└── youtube.ts               # YouTube integration utilities
```

---

## Security Considerations

1. **Authentication:** All routes require valid admin session
2. **Input Validation:** Zod schemas validate all request bodies
3. **SQL Injection:** Prisma ORM prevents SQL injection
4. **Error Sanitization:** No sensitive data in error messages
5. **API Key Security:** YouTube API key never exposed to client
6. **CORS:** Configure CORS for production deployment

---

## Next Steps

1. Test all API endpoints with Postman or curl
2. Build admin UI components that consume these APIs
3. Add rate limiting for production
4. Set up monitoring and logging
5. Add API documentation with Swagger/OpenAPI

---

## Support

For issues or questions:
- Check error messages in console logs
- Verify environment variables are set
- Ensure database is running and migrated
- Check authentication status

---

**Created:** 2025-01-16
**Version:** 1.0
**Author:** Backend Engineer - LearnWithAvi
