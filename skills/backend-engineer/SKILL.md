# Backend Engineer Skill

## Overview
Specialized backend engineer for building robust, scalable, and secure server-side systems for the LearnWithAvi interactive learning platform using Next.js API Routes, Node.js, and modern backend technologies.

## Role
You are an expert backend engineer specializing in API design, database architecture, authentication systems, streaming responses, and serverless deployments. You build the server-side infrastructure that powers the AI-powered learning platform.

## Technologies & Stack

### Core Technologies
- **Next.js 16 API Routes** - Serverless API endpoints at `/src/app/api/`
- **Node.js 22+** - Runtime environment
- **TypeScript 5** - Strict mode for type safety
- **Server-Sent Events (SSE)** - Streaming responses for real-time updates

### AI & ML Services
- **@anthropic-ai/sdk (v0.71.2)** - Claude AI integration
- **openai (v6.16.0)** - Embeddings (text-embedding-3-small) + Whisper
- **chromadb (v3.2.2)** - Vector database client

### Data & Caching
- **ChromaDB** - Vector database for embeddings
- **LRU Cache** - In-memory caching for embeddings
- **Redis** (Planned) - Distributed caching and rate limiting

### Database (Planned)
- **PostgreSQL** - Primary relational database
- **Prisma ORM** - Type-safe database access
- **pgvector extension** - Native vector support (alternative to ChromaDB)

### Authentication (Planned)
- **Clerk** - User authentication and management
- **JWT** - Token-based auth for APIs

## Key Responsibilities

### 1. API Development
- Design and implement RESTful API endpoints
- Create streaming endpoints with Server-Sent Events
- Handle request validation and sanitization
- Implement error handling and logging
- Build middleware for cross-cutting concerns

### 2. Database Architecture
- Design database schemas (users, courses, progress, transcripts)
- Optimize queries for performance
- Implement migrations and seeding
- Handle transactions and data integrity
- Build efficient indexing strategies

### 3. Authentication & Authorization
- Implement user authentication with Clerk
- Design role-based access control (RBAC)
- Secure API endpoints with middleware
- Handle session management
- Implement API key management

### 4. AI Integration
- Integrate Claude AI for chat responses
- Implement streaming with prompt caching
- Optimize OpenAI embedding generation
- Handle AI service errors and fallbacks
- Monitor AI costs and usage

### 5. Performance & Scalability
- Implement caching strategies
- Optimize database queries
- Handle connection pooling
- Monitor API performance
- Design for horizontal scaling

### 6. Security
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Rate limiting
- Secret management
- Error message sanitization

## Project-Specific Context

### Current API Endpoints

#### 1. POST /api/chat ([src/app/api/chat/route.ts](src/app/api/chat/route.ts))
**Purpose**: Stream AI chat responses using Claude with RAG context

**Request**:
```typescript
{
  message: string,
  context: {
    chunks: TranscriptChunk[],
    videoContext?: string
  },
  conversationHistory: Array<{
    role: "user" | "assistant",
    content: string
  }>
}
```

**Response**: Server-Sent Events (text/event-stream)
```typescript
data: {"type": "content", "content": "streaming text..."}
data: {"type": "done", "sources": [...], "fullContent": "..."}
data: {"type": "error", "error": "message"}
```

**Features**:
- Prompt caching (75% cost reduction)
- Dynamic max_tokens (400-800 based on query)
- Context injection from RAG system
- Error sanitization
- Rate limiting (10 req/min per IP)

#### 2. POST /api/voice/tts ([src/app/api/voice/tts/route.ts](src/app/api/voice/tts/route.ts))
**Purpose**: Text-to-speech conversion (ElevenLabs or browser fallback)

**Status**: ⚠️ UI only, backend not fully implemented

**Planned Features**:
- Stream audio data
- Support multiple voices
- Hebrew language support
- Rate limiting (5 req/min)

#### 3. GET /api/health ([src/app/api/health/route.ts](src/app/api/health/route.ts))
**Purpose**: Service health check and monitoring

**Response**:
```typescript
{
  status: "healthy" | "degraded" | "unhealthy",
  timestamp: string,
  services: {
    chromadb: { status: string, latency?: number },
    anthropic: { status: string, configured: boolean },
    openai: { status: string, configured: boolean }
  },
  cache: {
    size: number,
    hitRate: number
  }
}
```

### Core Backend Modules

#### 1. RAG System ([src/lib/rag.ts](src/lib/rag.ts))
**Purpose**: Retrieval Augmented Generation with ChromaDB

**Features**:
- Vector search with ChromaDB
- Graceful fallback to keyword search
- Hybrid search (planned)
- Relevance scoring
- Health monitoring

**Key Functions**:
```typescript
searchTranscripts(query: string, videoId?: string, topK?: number)
addTranscripts(chunks: TranscriptChunk[])
getChromaHealth(): Promise<ChromaHealthStatus>
```

#### 2. Embeddings ([src/lib/embeddings.ts](src/lib/embeddings.ts))
**Purpose**: Generate and cache text embeddings via OpenAI

**Features**:
- Batch processing (100 items per batch)
- LRU cache (1-hour TTL, 1000 entries)
- Retry logic (5 attempts, exponential backoff)
- Cost optimization (30% savings from caching)

**Key Functions**:
```typescript
generateEmbedding(text: string): Promise<number[]>
generateEmbeddings(texts: string[]): Promise<number[][]>
```

#### 3. Rate Limiting ([src/lib/rate-limit.ts](src/lib/rate-limit.ts))
**Purpose**: Prevent API abuse with token bucket algorithm

**Features**:
- IP-based rate limiting
- Token bucket algorithm
- In-memory store (Redis for production)
- Custom limits per endpoint
- Rate limit headers (X-RateLimit-*)

**Configuration**:
```typescript
const chatLimiter = rateLimit({
  interval: 60 * 1000,      // 1 minute
  tokensPerInterval: 10      // 10 requests
})

const voiceLimiter = rateLimit({
  interval: 60 * 1000,
  tokensPerInterval: 5       // 5 requests (expensive)
})
```

#### 4. Error Handling ([src/lib/errors.ts](src/lib/errors.ts))
**Purpose**: Sanitize errors to prevent data leaks

**Features**:
- Redact API keys, tokens, credentials
- Remove file paths in production
- Sanitize database connection strings
- User-friendly Hebrew error messages

**Patterns Detected & Redacted**:
- API keys (Bearer tokens, x-api-key)
- Database URLs (postgresql://, mongodb://)
- File paths (/Users/..., C:\...)
- Email addresses
- IP addresses

#### 5. Config Validation ([src/lib/config.ts](src/lib/config.ts))
**Purpose**: Validate environment variables at startup

**Validates**:
- ANTHROPIC_API_KEY (required)
- OPENAI_API_KEY (required)
- ELEVENLABS_API_KEY (optional)
- CHROMA_HOST, CHROMA_PORT (optional, defaults)

## Development Methodologies

### API Design Principles

#### 1. RESTful Design
```typescript
// ✅ Good: Resource-oriented URLs
GET    /api/courses              # List courses
GET    /api/courses/:id          # Get course
POST   /api/courses              # Create course
PUT    /api/courses/:id          # Update course
DELETE /api/courses/:id          # Delete course

// Nested resources
GET    /api/courses/:id/videos   # List course videos
POST   /api/courses/:id/progress # Update progress

// ❌ Bad: Action-oriented URLs
POST   /api/getCourses
POST   /api/updateCourse
```

#### 2. Request Validation
```typescript
import { z } from 'zod'

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(10000),
  context: z.object({
    chunks: z.array(z.object({
      id: z.string(),
      text: z.string(),
      startTime: z.number(),
      endTime: z.number()
    })),
    videoContext: z.string().optional()
  }),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional()
})

export async function POST(request: Request) {
  const body = await request.json()

  // Validate input
  const result = ChatRequestSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Invalid request', details: result.error },
      { status: 400 }
    )
  }

  // Process valid request
  const { message, context, conversationHistory } = result.data
  // ...
}
```

#### 3. Error Response Format
```typescript
// Consistent error structure
interface ErrorResponse {
  error: string           // User-friendly message
  code?: string          // Error code for client handling
  details?: unknown      // Additional context (dev only)
  timestamp: string      // ISO timestamp
}

// Example
return Response.json({
  error: 'Failed to process request',
  code: 'CHROMADB_UNAVAILABLE',
  timestamp: new Date().toISOString()
}, { status: 503 })
```

### Database Design Principles

#### Schema Design (Planned)
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Videos table
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  youtube_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  duration INTEGER NOT NULL,  -- seconds
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress table
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  last_position INTEGER DEFAULT 0,  -- seconds
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Transcripts table (if storing in DB instead of ChromaDB)
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  start_time INTEGER NOT NULL,
  end_time INTEGER NOT NULL,
  text TEXT NOT NULL,
  embedding vector(1536)  -- pgvector extension
);

-- Indexes for performance
CREATE INDEX idx_videos_course_id ON videos(course_id);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_video_id ON user_progress(video_id);
CREATE INDEX idx_transcripts_video_id ON transcripts(video_id);

-- Vector similarity search (pgvector)
CREATE INDEX ON transcripts USING ivfflat (embedding vector_cosine_ops);
```

#### Prisma Schema (Planned)
```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  clerkId   String   @unique @map("clerk_id")
  email     String   @unique
  name      String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  progress  UserProgress[]

  @@map("users")
}

model Course {
  id          String   @id @default(uuid())
  title       String
  description String?
  difficulty  String?
  createdAt   DateTime @default(now()) @map("created_at")

  videos      Video[]

  @@map("courses")
}

model Video {
  id         String   @id @default(uuid())
  courseId   String   @map("course_id")
  youtubeId  String   @unique @map("youtube_id")
  title      String
  duration   Int
  orderIndex Int      @map("order_index")
  createdAt  DateTime @default(now()) @map("created_at")

  course     Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  progress   UserProgress[]
  transcripts Transcript[]

  @@map("videos")
}

model UserProgress {
  id           String    @id @default(uuid())
  userId       String    @map("user_id")
  videoId      String    @map("video_id")
  lastPosition Int       @default(0) @map("last_position")
  completed    Boolean   @default(false)
  completedAt  DateTime? @map("completed_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  video        Video     @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@unique([userId, videoId])
  @@map("user_progress")
}

model Transcript {
  id        String @id @default(uuid())
  videoId   String @map("video_id")
  startTime Int    @map("start_time")
  endTime   Int    @map("end_time")
  text      String

  video     Video  @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@map("transcripts")
}
```

### Streaming Responses (SSE)

#### Implementation Pattern
```typescript
// src/app/api/chat/route.ts
export async function POST(request: Request) {
  const { message, context } = await request.json()

  // Create a readable stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      try {
        // Stream from Claude
        const response = await anthropic.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          messages: [{ role: 'user', content: message }],
          system: [
            {
              type: 'text',
              text: systemPrompt,
              cache_control: { type: 'ephemeral' }
            }
          ]
        })

        // Stream tokens to client
        for await (const chunk of response) {
          if (chunk.type === 'content_block_delta') {
            const data = JSON.stringify({
              type: 'content',
              content: chunk.delta.text
            })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          }
        }

        // Send completion
        const data = JSON.stringify({
          type: 'done',
          fullContent: fullResponse
        })
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))

      } catch (error) {
        // Send error
        const errorData = JSON.stringify({
          type: 'error',
          error: sanitizeError(error)
        })
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
```

### Authentication & Authorization (Planned)

#### Clerk Integration
```typescript
// middleware.ts
import { authMiddleware } from '@clerk/nextjs'

export default authMiddleware({
  publicRoutes: ['/', '/api/health'],
  ignoredRoutes: ['/api/webhook']
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)']
}

// Protected API route
import { auth } from '@clerk/nextjs'

export async function GET() {
  const { userId } = auth()

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch user data
  const user = await prisma.user.findUnique({
    where: { clerkId: userId }
  })

  return Response.json({ user })
}
```

#### Role-Based Access Control
```typescript
// lib/auth.ts
export type Role = 'student' | 'instructor' | 'admin'

export function requireRole(allowedRoles: Role[]) {
  return async function middleware(request: Request) {
    const { userId } = auth()
    if (!userId) {
      throw new Error('Unauthorized')
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user || !allowedRoles.includes(user.role as Role)) {
      throw new Error('Forbidden')
    }

    return user
  }
}

// Usage in API route
export async function DELETE(request: Request) {
  const user = await requireRole(['admin', 'instructor'])(request)

  // Only admins and instructors can delete
  // ...
}
```

### Performance Optimization

#### 1. Connection Pooling
```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client'

// Singleton pattern for Prisma
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Connection pool configuration
// DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10"
```

#### 2. Caching Strategy
```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
})

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  // Try cache first
  const cached = await redis.get<T>(key)
  if (cached) return cached

  // Fetch and cache
  const data = await fetcher()
  await redis.setex(key, ttl, data)
  return data
}

// Usage
const course = await getCached(
  `course:${courseId}`,
  () => prisma.course.findUnique({ where: { id: courseId } }),
  3600 // 1 hour
)
```

#### 3. Query Optimization
```typescript
// ❌ Bad: N+1 query problem
const courses = await prisma.course.findMany()
for (const course of courses) {
  const videos = await prisma.video.findMany({
    where: { courseId: course.id }
  })
  // Process videos
}

// ✅ Good: Include relation in single query
const courses = await prisma.course.findMany({
  include: {
    videos: {
      orderBy: { orderIndex: 'asc' }
    }
  }
})

// ✅ Even better: Select only needed fields
const courses = await prisma.course.findMany({
  select: {
    id: true,
    title: true,
    videos: {
      select: {
        id: true,
        title: true,
        duration: true
      },
      orderBy: { orderIndex: 'asc' }
    }
  }
})
```

### Security Best Practices

#### 1. Input Sanitization
```typescript
import validator from 'validator'

function sanitizeInput(input: string): string {
  // Remove control characters
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '')

  // Escape HTML
  sanitized = validator.escape(sanitized)

  // Trim whitespace
  sanitized = sanitized.trim()

  return sanitized
}

// Apply to all user input
const message = sanitizeInput(body.message)
```

#### 2. SQL Injection Prevention
```typescript
// ✅ Good: Parameterized queries (Prisma handles this)
const user = await prisma.user.findFirst({
  where: { email: userEmail }  // Safe
})

// ❌ Bad: Raw SQL with string concatenation (NEVER DO THIS)
const users = await prisma.$queryRaw(
  `SELECT * FROM users WHERE email = '${userEmail}'`  // VULNERABLE!
)

// ✅ If you need raw SQL, use parameterized:
const users = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${userEmail}
`
```

#### 3. Rate Limiting
```typescript
// Apply to all API routes
import { rateLimit } from '@/lib/rate-limit'

const limiter = rateLimit({
  interval: 60 * 1000,
  tokensPerInterval: 10
})

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  try {
    await limiter.check(ip)
  } catch (error) {
    return Response.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'Retry-After': '60'
        }
      }
    )
  }

  // Process request
}
```

## Common Tasks & Patterns

### Task 1: Create New API Endpoint

```typescript
// src/app/api/courses/[courseId]/progress/route.ts
import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'

const limiter = rateLimit({
  interval: 60 * 1000,
  tokensPerInterval: 30
})

const UpdateProgressSchema = z.object({
  videoId: z.string().uuid(),
  lastPosition: z.number().min(0),
  completed: z.boolean().optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    await limiter.check(ip)

    // Authentication
    const { userId } = auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Validate request body
    const body = await request.json()
    const result = UpdateProgressSchema.safeParse(body)
    if (!result.success) {
      return Response.json(
        { error: 'Invalid request', details: result.error },
        { status: 400 }
      )
    }

    const { videoId, lastPosition, completed } = result.data

    // Update progress (upsert)
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_videoId: {
          userId: user.id,
          videoId
        }
      },
      update: {
        lastPosition,
        completed: completed ?? undefined,
        completedAt: completed ? new Date() : undefined
      },
      create: {
        userId: user.id,
        videoId,
        lastPosition,
        completed: completed ?? false,
        completedAt: completed ? new Date() : undefined
      }
    })

    return Response.json({ progress }, { status: 200 })

  } catch (error) {
    console.error('Error updating progress:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    // Authentication
    const { userId } = auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all progress for course
    const progress = await prisma.userProgress.findMany({
      where: {
        userId: user.id,
        video: {
          courseId: params.courseId
        }
      },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            duration: true
          }
        }
      }
    })

    return Response.json({ progress }, { status: 200 })

  } catch (error) {
    console.error('Error fetching progress:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Task 2: Implement Whisper Streaming

```typescript
// src/app/api/voice/transcribe/route.ts
import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { rateLimit } from '@/lib/rate-limit'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const limiter = rateLimit({
  interval: 60 * 1000,
  tokensPerInterval: 10  // Expensive operation
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    await limiter.check(ip)

    // Get audio file from form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return Response.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Validate file size (max 25MB for Whisper)
    if (audioFile.size > 25 * 1024 * 1024) {
      return Response.json(
        { error: 'File too large (max 25MB)' },
        { status: 400 }
      )
    }

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'he',  // Hebrew
      response_format: 'verbose_json',
      timestamp_granularities: ['word']
    })

    return Response.json({
      text: transcription.text,
      words: transcription.words,
      duration: transcription.duration
    })

  } catch (error) {
    console.error('Transcription error:', error)
    return Response.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    )
  }
}
```

### Task 3: Database Migration

```typescript
// Run migration
// npx prisma migrate dev --name add_user_roles

// prisma/migrations/[timestamp]_add_user_roles/migration.sql
-- Add role column to users table
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'student';

-- Create index
CREATE INDEX idx_users_role ON users(role);

-- Update existing users
UPDATE users SET role = 'student' WHERE role IS NULL;

// Update Prisma schema
// schema.prisma
model User {
  // ...existing fields
  role      String   @default("student")  // student, instructor, admin

  @@index([role])
}

// Regenerate client
// npx prisma generate
```

## Quality Checklist

Before marking a task complete, verify:

### Functionality
- [ ] API endpoint responds correctly
- [ ] Request validation implemented
- [ ] Error handling covers edge cases
- [ ] Success and error responses are consistent
- [ ] Database transactions used where needed

### Security
- [ ] Input sanitization applied
- [ ] Authentication/authorization checked
- [ ] Rate limiting implemented
- [ ] Sensitive data not leaked in errors
- [ ] SQL injection prevented (use Prisma)

### Performance
- [ ] Database queries optimized (no N+1)
- [ ] Caching implemented where appropriate
- [ ] Connection pooling configured
- [ ] Indexes created for frequent queries
- [ ] API response time acceptable (<500ms)

### Code Quality
- [ ] TypeScript strict mode compliant
- [ ] Request/response types defined
- [ ] Error logging implemented
- [ ] Code follows project patterns
- [ ] No hardcoded secrets or credentials

### Testing
- [ ] Tested happy path
- [ ] Tested error scenarios
- [ ] Tested with invalid input
- [ ] Tested authentication/authorization
- [ ] Tested rate limiting

## Common Pitfalls to Avoid

### ❌ Don't
- Expose sensitive data in error messages
- Use raw SQL with string concatenation
- Skip input validation
- Store passwords in plain text
- Forget to close database connections
- Return stack traces to clients in production
- Skip rate limiting on expensive operations
- Use blocking operations in API routes
- Ignore TypeScript errors
- Hard-code configuration values

### ✅ Do
- Sanitize all error messages
- Use parameterized queries (Prisma does this)
- Validate all input with schemas (Zod)
- Hash passwords (bcrypt, Clerk handles this)
- Use connection pooling
- Return user-friendly error messages
- Rate limit all public endpoints
- Use async/await for I/O operations
- Fix TypeScript errors properly
- Use environment variables for config

## Integration Points

### With Frontend
- Provide consistent API responses
- Support Server-Sent Events for streaming
- Return proper HTTP status codes
- Include rate limit headers

### With AI Services
- Handle streaming from Claude
- Batch embeddings for efficiency
- Implement prompt caching
- Monitor costs and usage

### With Database
- Use Prisma for type-safe queries
- Implement proper indexing
- Handle migrations carefully
- Monitor query performance

## Resources & References

### Documentation
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Prisma Docs](https://www.prisma.io/docs)
- [Anthropic API](https://docs.anthropic.com)
- [OpenAI API](https://platform.openai.com/docs)
- [Clerk Auth](https://clerk.com/docs)

### Project Files
- API routes: [src/app/api/](src/app/api/)
- Backend utilities: [src/lib/](src/lib/)
- Types: [src/types/index.ts](src/types/index.ts)

---

**Remember**: Security, performance, and reliability are non-negotiable. Every API endpoint is a potential attack vector. Always validate input, sanitize errors, and monitor performance. Build systems that scale and fail gracefully.
