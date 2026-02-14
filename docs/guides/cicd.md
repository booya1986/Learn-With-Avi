# CI/CD Pipeline Guide

Complete guide for GitHub Actions CI/CD pipeline for the LearnWithAvi platform.

## Quick Start (5 Minutes)

```bash
# 1. Run all CI checks locally before pushing
npm run ci

# 2. Push to GitHub - workflows trigger automatically
git push origin main

# 3. View workflow status
open https://github.com/YOUR_ORG/learnwithavi/actions
```

**Requirements**: Node.js 20, GitHub repository, clean `npm run ci` output.

## Overview

The CI/CD pipeline automates quality checks and deployment preparation through GitHub Actions. Every push triggers:

1. **Linting** - Code style and consistency (ESLint)
2. **Type checking** - TypeScript strict mode validation
3. **Unit tests** - Vitest with coverage reports
4. **E2E tests** - Playwright cross-browser testing
5. **Build** - Next.js production build verification
6. **Deploy checks** - Configuration and secret validation

## Workflows

### 1. Main CI Pipeline

**File**: `.github/workflows/ci.yml`

Runs on every push to `main` and pull requests.

#### Jobs

| Job | Purpose | Command | Time |
|-----|---------|---------|------|
| Lint | Code style enforcement | `npm run lint` | 1-2 min |
| Type Check | TypeScript validation | `npm run type-check` | 1-2 min |
| Unit Tests | Test coverage | `npm run test:unit` | 3-5 min |
| Build | Production build | `npm run build` | 3-5 min |

All jobs run in parallel. **All must pass** for PR merge.

### 2. E2E Testing

**File**: `.github/workflows/e2e.yml`

Tests user workflows across browsers:
- Desktop: Chrome, Firefox, Safari
- Mobile: Chrome (Pixel 5), Safari (iPhone 12)

**Artifacts** (30-day retention):
- Playwright HTML report
- Screenshots/videos of failures
- Test results JSON

### 3. Deploy Check

**File**: `.github/workflows/deploy-check.yml`

Validates deployment readiness:
- PR title and description presence
- `.env.example` completeness
- No hardcoded secrets in code
- Configuration file validity

### 4. Quality & Security

**File**: `.github/workflows/quality-checks.yml`

Runs when code/dependencies change:
- Dependency vulnerability scan (`npm audit`)
- Bundle size analysis (alerts >500MB)
- Code quality checks (no `console.log`, unsafe types)
- Accessibility validation (alt text, ARIA labels)

## Local Development

### Run Full CI Suite

```bash
npm run ci
```

Equivalent to:
```bash
npm run type-check && npm run lint && npm run test:unit && npm run build
```

### Individual Checks

```bash
# Type checking
npm run type-check

# Linting (auto-fix)
npm run lint
npx eslint --fix src/

# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e        # Headless
npm run test:e2e:ui     # With UI

# Build
npm run build
```

## GitHub Setup

### Step 1: Configure Secrets

Navigate to: **Settings → Secrets and variables → Actions**

Add these repository secrets:

| Secret | Required | Purpose | How to Get |
|--------|----------|---------|------------|
| `CODECOV_TOKEN` | Optional | Coverage reports | [codecov.io](https://codecov.io) → Your repo → Copy upload token |
| `DATABASE_URL` | For E2E | Test database | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | For integration tests | Claude API | Anthropic Console → API Keys |

### Step 2: Enable Branch Protection

Navigate to: **Settings → Branches → Add rule**

**Branch name pattern**: `main`

Enable:
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Require approvals: 1
- ✅ Dismiss stale pull request approvals

**Required status checks** (select all):
- `lint`
- `type-check`
- `unit-tests`
- `build`
- `e2e` (optional - enable when stable)

### Step 3: Workflow Permissions

Navigate to: **Settings → Actions → General → Workflow permissions**

Select:
- **Read and write permissions** (for artifacts, PR comments)
- ✅ Allow GitHub Actions to create and approve pull requests

## Environment Variables

### `.env.example` Requirements

All required environment variables must be documented:

```bash
# Required
ANTHROPIC_API_KEY=sk-your-key-here
OPENAI_API_KEY=sk-your-key-here
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# Optional
ELEVENLABS_API_KEY=your-key-here
YOUTUBE_API_KEY=your-key-here
REDIS_URL=redis://localhost:6379
```

**Never commit actual secrets** - use placeholder values only.

## Troubleshooting

### Tests Pass Locally, Fail in CI

**Cause**: Environment differences

**Fix**:
```bash
# 1. Verify Node version matches CI (Node 20)
node --version

# 2. Use exact dependencies (not latest)
npm ci

# 3. Clear cache
npm run clean
npm ci
npm run ci
```

### Build Failing with Cache Issues

```bash
npm run clean
npm ci
npm run build
```

### E2E Tests Timing Out

```bash
# Run with longer timeout
npm run test:e2e -- --timeout=60000

# Debug with UI mode
npm run test:e2e:ui
```

### Lint Errors

```bash
# Auto-fix most issues
npx eslint --fix src/

# View specific errors
npm run lint 2>&1 | head -50
```

### Type Errors

```bash
# Rebuild Prisma types
npx prisma generate

# Check specific file
npx tsc --noEmit src/path/to/file.ts
```

### Coverage Not Uploading

1. Go to **Settings → Secrets and variables → Actions**
2. Verify `CODECOV_TOKEN` exists
3. Check value matches [codecov.io](https://codecov.io) upload token
4. Re-run workflow

## Performance Optimization

### Current CI Times

- **Lint**: 1-2 minutes
- **Type Check**: 1-2 minutes
- **Unit Tests**: 3-5 minutes
- **Build**: 3-5 minutes
- **E2E Tests**: 10-15 minutes

**Total**: ~15-20 minutes for full pipeline

### Optimization Strategies

#### 1. Enable Caching

Already configured:
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'  # Caches node_modules
```

#### 2. Cancel In-Progress Runs

Prevents duplicate runs:
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

#### 3. Skip Workflows for Docs

```yaml
on:
  push:
    paths-ignore:
      - 'docs/**'
      - '**.md'
```

## Status Badges

Add to your `README.md`:

```markdown
[![CI](https://github.com/YOUR_ORG/learnwithavi/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_ORG/learnwithavi/actions/workflows/ci.yml)
[![E2E Tests](https://github.com/YOUR_ORG/learnwithavi/actions/workflows/e2e.yml/badge.svg)](https://github.com/YOUR_ORG/learnwithavi/actions/workflows/e2e.yml)
```

## Vercel Integration

Vercel runs in parallel with GitHub Actions:

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "installCommand": "npm ci",
  "env": {
    "ANTHROPIC_API_KEY": "@anthropic-api-key",
    "OPENAI_API_KEY": "@openai-api-key"
  }
}
```

1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Both CI and Vercel must pass before merge

## Security Best Practices

### 1. Never Hardcode Secrets

```yaml
# Bad
env:
  API_KEY: "sk-ant-..."

# Good
env:
  API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### 2. Pin Action Versions

```yaml
# Good
- uses: actions/checkout@v4

# Avoid
- uses: actions/checkout@latest
```

### 3. Limit Secret Access

Only expose secrets to jobs that need them:

```yaml
jobs:
  deploy:
    env:
      API_KEY: ${{ secrets.API_KEY }}  # Only in deploy job
```

### 4. Use OIDC for Cloud Providers

For AWS, GCP, Azure - use short-lived tokens:

```yaml
- uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::ACCOUNT_ID:role/github-actions
```

## Common Issues

### Workflow Not Triggering

**Check**:
1. Branch name matches exactly (case-sensitive): `branches: [main]`
2. File path filters don't exclude your changes
3. Workflow YAML is valid: `npx actionlint .github/workflows/ci.yml`

### Secrets Not Available

**Check**:
1. Secret name in Settings matches workflow exactly
2. Workflow has read permissions: **Settings → Actions → Workflow permissions**
3. Correct syntax: `${{ secrets.SECRET_NAME }}` (not `secret.NAME`)

### Artifacts Not Uploading

**Check**:
1. Path exists before upload: `ls -la coverage/`
2. Use glob patterns: `path: coverage/**`
3. Upload on all conditions: `if: always()`

## Monitoring

### View Workflow Analytics

**Actions → All workflows**

Track:
- Success/failure rates
- Execution time trends
- Most common failure reasons

### Enable Dependabot

**Settings → Code security and analysis**

Enable:
- ✅ Dependabot alerts
- ✅ Secret scanning
- ✅ Code scanning (CodeQL)

## Cost Optimization

GitHub Actions free tier:
- **2,000 minutes/month** (private repos)
- **Unlimited** (public repos)

### Reduce Usage

1. **Skip docs changes**:
   ```yaml
   paths-ignore:
     - 'docs/**'
     - '**.md'
   ```

2. **Cancel in-progress runs** (see above)

3. **Limit artifact retention**:
   ```yaml
   retention-days: 7  # Instead of 30
   ```

4. **Run E2E selectively**:
   ```yaml
   if: github.event_name == 'push' && github.ref == 'refs/heads/main'
   ```

## Advanced Configuration

### Slack Notifications

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "CI failed on ${{ github.ref }}"
      }
```

### Matrix Testing

Test across multiple Node versions:

```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]
steps:
  - uses: actions/setup-node@v4
    with:
      node-version: ${{ matrix.node-version }}
```

### Conditional Jobs

```yaml
jobs:
  deploy:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: npm run deploy
```

## Related Documentation

- [Testing Guide](./testing.md) - Test setup and best practices
- [Contributing Guidelines](../CONTRIBUTING.md) - PR requirements
- [GitHub Actions Docs](https://docs.github.com/en/actions) - Official documentation
