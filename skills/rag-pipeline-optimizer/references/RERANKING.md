# Semantic Re-ranking for RAG Systems

Complete guide to improving retrieval relevance through semantic re-ranking using cross-encoders and LLM-based scoring.

## Table of Contents

1. [Why Re-ranking?](#why-re-ranking)
2. [Re-ranking Methods](#re-ranking-methods)
3. [Cross-Encoder Models](#cross-encoder-models)
4. [LLM-Based Re-ranking](#llm-based-re-ranking)
5. [Implementation Guide](#implementation-guide)
6. [Performance Optimization](#performance-optimization)
7. [Evaluation](#evaluation)

---

## Why Re-ranking?

### The Two-Stage Retrieval Problem

**Stage 1: Fast Retrieval** (BM25 or bi-encoder embeddings)
- Searches millions of chunks in <100ms
- Uses approximate search (trade-off: speed vs accuracy)
- Returns top 20-100 candidates

**Stage 2: Slow Re-ranking** (cross-encoder or LLM)
- Re-scores only top candidates (20-100 chunks)
- Uses precise query-chunk comparisons
- Returns final top 5-10 results

### Why Bi-encoders Aren't Enough

**Bi-encoder** (e.g., OpenAI embeddings):
```
query → [embedding] → cosine similarity ← [embedding] ← chunk
```
- Encodes query and chunk independently
- Fast but less accurate
- Misses nuanced semantic relationships

**Cross-encoder**:
```
[query + chunk together] → relevance score
```
- Processes query-chunk pair jointly
- Slower but much more accurate
- Captures complex interactions

### Performance Gains

Expected improvements with re-ranking:

| Metric | Without Re-ranking | With Re-ranking | Improvement |
|--------|-------------------|-----------------|-------------|
| Precision@5 | 0.60 | 0.82 | +37% |
| NDCG@5 | 0.68 | 0.86 | +26% |
| MRR | 0.58 | 0.78 | +34% |
| Answer Quality | 0.72 | 0.85 | +18% |

---

## Re-ranking Methods

### 1. Heuristic Re-ranking (Fast)

Use simple rules to re-score chunks:
- Query term overlap
- Exact phrase matching
- Chunk length preferences
- Diversity filtering

**Pros**: No additional API calls, very fast
**Cons**: Limited accuracy improvement

**Use when**: Need minimal latency, cost-sensitive

### 2. Cross-Encoder Re-ranking (Balanced)

Use specialized cross-encoder models:
- MS MARCO models (English)
- mMARCO models (multilingual, including Hebrew)
- Domain-specific models

**Pros**: Significant accuracy boost, reasonable speed
**Cons**: Requires model hosting or API

**Use when**: Need best accuracy/cost trade-off

### 3. LLM-Based Re-ranking (Slow)

Use Claude/GPT to score relevance:
- Most accurate
- Can explain scoring
- Handles complex reasoning

**Pros**: Highest accuracy, no model hosting
**Cons**: Expensive, slow (200-500ms per batch)

**Use when**: Quality is paramount, cost acceptable

---

## Cross-Encoder Models

### Recommended Models

#### 1. MS MARCO MiniLM (English, Fast)

```python
from sentence_transformers import CrossEncoder

model = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

# Score query-chunk pairs
scores = model.predict([
    ["What is RAG?", "RAG stands for Retrieval-Augmented Generation"],
    ["What is RAG?", "The sky is blue"]
])
# scores = [0.92, 0.03]
```

**Specs**:
- Size: 90MB
- Speed: ~50ms for 20 pairs (on CPU)
- Accuracy: Good for English

#### 2. mMARCO mMiniLM (Multilingual)

```python
model = CrossEncoder('cross-encoder/mmarco-mMiniLMv2-L12-H384-v1')

# Works with Hebrew
scores = model.predict([
    ["מה זה embeddings?", "Embeddings הם ייצוג וקטורי של טקסט"],
    ["מה זה embeddings?", "החתול ישן על השטיח"]
])
# scores = [0.88, 0.05]
```

**Specs**:
- Size: 420MB
- Speed: ~120ms for 20 pairs
- Languages: 100+ including Hebrew
- Best for LearnWithAvi (Hebrew support)

#### 3. DistilRoBERTa (Semantic Similarity)

```python
model = CrossEncoder('cross-encoder/stsb-distilroberta-base')

# Good for semantic similarity tasks
scores = model.predict([
    ["embeddings", "vector representations"],
    ["embeddings", "database tables"]
])
# scores = [0.91, 0.22]
```

**Specs**:
- Size: 328MB
- Speed: ~80ms for 20 pairs
- Use case: Semantic similarity, not information retrieval

### Model Selection Guide

| Scenario | Model | Reason |
|----------|-------|--------|
| English only, speed critical | ms-marco-MiniLM-L-6-v2 | Fastest, good accuracy |
| Hebrew + English (LearnWithAvi) | mmarco-mMiniLMv2-L12-H384-v1 | Best multilingual |
| Domain-specific | Fine-tune ms-marco | Custom training |
| Highest accuracy | ms-marco-TinyBERT-L-6 | Larger model |

---

## LLM-Based Re-ranking

### Using Claude for Re-ranking

```python
from anthropic import Anthropic

client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

async def rerank_with_claude(
    query: str,
    chunks: list[str],
    top_k: int = 5
) -> list[dict]:
    """
    Re-rank chunks using Claude.

    Args:
        query: User query
        chunks: List of chunk texts
        top_k: Number to return

    Returns:
        Re-ranked chunks with scores
    """
    # Prepare prompt
    chunks_text = "\n\n".join([
        f"[Chunk {i+1}]\n{chunk}"
        for i, chunk in enumerate(chunks)
    ])

    prompt = f"""Rate the relevance of each chunk to the query. Output JSON array of scores 0-1.

Query: {query}

Chunks:
{chunks_text}

Output format: [{{"chunk_id": 1, "score": 0.95}}, ...]"""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )

    # Parse scores
    scores = json.loads(response.content[0].text)

    # Sort and return top K
    ranked = sorted(
        zip(chunks, scores),
        key=lambda x: x[1]['score'],
        reverse=True
    )

    return [
        {'text': chunk, 'score': score['score']}
        for chunk, score in ranked[:top_k]
    ]
```

### Cost Analysis

**Claude Sonnet 4 Pricing**:
- Input: $3 per 1M tokens
- Output: $15 per 1M tokens

**Example Cost**:
- Query: 10 tokens
- 20 chunks × 100 tokens each = 2000 tokens
- Output: 100 tokens
- **Total**: ~$0.002 per re-ranking call

**Optimization**: Batch multiple queries, use shorter chunks

---

## Implementation Guide

### Step 1: Retrieve Candidates

```python
# Retrieve 20-50 candidates (over-retrieve)
candidates = await hybrid_search(query, top_k=30)
```

**Why over-retrieve?**
- Initial retrieval might miss relevant chunks
- Re-ranking can promote better chunks to top positions
- Rule of thumb: Retrieve 3-5x final top_k

### Step 2: Re-rank

```python
# Re-rank top 30 down to top 5
from sentence_transformers import CrossEncoder

model = CrossEncoder('cross-encoder/mmarco-mMiniLMv2-L12-H384-v1')

# Prepare query-chunk pairs
pairs = [[query, chunk['text']] for chunk in candidates]

# Score all pairs
scores = model.predict(pairs)

# Attach scores to chunks
for chunk, score in zip(candidates, scores):
    chunk['rerank_score'] = float(score)

# Sort by rerank score
reranked = sorted(candidates, key=lambda x: x['rerank_score'], reverse=True)

# Return top K
top_k_results = reranked[:5]
```

### Step 3: Generate Answer

```python
# Use re-ranked chunks as context
context = "\n\n".join([chunk['text'] for chunk in top_k_results])

answer = await claude_generate(query, context)
```

---

## Performance Optimization

### 1. Model Caching

Load model once, reuse:

```python
# Global model cache
_model_cache = {}

def get_cross_encoder(model_name: str):
    """Get cached cross-encoder model."""
    if model_name not in _model_cache:
        _model_cache[model_name] = CrossEncoder(model_name)
    return _model_cache[model_name]

# Usage
model = get_cross_encoder('cross-encoder/mmarco-mMiniLMv2-L12-H384-v1')
scores = model.predict(pairs)
```

### 2. Batch Processing

Process multiple queries together:

```python
def batch_rerank(
    queries: list[str],
    chunks_per_query: list[list[str]],
    model: CrossEncoder
) -> list[list[float]]:
    """
    Re-rank multiple queries in batch.

    Args:
        queries: List of queries
        chunks_per_query: List of chunk lists (one per query)
        model: Cross-encoder model

    Returns:
        List of score lists (one per query)
    """
    # Flatten all pairs
    all_pairs = []
    query_lengths = []

    for query, chunks in zip(queries, chunks_per_query):
        pairs = [[query, chunk] for chunk in chunks]
        all_pairs.extend(pairs)
        query_lengths.append(len(pairs))

    # Score all at once
    all_scores = model.predict(all_pairs)

    # Split scores back by query
    results = []
    start = 0
    for length in query_lengths:
        results.append(all_scores[start:start + length].tolist())
        start += length

    return results
```

### 3. Parallel Processing

Use async for LLM-based re-ranking:

```python
import asyncio

async def rerank_parallel(
    queries: list[str],
    chunks_per_query: list[list[str]],
    max_concurrent: int = 5
) -> list[list[dict]]:
    """
    Re-rank multiple queries in parallel.
    """
    semaphore = asyncio.Semaphore(max_concurrent)

    async def rerank_one(query, chunks):
        async with semaphore:
            return await rerank_with_claude(query, chunks)

    tasks = [
        rerank_one(query, chunks)
        for query, chunks in zip(queries, chunks_per_query)
    ]

    return await asyncio.gather(*tasks)
```

### 4. Smart Caching

Cache re-ranking results:

```python
import hashlib
from functools import lru_cache

def compute_cache_key(query: str, chunk_ids: list[str]) -> str:
    """Generate cache key for query-chunks pair."""
    content = query + '|' + ','.join(sorted(chunk_ids))
    return hashlib.md5(content.encode()).hexdigest()

# In-memory cache
rerank_cache = {}

async def rerank_with_cache(
    query: str,
    chunks: list[dict]
) -> list[dict]:
    """
    Re-rank with caching.
    """
    # Generate cache key
    chunk_ids = [chunk['id'] for chunk in chunks]
    cache_key = compute_cache_key(query, chunk_ids)

    # Check cache
    if cache_key in rerank_cache:
        print("Cache hit!")
        return rerank_cache[cache_key]

    # Re-rank
    result = await rerank_cross_encoder(query, chunks)

    # Store in cache
    rerank_cache[cache_key] = result

    return result
```

**Cache Considerations**:
- ✅ Cache common queries (FAQ)
- ✅ Short TTL (1 hour) for dynamic content
- ❌ Don't cache user-specific queries
- ❌ Limit cache size (LRU eviction)

---

## Evaluation

### Measuring Re-ranking Impact

```python
def evaluate_reranking(
    test_cases: list[dict],
    retrieval_fn,
    rerank_fn
) -> dict:
    """
    Compare retrieval with and without re-ranking.

    Args:
        test_cases: List of {query, relevant_chunks}
        retrieval_fn: Initial retrieval function
        rerank_fn: Re-ranking function

    Returns:
        Comparison metrics
    """
    metrics_before = {'precision': [], 'recall': [], 'ndcg': []}
    metrics_after = {'precision': [], 'recall': [], 'ndcg': []}

    for test_case in test_cases:
        query = test_case['query']
        relevant = test_case['relevant_chunks']

        # Before re-ranking
        results_before = retrieval_fn(query, top_k=5)
        metrics_before['precision'].append(
            precision_at_k(results_before, relevant, k=5)
        )
        # ... other metrics

        # After re-ranking
        candidates = retrieval_fn(query, top_k=30)
        results_after = rerank_fn(query, candidates, top_k=5)
        metrics_after['precision'].append(
            precision_at_k(results_after, relevant, k=5)
        )
        # ... other metrics

    # Average metrics
    comparison = {
        'before': {k: statistics.mean(v) for k, v in metrics_before.items()},
        'after': {k: statistics.mean(v) for k, v in metrics_after.items()}
    }

    # Calculate improvements
    comparison['improvement'] = {
        k: (comparison['after'][k] - comparison['before'][k]) / comparison['before'][k]
        for k in metrics_before.keys()
    }

    return comparison

# Example output
# {
#   'before': {'precision': 0.60, 'recall': 0.65, 'ndcg': 0.68},
#   'after': {'precision': 0.82, 'recall': 0.78, 'ndcg': 0.86},
#   'improvement': {'precision': +0.37, 'recall': +0.20, 'ndcg': +0.26}
# }
```

---

## LearnWithAvi Integration

### Update RAG Pipeline

```typescript
// src/lib/rag/rerank.ts

import { TranscriptChunk, QueryResult } from '@/types';

export async function rerankChunks(
  query: string,
  candidates: QueryResult[],
  topK: number = 5
): Promise<QueryResult[]> {
  // Call Python re-ranking service
  const response = await fetch('http://localhost:8000/rerank', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      chunks: candidates.map(c => ({
        id: c.chunk.id,
        text: c.chunk.text
      })),
      top_k: topK
    })
  });

  const reranked = await response.json();

  // Map back to QueryResult format
  return reranked.map((item: any) => ({
    chunk: candidates.find(c => c.chunk.id === item.chunk_id)!.chunk,
    relevance: item.rerank_score
  }));
}
```

### Update Chat API

```typescript
// src/app/api/chat/route.ts

import { queryChunks } from '@/lib/rag';
import { rerankChunks } from '@/lib/rag/rerank';

export async function POST(req: Request) {
  const { message, videoId } = await req.json();

  // Stage 1: Retrieve 30 candidates
  const candidates = await queryChunks(message, 30, videoId);

  // Stage 2: Re-rank to top 5
  const reranked = await rerankChunks(message, candidates, 5);

  // Generate answer with re-ranked context
  const context = reranked.map(r => r.chunk.text).join('\n\n');
  const answer = await generateAnswer(message, context);

  return Response.json({ answer, sources: reranked });
}
```

---

## Best Practices

### Do's

✅ **Over-retrieve** then re-rank (retrieve 3-5x final top_k)
✅ **Use cross-encoders** for best accuracy/cost trade-off
✅ **Cache models** in memory (don't reload per query)
✅ **Batch process** when possible (multiple queries)
✅ **Measure impact** with A/B testing
✅ **Monitor latency** (re-ranking adds 50-200ms)

### Don'ts

❌ **Don't re-rank all results** (only top candidates)
❌ **Don't skip initial retrieval** (re-ranking isn't search)
❌ **Don't use LLM re-ranking** for every query (cost)
❌ **Don't forget multilingual models** for Hebrew
❌ **Don't re-rank already perfect results** (diminishing returns)

---

**Last Updated**: January 2026
