---
name: rag-pipeline-optimizer
description: Optimize retrieval-augmented generation systems with hybrid search, semantic re-ranking, and prompt caching. Use when building or improving RAG-based Q&A systems, reducing API costs through caching, improving answer accuracy, or debugging retrieval quality issues in educational platforms.
license: Apache-2.0
compatibility: Requires ChromaDB, OpenAI API access, Python 3.9+, Node.js for Next.js integration
metadata:
  author: LearnWithAvi
  version: "1.0"
  category: AI/ML
  tags: [RAG, embeddings, semantic-search, prompt-caching, Hebrew-NLP]
allowed-tools: Bash(python:*) Bash(pip:*) Bash(node:*) Read Write
---

# RAG Pipeline Optimizer

Optimize retrieval-augmented generation systems for educational content with hybrid search, semantic re-ranking, prompt caching, and Hebrew language support.

## Quick Start

### 1. Hybrid Search Implementation

Combine BM25 keyword search with semantic vector search for better retrieval:

```bash
# Install dependencies
pip install rank-bm25 chromadb openai anthropic

# Run hybrid search
python scripts/hybrid_search.py \
  --query "מה זה embeddings?" \
  --top-k 10 \
  --bm25-weight 0.3 \
  --semantic-weight 0.7
```

**Output**: Top 10 results ranked by combined BM25 + semantic similarity scores.

### 2. Semantic Re-ranking

Re-rank retrieved chunks using cross-encoder for improved relevance:

```bash
python scripts/rerank.py \
  --chunks retrieved_chunks.json \
  --query "explain embeddings in Hebrew" \
  --top-k 5
```

### 3. Prompt Caching Analysis

Analyze and optimize prompt caching for cost reduction:

```bash
python scripts/cache_optimizer.py \
  --chat-logs logs/chat_history.jsonl \
  --analyze-cache-hits
```

**Expected savings**: 50-90% reduction in API costs for repeated content queries.

## Core Features

### Hybrid Search (BM25 + Semantic)

Traditional keyword search catches exact matches that embeddings might miss (e.g., technical terms, code, acronyms). Semantic search handles synonyms and conceptual queries.

**When to use**:
- Queries with technical jargon (e.g., "LoRA fine-tuning")
- Code-related questions
- Hebrew queries with English technical terms mixed in
- Queries where exact keyword match is important

**Implementation**: See [HYBRID_SEARCH.md](references/HYBRID_SEARCH.md)

### Semantic Re-ranking

After retrieval, re-rank using a cross-encoder model that compares query-chunk pairs directly (more accurate than embeddings alone).

**When to use**:
- Top 20-50 candidates retrieved, need best 5-10
- Questions requiring nuanced understanding
- When citation accuracy is critical
- Improving answer confidence scores

**Implementation**: See [RERANKING.md](references/RERANKING.md)

### Prompt Caching Strategy

Claude API supports prompt caching to reduce costs on repeated content. Cache:
1. System prompt (static)
2. Video transcripts (semi-static, change per video)
3. Retrieved context (dynamic, don't cache)

**Example cache structure**:
```typescript
// Cached prefix (90% of tokens)
{
  role: "user",
  content: [
    { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    { type: "text", text: VIDEO_TRANSCRIPT, cache_control: { type: "ephemeral" } }
  ]
}

// Dynamic query (10% of tokens)
{
  role: "user",
  content: [{ type: "text", text: USER_QUERY }]
}
```

**Implementation**: See [PROMPT_CACHING.md](references/PROMPT_CACHING.md)

### Hebrew Language Optimization

Hebrew introduces unique challenges:
- RTL text handling in embeddings
- Mixed Hebrew-English technical content
- Morphological variations (prefixes, suffixes)
- Technical terms often in English

**Strategies**:
- Use multilingual embedding models (OpenAI text-embedding-3-small supports Hebrew)
- Normalize Hebrew text (remove nikud, normalize final letters)
- Handle code-switching (Hebrew + English in same chunk)
- BM25 for exact Hebrew term matching

**Implementation**: See [HEBREW_OPTIMIZATION.md](references/HEBREW_OPTIMIZATION.md)

## Testing & Evaluation

### Generate Synthetic Test Cases

Auto-generate Q&A pairs from video transcripts for RAG evaluation:

```bash
python scripts/test_generator.py \
  --video-id mHThVfGmd6I \
  --num-questions 20 \
  --difficulty-levels beginner,intermediate,advanced \
  --output test_cases.json
```

### Evaluate RAG Quality

Run test cases against your RAG system:

```bash
python scripts/evaluate_rag.py \
  --test-cases test_cases.json \
  --rag-endpoint http://localhost:3000/api/chat \
  --metrics accuracy,relevance,citation_quality
```

**Metrics**:
- **Accuracy**: Answer correctness (0-1)
- **Relevance**: Retrieved context relevance (0-1)
- **Citation Quality**: Timestamp accuracy (0-1)
- **Latency**: Response time (ms)
- **Cost**: Tokens used per query

**Implementation**: See [RAG_METRICS.md](references/RAG_METRICS.md)

## Integration with LearnWithAvi

### Update Chat API

Modify `/src/app/api/chat/route.ts`:

```typescript
import { hybridSearch } from '@/lib/rag/hybrid-search'
import { rerankResults } from '@/lib/rag/rerank'

// Replace simple vector search with hybrid + rerank
const retrievedChunks = await hybridSearch(query, { topK: 20 })
const rankedChunks = await rerankResults(query, retrievedChunks, { topK: 5 })

// Use ranked chunks as context
const context = rankedChunks.map(chunk => chunk.text).join('\n\n')
```

### Optimize Prompt Caching

Update Claude API call with caching:

```typescript
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" }
        },
        {
          type: "text",
          text: `Video Context:\n${videoTranscript}`,
          cache_control: { type: "ephemeral" }
        },
        {
          type: "text",
          text: `User Query: ${query}`
        }
      ]
    }
  ]
})
```

### Monitor Cache Hit Rates

Add cache metrics logging:

```typescript
const cacheMetrics = {
  cache_creation_input_tokens: response.usage.cache_creation_input_tokens,
  cache_read_input_tokens: response.usage.cache_read_input_tokens,
  input_tokens: response.usage.input_tokens
}

// Log for analysis
console.log('Cache hit rate:',
  cacheMetrics.cache_read_input_tokens / cacheMetrics.input_tokens
)
```

## Advanced Topics

### Multi-turn Conversation Context

For follow-up questions, maintain conversation history in cache:

```typescript
const conversationHistory = messages.slice(0, -1) // All but last message
const latestQuery = messages[messages.length - 1]

// Cache conversation history
cache_control: { type: "ephemeral" }
```

**Trade-off**: More cache hits but larger cache footprint. Best for 3+ turn conversations.

### Confidence Scoring

Score answer confidence based on:
1. Retrieval relevance scores
2. Semantic similarity of top chunks
3. Presence of contradictory information
4. Citation count

```bash
python scripts/confidence_scorer.py \
  --query "מה זה RAG?" \
  --retrieved-chunks chunks.json \
  --threshold 0.7
```

Low confidence → Suggest user rephrase or indicate uncertainty in response.

### Fallback Strategies

When RAG quality is poor:
1. Keyword search only (exact matches)
2. Broader semantic search (increase top-K)
3. Cross-video search (search all transcripts, not just current video)
4. Clarification request ("I don't have information about this in the current video. Can you rephrase?")

## Scripts Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `hybrid_search.py` | BM25 + semantic search | Retrieval improvement |
| `rerank.py` | Cross-encoder re-ranking | Relevance improvement |
| `cache_optimizer.py` | Analyze caching efficiency | Cost reduction |
| `test_generator.py` | Generate synthetic Q&A | Testing |
| `evaluate_rag.py` | Measure RAG quality | Quality assurance |
| `confidence_scorer.py` | Score answer confidence | Answer reliability |

## Detailed References

For implementation details, see the `references/` directory:

- **[HYBRID_SEARCH.md](references/HYBRID_SEARCH.md)** - BM25 + semantic search implementation
- **[RERANKING.md](references/RERANKING.md)** - Cross-encoder re-ranking guide
- **[PROMPT_CACHING.md](references/PROMPT_CACHING.md)** - Claude caching strategies
- **[HEBREW_OPTIMIZATION.md](references/HEBREW_OPTIMIZATION.md)** - Hebrew-specific NLP tips
- **[RAG_METRICS.md](references/RAG_METRICS.md)** - Evaluation metrics and benchmarks

## Common Patterns

### Pattern 1: High-Precision Retrieval

Use when answer accuracy is critical (e.g., technical explanations):

```bash
# Strict thresholds, re-ranking enabled
python scripts/hybrid_search.py --top-k 50 --threshold 0.8
python scripts/rerank.py --top-k 5 --threshold 0.9
```

### Pattern 2: High-Recall Retrieval

Use when exploring topics (e.g., "tell me about embeddings"):

```bash
# Broad search, more results
python scripts/hybrid_search.py --top-k 100 --threshold 0.5
python scripts/rerank.py --top-k 10 --threshold 0.6
```

### Pattern 3: Code-Focused Retrieval

Use when query involves code or technical terms:

```bash
# Higher BM25 weight for exact matches
python scripts/hybrid_search.py --bm25-weight 0.6 --semantic-weight 0.4
```

## Troubleshooting

**Problem**: Low retrieval relevance scores
- **Solution**: Check embedding model, try different chunking strategy, add more overlap

**Problem**: High API costs despite caching
- **Solution**: Run `cache_optimizer.py` to analyze cache hit rates, ensure static content is cached

**Problem**: Hebrew queries returning poor results
- **Solution**: See [HEBREW_OPTIMIZATION.md](references/HEBREW_OPTIMIZATION.md) for language-specific tuning

**Problem**: Slow response times
- **Solution**: Reduce top-K in retrieval, use smaller re-ranking model, enable response streaming

## Performance Benchmarks

Expected improvements over baseline (vector-only search):

| Metric | Baseline | With Hybrid Search | With Reranking |
|--------|----------|-------------------|----------------|
| Answer Accuracy | 65% | 75% (+10%) | 85% (+20%) |
| API Cost | $100/mo | $60/mo (-40%) | $50/mo (-50%) |
| Latency | 800ms | 850ms (+6%) | 1000ms (+25%) |
| Hebrew Accuracy | 55% | 70% (+15%) | 80% (+25%) |

## Next Steps

1. **Implement hybrid search** in `/src/lib/rag.ts`
2. **Add prompt caching** to `/src/app/api/chat/route.ts`
3. **Generate test cases** for your video content
4. **Benchmark improvements** using `evaluate_rag.py`
5. **Monitor cache hit rates** in production
6. **Iterate** based on real user queries

---

**Note**: This skill assumes familiarity with RAG concepts. For RAG fundamentals, see the LearnWithAvi course on Retrieval-Augmented Generation.
