# Database Setup Guide

This guide will help you set up the PostgreSQL database and authentication system for the LearnWithAvi admin panel.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed (local or cloud)
- All npm dependencies installed (`npm install`)

## Quick Start

### 1. Set up PostgreSQL

#### Option A: Local PostgreSQL with Docker (Recommended for Development)

```bash
# Start PostgreSQL container
docker run --name learnwithavi-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=learnwithavi \
  -p 5432:5432 \
  -d postgres:16-alpine

# Verify it's running
docker ps | grep learnwithavi-db
```

#### Option B: Local PostgreSQL Installation

1. Install PostgreSQL from https://www.postgresql.org/download/
2. Create a database:
```bash
createdb learnwithavi
```

#### Option C: Cloud PostgreSQL (Supabase, Railway, Neon)

1. Create a new PostgreSQL database on your preferred platform
2. Copy the connection string (format: `postgresql://user:pass@host:port/dbname`)

### 2. Configure Environment Variables

Create a `.env.local` file (copy from `.env.example`):

```bash
cp .env.example .env.local
```

Edit `.env.local` and set these required variables:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/learnwithavi

# Authentication (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-secret-key-here-change-in-production
NEXTAUTH_URL=http://localhost:3000
```

### 3. Initialize the Database

```bash
# Generate Prisma Client
npm run db:generate

# Create database schema
npm run db:push

# Seed initial data (creates admin user)
npm run db:seed

# Migrate existing config data to database (optional)
npm run migrate:config
```

### 4. Verify Setup

Open Prisma Studio to view your database:

```bash
npm run db:studio
```

This opens a browser at http://localhost:5555 where you can view and edit your data.

## Default Admin Credentials

After seeding, you can log in with:

- **Email**: admin@learnwithavi.com
- **Password**: admin123

**IMPORTANT**: Change this password immediately in production!

## Database Schema Overview

### Core Models

- **Course**: Courses with title, description, difficulty, topics
- **Video**: YouTube videos linked to courses with chapters
- **Chapter**: Time-stamped sections within videos
- **Transcript**: Video transcripts with chunked text
- **TranscriptChunk**: Individual transcript segments for RAG
- **Admin**: Admin users for authentication

### Relationships

- Course → Video (one-to-many)
- Video → Chapter (one-to-many)
- Video → Transcript (one-to-one)
- Transcript → TranscriptChunk (one-to-many)

## Common Operations

### View Database in Browser

```bash
npm run db:studio
```

### Create a Migration

```bash
npm run db:migrate
# Enter a descriptive name when prompted
```

### Reset Database (⚠️ Deletes all data)

```bash
npx prisma migrate reset
```

### Migrate Config Data to Database

If you've added videos in `src/data/video-config.ts`:

```bash
npm run migrate:config
```

This will:
1. Read all courses and videos from config files
2. Create database records
3. Skip existing entries
4. Log progress

## Troubleshooting

### Connection Errors

If you see "Can't reach database server":

1. Verify PostgreSQL is running:
   ```bash
   docker ps  # if using Docker
   psql -U postgres -l  # if using local install
   ```

2. Check DATABASE_URL in `.env.local`:
   ```env
   # Correct format
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE

   # Examples
   postgresql://postgres:password@localhost:5432/learnwithavi  # Local
   postgresql://user:pass@db.example.com:5432/dbname  # Remote
   ```

3. Test connection manually:
   ```bash
   psql "postgresql://postgres:password@localhost:5432/learnwithavi"
   ```

### Migration Errors

If you see "Migration failed":

1. Reset the database (development only):
   ```bash
   npx prisma migrate reset
   ```

2. Or manually fix and retry:
   ```bash
   npx prisma migrate resolve --applied "migration_name"
   npx prisma migrate deploy
   ```

### Auth Errors

If you see "NEXTAUTH_SECRET must be provided":

1. Generate a secure secret:
   ```bash
   openssl rand -base64 32
   ```

2. Add to `.env.local`:
   ```env
   NEXTAUTH_SECRET=<generated-secret>
   ```

### Prisma Client Errors

If you see "Prisma Client not initialized":

```bash
npm run db:generate
```

## Production Deployment

### 1. Use a Managed Database

- **Supabase**: Free PostgreSQL with auto-backups
- **Railway**: One-click PostgreSQL deployment
- **Neon**: Serverless PostgreSQL with branching
- **Vercel Postgres**: Integrated with Vercel hosting

### 2. Set Environment Variables

In your hosting platform (Vercel, Railway, etc.), set:

```env
DATABASE_URL=<your-production-database-url>
NEXTAUTH_SECRET=<strong-random-secret>
NEXTAUTH_URL=https://your-domain.com
```

### 3. Run Migrations

```bash
npx prisma migrate deploy
```

### 4. Seed Admin User

```bash
npm run db:seed
```

## Security Best Practices

1. **Never commit `.env.local`** - Add to `.gitignore`
2. **Use strong passwords** - Change default admin password
3. **Rotate secrets regularly** - Update NEXTAUTH_SECRET periodically
4. **Use SSL in production** - Enable SSL for database connections
5. **Backup regularly** - Set up automated backups
6. **Monitor access** - Log all admin actions
7. **Use connection pooling** - Enable in production for performance

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Supabase Setup Guide](https://supabase.com/docs)
- [Railway Deployment Guide](https://docs.railway.app)

## Need Help?

Check the following files for implementation details:

- Database Schema: `/prisma/schema.prisma`
- Prisma Client: `/src/lib/prisma.ts`
- Auth Config: `/src/app/api/auth/[...nextauth]/route.ts`
- Data Layer: `/src/data/courses.ts`
- Migration Script: `/scripts/migrate-config-to-db.ts`
