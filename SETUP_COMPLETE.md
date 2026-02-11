# Database and Authentication Setup - Complete

## Summary

The database layer and authentication system for the LearnWithAvi admin panel has been successfully set up. All files have been created and are ready for use.

## What Was Created

### Phase 1: Database Setup

#### 1. Prisma Schema (`/prisma/schema.prisma`)
- PostgreSQL database configuration
- 6 models: Course, Video, Chapter, Transcript, TranscriptChunk, Admin
- Proper relationships with cascade deletes
- Indexes for performance optimization
- CUID-based IDs for all records

#### 2. Prisma Client Singleton (`/src/lib/prisma.ts`)
- Prevents multiple Prisma instances in development
- Configured with proper logging for dev/prod

#### 3. Database Seed Script (`/prisma/seed.ts`)
- Creates initial admin user
- Email: admin@learnwithavi.com
- Password: admin123 (hashed with bcrypt, 12 rounds)

#### 4. Migration Script (`/scripts/migrate-config-to-db.ts`)
- Migrates data from `/src/data/video-config.ts` to database
- Creates Course and Video records with chapters
- Handles errors gracefully, skips existing records
- Detailed logging of progress

#### 5. Package.json Scripts
Added the following npm scripts:
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Create and apply migrations
- `npm run db:seed` - Seed initial admin user
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run migrate:config` - Migrate config files to database

#### 6. Updated Dependencies
- Added `tsx` for running TypeScript files
- All Prisma and auth dependencies already installed

### Phase 2: Authentication Setup

#### 7. NextAuth Configuration (`/src/app/api/auth/[...nextauth]/route.ts`)
- CredentialsProvider for email/password authentication
- Bcrypt password hashing (12 rounds)
- JWT-based sessions (30-day expiry)
- Custom login page at `/admin/login`
- Automatic last login timestamp update
- Exported authOptions for use in other files

#### 8. NextAuth Type Extensions (`/src/types/next-auth.d.ts`)
- TypeScript types for Session and User objects
- Ensures type safety across the application

#### 9. Auth Helper Utilities (`/src/lib/auth.ts`)
Helper functions for server-side authentication:
- `getSession()` - Get current session
- `requireAuth()` - Require authentication (redirects if not logged in)
- `isAuthenticated()` - Check auth status
- `getCurrentAdmin()` - Get current admin user

#### 10. Environment Variables (`/.env.example`)
Added database and authentication variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - JWT encryption secret
- `NEXTAUTH_URL` - Application base URL

### Phase 3: Data Layer Update

#### 11. Updated Courses Data Layer (`/src/data/courses.ts`)
Converted all functions to async and database-backed:
- `getCourses()` - Fetch all published courses
- `getCourseById(id)` - Fetch single course
- `getVideoById(id)` - Fetch single video
- `getVideoByYoutubeId(youtubeId)` - Fetch by YouTube ID
- `getFeaturedCourses()` - Get first 3 courses
- `getAllVideos()` - Get all videos across courses
- `getCourseForVideo(videoId)` - Get course for a video

All functions include:
- Database queries with proper relations
- Fallback to config files if database unavailable
- Proper TypeScript types
- Error handling

### Documentation

#### 12. Database Setup Guide (`/DATABASE_SETUP.md`)
Comprehensive guide covering:
- PostgreSQL setup (Docker, local, cloud)
- Environment configuration
- Database initialization
- Schema overview
- Common operations
- Troubleshooting
- Production deployment
- Security best practices

#### 13. Setup Summary (`/SETUP_COMPLETE.md`)
This file - summary of all changes

## Next Steps

### 1. Install Dependencies

If you haven't already:
```bash
npm install
```

### 2. Set Up PostgreSQL

Choose one of these options:

**Option A: Docker (Recommended)**
```bash
docker run --name learnwithavi-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=learnwithavi \
  -p 5432:5432 \
  -d postgres:16-alpine
```

**Option B: Use existing PostgreSQL**
Create a database named `learnwithavi`

**Option C: Cloud Provider**
Create a database on Supabase, Railway, or Neon

### 3. Configure Environment

```bash
# Copy example file
cp .env.example .env.local

# Edit .env.local and set:
# - DATABASE_URL (your PostgreSQL connection string)
# - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
# - NEXTAUTH_URL (http://localhost:3000 for dev)
```

### 4. Initialize Database

```bash
# Generate Prisma Client
npm run db:generate

# Create database schema
npm run db:push

# Seed initial admin user
npm run db:seed

# Optional: Migrate config data
npm run migrate:config
```

### 5. Verify Setup

```bash
# Open Prisma Studio
npm run db:studio

# Start dev server
npm run dev
```

### 6. Test Authentication

1. Go to http://localhost:3000/admin/login
2. Log in with:
   - Email: admin@learnwithavi.com
   - Password: admin123
3. Create admin UI pages (next task)

## File Structure

```
learnwithavi/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed script
├── scripts/
│   └── migrate-config-to-db.ts # Migration script
├── src/
│   ├── app/
│   │   └── api/
│   │       └── auth/
│   │           └── [...nextauth]/
│   │               └── route.ts    # NextAuth config
│   ├── data/
│   │   ├── courses.ts         # Updated data layer (async)
│   │   └── video-config.ts    # Original config (fallback)
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   └── auth.ts            # Auth helpers
│   └── types/
│       ├── index.ts           # App types
│       └── next-auth.d.ts     # NextAuth types
├── .env.example               # Updated with DB vars
├── DATABASE_SETUP.md          # Setup guide
├── SETUP_COMPLETE.md          # This file
└── package.json               # Updated with scripts
```

## Database Schema

### Course
- id, title, description, difficulty, topics[], thumbnail
- order, published, createdAt, updatedAt
- Relations: videos[]

### Video
- id, youtubeId, title, description, duration, thumbnail
- topic, tags[], courseId, order, published
- Relations: course, chapters[], transcript

### Chapter
- id, videoId, title, startTime, endTime, order
- Relations: video

### Transcript
- id, videoId, source, language, createdAt, updatedAt
- Relations: video, chunks[]

### TranscriptChunk
- id, transcriptId, text, startTime, endTime, order
- Relations: transcript

### Admin
- id, email, passwordHash, name, createdAt, lastLogin
- Used for authentication

## Authentication Flow

1. Admin visits `/admin/*` route
2. Server checks session with `requireAuth()`
3. If not authenticated → redirect to `/admin/login`
4. Admin enters email/password
5. NextAuth validates against database
6. Password compared with bcrypt
7. JWT token created (30-day expiry)
8. Session stored in encrypted cookie
9. Admin redirected to protected route

## API Usage Examples

### In Server Components

```typescript
import { requireAuth } from '@/lib/auth';
import { getCourses } from '@/data/courses';

export default async function AdminDashboard() {
  // Require authentication (redirects if not logged in)
  const session = await requireAuth();

  // Fetch courses from database
  const courses = await getCourses();

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
      <CourseList courses={courses} />
    </div>
  );
}
```

### In API Routes

```typescript
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  // Check authentication
  const session = await getSession();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Query database
  const courses = await prisma.course.findMany({
    include: { videos: true },
  });

  return Response.json(courses);
}
```

### In Client Components (with useSession hook)

```typescript
'use client';
import { useSession } from 'next-auth/react';

export default function ClientComponent() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div>Loading...</div>;
  if (!session) return <div>Not authenticated</div>;

  return <div>Hello, {session.user.name}</div>;
}
```

## Security Features

- **Password Hashing**: Bcrypt with 12 rounds (slow, secure)
- **JWT Tokens**: Encrypted with NEXTAUTH_SECRET
- **Session Expiry**: 30-day maximum
- **CSRF Protection**: Built into NextAuth
- **HTTP-Only Cookies**: Prevents XSS attacks
- **Database Indexes**: Optimized queries for email lookups
- **Cascade Deletes**: Maintains referential integrity
- **Published Flag**: Controls content visibility

## Troubleshooting

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker ps  # if using Docker
psql -l    # if using local install

# Verify DATABASE_URL in .env.local
cat .env.local | grep DATABASE_URL
```

### Prisma Client Error
```bash
# Regenerate Prisma Client
npm run db:generate
```

### Auth Error
```bash
# Generate new NEXTAUTH_SECRET
openssl rand -base64 32

# Add to .env.local
echo "NEXTAUTH_SECRET=<generated-secret>" >> .env.local
```

### Migration Error
```bash
# Reset database (development only)
npx prisma migrate reset
```

## Production Checklist

- [ ] Use managed PostgreSQL (Supabase, Railway, Neon)
- [ ] Set strong NEXTAUTH_SECRET
- [ ] Enable SSL for database connections
- [ ] Change default admin password
- [ ] Set up automated backups
- [ ] Enable connection pooling
- [ ] Add rate limiting to auth endpoints
- [ ] Monitor database performance
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Review and test all security measures

## Support

For detailed setup instructions, see:
- `/DATABASE_SETUP.md` - Database setup guide
- `/prisma/schema.prisma` - Database schema
- `/src/lib/auth.ts` - Auth helper functions
- `/src/app/api/auth/[...nextauth]/route.ts` - Auth configuration

For Prisma documentation: https://www.prisma.io/docs
For NextAuth documentation: https://next-auth.js.org

## Ready for Next Phase

The database and authentication layer is now complete. You can proceed with:

1. Building the admin UI pages (`/admin/courses`, `/admin/videos`)
2. Creating API routes for CRUD operations
3. Implementing the video upload and transcript management features
4. Adding file upload for course thumbnails
5. Building the admin dashboard with analytics

All the infrastructure is in place and ready to use!
