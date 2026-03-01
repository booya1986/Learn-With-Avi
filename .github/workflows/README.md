# GitHub Actions Workflows

This directory contains all CI/CD pipeline configurations for LearnWithAvi.

## Workflow Files

### ci.yml
**Main CI Pipeline** — Triggered on push and pull requests to `main`

- **Jobs**: lint → type-check → unit-tests → build → all-checks
- **Duration**: 5-10 minutes (parallel execution)
- **Purpose**: Verify code quality, TypeScript compilation, tests, and production build
- **Status**: Required for all PRs

```bash
# Run locally
npm run ci
```

### e2e.yml
**End-to-End Tests** — Triggered on push and pull requests to `main`

- **Jobs**: check-secrets → e2e (conditional) → e2e-results
- **Duration**: 20-30 minutes (if secrets configured)
- **Purpose**: Run Playwright E2E tests against database
- **Status**: Optional (skipped if DATABASE_URL secret missing)

**To Enable**:
1. Create test database on Supabase/Railway/Neon
2. Add `DATABASE_URL` secret to GitHub Actions
3. Workflow will run automatically on next push

```bash
# Run locally
npm run test:e2e
npm run test:e2e:ui  # Interactive mode
```

### quality-checks.yml
**Security & Quality** — Triggered on changes to `src/`, `package.json`, or workflows

- **Jobs**: dependency-check → bundle-size → code-quality → accessibility-check
- **Duration**: 5-10 minutes
- **Purpose**: Audit dependencies, analyze bundle size, check code patterns
- **Status**: Informational (warnings only)

### deploy-check.yml
**Deployment Readiness** — Triggered on PR open/update to `main`

- **Jobs**: deployment-readiness → environment-check → secrets-check
- **Duration**: 2-3 minutes
- **Purpose**: Validate PR metadata, env files, and secrets are not hardcoded
- **Status**: Informational (warnings only)

## Quick Reference

| Workflow | Trigger | Duration | Required |
|----------|---------|----------|----------|
| `ci.yml` | Push, PR | 5-10 min | Yes ✓ |
| `e2e.yml` | Push, PR | 20-30 min | Optional |
| `quality-checks.yml` | Source changes | 5-10 min | No |
| `deploy-check.yml` | PR to main | 2-3 min | No |

## Configuration

### Environment Variables
- `NODE_VERSION`: Set to `'20'` (hardcoded in workflows)
- `NODE_ENV`: Set to `production` for builds, `test` for tests
- `CI`: Set to `true` in E2E tests

### GitHub Secrets
Required for E2E tests:
- `DATABASE_URL`: PostgreSQL connection string (optional)

Optional (used by workflows if available):
- `CODECOV_TOKEN`: For coverage report uploads
- API keys: If needed for tests

### Branch Protection
Recommended on `main`:
- Require passing builds: `ci` workflow
- Require code review: 1 approval
- Require up-to-date branches
- Dismiss stale pull request approvals

See `/docs/deployment/ci-cd-setup.md` for full branch protection rules.

## Troubleshooting

### CI Jobs Failing

**Type check fails**:
```bash
npm run clean
npm run type-check
```

**Linting fails**:
```bash
npm run lint:fix
```

**Tests fail locally but pass in CI**:
- Check `NODE_ENV=test`
- Clear cache: `npm run clean:full && npm ci`
- Ensure all fixtures are committed

**Build fails**:
```bash
npm run clean:full
npm run build
```

### E2E Tests Not Running

**Check if secrets are configured**:
- Go to: https://github.com/{owner}/{repo}/settings/secrets/actions
- Verify `DATABASE_URL` secret exists
- Re-run workflow if just added

**Database connection issues**:
- Verify connection string is correct
- Check database is accepting connections
- Ensure migrations have run: `npx prisma migrate deploy`

### Dependabot PRs

**Auto-merge safe updates**:
```bash
gh pr merge --auto --squash <pr-number>
```

**Review major changes**:
1. Read changelog in PR
2. Test locally: `npm install && npm run ci`
3. Approve if compatible

## Performance

### Optimization Tips

1. **Cache**: npm dependencies cached automatically (hit rate ~90%)
2. **Parallelization**: lint, type-check, unit-tests run concurrently
3. **Early termination**: Build skipped if lint/type-check fail
4. **Concurrency**: Old builds cancelled when new push arrives

### Costs

With free GitHub Actions tier (2,000 min/month):
- CI pipeline: ~200 min/month (20 runs × 10 min)
- Quality checks: ~100 min/month
- E2E tests: ~100 min/month (if enabled)
- Deploy checks: ~60 min/month

**Total**: ~460 min/month (well within free tier)

## Documentation

- **Full Setup Guide**: `/docs/deployment/ci-cd-setup.md`
- **Dependabot Config**: `/github/dependabot.yml`
- **Env Validation**: `scripts/check-env.sh` (bash) or `scripts/validate-env.ts` (TypeScript)
- **This File**: Overview and quick reference

## Next Steps

1. **Review**: Read `/docs/deployment/ci-cd-setup.md`
2. **Test**: Run `bash scripts/check-env.sh` locally
3. **Setup**: Configure branch protection rules
4. **Enable E2E**: Add `DATABASE_URL` secret (optional)

---

**Last Updated**: 2026-03-01
**Maintainer**: DevOps Engineer
