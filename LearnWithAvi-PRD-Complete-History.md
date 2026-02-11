# LearnWithAvi PRD - Complete Version History

This document contains all versions of the LearnWithAvi Product Requirements Document, showing the evolution of the product from initial concept to implementation.

---

## Table of Contents

- [Version 1.0 - Initial PRD](#version-10---initial-prd-january-16-2026)
- [Version 2.0 - Voice AI Addition](#version-20---voice-ai-addition-january-16-2026)
- [Version 3.0 - Implementation Progress](#version-30---implementation-progress-january-16-2026)

---

## Evolution Summary

### Version 1.0 → 2.0 (Key Changes)
- ✨ **Added Voice AI Tutor** as flagship feature (voice-to-voice interaction)
- 🔧 **Updated tech stack:** Claude API, ElevenLabs TTS, Whisper STT
- 📚 **Added RAG architecture** details with content boundary enforcement
- 💰 **Added cost estimates:** $255-555/month for MVP
- 📝 **Added transcript preparation guide** for content ingestion

### Version 2.0 → 3.0 (Key Changes)
- ✅ **Added Implementation Status section** documenting completed features
- 🎥 **Documented built features:** Video player, chapter tracking, AI chatbot UI, transcript system
- 📋 **Listed remaining MVP tasks** with priorities
- 📊 **Shorter format** focused on progress update rather than full requirements

---

# Version 1.0 - Initial PRD (January 16, 2026)

## PRODUCT REQUIREMENTS DOCUMENT

### LearnWithAvi
**AI-Powered Interactive Course Platform**

**Transforming AI/ML Educational Content into Interactive Learning Experiences**

Version 1.0
January 2026
Author: Avi Levi

---

## Document Information

| Field | Value |
|-------|-------|
| Document Title | Product Requirements Document - LearnWithAvi |
| Version | 1.0 |
| Date | January 16, 2026 |
| Author | Avi Levi |
| Status | Draft - Ready for Review |
| Target MVP Timeline | 2-4 Weeks |

---

## 1. Executive Summary

LearnWithAvi is an AI-powered interactive learning platform designed to transform existing educational video content from avilevi.co.il blog and social media channels into an engaging, personalized learning experience for intermediate developers seeking to master AI and Machine Learning concepts.

The platform leverages cutting-edge AI technology to enable learners to interact with video content through intelligent Q&A, auto-generated exercises, personalized learning paths, and comprehensive content summaries. This transforms passive video consumption into active, measurable learning.

### 1.1 Vision Statement

*"Empowering developers to master AI/ML through interactive, personalized learning experiences powered by the very technology they're learning about."*

### 1.2 Key Value Propositions

- **Ask Your Teacher Anytime:** AI chatbot trained on Avi's specific content provides instant answers with video timestamp references
- **Learn by Doing:** Auto-generated coding exercises and quizzes derived directly from video content
- **Your Pace, Your Path:** Personalized progression based on demonstrated knowledge and learning goals
- **Never Miss a Point:** AI-generated summaries and key takeaways for every video

---

## 2. Problem Statement

### 2.1 Current Challenges

Educational video content from avilevi.co.il and associated social media platforms currently faces several limitations:

- **Fragmented Content:** Videos are scattered across multiple platforms (YouTube, blog, social media) with no unified learning experience
- **Passive Learning:** Viewers watch but cannot interact, ask questions, or test their understanding
- **No Progress Tracking:** Learners cannot measure their advancement or identify knowledge gaps
- **One-Size-Fits-All:** No personalization based on learner's existing knowledge or learning pace
- **Delayed Feedback:** Questions go unanswered or require waiting for creator response

### 2.2 Market Opportunity

The e-learning market continues to grow rapidly, with particular demand for AI/ML education in the Hebrew-speaking market. There is a significant gap for interactive, AI-enhanced learning platforms that offer personalized experiences in Hebrew. By combining existing high-quality content with AI-powered interactivity, LearnWithAvi can capture this underserved market segment.

---

## 3. Target Audience

### 3.1 Primary Persona: "Alex the Upskiller"

| Attribute | Details |
|-----------|---------|
| Demographics | Software developer, 25-35 years old, 2-4 years experience |
| Goals | Level up AI/ML skills to advance career, build AI-powered features at work |
| Pain Points | Limited time, needs efficient learning, frustrated by passive video content |
| Behaviors | Learns during commute and evenings, prefers hands-on practice over theory |
| Success Criteria | Can implement learned concepts in real projects, understands when to use which technique |

### 3.2 Secondary Personas

- **"Maya the Manager":** Team lead wanting to upskill their team on AI fundamentals. Needs trackable progress and team dashboards.
- **"David the Career Changer":** Professional transitioning into tech, needs comprehensive fundamentals with extra support and practice opportunities.

---

## 4. Content Strategy

### 4.1 Existing Content Inventory

The platform will aggregate and enhance existing educational content from avilevi.co.il covering key AI/ML topics:

| Topic | Description |
|-------|-------------|
| Embeddings | How embeddings work, their role in recommendation engines |
| Zero-Shot & Few-Shot Learning | AI performing tasks without extensive training examples |
| Supervised vs Unsupervised Learning | Core ML approaches and when to use each |
| LoRA (Low-Rank Adaptation) | Efficient fine-tuning techniques for LLMs |
| RAG (Retrieval-Augmented Generation) | Building chatbots with accurate, data-driven responses |

### 4.2 Content Enhancement Pipeline

- **Video Ingestion:** Import videos from YouTube, blog embeds, and social media platforms
- **Transcription:** Auto-transcribe using Whisper with Hebrew language support
- **Embedding Generation:** Create semantic embeddings for RAG-based Q&A system
- **Content Structuring:** Organize into courses, modules, and lessons with prerequisites
- **AI Enhancement:** Generate summaries, exercises, and key takeaways

---

## 5. Feature Requirements

### 5.1 MVP Features (Weeks 1-2)

#### 5.1.1 Video Aggregation & Player [P0]

- Import videos from YouTube API and direct uploads
- Custom video player with playback controls, speed adjustment, and chapter markers
- Timestamp linking from AI responses to video moments
- Mobile-responsive design

#### 5.1.2 AI Q&A Chatbot [P0]

- RAG-based system trained on video transcripts and blog content
- Hebrew language support with natural conversation flow
- Answers include relevant video timestamp references
- Context-aware responses based on current video being watched
- Sidebar chat panel alongside video player

#### 5.1.3 Content Transcription [P0]

- Automatic transcription using OpenAI Whisper
- Hebrew language transcription with technical term accuracy
- Timestamp synchronization for searchability
- Manual correction interface for transcript refinement

#### 5.1.4 Course Structure [P0]

- Organize videos into logical courses and modules
- Define prerequisites and learning paths
- Course catalog with descriptions and difficulty levels
- Admin dashboard for content management

### 5.2 Core Features (Weeks 2-3)

#### 5.2.1 Auto-Generated Exercises [P1]

- AI generates multiple-choice quizzes from video content
- Coding challenges based on concepts taught
- Difficulty scaling based on video complexity
- Instant feedback with explanations

#### 5.2.2 Content Summaries [P1]

- AI-generated executive summary for each video
- Key takeaways and learning objectives
- Chapter breakdowns with timestamps
- Downloadable study notes

#### 5.2.3 Progress Tracking [P1]

- Track video completion and watch time
- Exercise scores and quiz performance
- Learning streaks and gamification elements
- Personal dashboard with analytics

#### 5.2.4 Comments & Discussion [P1]

- Threaded comments on videos
- Timestamp-linked discussions
- Upvoting and best answer highlighting
- Notification system for replies

### 5.3 Advanced Features (Weeks 3-4 / Post-MVP)

#### 5.3.1 Personalized Learning Paths [P2]

- Initial assessment quiz to determine starting level
- AI-recommended content order based on knowledge gaps
- Adaptive difficulty adjustment
- Skip or fast-track based on demonstrated mastery

#### 5.3.2 Code Sandbox [P2]

- In-browser Python/JavaScript execution environment
- Pre-loaded ML libraries (numpy, pandas, sklearn)
- Exercise starter code and test cases
- Save and share code snippets

#### 5.3.3 Certificates & Achievements [P2]

- Course completion certificates (PDF/LinkedIn)
- Skill badges for mastery areas
- Shareable achievement cards
- Leaderboards and community recognition

---

## 6. Technical Architecture

### 6.1 System Overview

The platform follows a modern, scalable architecture with clear separation between frontend, backend, AI services, and data layers.

### 6.2 Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 14 + TypeScript | SEO, SSR, React ecosystem, type safety |
| Styling | Tailwind CSS + shadcn/ui | Rapid development, consistent design |
| Backend API | Node.js / Python FastAPI | ML integration, async processing |
| Database | PostgreSQL + Prisma | Relational data, type-safe ORM |
| Vector DB | Pinecone / Weaviate | Semantic search, RAG support |
| LLM Provider | Claude API / OpenAI | Q&A, exercise generation, summaries |
| Transcription | OpenAI Whisper | Hebrew support, accuracy |
| Authentication | NextAuth.js / Clerk | Social login, session management |
| Storage | AWS S3 / Cloudflare R2 | Video hosting, cost-effective |
| Hosting | Vercel / Railway | Easy deployment, scaling |

### 6.3 AI Pipeline Architecture

The AI system operates as follows:

1. **Ingestion:** Videos are imported and transcribed using Whisper
2. **Chunking:** Transcripts are split into semantic chunks with timestamp metadata
3. **Embedding:** Chunks are converted to vector embeddings and stored
4. **Retrieval:** User queries trigger semantic search for relevant chunks
5. **Generation:** LLM generates response using retrieved context + timestamps

---

## 7. Success Metrics & KPIs

### 7.1 MVP Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Questions per Session | > 3 questions | AI chatbot interactions |
| Video Completion Rate | > 60% | Videos watched to end |
| 7-Day Return Rate | > 40% | Users returning within 7 days |
| Exercise Attempt Rate | > 50% | Users attempting exercises |
| NPS Score | > 40 | User satisfaction survey |

### 7.2 Business Metrics (Post-MVP)

- Monthly Active Users (MAU) growth rate
- Conversion rate (free to paid)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Course completion rates by topic

---

## 8. Timeline & Milestones

### 8.1 MVP Development Schedule

| Week | Milestone | Deliverables |
|------|-----------|--------------|
| Week 1 | Foundation & Video Infrastructure | Video player, import pipeline, basic UI |
| Week 2 | AI Core & Q&A System | Transcription, RAG setup, chatbot v1 |
| Week 3 | Learning Features | Exercises, summaries, progress tracking |
| Week 4 | Polish & Launch | Testing, bug fixes, beta launch |

### 8.2 Key Milestones

- **M1 (Day 7):** First video imported and playable with basic course structure
- **M2 (Day 14):** AI chatbot answering questions about video content
- **M3 (Day 21):** Auto-generated exercises and summaries live
- **M4 (Day 28):** Beta launch with 10 initial users for feedback

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Hebrew transcription accuracy | Medium | High | Manual review pipeline, user corrections |
| AI API costs exceed budget | Medium | Medium | Caching, rate limiting, cost monitoring |
| Low initial user engagement | Low | High | Existing audience leverage, content quality |
| Technical complexity delays | Medium | Medium | Phased rollout, MVP focus |
| Video hosting costs | Low | Low | Use existing YouTube, lazy loading |

---

## 10. Future Roadmap

### 10.1 Phase 2 (Months 2-3)

- Personalized learning paths with AI-driven recommendations
- In-browser code sandbox for hands-on exercises
- Mobile app (React Native)
- Payment integration and subscription model

### 10.2 Phase 3 (Months 4-6)

- Community features: forums, study groups, peer learning
- Enterprise/team accounts with admin dashboards
- Guest instructors and content partnerships
- White-label solution for other educators

### 10.3 Monetization Strategy

| Tier | Price | Features |
|------|-------|----------|
| Free | $0/month | Limited videos, basic Q&A (5 questions/day) |
| Pro | $19/month | All videos, unlimited Q&A, exercises, certificates |
| Team | $49/user/month | Pro + admin dashboard, team progress, priority support |

---

## 11. Appendix

### 11.1 Glossary

- **RAG (Retrieval-Augmented Generation):** AI technique combining search with LLM generation for accurate, contextual answers.
- **Embeddings:** Vector representations of text enabling semantic similarity search.
- **LLM (Large Language Model):** AI models like Claude or GPT that understand and generate human language.
- **LoRA:** Low-Rank Adaptation - efficient technique for fine-tuning large models.

### 11.2 References

- avilevi.co.il - Source content and blog
- OpenAI Whisper Documentation
- Claude API Documentation
- Next.js 14 Documentation

### 11.3 Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 16, 2026 | Avi Levi | Initial PRD creation |

---

**— End of Version 1.0 —**

---
---

# Version 2.0 - Voice AI Addition (January 16, 2026)

## PRODUCT REQUIREMENTS DOCUMENT

### LearnWithAvi
**AI-Powered Interactive Course Platform with Voice & Text AI Tutor**

**Transforming AI/ML Educational Content into Interactive Learning Experiences**

Version 2.0
January 2026
Author: Avi Levi

---

## Document Information

| Field | Value |
|-------|-------|
| Document Title | Product Requirements Document - LearnWithAvi v2.0 |
| Version | 2.0 |
| Date | January 16, 2026 |
| Author | Avi Levi |
| Status | Draft - Ready for Review |
| Target MVP Timeline | 2-4 Weeks |
| Major Update | Added Voice AI Tutor & Updated Tech Stack |

---

## 1. Executive Summary

LearnWithAvi is an AI-powered interactive learning platform designed to transform existing educational video content from avilevi.co.il blog and social media channels (YouTube: @avilevi86) into an engaging, personalized learning experience for intermediate developers seeking to master AI and Machine Learning concepts.

The platform features an intelligent AI tutor that supports both text chat and voice conversation (voice-to-voice), auto-generated exercises, personalized learning paths, and comprehensive content summaries. This transforms passive video consumption into active, measurable learning.

### 1.1 Vision Statement

*"Empowering developers to master AI/ML through interactive, personalized learning experiences powered by the very technology they're learning about - including a voice AI tutor that feels like having the instructor available 24/7."*

### 1.2 Key Value Propositions

- **Talk to Your Teacher:** Voice-to-voice AI tutor trained on Avi's content - ask questions by speaking naturally, get spoken answers with video references
- **Ask Anytime (Text):** Text chatbot for quick questions with timestamp references to relevant video moments
- **Grounded in Content:** AI tutor only answers from course materials - clearly indicates when questions are outside the content scope
- **Learn by Doing:** Auto-generated coding exercises and quizzes derived directly from video content
- **Your Pace, Your Path:** Personalized progression based on demonstrated knowledge and learning goals

---

## 2. Voice AI Tutor - NEW FEATURE

The Voice AI Tutor is the flagship differentiator of LearnWithAvi. Instead of just reading or typing, learners can have natural spoken conversations with an AI that has been trained on Avi's educational content.

### 2.1 Interaction Modes

| Mode | Description | Priority |
|------|-------------|----------|
| Text Chat | Traditional chatbot interface alongside video player. Quick questions, copy-paste code, link sharing. | P0 (MVP) |
| Voice-to-Voice | User speaks naturally, AI responds with synthesized voice. Hands-free learning while coding or commuting. | P0 (MVP) |
| Animated Avatar | Visual avatar that moves/lip-syncs while speaking. More engaging, feels like video call with tutor. | P2 (Future) |

### 2.2 Voice AI Requirements

#### Speech-to-Text (STT)

- Must support Hebrew with high accuracy for technical terms
- Real-time streaming for low latency conversations
- Handle code-related vocabulary (function names, library names)

#### Text-to-Speech (TTS)

- Natural-sounding Hebrew voice
- Low latency (<100ms to first audio byte)
- Consistent voice persona representing the tutor

#### Conversation Flow

- Context-aware: knows which video user is watching
- Interruption handling: user can ask follow-up before AI finishes
- Turn-taking: natural conversation pauses and cues

### 2.3 Content Boundary Enforcement

**CRITICAL REQUIREMENT:** The AI tutor must clearly distinguish between answers from course content vs. general knowledge.

- **In-Scope Questions:** AI provides detailed answers citing specific videos and timestamps
- **Out-of-Scope Questions:** AI responds: *"This topic isn't covered in the current course materials. I can only provide accurate answers about the content Avi has created. Would you like me to suggest related topics that are covered?"*
- **Partial Match:** AI indicates what it can answer from content and what would require external knowledge

---

## 3. RAG System Architecture

The Retrieval-Augmented Generation (RAG) system is the backbone of the AI tutor, ensuring answers are grounded in actual course content.

### 3.1 Content Ingestion Pipeline

- **Video Import:** Fetch videos from YouTube (@avilevi86) via API
- **Transcription:** Process with OpenAI Whisper (Hebrew language model)
- **Chunking:** Split transcripts into 15-30 second segments with 5-second overlap
- **Embedding:** Convert chunks to vectors using OpenAI text-embedding-3-small
- **Storage:** Store in Chroma (MVP) or Pinecone (production)

### 3.2 Chunk Metadata Schema

Each chunk includes rich metadata for accurate retrieval and citation:

| Field | Type | Description |
|-------|------|-------------|
| chunk_id | string | Unique identifier (video_001_chunk_005) |
| text | string | Transcript content for this segment |
| timestamp_start | string | HH:MM:SS format start time |
| timestamp_end | string | HH:MM:SS format end time |
| video_id | string | YouTube video ID |
| video_title | string | Human-readable video title |
| topic | string | Course topic/module |
| source_url | string | Direct link with time parameter (?t=330) |
| embedding | vector | 3072-dimensional semantic embedding |

### 3.3 Query Flow

1. **User Query:** Text or voice input from user
2. **Query Embedding:** Convert query to vector using same embedding model
3. **Semantic Search:** Find top 5-7 most relevant chunks from vector DB
4. **Context Assembly:** Format chunks with metadata for LLM
5. **LLM Generation:** Claude generates response using only provided context
6. **Citation:** Response includes video timestamps and links

---

## 4. Technical Architecture (Updated)

### 4.1 Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 14 + TypeScript | SEO, SSR, React ecosystem, type safety |
| Styling | Tailwind CSS + shadcn/ui | Rapid development, consistent design |
| Backend API | Node.js / Python FastAPI | ML integration, async processing |
| Database | PostgreSQL + Prisma | Relational data, type-safe ORM |
| Vector DB | Chroma (MVP) → Pinecone | Start simple, scale easily |
| Embeddings | OpenAI text-embedding-3-small | Cost-effective ($0.02/1M tokens), accurate |
| LLM Provider | Claude API (Anthropic) | Best for RAG, nuanced responses |
| Transcription | OpenAI Whisper | Hebrew support, 99+ languages |
| Speech-to-Text | OpenAI Whisper / Deepgram | Real-time streaming, Hebrew |
| Text-to-Speech | ElevenLabs | Natural voices, 75ms latency, Hebrew |
| Voice Pipeline | WebRTC + Custom | Low-latency real-time audio |
| Authentication | Clerk | Social login, session management |
| Storage | Cloudflare R2 | S3-compatible, cost-effective |
| Hosting | Vercel / Railway | Easy deployment, scaling |

### 4.2 Voice AI Pipeline Architecture

The voice conversation follows this real-time flow:

1. **Audio Capture:** Browser MediaRecorder API captures user speech
2. **WebRTC Stream:** Audio streamed to server via WebRTC for low latency
3. **STT Processing:** Whisper/Deepgram transcribes speech to text (~150-300ms)
4. **RAG Query:** Text query processed through RAG system
5. **Claude Response:** LLM generates contextual answer
6. **TTS Synthesis:** ElevenLabs converts text to speech (~75ms)
7. **Audio Playback:** Synthesized audio streamed back to user

**Total round-trip latency target:** <700ms

### 4.3 Claude System Prompt Strategy

The AI tutor uses a carefully crafted system prompt to stay in character:

- **Role Definition:** "You are an AI tutor specializing in AI/ML education, trained on Avi Levi's course materials."
- **Content Constraint:** "Only answer questions using information from the provided context. If the answer is not in the context, clearly state this."
- **Citation Requirement:** "Always cite your sources with video timestamps in the format [Video Title @ MM:SS]"
- **Teaching Style:** "Use the Socratic method - ask clarifying questions before explaining complex topics"

---

## 5. Feature Requirements (Updated)

### 5.1 MVP Features (Weeks 1-2)

#### 5.1.1 Video Player & Aggregation [P0]

- Import videos from YouTube API (@avilevi86)
- Custom video player with playback controls, speed adjustment, chapter markers
- Timestamp linking from AI responses to video moments (click to seek)
- Mobile-responsive design

#### 5.1.2 Text AI Chatbot [P0]

- RAG-based system trained on video transcripts
- Hebrew language support with natural conversation flow
- Answers include relevant video timestamp references
- Context-aware responses based on current video
- Sidebar chat panel alongside video player
- Clear indication when questions are outside course content

#### 5.1.3 Voice AI Tutor [P0] - NEW

- Push-to-talk or continuous listening modes
- Real-time speech-to-text with Hebrew support
- Natural voice response synthesis
- Visual feedback during listening/speaking states
- Transcript display of voice conversation
- Seamless switching between text and voice modes

#### 5.1.4 RAG Content Pipeline [P0]

- YouTube transcript fetching or Whisper transcription
- Semantic chunking with timestamp preservation
- Vector embedding and storage
- Admin interface for content management

### 5.2 Core Features (Weeks 2-3)

Auto-generated exercises, content summaries, progress tracking, and comments (unchanged from v1.0)

### 5.3 Advanced Features (Post-MVP)

- **Animated Avatar [P2]:** Visual tutor avatar with lip-sync and expressions
- **Personalized Learning Paths [P2]:** AI-recommended content order based on knowledge gaps
- **Code Sandbox [P2]:** In-browser Python/JavaScript execution environment
- **Certificates [P2]:** Course completion certificates for LinkedIn

---

## 6. Cost Estimates

### 6.1 MVP Monthly Costs (Estimated)

| Component | Service | Estimated Cost |
|-----------|---------|----------------|
| Speech-to-Text | OpenAI Whisper | $20/month |
| Text-to-Speech | ElevenLabs | $75/month |
| LLM (Claude) | Anthropic API | $100-300/month |
| Embeddings | OpenAI text-embedding-3-small | $10/month |
| Vector DB | Chroma (self-hosted) → Pinecone | $0-50/month |
| Infrastructure | Vercel/Railway + WebRTC | $50-100/month |
| **Total MVP** | | **$255-555/month** |

**Note:** Costs scale with usage. Prompt caching can reduce Claude API costs by up to 90% for repeated content.

---

## 7. Timeline & Milestones (Updated)

| Week | Milestone | Deliverables |
|------|-----------|--------------|
| Week 1 | Foundation & Video Infrastructure | Video player, YouTube import, basic UI, course structure |
| Week 2 | AI Core: Text Chatbot + RAG | Transcription pipeline, RAG setup, text chatbot v1 |
| Week 3 | Voice AI + Learning Features | Voice-to-voice tutor, exercises, summaries, progress tracking |
| Week 4 | Polish & Launch | Testing, bug fixes, beta launch with 10 users |

### 7.1 Key Milestones

- **M1 (Day 7):** First video imported and playable with basic course structure
- **M2 (Day 14):** Text chatbot answering questions with video timestamps
- **M3 (Day 18):** Voice-to-voice AI tutor functional
- **M4 (Day 28):** Beta launch with 10 initial users for feedback

---

## 8. Transcript Preparation Guide

To build the RAG system, Avi needs to prepare transcripts. Here's the recommended approach:

### 8.1 Option A: Use Existing YouTube Captions

- Export auto-generated captions from YouTube Studio
- Download as SRT or VTT format (includes timestamps)
- Review and correct technical terms manually

### 8.2 Option B: Fresh Transcription with Whisper

- Download video audio files
- Process with OpenAI Whisper API (--language he)
- Output: JSON with word-level timestamps

### 8.3 Required Transcript Format

For each video, provide a JSON file with this structure:

```json
{
  "video_id": "youtube_video_id",
  "title": "Video Title",
  "topic": "Embeddings",
  "segments": [
    {
      "start": "00:00:30",
      "end": "00:00:45",
      "text": "Hebrew transcript text here..."
    }
  ]
}
```

---

## 9. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 16, 2026 | Avi Levi | Initial PRD creation |
| 2.0 | Jan 16, 2026 | Avi Levi + Claude | Added Voice AI Tutor feature, updated tech stack (Claude API, ElevenLabs, Whisper, Chroma/Pinecone), added RAG architecture details, content boundary enforcement, cost estimates, transcript preparation guide |

---

**— End of Version 2.0 —**

---
---

# Version 3.0 - Implementation Progress (January 16, 2026)

## PRODUCT REQUIREMENTS DOCUMENT

### LearnWithAvi
**AI-Powered Interactive Course Platform with Voice & Text AI Tutor**

**Version 3.0 - Implementation Progress Update**

January 16, 2026
Author: Avi Levi

---

## 1. Executive Summary

LearnWithAvi is an AI-powered interactive learning platform designed to transform existing educational video content from avilevi.co.il blog and social media channels (YouTube: @avilevi86) into an engaging, personalized learning experience for intermediate developers seeking to master AI and Machine Learning concepts.

The platform features an intelligent AI tutor that supports both text chat and voice conversation (voice-to-voice), auto-generated exercises, personalized learning paths, and comprehensive content summaries.

### 1.1 Vision Statement

*"Empowering developers to master AI/ML through interactive, personalized learning experiences powered by the very technology they're learning about - including a voice AI tutor that feels like having the instructor available 24/7."*

---

## 2. Implementation Status (NEW)

This section documents what has been built and is currently functional in the LearnWithAvi platform.

### 2.1 Completed Features

#### 2.1.1 Core Platform Architecture

- ✅ Next.js 14 with TypeScript and App Router
- ✅ Tailwind CSS with shadcn/ui component library
- ✅ Three-column responsive layout (AI Chat | Video | Materials)
- ✅ Hebrew RTL language support throughout
- ✅ Dark mode support

#### 2.1.2 Video Player System

- ✅ Custom YouTube player integration with react-youtube
- ✅ Chapter-based timeline with visual segments
- ✅ Hover tooltips showing chapter names on timeline
- ✅ Playback speed controls (0.5x to 2x)
- ✅ Volume control with mute toggle
- ✅ Skip forward/backward (10 seconds)
- ✅ Fullscreen support
- ✅ Automatic duration detection from YouTube API

#### 2.1.3 Chapter Progress Tracking System

A sophisticated system tracks actual watch time per chapter:

- ✅ Chapters only marked complete when 90%+ actually watched
- ✅ Seeking/jumping does NOT mark chapters as complete
- ✅ Per-chapter progress tracking with visual indicators
- ✅ Sequential watching detection (time delta < 3 seconds)
- ✅ Visual states: Active (blue), Completed (green), Partial (gray with %)
- ✅ Auto-generated chapters when none defined (3-10 chapters based on duration)

#### 2.1.4 AI Text Chatbot

- ✅ Left sidebar chat interface with AI Assistant branding
- ✅ Topic-aware responses based on video content
- ✅ Knowledge base for tools: Make, News API, ChatGPT, ElevenLabs, Telegram
- ✅ Clickable inline timestamps in responses (e.g., click '3:05' to seek)
- ✅ Clear indication when topic is outside video scope
- ✅ Chat input always visible at bottom (no scrolling needed)
- ✅ Voice input button (UI ready)

#### 2.1.5 Live Transcript

- ✅ Full transcript display below video player
- ✅ Active chunk highlighting synced with video playback
- ✅ Clickable timestamps to seek to any transcript segment
- ✅ 46 transcript chunks covering full 21:48 video duration
- ✅ Visual distinction for past, active, and upcoming segments

#### 2.1.6 AI Summary Generation

- ✅ One-click AI summary generation from transcript
- ✅ Structured summary with: About, Tools Used, Process Steps, Benefits
- ✅ Copy to clipboard functionality
- ✅ Modal overlay with loading animation

#### 2.1.7 Right Sidebar - Course Materials

- ✅ Course title and description display
- ✅ Dynamic topic tags with color coding
- ✅ Course metadata (Type, Level, Duration, Video count)
- ✅ Chapter list matching video timeline exactly
- ✅ Overall progress bar with time indicators
- ✅ Click-to-seek chapter navigation
- ✅ Compact design preventing overflow

### 2.2 Video Content Integrated

First video fully integrated with complete data:

- **YouTube ID:** mHThVfGmd6I
- **Title:** איך בניתי אפליקציה שמייצרת סיכום קולי יומי של חדשות AI – לגמרי בלי קוד
- **Duration:** 21:48 (1308 seconds)
- **Chapters:** 10 chapters with accurate timestamps
- **Transcript:** 46 transcript chunks covering full duration
- **Course:** בניית אפליקציות AI ללא קוד

### 2.3 Documentation Created

- ✅ **VIDEO_SYSTEM_RULES.md** - Comprehensive documentation of video system behaviors
  - Chapter progress tracking rules
  - Video duration handling
  - Auto-generated chapters logic
  - UI/UX rules
  - Adding new videos guide

---

## 3. Key Files Structure

### 3.1 Core Application Files

```
src/app/course/[courseId]/page.tsx    # Main course page with three-column layout
src/components/video/VideoPlayer.tsx  # Custom YouTube player with chapters
src/data/video-config.ts              # Video and course configuration
src/data/sample-transcripts.ts        # Transcript chunks for AI chatbot
docs/VIDEO_SYSTEM_RULES.md            # System documentation
```

### 3.2 Configuration System

Adding new videos is simple - add entry to `video-config.ts` with:

- `youtubeId` (required)
- `title` (required)
- `courseId` (required)
- `duration`, `chapters`, `topics` (optional - auto-detected/generated)

---

## 4. Remaining MVP Tasks

### 4.1 High Priority (P0)

- [ ] Integrate Claude API for real AI responses (currently using mock responses)
- [ ] Implement RAG pipeline with vector embeddings
- [ ] Add voice-to-voice AI tutor functionality
- [ ] User authentication with Clerk
- [ ] Persistent progress storage (database)

### 4.2 Medium Priority (P1)

- [ ] Add more videos from YouTube channel
- [ ] Mobile responsive optimization
- [ ] Auto-generated quizzes from content
- [ ] Course completion certificates

---

## 5. Technical Stack (Implemented)

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

## 6. Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 16, 2026 | Initial PRD creation |
| 2.0 | Jan 16, 2026 | Added Voice AI Tutor, RAG architecture, cost estimates |
| 3.0 | Jan 16, 2026 | Added Implementation Status section documenting completed features: Video player with chapters, chapter progress tracking, AI chatbot with inline timestamps, live transcript, AI summary, right sidebar materials panel. First video fully integrated. |

---

**— End of Version 3.0 —**

---
---

# End of Document

This complete history document preserves all three versions of the LearnWithAvi PRD, showing the evolution from initial concept through voice AI enhancement to implementation progress tracking.

**For the current working version, see [LearnWithAvi-PRD.md](LearnWithAvi-PRD.md)**
