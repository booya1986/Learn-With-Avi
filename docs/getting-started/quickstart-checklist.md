# Quick Start Checklist

Follow these steps to get your database and authentication system up and running.

## Prerequisites Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL 14+ available (local or cloud)
- [ ] Git repository initialized
- [ ] IDE/editor open (VS Code, Cursor, etc.)

## Setup Steps

### Step 1: Install Dependencies

```bash
npm install
```

This will install the new dependencies including:
- `tsx` - TypeScript execution for seed/migration scripts
- All existing dependencies (Prisma, NextAuth, bcrypt, etc.)

**Verification**: Run `npm list tsx` - should show version 4.19.2

---

### Step 2: Set Up PostgreSQL Database

Choose ONE of these options:

#### Option A: Docker (Recommended - Easiest)

```bash
docker run --name learnwithavi-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=learnwithavi \
  -p 5432:5432 \
  -d postgres:16-alpine
```

**Verification**: Run `docker ps | grep learnwithavi-db`

#### Option B: Local PostgreSQL

If you have PostgreSQL installed locally:

```bash
createdb learnwithavi
```

**Verification**: Run `psql -l | grep learnwithavi`

#### Option C: Cloud Provider

1. Create account on [Supabase](https://supabase.com), [Railway](https://railway.app), or [Neon](https://neon.tech)
2. Create new PostgreSQL database
3. Copy the connection string
4. Skip to Step 3

**Verification**: Test connection with provided string

---

### Step 3: Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env.local
```

Now edit `.env.local` and set these three variables:

```env
# 1. Database URL (adjust if using different credentials)
DATABASE_URL=postgresql://postgres:password@localhost:5432/learnwithavi

# 2. NextAuth Secret (generate a new one)
NEXTAUTH_SECRET=your-secret-key-change-this

# 3. NextAuth URL (keep as-is for development)
NEXTAUTH_URL=http://localhost:3001
```

#### Generate a secure NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

Copy the output and paste it as your `NEXTAUTH_SECRET` value.

**Verification**: Run `cat .env.local | grep -E "DATABASE_URL|NEXTAUTH"` - all three should be set

---

### Step 4: Initialize Database

Run these commands in order:

```bash
# 1. Generate Prisma Client (creates TypeScript types)
npm run db:generate

# 2. Push schema to database (creates tables)
npm run db:push

# 3. Seed initial admin user
npm run db:seed
```

**Expected Output**:
- `db:generate`: "Generated Prisma Client"
- `db:push`: "The database is now in sync with your schema"
- `db:seed`: "✅ Created admin user: admin@learnwithavi.com"

**Verification**: Run `npm run db:studio` - opens Prisma Studio at http://localhost:5555

---

### Step 5: Migrate Existing Config Data (Optional)

If you want to migrate your existing video configuration to the database:

```bash
npm run migrate:config
```

**Expected Output**:
- "✅ Migrated X courses"
- "✅ Migrated Y videos with Z chapters"

This reads from `/src/data/video-config.ts` and creates database records.

**Skip this if**: You want to start fresh and add courses via the admin panel.

---

### Step 6: Verify Setup

#### Test Database Connection

```bash
npm run db:studio
```

Opens Prisma Studio at http://localhost:5555. You should see:
- Admin table with 1 record (admin@learnwithavi.com)
- Course/Video tables (populated if you ran migrate:config)

#### Start Development Server

```bash
npm run dev
```

Opens at http://localhost:3001

> **Note:** The dev server runs on port 3001 to avoid conflicts with browser extensions (e.g., Ollama Web UI) that intercept port 3000.

**Verification Checklist**:
- [ ] Server starts without errors
- [ ] No database connection errors in console
- [ ] Can access homepage

---

### Step 7: Test Authentication

1. Navigate to http://localhost:3001/admin/login
2. Log in with:
   - **Email**: admin@learnwithavi.com
   - **Password**: admin123

**Note**: You'll need to create the login page first (next task)

**After login works**:
- [ ] Change the default password immediately
- [ ] Create additional admin users if needed

---

## Troubleshooting

### Error: "Can't reach database server"

**Problem**: PostgreSQL not running or wrong connection string

**Solutions**:
1. If using Docker:
   ```bash
   docker ps | grep learnwithavi-db
   # If not running:
   docker start learnwithavi-db
   ```

2. If using local PostgreSQL:
   ```bash
   pg_isready
   # If not ready:
   brew services start postgresql  # macOS
   sudo systemctl start postgresql  # Linux
   ```

3. Verify DATABASE_URL in `.env.local`:
   ```bash
   cat .env.local | grep DATABASE_URL
   ```

4. Test connection manually:
   ```bash
   psql "postgresql://postgres:password@localhost:5432/learnwithavi"
   ```

---

### Error: "NEXTAUTH_SECRET must be provided"

**Problem**: Missing or invalid NEXTAUTH_SECRET in `.env.local`

**Solution**:
```bash
# Generate new secret
openssl rand -base64 32

# Add to .env.local
echo "NEXTAUTH_SECRET=<paste-generated-secret-here>" >> .env.local

# Restart dev server
npm run dev
```

---

### Error: "Prisma Client is not initialized"

**Problem**: Prisma Client not generated

**Solution**:
```bash
npm run db:generate
```

---

### Error: "Command 'tsx' not found"

**Problem**: Dependencies not installed

**Solution**:
```bash
npm install
```

---

### Error: Migration script fails

**Problem**: Database schema out of sync

**Solution**:
```bash
# Development only - resets database!
npx prisma migrate reset

# Then re-seed
npm run db:seed
```

---

## What's Next?

After completing this checklist, you're ready to:

1. **Build Admin UI Pages**
   - `/admin/login` - Login page
   - `/admin` - Dashboard
   - `/admin/courses` - Course management
   - `/admin/videos` - Video management

2. **Create API Routes**
   - See `ADMIN_API_REFERENCE.md` for specifications
   - Implement CRUD operations for courses/videos
   - Add file upload for thumbnails

3. **Add Features**
   - YouTube video import
   - Transcript management
   - Chapter editor
   - Drag-and-drop reordering

---

## Quick Reference

### Useful Commands

```bash
# Database
npm run db:generate     # Generate Prisma Client
npm run db:push        # Push schema to DB
npm run db:migrate     # Create migration
npm run db:seed        # Seed admin user
npm run db:studio      # Open GUI

# Development
npm run dev            # Start dev server
npm run build          # Build for production
npm run lint           # Run linter

# Scripts
npm run migrate:config # Migrate config to DB
```

### Default Admin Credentials

- **Email**: admin@learnwithavi.com
- **Password**: admin123
- **Change immediately in production!**

### Database Connection Strings

```bash
# Local Docker
DATABASE_URL=postgresql://postgres:password@localhost:5432/learnwithavi

# Local PostgreSQL
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/learnwithavi

# Supabase
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres

# Railway
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST].railway.app:5432/railway

# Neon
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST].neon.tech/[DATABASE]
```

### Important Files

- `/prisma/schema.prisma` - Database schema
- `/src/lib/prisma.ts` - Prisma client
- `/src/lib/auth.ts` - Auth helpers
- `/src/app/api/auth/[...nextauth]/route.ts` - NextAuth config
- `/src/data/courses.ts` - Data layer
- `/.env.local` - Environment variables (DON'T COMMIT!)

### Documentation

- `DATABASE_SETUP.md` - Detailed setup guide
- `SETUP_COMPLETE.md` - Summary of all changes
- `ADMIN_API_REFERENCE.md` - API specifications
- `QUICKSTART_CHECKLIST.md` - This file

---

## Need Help?

1. Check the error message carefully
2. Review troubleshooting section above
3. Check documentation files listed above
4. Verify all steps were completed in order
5. Ensure PostgreSQL is running
6. Verify environment variables are set correctly

---

## Status Checklist

Mark off as you complete each step:

- [ ] Step 1: Installed dependencies
- [ ] Step 2: Set up PostgreSQL
- [ ] Step 3: Configured environment variables
- [ ] Step 4: Initialized database
- [ ] Step 5: Migrated config (optional)
- [ ] Step 6: Verified setup
- [ ] Step 7: Tested authentication (requires login page)

Once all steps are complete, you're ready to build the admin panel! 🚀
