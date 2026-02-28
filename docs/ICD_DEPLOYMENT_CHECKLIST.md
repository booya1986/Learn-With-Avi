# LearnWithAvi — Integration & Confirmation Checklist (ICD)

Run this checklist immediately after every production deployment.

---

## PRE-DEPLOYMENT (Do Before Every Deploy)

### Database
- [ ] PostgreSQL 15+ instance running with pgvector extension enabled
- [ ] `CREATE EXTENSION IF NOT EXISTS vector;` confirmed in DB console
- [ ] `DATABASE_URL` includes connection pooling: `?connection_limit=10&pool_timeout=20`
- [ ] Migrations applied: `DATABASE_URL=<prod> npx prisma migrate deploy`
- [ ] Verify in DB: `SELECT * FROM "_prisma_migrations";` — both migrations listed as applied

### Vercel Environment Variables (Project Settings → Environment Variables)
| Variable | Required | Notes |
|----------|----------|-------|
| `ANTHROPIC_API_KEY` | YES | Claude chat |
| `OPENAI_API_KEY` | YES | Embeddings |
| `DATABASE_URL` | YES | PostgreSQL + pooling params |
| `NEXTAUTH_SECRET` | YES | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | YES | Your production domain (https://) |
| `NEXT_PUBLIC_APP_URL` | YES | Your production domain (https://) |
| `REDIS_URL` | STRONGLY RECOMMENDED | Upstash or Redis Cloud |
| `YOUTUBE_API_KEY` | Recommended | For video ingest |
| `ELEVENLABS_API_KEY` | Optional | Falls back to browser TTS |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Error tracking |
| `SENTRY_ORG` | Optional | Source map upload |
| `SENTRY_PROJECT` | Optional | Source map upload |
| `SENTRY_AUTH_TOKEN` | Optional | Source map upload |

### Local Build Verification
- [ ] `npm run build` — succeeds, 33 pages, zero build errors
- [ ] No Sentry `ACTION REQUIRED` or `DEPRECATION` warnings in build output

### First Admin User
- [ ] After first deploy: POST to `https://your-domain.com/api/admin/signup`
  ```bash
  curl -X POST https://your-domain.com/api/admin/signup \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@domain.com","password":"YourStrongPass!","name":"Admin"}'
  ```
- [ ] Signup returns 201 Created (auto-disabled after first admin)

---

## POST-DEPLOYMENT VERIFICATION

### 1. Health & Infrastructure
- [ ] `GET https://your-domain.com/api/v1/health` → HTTP 200, `{"status":"ok"}`
- [ ] `HEAD https://your-domain.com/api/v1/health` → HTTP 200
- [ ] Vercel Functions tab shows no deployment errors
- [ ] Build logs show: "✓ Compiled successfully"

### 2. Authentication Flow
- [ ] `GET /en/admin/login` → Admin login page renders
- [ ] Login with admin credentials → redirects to `/en/admin/dashboard`
- [ ] `GET /api/admin/courses` without Authorization → HTTP 401
- [ ] Session persists on page refresh
- [ ] Logout clears session (redirects to login)

### 3. Chat — Core Feature
- [ ] Open any course page → chat panel renders
- [ ] Type and send a message → streaming response appears within 3s
- [ ] Response is contextually relevant (RAG is working)
- [ ] Hebrew text input is accepted and answered in Hebrew
- [ ] Rate limit test: send 11 chat messages within 60s → 11th returns HTTP 429

### 4. Voice
- [ ] Voice button renders on course page
- [ ] If `ELEVENLABS_API_KEY` set: speak → receive audio response from ElevenLabs
- [ ] If no key: speak → receive audio response from browser Web Speech API (no error shown)
- [ ] `POST /api/v1/voice/tts` with `{"text":"Hello"}` → audio binary returned

### 5. Quiz
- [ ] Quiz panel renders on course page
- [ ] Click "Generate Quiz" → questions appear within 30s
- [ ] Select answers → feedback and score shown

### 6. Admin Panel
- [ ] Dashboard → `/en/admin/dashboard` loads with stats
- [ ] Courses list → `/en/admin/courses` shows course list
- [ ] Create course → appears in list immediately
- [ ] Videos list → `/en/admin/videos` shows video list
- [ ] Ingest page → `/en/admin/videos/ingest` loads
- [ ] If `YOUTUBE_API_KEY` set: paste YouTube URL → video ingested with transcript

### 7. Internationalization (Hebrew/RTL)
- [ ] `GET /he/` → Hebrew homepage loads
- [ ] Text is right-aligned, layout is RTL
- [ ] `GET /en/` → English homepage loads
- [ ] `GET /` → redirects to `/en/` (default locale)
- [ ] Mixed Hebrew-English chat message renders correctly

### 8. Error Handling & Resilience
- [ ] Navigate to `/en/nonexistent-page` → custom 404 page (not Vercel default)
- [ ] Navigate to `/api/nonexistent` → JSON 404 response
- [ ] If Sentry configured: check Sentry dashboard for test event

### 9. Performance Targets
- [ ] Homepage LCP < 2.5s (check Chrome DevTools → Lighthouse)
- [ ] Course page TTI < 4s
- [ ] Chat first streaming token < 3s
- [ ] `/api/v1/health` response time < 500ms

### 10. Security Checks
- [ ] All pages served over HTTPS (no HTTP leaks)
- [ ] Scan with [securityheaders.com](https://securityheaders.com) → A or A+ rating
  - X-Frame-Options: SAMEORIGIN ✓
  - Strict-Transport-Security ✓
  - Content-Security-Policy ✓
  - X-Content-Type-Options: nosniff ✓
- [ ] `POST /api/v1/chat` from different origin → CORS rejected
- [ ] `GET /api/admin/courses` without session cookie → HTTP 401
- [ ] Error messages do not contain API keys or DB credentials

---

## MONITORING SETUP (First Week After Deploy)

- [ ] Uptime monitor configured: ping `GET /api/v1/health` every 60s
  - Tools: Better Uptime, UptimeRobot, Checkly, or Vercel's built-in
  - Alert: SMS/email if 3 consecutive failures
- [ ] Sentry alert rule: notify on > 10 errors in 5 minutes
- [ ] Vercel Analytics enabled (Project Settings → Analytics)
- [ ] API cost alerts set on Anthropic dashboard (80% of monthly budget)
- [ ] API cost alerts set on OpenAI dashboard (80% of monthly budget)

---

## ROLLBACK PROCEDURE

If critical issues found post-deploy:
1. Vercel Dashboard → Deployments → previous deployment → "Promote to Production"
2. No database rollback needed (migrations are additive and backward-compatible)
3. Notify users if downtime exceeded 5 minutes

---

## QUICK COMMAND REFERENCE

```bash
# Apply DB migrations to production
DATABASE_URL="<prod-url>" npx prisma migrate deploy

# Check migration status
DATABASE_URL="<prod-url>" npx prisma migrate status

# Verify DB schema matches Prisma schema
DATABASE_URL="<prod-url>" npx prisma db pull

# Create first admin user
curl -X POST https://your-domain.com/api/admin/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@domain.com","password":"StrongPass123!","name":"Admin"}'

# Health check (unauthenticated)
curl https://your-domain.com/api/v1/health

# Local build validation
npm run build && echo "BUILD OK"

# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```
