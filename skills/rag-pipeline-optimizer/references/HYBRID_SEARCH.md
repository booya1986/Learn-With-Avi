# Hybrid Search Implementation Guide

Combine BM25 keyword search with semantic vector search for optimal retrieval in educational RAG systems.

## Why Hybrid Search?

**Vector Search Alone** (current LearnWithAvi implementation):
- ✅ Handles synonyms and conceptual queries
- ✅ Works across languages (Hebrew ↔ English)
- ❌ Misses exact technical terms
- ❌ Poor with code, acronyms, numbers
- ❌ Expensive (requires embeddings for everything)

**BM25 Keyword Search Alone**:
- ✅ Fast and cheap
- ✅ Exact matches for technical terms
- ✅ No model required
- ❌ No semantic understanding
- ❌ Misses synonyms and paraphrases
- ❌ Poor with Hebrew morphology

**Hybrid (BM25 + Vector)**:
- ✅ Best of both worlds
- ✅ Handles technical terms AND conceptual queries
- ✅ Resilient to query variations

---

## Algorithm

### 1. Parallel Retrieval

Retrieve top-K candidates from both methods in parallel:

```python
# BM25 retrieval
bm25_results = bm25_search(query, top_k=50)

# Vector retrieval
query_embedding = embed(query)
vector_results = vector_search(query_embedding, top_k=50)
```

### 2. Score Normalization

Normalize scores to [0, 1] range for fair comparison:

```python
def normalize_scores(results):
    scores = [r.score for r in results]
    min_score, max_score = min(scores), max(scores)

    for result in results:
        result.normalized_score = (
            (result.score - min_score) / (max_score - min_score)
            if max_score > min_score else 0
        )

    return results
```

### 3. Weighted Combination

Combine scores with tunable weights:

```python
# Default weights (tune based on your domain)
BM25_WEIGHT = 0.3
SEMANTIC_WEIGHT = 0.7

combined_scores = {}

for chunk_id in all_chunk_ids:
    bm25_score = bm25_results.get(chunk_id, 0)
    semantic_score = vector_results.get(chunk_id, 0)

    combined_scores[chunk_id] = (
        BM25_WEIGHT * bm25_score +
        SEMANTIC_WEIGHT * semantic_score
    )
```

### 4. Re-ranking by Combined Score

```python
ranked_results = sorted(
    combined_scores.items(),
    key=lambda x: x[1],
    reverse=True
)[:top_k]
```

---

## Implementation for LearnWithAvi

### Step 1: Install Dependencies

```bash
pip install rank-bm25
```

### Step 2: Create BM25 Index

Index all transcript chunks for BM25 search:

```python
from rank_bm25 import BM25Okapi
import json

# Load transcripts
with open('src/data/sample-transcripts.ts') as f:
    transcripts = parse_transcript_file(f)

# Tokenize for BM25 (Hebrew + English)
corpus = [chunk['text'].split() for chunk in transcripts]

# Create BM25 index
bm25 = BM25Okapi(corpus)

# Save index for reuse
with open('bm25_index.pkl', 'wb') as f:
    pickle.dump(bm25, f)
```

### Step 3: Hybrid Search Function

```python
def hybrid_search(
    query: str,
    bm25_index: BM25Okapi,
    vector_db: ChromaCollection,
    top_k: int = 10,
    bm25_weight: float = 0.3,
    semantic_weight: float = 0.7
):
    """
    Perform hybrid search combining BM25 and semantic vector search.

    Args:
        query: User query string
        bm25_index: Precomputed BM25 index
        vector_db: ChromaDB collection
        top_k: Number of results to return
        bm25_weight: Weight for BM25 scores (0-1)
        semantic_weight: Weight for semantic scores (0-1)

    Returns:
        List of ranked chunks with combined scores
    """
    # BM25 search
    query_tokens = query.split()
    bm25_scores = bm25_index.get_scores(query_tokens)
    bm25_results = {
        chunk_id: score
        for chunk_id, score in enumerate(bm25_scores)
    }

    # Vector search
    vector_results = vector_db.query(
        query_texts=[query],
        n_results=top_k * 2  # Get more candidates for reranking
    )

    # Normalize scores
    bm25_normalized = normalize_scores(bm25_results)
    vector_normalized = normalize_scores(vector_results)

    # Combine
    combined = {}
    all_ids = set(bm25_normalized.keys()) | set(vector_normalized.keys())

    for chunk_id in all_ids:
        bm25_score = bm25_normalized.get(chunk_id, 0)
        vector_score = vector_normalized.get(chunk_id, 0)

        combined[chunk_id] = (
            bm25_weight * bm25_score +
            semantic_weight * vector_score
        )

    # Sort by combined score
    ranked = sorted(
        combined.items(),
        key=lambda x: x[1],
        reverse=True
    )[:top_k]

    return [
        {
            'chunk_id': chunk_id,
            'score': score,
            'bm25_score': bm25_normalized.get(chunk_id, 0),
            'semantic_score': vector_normalized.get(chunk_id, 0)
        }
        for chunk_id, score in ranked
    ]
```

### Step 4: Integrate with LearnWithAvi Chat API

Update `/src/lib/rag.ts`:

```typescript
import { hybridSearch } from './hybrid-search'

export async function queryRAG(
  query: string,
  videoId: string,
  topK: number = 5
): Promise<Chunk[]> {
  try {
    // Use hybrid search instead of pure vector search
    const results = await hybridSearch({
      query,
      videoId,
      topK: topK * 2,  // Get more candidates
      bm25Weight: 0.3,
      semanticWeight: 0.7
    })

    // Return top results
    return results.slice(0, topK)

  } catch (error) {
    console.error('Hybrid search failed, falling back to vector only:', error)
    // Fallback to existing vector search
    return await vectorSearch(query, videoId, topK)
  }
}
```

---

## Weight Tuning

Choose weights based on query type:

| Query Type | Example | BM25 Weight | Semantic Weight |
|------------|---------|-------------|-----------------|
| Technical terms | "מה זה LoRA?" | 0.6 | 0.4 |
| Conceptual | "explain embeddings" | 0.2 | 0.8 |
| Code-related | "show me the code for..." | 0.7 | 0.3 |
| Mixed | "how to use RAG in chatbot" | 0.3 | 0.7 |

**Auto-tuning**: Analyze query patterns and adjust weights dynamically:

```python
def detect_query_type(query: str) -> str:
    """Detect query type for adaptive weight selection."""

    # Check for code indicators
    if any(keyword in query.lower() for keyword in ['code', 'function', 'class', 'import']):
        return 'code'

    # Check for technical terms (usually all-caps or English in Hebrew query)
    if re.search(r'\b[A-Z]{2,}\b', query):  # RAG, API, ML, etc.
        return 'technical'

    # Check for conceptual words
    if any(word in query for word in ['מה זה', 'explain', 'תסביר', 'how']):
        return 'conceptual'

    return 'mixed'

# Use adaptive weights
query_type = detect_query_type(query)
weights = {
    'technical': (0.6, 0.4),
    'conceptual': (0.2, 0.8),
    'code': (0.7, 0.3),
    'mixed': (0.3, 0.7)
}
bm25_weight, semantic_weight = weights[query_type]
```

---

## Hebrew-Specific Considerations

### Tokenization

Use Hebrew-aware tokenization for BM25:

```python
import re

def hebrew_tokenize(text: str) -> list[str]:
    """Tokenize Hebrew text for BM25."""

    # Remove nikud (diacritics)
    text = re.sub(r'[\u0591-\u05C7]', '', text)

    # Normalize final letters (ך→כ, ם→מ, ן→נ, ף→פ, ץ→צ)
    text = text.translate(str.maketrans('ךםןףץ', 'כמנפצ'))

    # Split on whitespace and punctuation
    tokens = re.findall(r'\b\w+\b', text)

    # Lowercase (for mixed Hebrew-English)
    tokens = [t.lower() for t in tokens]

    return tokens
```

### Handling Mixed Hebrew-English

Technical terms often appear in English within Hebrew text:

```python
# Example query: "מה זה RAG system?"
# Tokenized: ['מה', 'זה', 'rag', 'system']

# BM25 will match both Hebrew words and English technical terms
```

### Morphological Variations

Hebrew words change form with prefixes/suffixes. BM25 handles this poorly. Consider:

1. **Stemming**: Reduce words to root form
2. **Character n-grams**: Match partial word forms
3. **Higher semantic weight**: Rely more on embeddings for Hebrew

```python
# For Hebrew-heavy queries, increase semantic weight
if is_mostly_hebrew(query):
    bm25_weight = 0.2
    semantic_weight = 0.8
```

---

## Performance Optimization

### 1. Precompute BM25 Index

Compute once, reuse for all queries:

```python
# On video ingestion
bm25_index = BM25Okapi(corpus)
save_index(bm25_index, f'indexes/video_{video_id}.pkl')

# On query
bm25_index = load_index(f'indexes/video_{video_id}.pkl')
```

### 2. Parallel Search

Run BM25 and vector search in parallel:

```python
import asyncio

async def hybrid_search_async(query, video_id):
    bm25_task = asyncio.create_task(bm25_search(query))
    vector_task = asyncio.create_task(vector_search(query))

    bm25_results, vector_results = await asyncio.gather(
        bm25_task, vector_task
    )

    return combine_results(bm25_results, vector_results)
```

### 3. Cache Results

Cache frequent queries:

```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def hybrid_search_cached(query: str, video_id: str):
    return hybrid_search(query, video_id)
```

---

## Evaluation

Test hybrid search vs. vector-only:

```python
test_queries = [
    "מה זה embeddings?",           # Conceptual
    "RAG architecture",            # Technical
    "show me the code for LoRA",   # Code
    "איך לבנות chatbot?",          # Mixed
]

for query in test_queries:
    vector_results = vector_search(query)
    hybrid_results = hybrid_search(query)

    print(f"Query: {query}")
    print(f"Vector top-1: {vector_results[0].text[:100]}")
    print(f"Hybrid top-1: {hybrid_results[0].text[:100]}")
    print()
```

**Expected outcome**: Hybrid search should match or exceed vector-only for all query types.

---

## Integration Checklist

- [ ] Install `rank-bm25` package
- [ ] Create BM25 index for each video
- [ ] Implement `hybrid_search()` function
- [ ] Update `/src/lib/rag.ts` to use hybrid search
- [ ] Add weight tuning based on query type
- [ ] Test with Hebrew, English, and mixed queries
- [ ] Benchmark latency and accuracy improvements
- [ ] Monitor in production

---

## Next Steps

After implementing hybrid search:
1. Add **semantic re-ranking** (see [RERANKING.md](RERANKING.md))
2. Optimize **prompt caching** (see [PROMPT_CACHING.md](PROMPT_CACHING.md))
3. Tune for **Hebrew** (see [HEBREW_OPTIMIZATION.md](HEBREW_OPTIMIZATION.md))
