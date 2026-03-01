# LearnWithAvi v1.0 — Release Notes

**Release Date:** March 2026
**Status:** Production-Ready

---

## What is LearnWithAvi?

LearnWithAvi is an AI-powered interactive learning platform where developers master AI/ML through personalized, voice-enabled course experiences — powered by the very technology they're learning.

Built with Next.js 15, React 19, TypeScript (strict mode), and Claude AI, the platform delivers a full learning experience with voice tutoring, adaptive quizzes, and RAG-based Q&A in both Hebrew and English.

---

## Platform Highlights

### AI Tutor powered by Claude
An always-available AI tutor sits alongside every video lesson. Students ask questions about the content and get context-aware answers powered by a RAG pipeline that combines vector search (pgvector) with keyword search (BM25) for accurate retrieval in both Hebrew and English.

> **Storybook:** `Design System/Pages/Course Page` — see the 3-column layout with the AI Chat panel on the right, showing user/AI message bubbles and a typing indicator.

### Voice AI Tutoring
A flagship feature — students can talk to the AI tutor using push-to-talk voice interaction. The system uses Whisper for speech-to-text, Claude for generating responses, and ElevenLabs for natural text-to-speech with streaming playback and sub-second first-chunk latency.

> **Storybook:** `Voice/VoiceChatInterface` — shows all four states side by side: Idle, Recording (with live waveform), Processing (transcription preview), and Playing (AI response with latency metrics: STT 340ms, LLM 900ms).

> **Storybook:** `Voice/WaveformVisualizer` — real-time audio waveform using Web Audio API AnalyserNode, with Active vs Idle comparison.

> **Storybook:** `Voice/MicrophoneButton` — the microphone button in all states: idle (green), recording (red pulsing), processing, and playing.

> **Storybook:** `Voice/VoiceSettingsPanel` — language selection (English, Hebrew, auto-detect), voice picker, and button mode (toggle vs push-to-talk).

### Video Course Player
A three-column layout designed for focused learning. Chapter sidebar on the left, video player with transcript/quiz tabs in the center, and the AI tutor chat on the right. Progress is tracked automatically — the thin green progress bar at the top shows how far along you are.

> **Storybook:** `Design System/Pages/Course Page` — the full course experience with chapter list (checkmarks for completed), video player, transcript with active-line highlighting, and the AI Chat panel.

### Adaptive Quizzes
AI-generated quizzes that adapt based on Bloom's Taxonomy — progressing from knowledge recall to analysis and evaluation. Quiz results are persisted and visible in the student dashboard.

### Student Dashboard & Progress Tracking
Students see their enrolled courses, completion percentages, and quiz history. Video progress auto-saves so they can pick up exactly where they left off. Upon course completion, students earn PDF certificates.

### Course Catalog
A searchable catalog with filters for browsing available courses. Each course card shows the title, difficulty level, video count, duration, and a mini progress bar.

> **Storybook:** `Design System/Pages/Homepage` — the landing page with hero section, course grid (React Fundamentals, Node.js Advanced, AI Integration), and the green accent design system.

---

## Admin Panel

A full content management system for course administrators.

### Dashboard
Stats at a glance: total courses, total videos, published content counts, and student enrollment numbers. Below, a table of recent videos with thumbnails, course assignments, durations, and publish status.

> **Storybook:** `Design System/Pages/Admin — Dashboard` — sidebar navigation, stats grid with green glow hover effects, and the recent videos table.

### Content Management
- Upload and manage videos with YouTube integration
- Ingest transcripts automatically for RAG indexing
- Organize content into courses with chapter ordering
- Publish/draft workflow for content

### Student Analytics
- Voice session analytics (per-student usage, language breakdown)
- Progress tracking across courses
- Quiz performance analytics

### Admin Authentication
Separate admin login flow with its own credentials provider — completely isolated from student auth.

> **Storybook:** `Design System/Pages/Admin — Login` — admin login form with Sign In/Sign Up tabs and error state variant.

---

## Student Authentication

Students sign in with email/password or Google OAuth. The signup flow is simple — name, email, password — and account creation is instant.

> **Storybook:** `Design System/Pages/Auth — Login & Signup` — student login with Google OAuth button, email form, and tab switching between Sign In and Sign Up.

---

## Design System

The platform uses a consistent dark theme with green accent color (#22c55e) throughout. No purple, no color noise — just green on dark surfaces with glassmorphic effects and subtle glow interactions.

> **Storybook:** `Design System/Design Tokens` — the complete reference page showing the semantic color palette (Progress Green, Green Neon, Brand Blue, Warning Amber, Error Red), glow effects with hover previews, fluid typography scale, progress bar states, and motion/easing tokens.

### UI Components

| Component | Storybook Path | Variants |
|-----------|---------------|----------|
| Button | `UI/Button` | Default, Outline, Ghost, Destructive, Link + sizes (sm/lg/icon) + OrbytoDesign |
| Badge | `UI/Badge` | Default, Priority, Success, Warning, Error, Info, Outline + sizes + dot indicator |
| Avatar | `UI/Avatar` | Default, Solid, Ring borders + sizes (sm/md/lg/xl) + AvatarGroup with overflow |
| Progress | `UI/Progress` | 0%-100% states + thin/thick sizes + custom max values |
| GlassCard | `UI/GlassCard` | Light, Dark, Success, Brand, Subtle + padding options + CourseStatCards |
| IconBadge | `UI/IconBadge` | Default, Glass, Solid + sizes + animated hover |

### Shared Components

| Component | Storybook Path | What it shows |
|-----------|---------------|---------------|
| ConfirmDialog | `Components/ConfirmDialog` | Default + Destructive (red) confirmation modals |
| DataTable | `Components/DataTable` | Sortable tables with pagination — Videos table, Students table, Empty state |
| LoadingSpinner | `Components/LoadingSpinner` | Sizes + inline with text + full-page loading |
| SearchInput | `Components/SearchInput` | Empty, with results dropdown, in admin toolbar context |
| Toast | `Components/Toast` | Success (green), Error (red), Info (blue) notification toasts |

### Course Components

| Component | Storybook Path | What it shows |
|-----------|---------------|---------------|
| SummaryModal | `Course/SummaryModal` | AI-generated video summary modal — loading, filled, complex, dark mode |
| Timestamp | `Course/Timestamp` | Clickable video timestamps with active state glow, RTL Hebrew support |

---

## Technical Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15.5.7, React 19, TypeScript strict, Tailwind CSS |
| AI Chat | Claude Sonnet 4 with RAG (pgvector + BM25 hybrid search) |
| Voice STT | Whisper (language-aware, Hebrew optimized) |
| Voice TTS | ElevenLabs streaming (sub-second latency) with browser TTS fallback |
| Database | PostgreSQL + Prisma ORM + pgvector extension |
| Auth | NextAuth.js — admin credentials + user credentials + Google OAuth |
| i18n | next-intl v4 with RTL Hebrew support |
| Deployment | Vercel + Supabase PostgreSQL |
| Testing | Vitest (1,020 tests passing), Playwright E2E, axe-core a11y |
| Design | Storybook 8.6 with 23 story files across 6 categories |

---

## Quality Metrics

| Metric | Value |
|--------|-------|
| TypeScript errors | 0 |
| Test suites passing | 1,020 tests, 0 failures |
| Test coverage | 37%+ lines |
| E2E test suites | 5 critical flows + accessibility suite |
| Build status | Green |
| Accessibility | WCAG 2.1 AA compliant (16 files audited) |
| Security | Zod input validation, CSP headers, rate limiting |
| API versioning | All public routes under `/api/v1/` |

---

## Hebrew & RTL Support

The platform is fully bilingual (Hebrew and English) with complete RTL layout support:
- All UI uses Tailwind logical properties (`ps-4` not `pl-4`)
- next-intl v4 handles locale routing (`/he/`, `/en/`)
- Voice AI supports Hebrew STT and language-aware TTS
- Tested with mixed Hebrew-English content

---

## How to Run Storybook

To see all the components and page designs referenced above:

```bash
npm run storybook
```

Opens at http://localhost:6006. Browse the sidebar to find each story referenced in these release notes. Use the "Docs" tab on each story for auto-generated prop documentation.

---

## What's Next

- Redis-backed rate limiting for multi-instance scaling
- Additional course content and video library expansion
- Enhanced quiz analytics and learning path recommendations
- Mobile app consideration

---

*Built with Claude AI, Next.js, and a relentless focus on making learning interactive.*
