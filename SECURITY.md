# Security Policy

## Supported Versions

| Version | Supported          | Status |
| ------- | ------------------ | ------ |
| 0.1.x   | :white_check_mark: | Active |

## Reporting a Vulnerability

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please email security@learnwithavi.com with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and provide updates every 72 hours.

## Response Commitments

- **Initial Response**: Within 48 hours
- **Status Updates**: Every 72 hours
- **Patch Timeline**: Critical issues within 7 days, High within 30 days
- **Public Disclosure**: 90 days after patch release (coordinated disclosure)

## Security Measures

### Input Validation
- All user inputs are validated and sanitized
- SQL injection prevention via Prisma ORM parameterized queries
- XSS protection through React's automatic escaping and CSP headers

### Rate Limiting
- Chat API: 10 requests/minute per IP
- Voice/Quiz API: 5 requests/minute per IP
- Login attempts: 5 failures per 15 minutes
- Admin endpoints: Enhanced rate limiting with authentication required

### Authentication & Authorization
- NextAuth.js with secure session management
- Role-based access control (RBAC) for admin panel
- CSRF protection on all state-modifying endpoints
- Secure password hashing with bcrypt

### Data Protection
- PostgreSQL encryption at rest (production)
- HTTPS/TLS for all network communication
- Environment variables never committed to repository
- Sensitive logs sanitized before storage

### API Security
- API key validation on all endpoints
- Request signing for admin operations
- Error messages don't leak sensitive information
- Proper HTTP status codes (no information leakage)

### Dependencies
- Automated dependency updates via Dependabot
- Regular security audits with npm audit
- Pre-commit hooks prevent committed secrets

### Logging & Monitoring
- Sentry integration for error tracking and monitoring
- LogRocket for session replay and debugging
- Audit logs for admin operations
- Rate limit violation alerts

## Best Practices for Users

### For Developers
1. Never commit `.env.local` or secrets to the repository
2. Use `.env.example` as a template for required variables
3. Review code for hardcoded API keys before committing
4. Keep dependencies updated
5. Enable 2FA on GitHub account

### For Deployers
1. Rotate API keys regularly
2. Use strong, unique admin passwords
3. Enable HTTPS in production
4. Monitor error logs and alerts
5. Backup database regularly
6. Keep the application updated

## Security Headers

LearnWithAvi implements the following security headers:

- **Content-Security-Policy**: Restricts resource loading
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-Frame-Options**: Prevents clickjacking
- **Strict-Transport-Security**: Enforces HTTPS
- **X-XSS-Protection**: Legacy XSS protection

## Security Checklist for Deployments

Before deploying to production:
- [ ] All environment variables configured in hosting platform
- [ ] `npm audit` shows no high/critical vulnerabilities
- [ ] Tests passing (unit, E2E, security)
- [ ] Security headers present in response
- [ ] Rate limiting configured
- [ ] Error logging doesn't expose sensitive data
- [ ] API keys rotated if previously exposed
- [ ] Database backups configured
- [ ] HTTPS/TLS enforced (no HTTP)
- [ ] CSP headers properly configured

## Dependencies

This project uses the following key security libraries:
- **NextAuth.js** - Authentication & session management
- **Prisma ORM** - SQL injection prevention
- **Zod** - Input validation
- **@sentry/nextjs** - Error tracking with secret redaction
- **bcrypt** - Secure password hashing

All dependencies are regularly updated via Dependabot.

## Compliance

The platform implements:
- OWASP Top 10 mitigations
- WCAG 2.1 AA accessibility standards
- Data privacy best practices (GDPR-aligned)
- Secure coding standards (TypeScript strict mode)
- Industry-standard cryptography (bcrypt, TLS 1.2+)

## Known Security Considerations

### Next.js Version Lock
- **Current**: Next.js 15.5.7 (security-patched)
- **Rationale**: Version 16.x has fatal bundler incompatibilities
- **Security Patches**: CVE-2025-66478, CVE-2025-55182 applied
- **DO NOT upgrade** beyond 15.5.7 without thorough testing

### API Key Management
- All API keys stored in environment variables (never in code)
- Sanitized from error messages and Sentry reports
- Rate limiting prevents API abuse
- Keys validated at startup with `validate:env` script

### Hebrew/RTL Content Security
- XSS protection works with bidirectional text
- Input sanitization handles RTL characters correctly
- CSP headers configured for mixed Hebrew-English content

## Contact

For security inquiries or to report a vulnerability:
- Email: security@learnwithavi.com
- PGP Key: [To be added when available]

For general questions: Open a GitHub discussion

## Acknowledgments

Thank you to the security researchers who have reported vulnerabilities responsibly.

Last updated: 2026-02-14
