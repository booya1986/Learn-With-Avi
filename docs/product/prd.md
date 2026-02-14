# LearnWithAvi - Product Requirements Document

**AI-Powered Interactive Course Platform with Voice & Text AI Tutor**

Version 3.0 - Implementation Progress Update
January 16, 2026
Author: Avi Levi

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Implementation Status](#implementation-status)
- [Completed Features](#completed-features)
- [Remaining MVP Tasks](#remaining-mvc-tasks)
- [Technical Stack](#technical-stack)
- [Key Files Structure](#key-files-structure)
- [Document History](#document-history)

---

## Executive Summary

LearnWithAvi is an AI-powered interactive learning platform designed to transform existing educational video content from avilevi.co.il blog and social media channels (YouTube: @avilevi86) into an engaging, personalized learning experience for intermediate developers seeking to master AI and Machine Learning concepts.

The platform features an intelligent AI tutor that supports both text chat and voice conversation (voice-to-voice), auto-generated exercises, personalized learning paths, and comprehensive content summaries.

### Vision Statement

*"Empowering developers to master AI/ML through interactive, personalized learning experiences powered by the very technology they're learning about - including a voice AI tutor that feels like having the instructor available 24/7."*

---

## Implementation Status

This section documents what has been built and is currently functional in the LearnWithAvi platform.

### Completed Features

#### Core Platform Architecture
- ✅ Next.js 14 with TypeScript and App Router
- ✅ Tailwind CSS with shadcn/ui component library
- ✅ Three-column responsive layout (AI Chat | Video | Materials)
- ✅ Hebrew RTL language support throughout
- ✅ Dark mode support

#### Video Player System
- ✅ Custom YouTube player integration with react-youtube
- ✅ Chapter-based timeline with visual segments
- ✅ Hover tooltips showing chapter names on timeline
- ✅ Playback speed controls (0.5x to 2x)
- ✅ Volume control with mute toggle
- ✅ Skip forward/backward (10 seconds)
- ✅ Fullscreen support
- ✅ Automatic duration detection from YouTube API

#### Chapter Progress Tracking System

A sophisticated system tracks actual watch time per chapter:

- ✅ Chapters only marked complete when 90%+ actually watched
- ✅ Seeking/jumping does NOT mark chapters as complete
- ✅ Per-chapter progress tracking with visual indicators
- ✅ Sequential watching detection (time delta < 3 seconds)
- ✅ Visual states: Active (blue), Completed (green), Partial (gray with %)
- ✅ Auto-generated chapters when none defined (3-10 chapters based on duration)

#### AI Text Chatbot
- ✅ Left sidebar chat interface with AI Assistant branding
- ✅ Topic-aware responses based on video content
- ✅ Knowledge base for tools: Make, News API, ChatGPT, ElevenLabs, Telegram
- ✅ Clickable inline timestamps in responses (e.g., click '3:05' to seek)
- ✅ Clear indication when topic is outside video scope
- ✅ Chat input always visible at bottom (no scrolling needed)
- ✅ Voice input button (UI ready)

#### Live Transcript
- ✅ Full transcript display below video player
- ✅ Active chunk highlighting synced with video playback
- ✅ Clickable timestamps to seek to any transcript segment
- ✅ 46 transcript chunks covering full 21:48 video duration
- ✅ Visual distinction for past, active, and upcoming segments

#### AI Summary Generation
- ✅ One-click AI summary generation from transcript
- ✅ Structured summary with: About, Tools Used, Process Steps, Benefits
- ✅ Copy to clipboard functionality
- ✅ Modal overlay with loading animation

#### Right Sidebar - Course Materials
- ✅ Course title and description display
- ✅ Dynamic topic tags with color coding
- ✅ Course metadata (Type, Level, Duration, Video count)
- ✅ Chapter list matching video timeline exactly
- ✅ Overall progress bar with time indicators
- ✅ Click-to-seek chapter navigation
- ✅ Compact design preventing overflow

### Video Content Integrated

First video fully integrated with complete data:

- **YouTube ID:** mHThVfGmd6I
- **Title:** איך בניתי אפליקציה שמייצרת סיכום קולי יומי של חדשות AI – לגמרי בלי קוד
- **Duration:** 21:48 (1308 seconds)
- **Chapters:** 10 chapters with accurate timestamps
- **Transcript:** 46 transcript chunks covering full duration
- **Course:** בניית אפליקציות AI ללא קוד

### Documentation Created

- ✅ **VIDEO_SYSTEM_RULES.md** - Comprehensive documentation of video system behaviors
  - Chapter progress tracking rules
  - Video duration handling
  - Auto-generated chapters logic
  - UI/UX rules
  - Adding new videos guide

---

## Key Files Structure

### Core Application Files

```
src/app/course/[courseId]/page.tsx    # Main course page with three-column layout
src/components/video/VideoPlayer.tsx  # Custom YouTube player with chapters
src/data/video-config.ts              # Video and course configuration
src/data/sample-transcripts.ts        # Transcript chunks for AI chatbot
docs/VIDEO_SYSTEM_RULES.md            # System documentation
```

### Configuration System

Adding new videos is simple - add entry to `video-config.ts` with:

- `youtubeId` (required)
- `title` (required)
- `courseId` (required)
- `duration`, `chapters`, `topics` (optional - auto-detected/generated)

---

## Remaining MVP Tasks

### High Priority (P0)

- [ ] Integrate Claude API for real AI responses (currently using mock responses)
- [ ] Implement RAG pipeline with vector embeddings
- [ ] Add voice-to-voice AI tutor functionality
- [ ] User authentication with Clerk
- [ ] Persistent progress storage (database)

### Medium Priority (P1)

- [ ] Add more videos from YouTube channel
- [ ] Mobile responsive optimization
- [ ] Auto-generated quizzes from content
- [ ] Course completion certificates

---

## Technical Stack

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend | Next.js 14 + TypeScript | ✅ Implemented |
| Styling | Tailwind CSS + shadcn/ui | ✅ Implemented |
| Video Player | react-youtube + custom controls | ✅ Implemented |
| AI Chat UI | Custom React components | ✅ Implemented |
| LLM Provider | Claude API (Anthropic) | ⏳ Pending |
| Vector DB | Chroma / Pinecone | ⏳ Pending |
| Voice AI | Whisper + ElevenLabs | ⏳ Pending |
| Authentication | Clerk | ⏳ Pending |
| Database | PostgreSQL + Prisma | ⏳ Pending |

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 16, 2026 | Initial PRD creation |
| 2.0 | Jan 16, 2026 | Added Voice AI Tutor, RAG architecture, cost estimates |
| 3.0 | Jan 16, 2026 | Added Implementation Status section documenting completed features: Video player with chapters, chapter progress tracking, AI chatbot with inline timestamps, live transcript, AI summary, right sidebar materials panel. First video fully integrated. |

---

**For complete version history and detailed feature requirements from v1.0 and v2.0, see [LearnWithAvi-PRD-Complete-History.md](LearnWithAvi-PRD-Complete-History.md)**
