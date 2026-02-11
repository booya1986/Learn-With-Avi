# LearnWithAvi Skills

Custom Claude Code skills for the LearnWithAvi AI-powered learning platform, following [Anthropic Skills](https://github.com/anthropics/skills) best practices.

## Available Skills

### 1. RAG Pipeline Optimizer (In Progress)

**Status**: 🟡 Partially Implemented

Optimize retrieval-augmented generation systems with hybrid search, semantic re-ranking, and prompt caching.

**Files**:
- ✅ `SKILL.md` - Main skill instructions
- ✅ `scripts/hybrid_search.py` - Hybrid BM25 + semantic search
- ✅ `scripts/cache_optimizer.py` - Cache performance analysis
- ✅ `references/HYBRID_SEARCH.md` - Hybrid search guide
- ✅ `references/PROMPT_CACHING.md` - Caching strategies
- ⏳ `scripts/rerank.py` - Semantic re-ranking (TODO)
- ⏳ `scripts/test_generator.py` - RAG test case generation (TODO)
- ⏳ `scripts/evaluate_rag.py` - RAG quality metrics (TODO)
- ⏳ `references/RERANKING.md` - Re-ranking guide (TODO)
- ⏳ `references/HEBREW_OPTIMIZATION.md` - Hebrew NLP tips (TODO)
- ⏳ `references/RAG_METRICS.md` - Evaluation metrics (TODO)

**Usage**:
```bash
# Hybrid search
python skills/rag-pipeline-optimizer/scripts/hybrid_search.py \
  --query "מה זה embeddings?" --top-k 10

# Cache analysis
python skills/rag-pipeline-optimizer/scripts/cache_optimizer.py \
  --chat-logs logs/chat_history.jsonl --analyze-cache-hits
```

### 2. Voice AI Tutor (Planned)

**Status**: ⏳ Not Started

Real-time voice-to-voice AI tutor with Whisper STT and ElevenLabs TTS.

**Priority**: P0 (Critical - flagship feature)

### 3. Video Ingestion Pipeline (Planned)

**Status**: ⏳ Not Started

Automated video ingestion from YouTube with transcription and intelligent chunking.

**Priority**: P1 (High - unblocks content scaling)

### 4. Learning Content Generator (Planned)

**Status**: ⏳ Not Started

Auto-generate quizzes, exercises, and study guides from video content.

**Priority**: P1 (High - MVP feature)

### 5. Frontend Performance Optimizer (Planned)

**Status**: ⏳ Not Started

Performance auditing, accessibility hardening, and mobile optimization.

**Priority**: P2 (Medium - production readiness)

---

## Skill Structure

Each skill follows Anthropic's standard structure:

```
skill-name/
├── SKILL.md                 # Required: Main instructions with YAML frontmatter
├── scripts/                 # Optional: Executable Python/Node.js scripts
│   └── script_name.py
├── references/              # Optional: Detailed documentation (loaded as needed)
│   └── REFERENCE.md
└── assets/                  # Optional: Templates, configs, sample data
    └── template.json
```

### SKILL.md Format

Every skill must have a `SKILL.md` file with YAML frontmatter:

```yaml
---
name: skill-name                       # Lowercase with hyphens
description: What it does and when to use it.  # <1024 chars
license: Apache-2.0                    # Optional
compatibility: Requirements            # Optional
metadata:
  author: LearnWithAvi
  version: "1.0"
allowed-tools: Bash(python:*) Read     # Optional
---

# Skill Title

Instructions here...
```

---

## Installation

### Requirements

```bash
# Python dependencies
pip install -r requirements-skills.txt

# Or install individually
pip install rank-bm25 numpy anthropic openai chromadb
```

### Environment Variables

Add to `.env`:

```bash
# Required for RAG skills
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key

# Optional for voice skills
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

---

## Usage

### In Claude Code

```bash
# Add skills repository
/plugin marketplace add learnwithavi/skills

# Install specific skill
/plugin install rag-pipeline-optimizer@learnwithavi

# Use skill (automatic based on context)
# Just mention RAG, caching, or hybrid search in your query
```

### As Standalone Scripts

```bash
# Run any script directly
python skills/rag-pipeline-optimizer/scripts/hybrid_search.py --help

# Example: Analyze cache performance
python skills/rag-pipeline-optimizer/scripts/cache_optimizer.py \
  --chat-logs logs/chat_history.jsonl \
  --analyze-cache-hits \
  --by-video
```

### In LearnWithAvi Codebase

Skills integrate with existing code:

```typescript
// Import skill utilities
import { hybridSearch } from '@/skills/rag-pipeline-optimizer/lib/hybrid-search'

// Use in your code
const results = await hybridSearch({
  query: userQuery,
  videoId: currentVideo,
  topK: 10
})
```

---

## Development

### Creating a New Skill

1. **Create skill directory**:
   ```bash
   mkdir -p skills/my-new-skill/{scripts,references,assets}
   ```

2. **Write SKILL.md** with frontmatter and instructions

3. **Add scripts** (optional but recommended):
   ```python
   #!/usr/bin/env python3
   """Script description."""

   import argparse

   def main():
       parser = argparse.ArgumentParser(description='...')
       # Implementation

   if __name__ == '__main__':
       main()
   ```

4. **Add references** for detailed documentation (loaded progressively)

5. **Test thoroughly**:
   ```bash
   # Test script
   python skills/my-new-skill/scripts/test.py

   # Validate skill structure
   python scripts/validate_skill.py skills/my-new-skill
   ```

6. **Document** in this README

### Best Practices

✅ **DO**:
- Keep SKILL.md concise (<500 lines)
- Write compelling descriptions (what + when to use)
- Use progressive disclosure (metadata → instructions → references)
- Create standalone, self-contained scripts
- Include working examples
- Test with real LearnWithAvi data

❌ **DON'T**:
- Include README.md or auxiliary docs in skill directory
- Write verbose explanations when examples suffice
- Nest references (keep one level deep)
- Use uppercase in skill names
- Forget the description triggering mechanism

### Validation

Before considering a skill complete:

- [ ] `name` follows naming rules (lowercase-with-hyphens)
- [ ] `description` includes both "what" and "when to use"
- [ ] SKILL.md is under 500 lines
- [ ] Scripts run without errors and have `--help`
- [ ] References are well-organized
- [ ] Examples are tested and working
- [ ] No README.md in skill directory
- [ ] Tested on real LearnWithAvi tasks
- [ ] Integration verified

---

## Testing

### Test Individual Scripts

```bash
# Run script with test data
python skills/rag-pipeline-optimizer/scripts/hybrid_search.py \
  --query "test query" \
  --corpus-file skills/rag-pipeline-optimizer/assets/test_corpus.json
```

### Integration Tests

```bash
# Run integration tests
npm run test:skills

# Test specific skill
npm run test:skills -- rag-pipeline-optimizer
```

---

## Documentation

- **Skills Recommendations**: [docs/SKILLS_RECOMMENDATIONS.md](../docs/SKILLS_RECOMMENDATIONS.md)
- **Skills Summary**: [SKILLS_SUMMARY.md](../SKILLS_SUMMARY.md)
- **Anthropic Skills Repo**: https://github.com/anthropics/skills
- **Agent Skills Spec**: https://agentskills.io/specification

---

## Contributing

### Workflow

1. Review [SKILLS_RECOMMENDATIONS.md](../docs/SKILLS_RECOMMENDATIONS.md) for priorities
2. Choose a skill to implement
3. Follow the structure and best practices above
4. Test thoroughly
5. Update this README
6. Create pull request

### Skill Priority

Focus on implementing skills in this order:

1. **P0**: RAG Pipeline Optimizer (in progress), Voice AI Tutor
2. **P1**: Video Ingestion Pipeline, Learning Content Generator
3. **P2**: Frontend Performance Optimizer

---

## License

Apache-2.0 (same as main LearnWithAvi project)

---

## Questions?

See the main [SKILLS_SUMMARY.md](../SKILLS_SUMMARY.md) or refer to [Anthropic's skills guide](https://support.claude.com/en/articles/12512198-creating-custom-skills).
