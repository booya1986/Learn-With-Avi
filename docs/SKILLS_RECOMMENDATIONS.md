# LearnWithAvi - Skills Recommendations

Based on analysis of the [Anthropic Skills Repository](https://github.com/anthropics/skills) and the LearnWithAvi project architecture, this document recommends 5 high-value skills following Anthropic's best practices.

---

## Table of Contents

- [Anthropic Skills Best Practices Summary](#anthropic-skills-best-practices-summary)
- [Recommended Skills for LearnWithAvi](#recommended-skills-for-learnwithavi)
- [Skill Templates](#skill-templates)
- [Implementation Roadmap](#implementation-roadmap)

---

## Anthropic Skills Best Practices Summary

### Core Principles

1. **Conciseness is Critical**
   - Skills share context window with system prompt, conversation, and user requests
   - Keep SKILL.md under 500 lines
   - Challenge each piece: "Does Claude really need this?"
   - Prefer examples over verbose explanations

2. **Compelling Descriptions**
   - Description is the PRIMARY triggering mechanism
   - Include BOTH what the skill does AND specific triggers/contexts
   - Example: "Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction"

3. **Progressive Disclosure** (3 context levels)
   - **Level 1** (Always loaded): `name` + `description` (~100 words)
   - **Level 2** (When triggered): Full SKILL.md body (<5000 words)
   - **Level 3** (As needed): Reference files, scripts, assets (unlimited context)

4. **Set Appropriate Degrees of Freedom**
   - **High freedom**: Multiple valid approaches (text instructions)
   - **Medium freedom**: Preferred patterns with variation (pseudocode/scripts with parameters)
   - **Low freedom**: Fragile operations requiring consistency (specific scripts)

### Required File Structure

```
skill-name/
├── SKILL.md                 # Required - frontmatter + instructions
├── scripts/                 # Optional - executable code
├── references/              # Optional - documentation loaded as needed
└── assets/                  # Optional - templates, images, resources
```

### SKILL.md Format

**Required Frontmatter:**
```yaml
---
name: skill-name                # Lowercase, alphanumeric + hyphens only
description: Clear description of what this skill does and when to use it.
---
```

**Optional Frontmatter:**
```yaml
---
name: rag-pipeline-optimizer
description: Optimize RAG systems with hybrid search, re-ranking, and prompt caching. Use when implementing or improving retrieval-augmented generation systems.
license: Apache-2.0
compatibility: Requires ChromaDB, OpenAI API access, and Python 3.9+
metadata:
  author: LearnWithAvi
  version: "1.0"
  category: AI/ML
allowed-tools: Bash(python:*) Bash(pip:*) Read Write
---
```

**Name Validation:**
- ✅ Valid: `rag-pipeline`, `voice-tutor`, `video-ingestion`
- ❌ Invalid: `RAG-Pipeline` (uppercase), `-rag` (starts with hyphen), `rag--pipeline` (consecutive hyphens)

---

## Recommended Skills for LearnWithAvi

### Priority Matrix

| Skill | Business Impact | Technical Difficulty | Dev Time | Priority | Start Week |
|-------|-----------------|---------------------|----------|----------|-----------|
| **RAG Pipeline Optimizer** | Critical | High | 8-10 days | **P0** | Week 1 |
| **Voice AI Tutor** | Critical | Very High | 12-15 days | **P0** | Week 2 |
| **Video Ingestion Pipeline** | High | Medium | 5-7 days | **P1** | Week 1 |
| **Learning Content Generator** | High | High | 10-12 days | **P1** | Week 3 |
| **Frontend Performance Optimizer** | Medium | Medium | 7-10 days | **P2** | Week 4 |

---

## Skill #1: RAG Pipeline Optimizer

**Priority: P0 (Critical)**

### Overview

Optimize RAG systems for educational content with hybrid search, semantic re-ranking, prompt caching, and Hebrew language support.

### When to Use

- Building or improving RAG-based Q&A systems
- Optimizing semantic search for multilingual content
- Reducing API costs through prompt caching
- Improving answer accuracy and citation quality
- Debugging RAG retrieval issues

### Current Pain Points in LearnWithAvi

- No semantic re-ranking of retrieved chunks
- Prompt caching only uses ephemeral cache
- Full chunks sent to LLM (no context optimization)
- No hybrid search (vector only + keyword fallback)
- No confidence scoring for answers
- Hebrew-specific embeddings not optimized

### What This Skill Provides

1. **Hybrid Search Implementation**
   - BM25 keyword search + semantic vector search
   - Weighted combination with tunable parameters
   - Better handling of technical terms and code

2. **Semantic Re-ranking**
   - Cross-encoder models for re-ranking top-K results
   - Query-chunk relevance scoring
   - Deduplication of semantically similar chunks

3. **Prompt Caching Optimization**
   - System prompt caching strategy
   - Context window optimization
   - Cache hit rate monitoring

4. **Answer Quality Assurance**
   - Confidence scoring for generated answers
   - Citation accuracy verification
   - Automated test case generation

5. **Hebrew Language Optimization**
   - Embedding model comparison for Hebrew
   - Right-to-left text handling
   - Technical term extraction

### File Structure

```
rag-pipeline-optimizer/
├── SKILL.md                           # Main skill instructions
├── scripts/
│   ├── hybrid_search.py               # BM25 + vector search
│   ├── rerank.py                      # Semantic re-ranking
│   ├── cache_optimizer.py             # Prompt caching analysis
│   ├── test_generator.py              # Generate RAG test cases
│   └── evaluate_rag.py                # RAG quality metrics
├── references/
│   ├── HYBRID_SEARCH.md               # Hybrid search guide
│   ├── PROMPT_CACHING.md              # Caching strategies
│   ├── HEBREW_OPTIMIZATION.md         # Language-specific tips
│   └── RAG_METRICS.md                 # Evaluation metrics
└── assets/
    └── test_cases.json                # Sample test cases
```

### Integration Points

- `/src/app/api/chat/route.ts` - Chat streaming
- `/src/lib/rag.ts` - Vector queries
- `/src/lib/embeddings.ts` - Embedding generation

### Expected Outcomes

- 30-50% improvement in answer accuracy
- 50-70% reduction in API costs via caching
- Better handling of technical Hebrew terms
- Measurable quality metrics

---

## Skill #2: Voice AI Tutor

**Priority: P0 (Critical)**

### Overview

Complete voice-to-voice AI tutor implementation with real-time speech-to-text, RAG integration, and low-latency text-to-speech streaming.

### When to Use

- Implementing voice-to-voice conversational AI
- Building real-time audio streaming systems
- Integrating Whisper STT with Claude LLM
- Optimizing voice interaction latency
- Debugging voice session state

### Current Pain Points in LearnWithAvi

- Whisper API integrated but not wired to UI
- No real-time streaming between voice → text → LLM → speech
- Missing voice session state tracking
- No voice activity detection (VAD)
- No WebSocket infrastructure for low latency
- Hebrew voice quality untested

### What This Skill Provides

1. **Real-time Speech-to-Text**
   - Whisper API streaming integration
   - Voice activity detection (VAD)
   - Hebrew language optimization
   - Noise cancellation handling

2. **Voice Context Management**
   - Session state tracking for multi-turn conversations
   - Context window optimization for voice
   - Interrupt handling (user can cut off AI mid-response)

3. **Low-latency TTS Streaming**
   - ElevenLabs streaming API integration
   - Audio chunk buffering strategy
   - Latency optimization (<700ms total)

4. **WebSocket Architecture**
   - Real-time bidirectional communication
   - Connection management and reconnection
   - Error handling and graceful degradation

5. **Voice Quality Testing**
   - Automated voice quality assessment
   - Language detection verification
   - Latency benchmarking

### File Structure

```
voice-ai-tutor/
├── SKILL.md                           # Main skill instructions
├── scripts/
│   ├── websocket_server.py            # WebSocket server implementation
│   ├── stt_stream.py                  # Whisper streaming client
│   ├── tts_stream.py                  # ElevenLabs streaming client
│   ├── vad.py                         # Voice activity detection
│   └── latency_benchmark.py           # Performance testing
├── references/
│   ├── WEBSOCKET_ARCHITECTURE.md      # Real-time communication guide
│   ├── WHISPER_STREAMING.md           # STT implementation details
│   ├── ELEVENLABS_STREAMING.md        # TTS streaming guide
│   ├── LATENCY_OPTIMIZATION.md        # Performance tuning
│   └── HEBREW_VOICE.md                # Hebrew-specific configuration
└── assets/
    └── voice_prompts.json             # Sample voice interaction prompts
```

### Integration Points

- `/src/components/voice/VoicePanel.tsx` - UI component
- `/src/app/api/voice/tts/route.ts` - Speech output
- New: `/src/app/api/voice/stt/route.ts` - Speech input
- New: `/src/app/api/voice/stream/route.ts` - WebSocket streaming

### Expected Outcomes

- <700ms total round-trip latency
- Natural voice conversation flow
- Hebrew language support verified
- Hands-free learning experience

---

## Skill #3: Video Ingestion Pipeline

**Priority: P1 (High)**

### Overview

Automated video ingestion from YouTube with metadata extraction, transcription, intelligent chunking, and chapter generation.

### When to Use

- Adding new videos to the platform
- Batch processing multiple videos
- Updating video metadata or transcripts
- Synchronizing transcripts with video timeline
- Generating chapters from content analysis

### Current Pain Points in LearnWithAvi

- Manual video configuration takes hours per video
- Manual transcript creation (46+ chunks per video)
- Manual chapter generation and timestamp alignment
- No batch processing capability
- Blocks content scaling

### What This Skill Provides

1. **YouTube Metadata Extraction**
   - Automatic video metadata retrieval
   - Duration, title, description extraction
   - Thumbnail and preview image fetching

2. **Automated Transcription**
   - Whisper API integration with Hebrew support
   - Word-level timestamp generation
   - Technical term recognition
   - Batch processing for multiple videos

3. **Intelligent Chunking**
   - Semantic boundary detection
   - Optimal chunk size for RAG (15-30 seconds)
   - Overlap strategy (5-second overlap)
   - Metadata preservation

4. **Chapter Auto-generation**
   - Content-based chapter detection
   - Topic segmentation using embeddings
   - Timestamp alignment with video
   - Manual override capability

5. **Configuration File Generation**
   - Auto-generate video-config.ts entries
   - Auto-generate transcript chunk files
   - Validation and error checking

### File Structure

```
video-ingestion-pipeline/
├── SKILL.md                           # Main skill instructions
├── scripts/
│   ├── youtube_metadata.py            # YouTube API client
│   ├── transcribe_video.py            # Whisper transcription
│   ├── chunk_transcript.py            # Semantic chunking
│   ├── generate_chapters.py           # Chapter detection
│   ├── config_generator.py            # Generate video-config entries
│   └── batch_process.py               # Batch video processing
├── references/
│   ├── YOUTUBE_API.md                 # YouTube API guide
│   ├── WHISPER_TRANSCRIPTION.md       # Transcription best practices
│   ├── CHUNKING_STRATEGIES.md         # Semantic chunking algorithms
│   └── CHAPTER_GENERATION.md          # Content-based segmentation
└── assets/
    └── config_template.json           # Video config template
```

### Integration Points

- `/src/data/video-config.ts` - Video configuration
- `/src/data/sample-transcripts.ts` - Transcript storage
- New: `/src/app/api/ingest/video/route.ts` - Ingestion API
- New: `/src/app/api/ingest/batch/route.ts` - Batch processing

### Expected Outcomes

- Video ingestion time: hours → 10-15 minutes
- Batch processing of 10+ videos in parallel
- 95%+ transcription accuracy for Hebrew
- Zero manual timestamp alignment

---

## Skill #4: Learning Content Generator

**Priority: P1 (High)**

### Overview

Automated generation of quizzes, exercises, study guides, and learning objectives from video content using AI.

### When to Use

- Creating quizzes for new video content
- Generating coding exercises tied to concepts
- Building study notes and key takeaways
- Creating learning objectives per chapter
- Developing difficulty-adaptive practice problems

### Current Pain Points in LearnWithAvi

- P1 MVP feature not yet implemented
- No automated quiz generation
- Basic AI summary only (needs enhancement)
- No exercise creation
- Missing personalized learning paths

### What This Skill Provides

1. **Quiz Generation**
   - Multiple-choice questions from content
   - Difficulty scaling (beginner/intermediate/advanced)
   - Concept coverage validation
   - Answer explanation generation

2. **Coding Exercise Generation**
   - Practical exercises tied to video concepts
   - Starter code templates
   - Test cases and validation
   - Hints and solution walkthroughs

3. **Study Guide Generation**
   - Structured summaries with key takeaways
   - Visual diagrams and concept maps
   - Learning objectives per chapter
   - Prerequisite knowledge identification

4. **Adaptive Difficulty**
   - User profiling based on quiz performance
   - Dynamic difficulty adjustment
   - Knowledge gap identification
   - Personalized practice recommendations

5. **Content Quality Assurance**
   - Validate question clarity
   - Check answer correctness
   - Ensure concept coverage
   - Difficulty calibration

### File Structure

```
learning-content-generator/
├── SKILL.md                           # Main skill instructions
├── scripts/
│   ├── quiz_generator.py              # MCQ generation
│   ├── exercise_generator.py          # Coding exercise creation
│   ├── study_guide_generator.py       # Study notes generation
│   ├── learning_objectives.py         # Objective extraction
│   ├── difficulty_calibration.py      # Difficulty assessment
│   └── validate_content.py            # Quality validation
├── references/
│   ├── QUIZ_PATTERNS.md               # Quiz generation strategies
│   ├── EXERCISE_TEMPLATES.md          # Exercise formats
│   ├── BLOOM_TAXONOMY.md              # Learning objective framework
│   └── DIFFICULTY_SCALING.md          # Adaptive difficulty guide
└── assets/
    ├── quiz_templates.json            # Quiz format templates
    └── exercise_starters.json         # Coding exercise starters
```

### Integration Points

- `/src/app/course/[courseId]/page.tsx` - Course page UI
- New: `/src/app/api/content/generate/route.ts` - Generation API
- New: `/src/lib/content-generation.ts` - Generation logic
- New: `/src/components/exercises/` - Exercise UI components

### Expected Outcomes

- Auto-generate 5-10 quizzes per video
- Auto-generate 2-5 coding exercises per video
- Comprehensive study guides per course
- Measurable learning outcomes

---

## Skill #5: Frontend Performance Optimizer

**Priority: P2 (Medium)**

### Overview

Production-ready frontend optimization including performance auditing, code splitting, accessibility hardening, and mobile responsiveness.

### When to Use

- Preparing for production launch
- Performance regression detection
- Accessibility compliance checking
- Mobile responsive design completion
- Bundle size optimization

### Current Pain Points in LearnWithAvi

- No code splitting (entire app loads at once)
- Mobile responsive design marked as TODO
- Hebrew RTL + accessibility unique challenges
- No performance monitoring
- No real-time progress sync

### What This Skill Provides

1. **Performance Auditing**
   - Lighthouse CI integration
   - Core Web Vitals monitoring
   - Bundle analysis and size reduction
   - Lazy loading optimization
   - Image and asset optimization

2. **Accessibility Hardening**
   - WCAG 2.1 AA compliance for Hebrew RTL
   - Screen reader optimization
   - Keyboard navigation testing
   - Color contrast validation
   - ARIA attribute verification

3. **Mobile Responsive Design**
   - Breakpoint optimization
   - Touch interaction handling
   - Mobile video player optimization
   - Responsive chat interface
   - Voice UI for mobile

4. **Code Splitting Strategy**
   - Route-based splitting
   - Component lazy loading
   - Dynamic imports for heavy libraries
   - Vendor bundle optimization

5. **Real-time Sync Infrastructure**
   - WebSocket connection for progress sync
   - Offline-first architecture
   - Optimistic UI updates
   - Conflict resolution strategy

### File Structure

```
frontend-performance-optimizer/
├── SKILL.md                           # Main skill instructions
├── scripts/
│   ├── performance_audit.py           # Lighthouse automation
│   ├── bundle_analyzer.py             # Bundle size analysis
│   ├── accessibility_checker.py       # A11y validation
│   ├── mobile_test.py                 # Mobile responsive testing
│   └── websocket_setup.py             # Real-time sync setup
├── references/
│   ├── CODE_SPLITTING.md              # Splitting strategies
│   ├── RTL_ACCESSIBILITY.md           # Hebrew RTL best practices
│   ├── MOBILE_OPTIMIZATION.md         # Mobile performance guide
│   ├── WEBSOCKET_SYNC.md              # Real-time sync patterns
│   └── WEB_VITALS.md                  # Core Web Vitals guide
└── assets/
    └── lighthouse_config.json         # Lighthouse CI config
```

### Integration Points

- `/src/app/layout.tsx` - App layout
- `/src/components/*` - All components
- New: `/src/lib/performance.ts` - Metrics collection
- New: `/src/app/api/progress/sync/route.ts` - Real-time sync

### Expected Outcomes

- Lighthouse score >90 (all categories)
- WCAG 2.1 AA compliance
- Bundle size <200KB (initial load)
- Mobile-optimized experience
- Real-time progress sync

---

## Skill Templates

Below are example SKILL.md templates following Anthropic best practices.

### Template 1: RAG Pipeline Optimizer

```markdown
---
name: rag-pipeline-optimizer
description: Optimize retrieval-augmented generation systems with hybrid search, semantic re-ranking, and prompt caching. Use when building or improving RAG-based Q&A, reducing API costs, or debugging retrieval quality issues.
license: Apache-2.0
compatibility: Requires ChromaDB, OpenAI API access, Python 3.9+
metadata:
  author: LearnWithAvi
  version: "1.0"
  category: AI/ML
allowed-tools: Bash(python:*) Bash(pip:*) Read Write
---

# RAG Pipeline Optimizer

Optimize RAG systems for educational content with hybrid search, re-ranking, and Hebrew language support.

## Quick Start

### Hybrid Search Implementation

Combine BM25 keyword search with semantic vector search:

\`\`\`python
# Install dependencies
pip install rank-bm25 chromadb openai

# Use the hybrid search script
python scripts/hybrid_search.py --query "מה זה embeddings" --top-k 10
\`\`\`

### Semantic Re-ranking

Re-rank retrieved chunks using cross-encoder:

\`\`\`python
python scripts/rerank.py --chunks retrieved_chunks.json --query "embeddings explanation"
\`\`\`

## Detailed Guides

- **Hybrid Search**: See [HYBRID_SEARCH.md](references/HYBRID_SEARCH.md) for implementation details
- **Prompt Caching**: See [PROMPT_CACHING.md](references/PROMPT_CACHING.md) for caching strategies
- **Hebrew Optimization**: See [HEBREW_OPTIMIZATION.md](references/HEBREW_OPTIMIZATION.md) for language-specific tips
- **Quality Metrics**: See [RAG_METRICS.md](references/RAG_METRICS.md) for evaluation methods

## Testing RAG Quality

Generate synthetic test cases:

\`\`\`bash
python scripts/test_generator.py --video-id mHThVfGmd6I --num-questions 20
python scripts/evaluate_rag.py --test-cases test_cases.json
\`\`\`

## Prompt Caching Strategy

Optimize prompt caching for cost reduction:

1. Cache system prompt (static)
2. Cache video transcripts (semi-static)
3. Dynamic query context only

See [PROMPT_CACHING.md](references/PROMPT_CACHING.md) for Claude API caching implementation.
\`\`\`

### Template 2: Voice AI Tutor

```markdown
---
name: voice-ai-tutor
description: Implement voice-to-voice AI tutoring with real-time speech-to-text, RAG integration, and low-latency text-to-speech streaming. Use when building conversational voice interfaces, optimizing voice latency, or implementing Hebrew voice support.
license: Apache-2.0
compatibility: Requires OpenAI Whisper API, ElevenLabs API, WebSocket support, Python 3.9+
metadata:
  author: LearnWithAvi
  version: "1.0"
  category: Voice AI
allowed-tools: Bash(python:*) Bash(npm:*) Read Write
---

# Voice AI Tutor

Complete voice-to-voice AI tutor with real-time streaming and Hebrew language support.

## Quick Start

### WebSocket Server Setup

\`\`\`bash
# Install dependencies
pip install websockets openai elevenlabs

# Start WebSocket server
python scripts/websocket_server.py --port 8080
\`\`\`

### Voice Streaming Test

\`\`\`bash
# Test latency
python scripts/latency_benchmark.py --language he --iterations 10
\`\`\`

## Architecture Overview

1. **Audio Capture** → Browser MediaRecorder API
2. **WebSocket Stream** → Real-time audio chunks
3. **STT** → Whisper transcription (~150-300ms)
4. **RAG Query** → Semantic search + context retrieval
5. **LLM Response** → Claude generates answer
6. **TTS** → ElevenLabs synthesis (~75ms)
7. **Audio Playback** → Stream to user

**Target latency: <700ms**

## Detailed Guides

- **WebSocket Architecture**: See [WEBSOCKET_ARCHITECTURE.md](references/WEBSOCKET_ARCHITECTURE.md)
- **Whisper Streaming**: See [WHISPER_STREAMING.md](references/WHISPER_STREAMING.md)
- **ElevenLabs Streaming**: See [ELEVENLABS_STREAMING.md](references/ELEVENLABS_STREAMING.md)
- **Latency Optimization**: See [LATENCY_OPTIMIZATION.md](references/LATENCY_OPTIMIZATION.md)
- **Hebrew Voice**: See [HEBREW_VOICE.md](references/HEBREW_VOICE.md)

## Voice Activity Detection

\`\`\`python
# Use VAD to detect speech
python scripts/vad.py --threshold 0.5 --buffer-duration 2.0
\`\`\`

## Testing Hebrew Voice Quality

\`\`\`bash
# Test ElevenLabs Hebrew voice
python scripts/tts_stream.py --text "שלום, אני המורה שלך" --voice "eleven_multilingual_v2" --language he
\`\`\`
\`\`\`

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Week 1:**
- ✅ Set up skill directory structure
- ✅ Create SKILL.md templates
- ⏳ Implement RAG Pipeline Optimizer
  - Hybrid search (BM25 + vector)
  - Semantic re-ranking
  - Prompt caching optimization
- ⏳ Implement Video Ingestion Pipeline
  - YouTube metadata extraction
  - Whisper transcription integration
  - Intelligent chunking

**Week 2:**
- ⏳ Complete RAG optimization testing
- ⏳ Begin Voice AI Tutor implementation
  - WebSocket server setup
  - Whisper streaming integration
  - Voice session state management

### Phase 2: Core Features (Weeks 3-4)

**Week 3:**
- ⏳ Complete Voice AI Tutor
  - ElevenLabs streaming integration
  - Latency optimization
  - Hebrew voice testing
- ⏳ Implement Learning Content Generator
  - Quiz generation
  - Exercise generation
  - Study guide generation

**Week 4:**
- ⏳ Complete Content Generator testing
- ⏳ Implement Frontend Performance Optimizer
  - Code splitting
  - Accessibility hardening
  - Mobile responsive design
- ⏳ Production readiness checklist

### Phase 3: Refinement & Documentation (Post-MVP)

- 📚 Complete all reference documentation
- 🧪 Automated testing for all skills
- 📦 Package skills for distribution
- 🔄 Iterate based on usage feedback

---

## Validation Checklist

Before packaging each skill, validate:

- [ ] `name` follows lowercase alphanumeric + hyphens rule
- [ ] `description` includes both "what it does" and "when to use"
- [ ] SKILL.md is under 500 lines
- [ ] Scripts are self-contained with clear dependencies
- [ ] References are organized (one level deep)
- [ ] Examples are concise and actionable
- [ ] No README.md or auxiliary documentation included
- [ ] Skill has been tested on real tasks

---

## Resources

- **Anthropic Skills Repository**: https://github.com/anthropics/skills
- **Agent Skills Specification**: https://agentskills.io/specification
- **Skill Creation Guide**: https://support.claude.com/en/articles/12512198-creating-custom-skills
- **Skills Engineering Blog**: https://anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills

---

**Document Version**: 1.0
**Last Updated**: January 16, 2026
**Author**: LearnWithAvi Team
