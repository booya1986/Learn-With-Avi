# Dependency Management Guide

Quick reference for managing dependencies in the LearnWithAvi platform.

## Quick Commands

### Check Dependencies

```bash
# Check for outdated packages
npm run deps:check

# Security audit (moderate+ severity only)
npm run security:audit

# List all installed packages
npm list --depth=0
```

### Update Dependencies

```bash
# Interactive update (shows available updates)
npm run deps:update

# Update specific package
npm install package-name@latest

# Update all patch/minor versions (safe)
npm update
```

### Validate Project

```bash
# Run all checks (type-check + lint + tests)
npm run validate

# Individual checks
npm run type-check          # TypeScript type checking
npm run lint                # ESLint
npm run lint:fix            # Auto-fix linting issues
npm run test:unit           # Run unit tests
```

### Development

```bash
# Watch mode for type checking
npm run typecheck:watch

# Clean and reinstall
npm run clean:full
```

## Dependency Rules

### DO ✅

- Use exact versions for critical packages (Next.js, React)
- Keep devDependencies separate from dependencies
- Run `npm run security:audit` before releases
- Update dependencies regularly (weekly check)
- Test after updating dependencies

### DON'T ❌

- Use `npm audit fix --force` (can break things)
- Upgrade Next.js beyond 15.x (16.x incompatible per CLAUDE.md)
- Install both `bcrypt` and `bcryptjs` (use native `bcrypt` only)
- Add unused dependencies
- Skip testing after updates

## Critical Dependencies

### Production

| Package | Version | Purpose | Can Update? |
|---------|---------|---------|-------------|
| `next` | 15.5.7 | Framework | Patch only (15.x) |
| `react` | 19.2.3 | UI library | Minor only |
| `@prisma/client` | 5.22.0+ | Database ORM | Yes |
| `@anthropic-ai/sdk` | Latest | Claude API | Yes |
| `openai` | Latest | Embeddings/STT | Yes |
| `bcrypt` | 6.0.0+ | Password hashing | Yes |

### Development

| Package | Version | Purpose | Can Update? |
|---------|---------|---------|-------------|
| `typescript` | 5.x | Type system | Minor only |
| `vitest` | 2.x | Testing | Yes |
| `eslint` | 9.x | Linting | Yes |
| `prisma` | 5.22.0+ | DB CLI | Match @prisma/client |

## Security Guidelines

### Before Installing

1. Check package reputation (npm downloads, GitHub stars)
2. Review package.json for suspicious scripts
3. Check for known vulnerabilities: `npm audit`
4. Verify package is actively maintained

### After Installing

1. Run security audit: `npm run security:audit`
2. Check bundle size impact: `npm run build`
3. Run all tests: `npm run validate`
4. Commit package-lock.json

### Regular Audits

```bash
# Weekly
npm run deps:check

# Before releases
npm run security:audit
npm run validate
npm run build
```

## Common Issues

### Port 3000 in Use
```bash
lsof -ti:3000 | xargs kill -9
```

### Corrupted node_modules
```bash
npm run clean:full
```

### Type Errors After Update
```bash
npm run db:generate  # Regenerate Prisma client
npm run type-check   # Verify
```

### Build Failures
```bash
npm run clean        # Clear Next.js cache
npm run build        # Rebuild
```

## Dependency Update Checklist

When updating dependencies:

- [ ] Check release notes for breaking changes
- [ ] Update one package at a time (easier to debug)
- [ ] Run `npm run type-check`
- [ ] Run `npm run lint`
- [ ] Run `npm run test:unit`
- [ ] Run `npm run build`
- [ ] Test critical features manually
- [ ] Commit package.json and package-lock.json together
- [ ] Document breaking changes in CHANGELOG.md

## Emergency Rollback

If an update breaks the build:

```bash
# 1. Revert package files
git checkout HEAD -- package.json package-lock.json

# 2. Clean install
npm run clean:full

# 3. Verify
npm run validate
```

## Migration Notes

### chromadb → pgvector
- ✅ Removed chromadb (v0.1.x)
- ✅ Added pgvector extension to PostgreSQL
- ✅ Updated RAG pipeline (see docs/guides/PGVECTOR_MIGRATION.md)

### bcryptjs → bcrypt
- ✅ Removed bcryptjs
- ✅ Using native bcrypt (30% faster)
- ✅ Updated all imports

## Related Documentation

- [PGVECTOR_MIGRATION.md](./PGVECTOR_MIGRATION.md) - Vector database migration
- [../CLAUDE.md](../../CLAUDE.md) - Project constraints and rules
- [DEPENDENCY_CLEANUP_SUMMARY.md](../../DEPENDENCY_CLEANUP_SUMMARY.md) - Latest cleanup results
