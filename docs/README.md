# LearnWithAvi Documentation

Complete documentation for the AI-powered interactive learning platform.

## Quick Links

- [PROJECT.md](../PROJECT.md) - Project hub (GSD context files, stack, key paths)
- [Main README](../README.md) - Project overview and setup
- [CLAUDE.md](../CLAUDE.md) - Claude Code configuration
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [ROADMAP.md](../ROADMAP.md) - Phase-based roadmap
- [STATE.md](../STATE.md) - Current blockers and metrics

## Documentation Structure

### Getting Started

- [Installation & Setup](../README.md#installation) - First-time setup
- [Quick Start](../CLAUDE.md#quick-start) - Get running in 5 minutes
- [Quickstart Checklist](./getting-started/quickstart-checklist.md) - Setup checklist
- [Database Setup](./getting-started/database-setup.md) - Database configuration

### Guides (How-To)

Task-oriented guides for common workflows:

| Guide | Purpose | Time |
|-------|---------|------|
| **[CI/CD Pipeline](./guides/cicd.md)** | Set up GitHub Actions | 15 min |
| **[Monitoring & Error Tracking](./guides/monitoring.md)** | Configure Sentry | 10 min |
| **[Auth & Rate Limiting](./guides/auth-middleware.md)** | Secure admin routes | 15 min |
| [Testing](./guides/testing.md) | Run unit & E2E tests | 10 min |
| [Admin Panel](./guides/admin-panel.md) | Manage courses & videos | 10 min |
| [YouTube Ingestion](./guides/YOUTUBE_INGESTION_SETUP.md) | Add video content | 20 min |
| [Hybrid Search](./guides/HYBRID_SEARCH_GUIDE.md) | Vector + keyword search | 15 min |
| [pgvector Migration](./guides/PGVECTOR_MIGRATION.md) | PostgreSQL vector search | 20 min |
| [QA Quick Reference](./guides/qa-quick-reference.md) | Testing checklist | 5 min |

### API Reference

API route documentation:

- [API Quick Reference](./api/quick-reference.md)
- [API Versioning Guide](./api/VERSIONING.md) - v1 routing rules
- [Admin API](./api/admin/documentation.md) - CRUD operations

### Architecture

System design and architecture decisions:

- [Architecture Overview](./architecture/overview.md) - High-level design
- [Implementation Details](./architecture/implementation.md) - Technical details
- [Component Extraction](./architecture/component-extraction-initiative.md) - 300-line rule
- [Video System Rules](./VIDEO_SYSTEM_RULES.md) - Video player behavior

### Configuration

Setup and configuration guides:

- [Figma MCP](./configuration/FIGMA_MCP_SETUP.md) - Figma integration
- [Context7 MCP](./configuration/CONTEXT7_MCP_SETUP.md) - AI context management
- [Google OAuth Setup](./deployment/google-oauth-setup.md) - Google OAuth credentials

### Product

Product specifications and planning:

- [Product Requirements (PRD)](./product/prd.md)
- [Skills Recommendations](./SKILLS_RECOMMENDATIONS.md)

### Skills

Custom Claude Code skills (located in `../skills/`):

- [GSD Workflow](../skills/gsd/) - Plan/execute phases with fresh agent context (orchestrator)
- [Voice AI Tutor](../skills/voice-ai-tutor/) - Real-time voice tutoring
- [RAG Pipeline Optimizer](../skills/rag-pipeline-optimizer/) - Search optimization
- [Figma to Code](../skills/figma-to-code/) - Design to React components
- [Product Storyteller](../skills/product-storyteller/) - Marketing content

## Common Tasks

### For Developers

**First time setup**:
```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Add your API keys

# 3. Set up database
npx prisma migrate dev

# 4. Start dev server
npm run dev
```

**Before pushing code**:
```bash
# Run all checks
npm run ci

# Expected: All tests pass, no lint errors
```

**Add new admin route**:
1. Create route in `src/app/api/admin/`
2. **Don't add auth checks** (middleware handles it)
3. Add tests in `src/app/api/__tests__/`
4. Document in [API docs](./api/admin/documentation.md)

### For Content Creators

**Add new course**:
1. Go to `/admin/courses`
2. Click "Add Course"
3. Fill in details and save
4. See [Admin Panel Guide](./guides/admin-panel.md)

**Ingest YouTube video**:
1. Go to `/admin/videos/ingest`
2. Paste YouTube URL
3. Wait for processing (~2 minutes)
4. See [YouTube Ingestion Guide](./guides/YOUTUBE_INGESTION_SETUP.md)

### For Operations

**Monitor errors**:
1. Check Sentry dashboard: https://sentry.io/
2. Review health endpoint: `curl https://your-domain.com/api/v1/health`
3. See [Monitoring Guide](./guides/monitoring.md)

**Check CI/CD status**:
1. Go to GitHub Actions tab
2. View workflow runs
3. See [CI/CD Guide](./guides/cicd.md)

## Development Phases

| Phase | Status | Description |
|---|---|---|
| Phase 1 — Core Platform | Complete | MVP: video player, AI chat, voice AI, auth, Hebrew RTL |
| Phase 2 — Quality | Complete | 0 TS errors, 35%+ test coverage, CI green |
| Phase 3 — Voice Optimization | Complete | Streaming TTS, Hebrew STT, waveform, voice analytics |
| Phase 4 — Scale | Complete | Student progress, quiz persistence, admin analytics, certificates |
| Phase 5 — Polish & Launch Readiness | In Progress | WCAG 2.1 AA, security headers, E2E tests, CI/CD hardening |

## Documentation Standards

### For Contributors

When creating documentation:

1. **Use Markdown** - GitHub-flavored Markdown
2. **Progressive disclosure** - Quick Start → Details → Advanced
3. **Task-oriented** - "How to X" not "About X"
4. **Scannable** - Headers, tables, code blocks
5. **Working examples** - Test all code samples
6. **No redundancy** - Link instead of duplicating

### File Naming

- Guides: `kebab-case.md` (e.g., `cicd.md`)
- API docs: `resource-name.md` (e.g., `chat.md`)
- Architecture: `SCREAMING_SNAKE.md` (e.g., `ARCHITECTURE.md`)

## Directory Structure

```
docs/
├── README.md                   # This file (documentation hub)
├── SKILLS_RECOMMENDATIONS.md   # Skills strategy
├── VIDEO_SYSTEM_RULES.md       # Video player rules
├── ICD_DEPLOYMENT_CHECKLIST.md # Pre/post-deployment checklist
├── api/                        # API documentation
├── architecture/               # Architecture docs
├── configuration/              # Setup & config
├── deployment/                 # Deployment & infrastructure guides
├── getting-started/            # Quick start guides
├── guides/                     # Developer guides
│   ├── cicd.md                 # CI/CD Pipeline
│   ├── monitoring.md           # Monitoring & Error Tracking
│   ├── auth-middleware.md      # Auth & Rate Limiting
│   ├── testing.md              # Testing guide
│   ├── admin-panel.md          # Admin panel guide
│   └── ...                     # Other guides
├── monitoring/                 # Monitoring & observability
└── product/                    # Product requirements
```

## Getting Help

1. **Check this documentation** - Start here
2. **Search issues** - [GitHub Issues](https://github.com/YOUR_ORG/learnwithavi/issues)
3. **Ask the team** - Post in Slack/Discord
4. **Create an issue** - If you found a bug

## Contributing to Documentation

See [CONTRIBUTING.md](../CONTRIBUTING.md) for documentation contribution guidelines.

### Quick Tips

- Keep docs up-to-date with code changes
- Test all code examples before committing
- Use relative links for internal references
- Add table of contents for docs >500 lines
- Follow the documentation standards above

---

**Last Updated**: 2026-03-01
**Version**: 1.1.0
**Maintainers**: LearnWithAvi Team
