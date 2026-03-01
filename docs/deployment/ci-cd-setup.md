# CI/CD Pipeline Setup Guide

This document describes the hardened CI/CD pipeline for LearnWithAvi, including GitHub Actions workflows, Dependabot configuration, and local validation.

## Overview

The CI/CD pipeline is designed to ensure code quality, security, and deployment readiness with minimal friction:

- **Main CI Workflow** (`ci.yml`): Type check → Lint → Unit tests → Build (5-10 minutes)
- **E2E Workflow** (`e2e.yml`): Optional, runs only when `DATABASE_URL` secret is configured
- **Quality Checks** (`quality-checks.yml`): Dependency security, bundle size, code quality
- **Deploy Check** (`deploy-check.yml`): PR validation (env vars, secrets, formatting)

All workflows trigger on:
- **Push to `main`**: Run full CI pipeline
- **Pull Request to `main`**: Run full CI pipeline + deployment checks

## GitHub Actions Workflows

### 1. Main CI Workflow (`.github/workflows/ci.yml`)

**Purpose**: Verify code quality and build integrity on every push/PR.

**Jobs**:

| Job | Timeout | Details |
|-----|---------|---------|
| **lint** | 10 min | ESLint code style checking |
| **type-check** | 10 min | TypeScript strict mode validation |
| **unit-tests** | 15 min | Vitest with coverage reporting (35%+ threshold) |
| **build** | 20 min | Next.js production build verification |
| **all-checks** | 1 min | Summary gate — fails if any job fails |

**Key Features**:
- Caching: npm dependencies cached across all jobs
- Timeouts: Each job has explicit timeout to prevent hangs
- Early termination: If lint/type-check fail, build is skipped
- Coverage reporting: Uploads to Codecov (fails gracefully if token missing)
- Build verification: Checks `.next/BUILD_ID` exists after build

**Run Locally**:
```bash
npm run lint
npm run type-check
npm run test:unit
npm run build
```

Or run full CI suite:
```bash
npm run ci
```

### 2. E2E Workflow (`.github/workflows/e2e.yml`)

**Purpose**: Run Playwright end-to-end tests (optional, conditional).

**Design**:
- **Conditional execution**: Only runs if `DATABASE_URL` GitHub secret is set
- **Graceful skip**: If secret missing, workflow completes without failure
- **No blocking**: CI pipeline succeeds even if E2E is skipped
- **Notification**: Posts comment on PR with test results

**Jobs**:

| Job | Condition | Details |
|-----|-----------|---------|
| **check-secrets** | Always | Checks if DATABASE_URL secret exists |
| **e2e** | If has secrets | Runs Playwright test suite |
| **e2e-skipped** | If no secrets | Notifies user about skipped tests |
| **e2e-results** | Always | Reports final status |

**Environment Variables**:
- `DATABASE_URL`: Passed from GitHub secret
- `NODE_ENV`: Set to `test`
- `CI`: Set to `true`

**To Enable E2E Tests**:

1. Create a test PostgreSQL database on Supabase/Railway/Neon:
   ```bash
   # Run migrations on test DB
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
   ```

2. Add GitHub secret:
   - Go to: `https://github.com/{owner}/{repo}/settings/secrets/actions`
   - Click "New repository secret"
   - Name: `DATABASE_URL`
   - Value: Your test database connection string

3. Re-run the workflow to enable E2E tests

**Run Locally**:
```bash
npm run test:e2e
npm run test:e2e:ui  # Interactive mode
```

### 3. Quality Checks Workflow (`.github/workflows/quality-checks.yml`)

**Purpose**: Security audits, bundle size analysis, code quality metrics.

**Jobs**:
- **dependency-check**: npm audit for vulnerable packages
- **bundle-size**: Analyzes .next folder size (warns if > 500MB)
- **code-quality**: Detects console.log, TODO/FIXME, unsafe types
- **accessibility-check**: Verifies alt text, aria labels, RTL support

**Triggers**: Only on changes to `src/`, `package.json`, or workflow itself.

### 4. Deploy Check Workflow (`.github/workflows/deploy-check.yml`)

**Purpose**: Validates PRs are ready for deployment.

**Checks**:
- PR has title and description
- `.env.example` exists with required variables
- No hardcoded API keys detected
- `.env.local` and `.env` properly gitignored

**Triggers**: On PR open/update to `main`.

## Dependabot Configuration

Dependabot automatically checks for dependency updates weekly. The configuration is in `.github/dependabot.yml`.

### Key Rules

**Next.js Locked at 15.5.7**:
```yaml
ignore:
  - dependency-name: "next"
    update-types:
      - "major"
      - "minor"
  - dependency-name: "eslint-config-next"
    update-types:
      - "major"
      - "minor"
```

**Reason**: Next.js 16.x has fatal Turbopack cache corruption and Webpack manifest failures. Do NOT upgrade until 16.1+ is stable (estimated Q2 2025).

**Grouping**:
- Minor/patch updates for production dependencies grouped (1 PR/week)
- Minor/patch updates for dev dependencies grouped (1 PR/week)
- GitHub Actions updates checked monthly

### Managing Dependabot PRs

**Auto-merge safe updates**:
```bash
# Install gh CLI, then:
gh pr merge --auto --squash <pr-number>
```

**Evaluate breaking changes**:
1. Read changelog in PR description
2. Run tests locally: `npm install && npm run ci`
3. Check for deprecations and update code if needed

## Environment Variable Validation

### Local Validation Script

Use `scripts/check-env.sh` to validate environment setup:

```bash
bash scripts/check-env.sh
```

**Output**:
- Green OK: Variable is set and valid
- Yellow WARN: Variable is missing or uses placeholder value
- Red ERROR: Required variable missing

**Example Output**:
```
================================
REQUIRED VARIABLES
================================
[OK] DATABASE_URL is set
[OK] NEXTAUTH_SECRET is set (***Hd9k)
[OK] NEXTAUTH_URL is set
[OK] ANTHROPIC_API_KEY is set (***xyz)
[OK] OPENAI_API_KEY is set (***abc)

================================
OPTIONAL VARIABLES (Recommended)
================================
[WARN] Optional: ELEVENLABS_API_KEY (ElevenLabs Text-to-Speech)
[WARN] Optional: YOUTUBE_API_KEY (YouTube Data API)
[OK] GOOGLE_CLIENT_ID is set (Google OAuth)
[OK] GOOGLE_CLIENT_SECRET is set (***def)

================================
ENVIRONMENT VALIDATION
================================
[OK] Node.js: v20.10.0
[OK] npm: 10.2.3
[OK] NODE_ENV: development
[OK] DATABASE_URL format is valid (PostgreSQL)
[OK] NEXTAUTH_SECRET length is sufficient (43 chars)
[OK] NEXTAUTH_URL: http://localhost:3000

================================
SUMMARY
================================
All required environment variables are set
```

### Required Environment Variables

All required for development and production:

| Variable | Purpose | Format |
|----------|---------|--------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:port/db` |
| `NEXTAUTH_SECRET` | JWT encryption key | Min 32 chars (use `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | OAuth callback base URL | `http://localhost:3000` or `https://domain.com` |
| `ANTHROPIC_API_KEY` | Claude API access | `sk-ant-...` from console.anthropic.com |
| `OPENAI_API_KEY` | OpenAI embeddings | `sk-...` from platform.openai.com |

### Optional But Recommended

| Variable | Purpose | Fallback |
|----------|---------|----------|
| `ELEVENLABS_API_KEY` | Voice synthesis | Browser Web Speech API |
| `YOUTUBE_API_KEY` | Video import | Manual transcript upload |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth login | Email/password only |
| `REDIS_URL` | Distributed caching | In-memory cache (not shared) |
| `SENTRY_DSN` | Error tracking | No error tracking |

## GitHub Actions Secrets

Secrets are required for Vercel deployment and optional CI features.

### Required Secrets

```
DATABASE_URL              # Supabase PostgreSQL (for E2E tests)
NEXTAUTH_SECRET           # JWT encryption (if not in .env)
NEXTAUTH_URL              # App URL (if not in .env)
ANTHROPIC_API_KEY         # Claude API (optional for CI)
OPENAI_API_KEY            # OpenAI API (optional for CI)
CODECOV_TOKEN             # Codecov integration (optional)
```

### Optional Secrets

```
ELEVENLABS_API_KEY        # Voice synthesis
YOUTUBE_API_KEY           # Video import
GOOGLE_CLIENT_ID          # OAuth
GOOGLE_CLIENT_SECRET      # OAuth
SENTRY_AUTH_TOKEN         # Error tracking
SENTRY_ORG                # Sentry org slug
SENTRY_PROJECT            # Sentry project slug
```

### Adding Secrets to GitHub

1. Go to: `https://github.com/{owner}/{repo}/settings/secrets/actions`
2. Click "New repository secret"
3. Enter name and value
4. Click "Add secret"

Secrets are:
- **Never logged** in workflow output
- **Per-repository** (not shared with forks)
- **Per-environment** (optional: dev, staging, production)

## Branch Protection Rules

Recommended GitHub branch protection for `main`:

```
Require status checks to pass before merging:
  ✓ lint
  ✓ type-check
  ✓ unit-tests
  ✓ build
  ✓ all-checks

Require code review before merging:
  ✓ Require at least 1 approval
  ✓ Require review from code owners

Require status checks from required contexts:
  ✓ Require branches to be up to date before merging

Allow force pushes:
  ✗ Do not allow force pushes
```

To configure:
1. Go to: `https://github.com/{owner}/{repo}/settings/branches`
2. Click "Add rule"
3. Pattern: `main`
4. Check all recommendations above
5. Save

## Local Development Setup

### Initial Setup

```bash
# Clone repository
git clone https://github.com/{owner}/{repo}.git
cd learnwithavi

# Install dependencies
npm ci

# Copy environment template
cp .env.example .env.local

# Fill in required variables
nano .env.local

# Validate environment
bash scripts/check-env.sh

# Start development server
npm run dev
```

### Pre-commit Hooks

Husky is configured to run linting on commit:

```bash
# Install hooks
npm run prepare

# Run manually
npm run lint:fix
npx husky install

# Skip hooks (not recommended)
git commit --no-verify
```

### Running Tests Locally

```bash
# Type checking only
npm run type-check

# Linting only
npm run lint
npm run lint:fix

# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e
npm run test:e2e:ui  # Interactive mode

# All checks (like CI)
npm run ci

# With coverage reporting
npm run test:unit  # Generates coverage/
```

## Troubleshooting

### CI Workflow Failures

**Type check fails**:
```bash
# Clear build cache and rebuild TypeScript
npm run clean
npm run type-check
```

**Tests fail locally but pass in CI**:
- Check `NODE_ENV` is set to `test`
- Clear node_modules: `rm -rf node_modules && npm ci`
- Check for hardcoded paths (use `@/` alias)

**Build fails**:
```bash
# Clean everything and rebuild
npm run clean:full
npm run build
```

### E2E Tests Not Running

**Check if DATABASE_URL secret is set**:
```bash
# On GitHub, go to Settings > Secrets > Actions
# Verify DATABASE_URL exists

# Locally, set before running:
export DATABASE_URL="postgresql://..."
npm run test:e2e
```

**Tests timeout**:
- Increase timeout in `e2e.yml` (currently 30 min)
- Check if test database is responsive
- Look for long-running migrations

### Dependabot Issues

**Merge conflicts in package.json**:
1. Check out the PR branch
2. Resolve conflicts manually
3. Commit changes
4. Let Dependabot auto-update if configured

**Unexpected version bump**:
- Review the full changelog in PR description
- Run `npm run ci` locally to test
- Reject if breaking changes aren't compatible

## Performance Optimization

### Caching

**npm cache** (GitHub Actions):
- Automatically cached in all jobs
- Cache key: `package-lock.json` hash
- Hit rate: ~90% for dependencies

**Build artifacts**:
- `.next` folder uploaded after build
- Retained for 1 day (can deploy from artifact if needed)
- Saves 5-10 minutes on subsequent workflows

### Job Dependencies

```
lint ────┐
         ├─→ build ──→ all-checks
type-check┤
         ├→
unit-tests┘
```

- `lint`, `type-check`, `unit-tests` run in parallel (3-5 min)
- `build` waits for all three (only if all pass)
- `all-checks` summarizes results

## Cost Optimization

### GitHub Actions Minutes

- **Free plan**: 2,000 minutes/month
- **LearnWithAvi usage**: ~50 minutes/day = 1,500/month (within free tier)

Breakdown per workflow:
- CI workflow: 10 min × 20 runs/month = 200 min
- Quality checks: 5 min × 20 runs/month = 100 min
- E2E tests: 20 min × 5 runs/month = 100 min (if enabled)
- Deploy checks: 2 min × 30 runs/month = 60 min

Total: ~460 min/month (comfortably within free tier)

### Tips to Stay Within Quota

1. **Use branch protection**: Only run CI on necessary branches
2. **Cancel outdated workflows**: Concurrency group cancels old runs
3. **Disable E2E in forks**: Only enable in main repository
4. **Cache aggressively**: npm cache hits save 2-3 min per job

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)

## Security Best Practices

1. **Never commit `.env.local`**: Already in `.gitignore`
2. **Rotate secrets regularly**: Especially API keys
3. **Use per-environment secrets**: Development vs production
4. **Review Dependabot PRs**: Don't auto-merge without checking
5. **Monitor GitHub Security tab**: Check for vulnerability alerts
6. **Keep Node.js updated**: Watch for security releases (v20.x)

---

**Last Updated**: 2026-03-01
**Maintainer**: DevOps Engineer
**Next Review**: 2026-03-15
