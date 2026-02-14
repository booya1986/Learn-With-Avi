# Changelog

All notable changes to the LearnWithAvi project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **Chat API**: Support both request formats (`messages` array from `useChat` hook and `message`/`conversationHistory` from `CoursePageClient`)
- **Chat API**: Filter out empty messages before sending to Anthropic (prevents "text content blocks must be non-empty" errors)
- **Chat streaming**: Fixed `CoursePageClient` stream reader to handle Vercel AI SDK plain text format instead of custom SSE JSON format
- **Course thumbnail**: Replaced `next/image` with native `<img>` for YouTube thumbnails to fix broken images caused by Next.js image optimization proxy issues; added cascading fallback chain (`maxresdefault` -> `hqdefault` -> `mqdefault`)

### Added
- **Voice AI Tutor Skill** (P0 Flagship Feature):
  - Complete STT→LLM→TTS pipeline with sub-2s latency target
  - `skills/voice-ai-tutor/SKILL.md` - Main skill documentation
  - `skills/voice-ai-tutor/scripts/voice_pipeline.py` - Python pipeline implementation
  - Hebrew language support with Whisper optimization
  - ElevenLabs voice selection guide with Hebrew voices
  - Browser TTS fallback for cost optimization
- **Voice Chat Frontend Integration**:
  - `src/app/api/voice/chat/route.ts` - Voice chat API endpoint
  - `src/components/voice/VoiceChatInterface.tsx` - Push-to-talk UI with waveform
  - Updated `VoicePanel.tsx` with 3-mode toggle (Voice/AI Voice/Text)
- **pgvector Migration** (Replaces ChromaDB dependency):
  - `src/lib/rag-pgvector.ts` - Native PostgreSQL vector search
  - `scripts/migrate-to-pgvector.ts` - Migration script with dry-run support
  - `prisma/migrations/20250202000000_add_pgvector/` - Database migration
  - Environment variable `VECTOR_DB=pgvector|chroma|keyword` for backend selection
- **RAG Pipeline Optimizer** (100% Complete):
  - `scripts/rerank.py` - Semantic re-ranking with Claude/cross-encoder
  - `scripts/evaluate_rag.py` - Comprehensive RAG quality metrics
  - `references/HEBREW_OPTIMIZATION.md` - Hebrew NLP guide
  - `references/RAG_METRICS.md` - Evaluation framework
  - `references/RERANKING.md` - Re-ranking implementation guide
- **Custom BM25 Implementation**:
  - Replaced broken `bm25` npm package with inline TypeScript implementation
  - Hebrew tokenization and stop word removal
  - Hybrid search with Reciprocal Rank Fusion (RRF)
- **Testing Infrastructure**:
  - `src/app/api/__tests__/chat.test.ts` - 22 API tests
  - `src/app/api/__tests__/health.test.ts` - 8 health endpoint tests
  - `src/app/api/__tests__/admin-courses.test.ts` - 22 admin API tests
  - `e2e/admin-panel.spec.ts` - 30 E2E tests for admin panel
  - Fixed progress component tests for jsdom compatibility
- **Playwright MCP Integration**:
  - Configured in `.mcp.json` for browser automation
  - Visual testing and accessibility audit capabilities
- **Complete YouTube Video Ingestion System**:
  - `scripts/ingest-video.ts` - CLI script for automated video ingestion
  - `POST /api/admin/videos/ingest` - API endpoint for video ingestion
  - `VideoIngestForm` component - Admin UI for pasting YouTube URLs
  - Admin page at `/admin/videos/ingest` for easy video management
  - Comprehensive setup guide at `docs/guides/YOUTUBE_INGESTION_SETUP.md`
- YouTube transcript fetch script (`scripts/fetch-transcript.ts`) for automated transcript extraction
- `youtube-transcript` package for fetching video transcripts
- Comprehensive environment loading and verification process
- Detailed session documentation in QUICK_START_TOMORROW.md
- Force update chapters script (`scripts/force-update-chapters.ts`) for syncing chapter data

### Changed
- Updated QUICK_START_TOMORROW.md with complete status from January 18, 2026 session
- Identified transcript availability issues for Videos 2 & 3
- **Fixed chapter sync issue**: Migration script now always updates chapters from config to database
- Chapters now display actual names (e.g., "הקדמה ומה נבנה היום") instead of generic "חלק 1, חלק 2"

### Infrastructure
- Environment setup verified (Next.js 15.5.7, PostgreSQL, API services)
- Development server tested and confirmed operational
- API health monitoring working correctly
- All 22 chapters synced correctly across 3 videos

### Fixed
- Chapter display showing generic "חלק 1" instead of actual chapter names
- Migration script now updates existing video chapters instead of skipping them

### Changed
- Updated RAG system to support pgvector, ChromaDB, and keyword backends
- Health endpoint now reports vector database status dynamically
- Hybrid search uses custom BM25 instead of npm package

### Fixed
- BM25 package dependency error (replaced with inline implementation)
- Progress component tests for jsdom style handling
- Health API tests with proper getVectorDBStatus mocking

### Known Issues
- pgvector extension needs to be enabled in Supabase SQL Editor
- E2E admin tests need selector adjustments for actual UI
- ElevenLabs using browser TTS fallback (API key not configured)

## [0.1.1] - 2026-01-18

### Added
- Documentation management system with comprehensive indexing
- Automated documentation cleanup and migration tools
- Multi-agent architecture for specialized AI assistance
- Voice interaction support (Hebrew and English)
- RAG (Retrieval Augmented Generation) system for context-aware responses
- Admin panel for course and content management
- Interactive video player with chapter navigation
- Semantic search across video transcripts

### Changed
- Reorganized documentation structure (337 files organized into logical directories)
- Cleaned root directory from 23 to 1 markdown file
- Updated README with comprehensive project information

### Infrastructure
- Documentation management utilities (docs-manager.js)
- Migration and cleanup scripts
- Automated link checking and orphan detection

## [0.1.0] - 2026-01-17

### Added
- Initial project setup with Next.js 15
- Basic course and video management
- AI-powered chat interface
- Database schema with Prisma ORM
- Authentication with NextAuth.js
- Admin dashboard
- API routes for core functionality

### Technical Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **AI/ML**: Claude API, OpenAI Embeddings, ChromaDB
- **Voice**: ElevenLabs, Web Speech API
- **Auth**: NextAuth.js

---

## Version Guidelines

### Version Format: MAJOR.MINOR.PATCH

- **MAJOR**: Breaking changes or significant architectural updates
- **MINOR**: New features, backward-compatible functionality
- **PATCH**: Bug fixes, documentation updates, minor improvements

### Change Categories

- **Added**: New features or functionality
- **Changed**: Changes to existing functionality
- **Deprecated**: Features marked for removal in future versions
- **Removed**: Removed features or functionality
- **Fixed**: Bug fixes
- **Security**: Security vulnerability fixes
- **Infrastructure**: Development tools, build process, documentation

---

## Contributing to Changelog

When making changes to the project:

1. Add your changes under the `[Unreleased]` section
2. Use the appropriate category (Added, Changed, Fixed, etc.)
3. Write clear, concise descriptions
4. Reference issue/PR numbers when applicable
5. Maintain reverse chronological order (newest first)

Example:
```markdown
### Added
- User profile management (#123)
- Dark mode toggle (#124)

### Fixed
- Video playback on Safari (#125)
```

---

## Release Process

When creating a new release:

1. Move items from `[Unreleased]` to a new version section
2. Add the release date in YYYY-MM-DD format
3. Update version in `package.json`
4. Create a git tag: `git tag -a v0.2.0 -m "Release v0.2.0"`
5. Update the `[Unreleased]` link at the top

---

**Note**: This changelog started on 2026-01-17 with version 0.1.0. Prior changes may not be fully documented.
