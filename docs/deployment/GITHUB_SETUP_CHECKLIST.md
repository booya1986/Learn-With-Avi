# GitHub & CI/CD Setup Checklist

Use this checklist to ensure all GitHub and CI/CD infrastructure is properly configured for LearnWithAvi.

## Phase 1: Initial Setup (New Repository)

- [ ] **Create repository** on GitHub with default branch `main`
- [ ] **Add GitHub collaborators** with appropriate roles (admin, write, read)
- [ ] **Clone repository** locally
- [ ] **Install dependencies**: `npm ci`
- [ ] **Validate environment**: `bash scripts/check-env.sh`
- [ ] **Create `.env.local`**: Copy from `.env.example` and fill required variables
- [ ] **Test local dev**: `npm run dev` — should start without errors

## Phase 2: Workflow Activation

- [ ] **Verify workflows exist** in `.github/workflows/`:
  - [ ] `ci.yml` (main CI pipeline)
  - [ ] `e2e.yml` (E2E tests)
  - [ ] `quality-checks.yml` (dependency/quality checks)
  - [ ] `deploy-check.yml` (PR validation)

- [ ] **Review workflow documentation**: `/docs/deployment/ci-cd-setup.md`

- [ ] **Test workflows** by making a test commit:
  ```bash
  git add .
  git commit -m "ci: test workflow activation"
  git push origin main
  ```
  Then check: https://github.com/{owner}/{repo}/actions

- [ ] **Verify all workflows pass**:
  - [ ] CI workflow completes green (5-10 minutes)
  - [ ] Quality checks complete (informational)
  - [ ] Deploy check completes (informational)

## Phase 3: Secrets Configuration

### Essential Secrets (for production deployment)

- [ ] **Create `NEXTAUTH_SECRET`**:
  ```bash
  openssl rand -base64 32
  ```
  Value: Copy output above
  Location: GitHub Settings > Secrets > Actions > New Secret

- [ ] **Create `NEXTAUTH_URL`**:
  - Development: `http://localhost:3000`
  - Production: `https://learn-with-avi.vercel.app`
  Location: GitHub Settings > Secrets > Actions > New Secret

- [ ] **Create `DATABASE_URL`**:
  - Format: `postgresql://user:pass@host:port/db`
  - Source: Supabase > Connection Pooler (Session Pooler)
  Location: GitHub Settings > Secrets > Actions > New Secret

- [ ] **Create `ANTHROPIC_API_KEY`**:
  - Get from: https://console.anthropic.com/
  Location: GitHub Settings > Secrets > Actions > New Secret

- [ ] **Create `OPENAI_API_KEY`**:
  - Get from: https://platform.openai.com/api-keys
  Location: GitHub Settings > Secrets > Actions > New Secret

### Optional Secrets (for full features)

- [ ] **Create `ELEVENLABS_API_KEY`** (voice synthesis):
  - Get from: https://elevenlabs.io/
  - Optional: Voice tutoring feature (graceful fallback enabled)

- [ ] **Create `YOUTUBE_API_KEY`** (video import):
  - Get from: https://console.cloud.google.com/
  - Optional: YouTube transcript import (manual upload still works)

- [ ] **Create `GOOGLE_CLIENT_ID`** + **`GOOGLE_CLIENT_SECRET`** (OAuth):
  - Get from: https://console.cloud.google.com/apis/credentials
  - Optional: Student Google login (email/password login always works)

- [ ] **Create `CODECOV_TOKEN`** (coverage reporting):
  - Get from: https://codecov.io/
  - Optional: Coverage tracking (fails gracefully)

## Phase 4: Branch Protection

- [ ] **Go to Settings > Branches > Add rule**

- [ ] **Configure rule for `main` branch**:

  **Require status checks**:
  - [ ] Require branches to be up to date before merging
  - [ ] Require status checks to pass: `ci` (all jobs)

  **Require reviews**:
  - [ ] Require a pull request before merging
  - [ ] Require at least 1 approval
  - [ ] Dismiss stale pull request approvals when new commits are pushed
  - [ ] Require code owner reviews

  **Other protections**:
  - [ ] Include administrators in restrictions
  - [ ] Restrict who can push to matching branches (leave empty for all)

- [ ] **Verify rule is active**: Try to push directly to `main` — should be blocked

## Phase 5: Environment Variables & Secrets Verification

- [ ] **Run environment validation**:
  ```bash
  bash scripts/check-env.sh
  ```
  Output should show all REQUIRED variables as `[OK]`

- [ ] **Test GitHub secrets are used correctly**:
  - Create test PR
  - Push to PR branch
  - Verify CI workflow can access secrets (no "secret not found" errors)

- [ ] **Verify secrets are NOT logged**:
  - Go to Actions > Latest CI run
  - Check logs: No API keys or credentials should be visible
  - All credentials should appear as `***` in output

## Phase 6: Dependabot Configuration

- [ ] **Review `.github/dependabot.yml`**:
  - [ ] npm ecosystem configured to check weekly
  - [ ] GitHub Actions ecosystem configured to check monthly
  - [ ] Next.js locked to 15.5.7 (no major/minor upgrades)
  - [ ] Dependencies are grouped (reduce PR noise)

- [ ] **Enable Dependabot**:
  - [ ] Go to Settings > Code security & analysis
  - [ ] Ensure "Dependabot alerts" is enabled (green)
  - [ ] Ensure "Dependabot security updates" is enabled (green)

- [ ] **Configure Dependabot PRs** (Settings > Branches > Branch protection rule):
  - [ ] Allow auto-merge for Dependabot PRs (optional):
    ```bash
    gh repo edit --enable-auto-merge
    ```

## Phase 7: E2E Tests (Optional but Recommended)

- [ ] **Create test database**:
  - Go to Supabase > New Project or use Railway/Neon
  - Create PostgreSQL database
  - Get Session Pooler connection string

- [ ] **Run migrations on test DB**:
  ```bash
  DATABASE_URL="postgresql://..." npx prisma migrate deploy
  ```

- [ ] **Add `DATABASE_URL` secret to GitHub**:
  - Go to Settings > Secrets > Actions > New Secret
  - Name: `DATABASE_URL`
  - Value: Connection string from step 1

- [ ] **Verify E2E tests run**:
  - Make a test commit/push
  - Go to Actions > E2E Tests workflow
  - Should see `e2e` job running (not skipped)
  - Should complete green

- [ ] **Verify E2E doesn't block CI**:
  - E2E should be optional (CI passes even if E2E fails)
  - CI should not wait for E2E to complete

## Phase 8: Team Collaboration Setup

- [ ] **Add CODEOWNERS file** (optional but recommended):
  ```bash
  # Create: .github/CODEOWNERS
  * @your-github-username
  /src/app/api/v1/ @devops-engineer
  /docs/deployment/ @devops-engineer
  ```

- [ ] **Configure team reviews** (Settings > Branch protection > Branch rule):
  - [ ] Require review from code owners: ON
  - [ ] This ensures critical paths get reviewed

- [ ] **Add GitHub Actions role** (if using OIDC with cloud providers):
  - Optional for Vercel/AWS/GCP deployments
  - Not needed for basic CI/CD

## Phase 9: Monitoring & Observability

- [ ] **Check GitHub Actions usage**:
  - Go to Settings > Billing & plans > Actions
  - Should show: ~460 min/month (well within free 2,000 min)
  - Verify no cost issues

- [ ] **Configure Slack notifications** (optional):
  - Go to Settings > Integrations & services
  - Add Slack workspace
  - Get workflow notifications in Slack

- [ ] **Add status badge to README** (optional):
  ```markdown
  ![CI](https://github.com/{owner}/{repo}/actions/workflows/ci.yml/badge.svg)
  ```

## Phase 10: Documentation & Handoff

- [ ] **Review documentation files**:
  - [ ] `/docs/deployment/ci-cd-setup.md` — Complete guide (read first)
  - [ ] `/docs/deployment/GITHUB_SETUP_CHECKLIST.md` — This file
  - [ ] `.github/workflows/README.md` — Quick workflow reference
  - [ ] `/CI-CD_HARDENING_SUMMARY.md` — Implementation summary

- [ ] **Document team processes**:
  - [ ] How to approve/merge Dependabot PRs
  - [ ] How to run tests locally before pushing
  - [ ] What to do if CI fails
  - [ ] How to add new GitHub secrets

- [ ] **Share with team**:
  - [ ] Send link to `.github/workflows/README.md` (quick reference)
  - [ ] Send link to `/docs/deployment/ci-cd-setup.md` (comprehensive guide)
  - [ ] Walk through branch protection rules
  - [ ] Demo E2E test runs

## Phase 11: Testing & Validation

- [ ] **Create test PR** and verify:
  - [ ] All workflows trigger
  - [ ] All checks pass or fail correctly
  - [ ] Cannot merge with failing checks (if branch protection on)
  - [ ] PR can be approved and merged when all checks pass

- [ ] **Test branch protection** by attempting to push directly to `main`:
  ```bash
  git commit --allow-empty -m "test"
  git push origin main
  ```
  Should fail with: "Updates were rejected because the tip of your current branch is behind its remote counterpart"

- [ ] **Test E2E tests** (if enabled):
  - Make PR that modifies tests
  - E2E should run and report results
  - Should post PR comment with results

## Phase 12: Production Readiness Checklist

- [ ] **Before deploying to production**:
  - [ ] All required secrets are set in GitHub
  - [ ] Branch protection is active on `main`
  - [ ] All workflows pass on latest commit
  - [ ] Dependabot is configured and monitoring
  - [ ] Team understands CI/CD process
  - [ ] Documentation is accessible to team

- [ ] **Production deployment steps**:
  - [ ] Connect GitHub repo to Vercel
  - [ ] Add Vercel environment variables (from GitHub secrets)
  - [ ] Deploy to production
  - [ ] Verify application loads correctly
  - [ ] Check monitoring (Sentry, LogRocket if configured)

## Troubleshooting

### Workflows Not Running

**Problem**: Workflows don't trigger on push
- [ ] Check `.github/workflows/` files exist
- [ ] Check `on:` triggers are correct (push, pull_request)
- [ ] Check branch is `main` (not `master` or other)
- [ ] Wait 1-2 minutes (GitHub may need time to register workflows)

### Status Checks Missing

**Problem**: Branch protection requires checks that don't appear
- [ ] Go to Settings > Actions > General
- [ ] Verify GitHub Actions is enabled
- [ ] Run one workflow successfully to populate check name
- [ ] Then enable branch protection with correct check name

### Secrets Not Found

**Problem**: "Secret not found" in workflow logs
- [ ] Verify secret exists: Settings > Secrets > Actions
- [ ] Verify secret is used correctly: `${{ secrets.SECRET_NAME }}`
- [ ] Verify branch protection rule doesn't restrict access
- [ ] Secrets are only available to `main` branch (not forks)

### E2E Tests Timeout

**Problem**: E2E tests timeout or hang
- [ ] Verify `DATABASE_URL` is accessible from GitHub (not localhost)
- [ ] Check database has completed migrations
- [ ] Check for long-running queries in test database
- [ ] Increase timeout in `e2e.yml` if needed (currently 30 min)

### Dependabot Not Creating PRs

**Problem**: No Dependabot PRs appearing
- [ ] Go to Settings > Code security & analysis
- [ ] Verify "Dependabot alerts" is enabled
- [ ] Verify "Dependabot security updates" is enabled
- [ ] Check repo has `package.json` and `package-lock.json`
- [ ] Wait 24 hours for first run (scheduled weekly)

## Success Criteria

✅ **You've successfully set up CI/CD when**:

1. All workflows exist and are active (Settings > Actions > General)
2. All required secrets are configured (Settings > Secrets)
3. Branch protection is active on `main` (Settings > Branches)
4. CI workflow passes on latest commit to `main`
5. Team can create PRs that require CI checks to pass
6. Dependabot creates regular dependency update PRs
7. E2E tests run (if DATABASE_URL secret configured)
8. Documentation is accessible and understood by team
9. Production deployment is connected and working

## Related Documents

- **CI/CD Guide**: `/docs/deployment/ci-cd-setup.md` (comprehensive)
- **Workflow Reference**: `.github/workflows/README.md` (quick)
- **Implementation Summary**: `/CI-CD_HARDENING_SUMMARY.md` (what was built)
- **Next.js Deployment**: https://nextjs.org/docs/deployment/vercel
- **GitHub Actions**: https://docs.github.com/en/actions

---

**Last Updated**: 2026-03-01
**Difficulty**: Intermediate (30-60 minutes)
**Time to Complete**: ~1-2 hours first time, then automated

Use this checklist systematically to ensure nothing is missed!
