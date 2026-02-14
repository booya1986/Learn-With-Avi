# Security Quick Reference Guide

Quick reference for security commands, configurations, and common tasks.

## Essential Commands

### Daily Security Checks

```bash
# Validate environment configuration
npm run validate:env

# Check for security vulnerabilities
npm run security:audit

# Run tests (includes security tests)
npm run test
```

### Pre-Deployment Checklist

```bash
# Complete security validation
npm run validate:env && \
npm run security:audit && \
npm run test && \
npm run build
```

### Security Maintenance

```bash
# Fix security vulnerabilities automatically
npm run security:fix

# Check for outdated dependencies
npm run deps:check

# Type checking (catches type-related security issues)
npm run type-check
```

## Security Configuration Files

### Critical Files (Never Commit)
- `.env.local` - Local environment variables
- `.env.production` - Production secrets
- Any file with API keys or passwords

### Security Configuration Files
- `SECURITY.md` - Vulnerability reporting policy
- `.github/dependabot.yml` - Automated dependency updates
- `.nvmrc` - Node.js version lock (20.18.0)
- `.editorconfig` - Code formatting consistency
- `scripts/validate-env.ts` - Environment validation

## Environment Variables

### Required for All Environments

```bash
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<min-32-chars>
NEXTAUTH_URL=https://...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

### Optional (Graceful Degradation)

```bash
ELEVENLABS_API_KEY=...
YOUTUBE_API_KEY=...
REDIS_URL=rediss://...
NEXT_PUBLIC_SENTRY_DSN=...
```

### Generate Secure Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate UUID
node -e "console.log(require('crypto').randomUUID())"

# Generate random password
openssl rand -base64 24
```

## API Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/v1/chat` | 10 requests | per minute per IP |
| `/api/v1/voice/*` | 5 requests | per minute per IP |
| `/api/v1/quiz/generate` | 5 requests | per minute per IP |
| `/api/admin/*` | 20 requests | per minute per user |

## Security Headers

Verify security headers in production:

```bash
curl -I https://your-domain.com
```

Expected headers:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy: ...`

## Common Security Tasks

### Setup New Environment

```bash
# 1. Copy environment template
cp .env.example .env.local

# 2. Generate secure secret
openssl rand -base64 32

# 3. Fill in API keys (get from provider consoles)

# 4. Validate configuration
npm run validate:env

# 5. Test the application
npm run dev
```

### Rotate API Keys

```bash
# 1. Generate new key from provider (Anthropic, OpenAI, etc.)

# 2. Update .env.local (development)
vim .env.local

# 3. Update hosting platform (production)
# Vercel: Project Settings > Environment Variables
# Railway: Variables tab
# Netlify: Site Settings > Environment Variables

# 4. Test thoroughly in staging

# 5. Deploy to production

# 6. Revoke old key after 24-48 hours
```

### Handle Security Vulnerability

```bash
# 1. Check for vulnerabilities
npm audit

# 2. Attempt automatic fix
npm run security:fix

# 3. If manual fix needed, update specific package
npm update <package-name>

# 4. Verify fix
npm audit

# 5. Test application
npm run test

# 6. Deploy
npm run build
```

### Review Security Logs

```bash
# View Sentry errors (production)
# Visit: https://sentry.io/

# Check database logs (if using managed PostgreSQL)
# Vercel: Dashboard > Storage > Logs
# Supabase: Logs & Reports

# View build logs
# Vercel: Deployments > [deployment] > Logs
```

## Security Testing

### Manual Security Testing

```bash
# Test rate limiting
for i in {1..15}; do curl -X POST https://your-domain.com/api/v1/chat; done

# Test HTTPS redirect
curl -I http://your-domain.com

# Test security headers
curl -I https://your-domain.com

# Test CORS
curl -H "Origin: https://malicious.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS https://your-domain.com/api/v1/chat
```

### Automated Security Testing

```bash
# Run unit tests (includes security tests)
npm run test:unit

# Run E2E tests (includes authentication flows)
npm run test:e2e

# Run accessibility tests (security aspect of a11y)
npm run test:a11y

# Full test suite
npm run test
```

## Incident Response

### If API Key is Compromised

1. **Immediate**: Revoke compromised key from provider console
2. **Generate**: Create new API key
3. **Update**: Update environment variables in all environments
4. **Deploy**: Push changes to production immediately
5. **Monitor**: Watch for unauthorized usage of old key
6. **Document**: Log incident for future reference

### If Database is Compromised

1. **Immediate**: Revoke database credentials
2. **Isolate**: Take affected database offline
3. **Assess**: Determine extent of breach
4. **Notify**: Contact security team and stakeholders
5. **Restore**: From last known good backup
6. **Rotate**: All credentials and secrets
7. **Investigate**: Root cause analysis
8. **Document**: Complete incident report

### If User Account is Compromised

1. **Immediate**: Force logout all sessions
2. **Reset**: Trigger password reset
3. **Notify**: Email user about suspicious activity
4. **Review**: Check for unauthorized changes
5. **Monitor**: Watch account for further suspicious activity
6. **Document**: Log incident in audit trail

## Security Contacts

### Internal
- Security Team: security@learnwithavi.com
- On-call: [To be configured]

### External
- Anthropic Security: security@anthropic.com
- OpenAI Security: security@openai.com
- Vercel Security: security@vercel.com
- Sentry Support: https://sentry.io/support/

## Documentation Links

- [SECURITY.md](../../SECURITY.md) - Vulnerability reporting policy
- [SECURITY_BEST_PRACTICES.md](./SECURITY_BEST_PRACTICES.md) - Comprehensive guide
- [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md) - Latest audit report
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)

## Tips & Tricks

### Secure Coding Checklist

Before every commit:
- [ ] No hardcoded secrets
- [ ] All inputs validated (Zod schemas)
- [ ] All outputs sanitized
- [ ] Authentication checks present
- [ ] Authorization verified
- [ ] Error messages don't leak info
- [ ] Tests pass (including security tests)
- [ ] No console.log with sensitive data

### Production Deployment Checklist

Before every deployment:
- [ ] `npm run validate:env` passes
- [ ] `npm run security:audit` shows 0 high/critical
- [ ] `npm run test` passes
- [ ] `npm run build` succeeds
- [ ] Environment variables configured in hosting platform
- [ ] Database backups verified
- [ ] Monitoring (Sentry) enabled
- [ ] Rate limiting active
- [ ] HTTPS enforced
- [ ] Security headers present

### Monthly Security Tasks

- [ ] Review security logs for anomalies
- [ ] Update dependencies (Dependabot PRs)
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Review access control policies
- [ ] Test authentication flows
- [ ] Verify backup integrity
- [ ] Check rate limiting effectiveness
- [ ] Review API key usage

## Troubleshooting

### validate:env fails

```bash
# Check what's missing
npm run validate:env

# Fix common issues:
# 1. NEXTAUTH_SECRET too short
openssl rand -base64 32

# 2. DATABASE_URL invalid
# Ensure it starts with postgresql:// or postgres://

# 3. API keys incorrect format
# Anthropic: should start with sk-ant-
# OpenAI: should start with sk-
```

### security:audit shows vulnerabilities

```bash
# Try automatic fix first
npm run security:fix

# If that doesn't work, update specific packages
npm update <package-name>

# If no fix available, check for alternatives
npm outdated
```

### Rate limiting not working

```bash
# Verify rate limiting is enabled in code
# Check src/lib/auth-rate-limit.ts

# Test with curl
for i in {1..15}; do curl -X POST http://localhost:3000/api/v1/chat; done

# Should see 429 status after limit reached
```

## Emergency Contacts

| Severity | Action | Contact | Response Time |
|----------|--------|---------|---------------|
| Critical | Data breach, production down | security@learnwithavi.com | < 1 hour |
| High | API key leaked, authentication bypass | security@learnwithavi.com | < 4 hours |
| Medium | Vulnerability found, suspicious activity | security@learnwithavi.com | < 24 hours |
| Low | Security question, best practice | GitHub Discussion | < 48 hours |

---

**Last Updated**: 2026-02-14
**Version**: 1.0.0
**Maintained By**: Security Team
