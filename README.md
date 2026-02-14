# LearnWithAvi

AI-powered interactive learning platform with voice AI tutoring, RAG-based Q&A, and personalized learning paths.

**Status**:
[![CI](https://github.com/avilevi/learnwithavi/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/avilevi/learnwithavi/actions/workflows/ci.yml)
[![E2E Tests](https://github.com/avilevi/learnwithavi/actions/workflows/e2e.yml/badge.svg?branch=main)](https://github.com/avilevi/learnwithavi/actions/workflows/e2e.yml)
![Node Version](https://img.shields.io/badge/node-20.18.0-green)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

## Tech Stack

- **Frontend**: Next.js 15.5.7, React 19, TypeScript, Tailwind CSS
- **AI**: Claude Sonnet 4, OpenAI Embeddings, ElevenLabs TTS
- **Database**: PostgreSQL + Prisma ORM
- **Vector DB**: pgvector with hybrid search (BM25 + semantic)
- **Auth**: NextAuth.js
- **Testing**: Vitest (unit), Playwright (E2E)
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel
- **Language**: Hebrew (RTL) + English

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Commands

### Development
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server
```

### Testing
```bash
npm run ci               # Run all checks (type check, lint, unit tests, build)
npm run type-check       # TypeScript type checking
npm run lint             # ESLint linting
npm run test:unit        # Unit tests with coverage (Vitest)
npm run test:e2e         # End-to-end tests (Playwright)
npm run test:e2e:ui      # E2E tests with UI for debugging
```

### Database
```bash
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio
```

### Other
```bash
npm run clean            # Clean build caches
npm run lint:fix         # Auto-fix linting issues
npm run docs:generate    # Generate API documentation
npm run storybook        # Start Storybook component library
```

## Project Structure

```
learnwithavi/
├── .github/workflows/        # CI/CD pipelines
├── src/
│   ├── app/                  # Next.js app router (pages + API)
│   ├── components/           # React components
│   ├── lib/                  # Core utilities (RAG, auth, db)
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript type definitions
│   └── i18n/                 # Internationalization (Hebrew/English)
├── prisma/                   # Database schema & migrations
├── e2e/                      # End-to-end tests (Playwright)
├── docs/                     # Documentation
├── skills/                   # Claude Code skills
└── scripts/                  # Utility scripts
```

## CI/CD Pipeline

Automated testing and quality checks run on every pull request and push to main.

**Workflows**:
- **CI** (`.github/workflows/ci.yml`) - Type check, lint, unit tests, build
- **E2E** (`.github/workflows/e2e.yml`) - End-to-end testing across browsers
- **Deploy Check** (`.github/workflows/deploy-check.yml`) - Deployment readiness
- **Quality** (`.github/workflows/quality-checks.yml`) - Security, bundle size, code quality

See [CI/CD Pipeline Documentation](./docs/CICD_SETUP.md) for detailed setup and troubleshooting.

### PR Requirements

All PRs to main require:
1. Passing CI checks (lint, type check, unit tests, build)
2. Passing E2E tests
3. Valid PR description and title
4. No hardcoded secrets
5. Updated `.env.example` if adding new environment variables

## Environment Variables

Create `.env.local` from `.env.example` and add your API keys:

**Required**:
- `ANTHROPIC_API_KEY` - Claude API key for chat
- `OPENAI_API_KEY` - OpenAI API key for embeddings
- `NEXTAUTH_SECRET` - NextAuth session secret
- `NEXTAUTH_URL` - Application URL (e.g., http://localhost:3000)
- `DATABASE_URL` - PostgreSQL connection string

**Optional**:
- `ELEVENLABS_API_KEY` - ElevenLabs for text-to-speech
- `YOUTUBE_API_KEY` - YouTube API for video metadata
- `CODECOV_TOKEN` - Codecov for coverage reporting

Never commit `.env.local` or actual API keys to the repository.

## Testing

### Unit Tests
```bash
npm run test:unit        # Run with coverage
npm run test:unit -- --watch    # Watch mode
npm run test:unit -- --ui       # UI mode
```

### E2E Tests
```bash
npm run test:e2e         # Run all tests
npm run test:e2e:ui      # Interactive test runner
npm run test:e2e -- --grep "course"    # Run specific tests
```

### Coverage
Unit test coverage report is generated at `coverage/index.html`.

Coverage thresholds (enforced):
- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

## Deployment

### Prerequisites
- PostgreSQL database
- Environment variables configured
- All tests passing

### Local Build Verification
```bash
npm run build
npm start
```

### Deploy to Vercel

1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Push to main branch - Vercel automatically deploys

**Build Command**: `npm run build`
**Start Command**: `npm start`

See [Deployment Guide](./docs/guides/deployment.md) for detailed instructions.

## Features

- 🎥 **Video Learning** - YouTube integration with player and transcript
- 💬 **AI Chat** - Claude-powered Q&A with RAG context
- 🎤 **Voice AI Tutor** - Real-time voice conversation with AI
- 🔊 **Text-to-Speech** - Multi-language voice responses
- 📊 **Progress Tracking** - Monitor learning progress
- 🔍 **Hybrid Search** - pgvector + BM25 keyword search
- 🌐 **Bilingual** - Hebrew (RTL) and English support
- 👨‍💼 **Admin Panel** - Full CRUD for courses and videos

## Documentation

- [CI/CD Setup](./docs/CICD_SETUP.md) - Automated testing and deployment
- [API Reference](./docs/api/) - API endpoint documentation
- [Component Guide](./docs/architecture/) - Component patterns and structure
- [Testing Guide](./docs/guides/testing.md) - Testing strategies and best practices
- [Contributing](./CONTRIBUTING.md) - Contribution guidelines

## Important Notes

### Next.js Version
**Version 15.5.7 is locked** - Do not upgrade to Next.js 16.x. Version 15.5.7 is:
- Stable and fully tested
- Compatible with React 19
- Security patched
- Free of cache corruption issues

### Security
- Never commit API keys or secrets
- Use `.env.local` for local development
- Always use GitHub Actions Secrets for CI/CD
- Review audit logs regularly

### Performance
- First startup: ~1.2s
- Cached pages: 22-135ms
- Hot reload: 98-284ms

## Admin Panel

Access admin features for content management:
- **Login**: http://localhost:3000/admin/login
- **Courses**: http://localhost:3000/admin/courses
- **Videos**: http://localhost:3000/admin/videos

Default credentials are in `.env.local` (change in production).

## Troubleshooting

### Build fails with TypeScript errors
```bash
npm run type-check
npm run clean
npm ci
npm run build
```

### E2E tests timeout
```bash
npm run test:e2e:ui    # Debug in interactive mode
```

### Port 3000 already in use
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

### Database connection issues
```bash
npx prisma db push
npx prisma generate
```

## Support

For issues, questions, or contributions:
1. Check existing [documentation](./docs/)
2. Review [troubleshooting guide](./docs/CICD_SETUP.md#troubleshooting)
3. Open a GitHub issue with detailed description

## License

See [LICENSE](./LICENSE) for details.

## Related

- [CLAUDE.md](./CLAUDE.md) - Claude Code configuration
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [CHANGELOG.md](./CHANGELOG.md) - Release notes and changes
