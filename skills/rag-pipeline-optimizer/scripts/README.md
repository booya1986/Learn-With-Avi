# RAG Pipeline Optimizer Scripts

Collection of Python scripts for optimizing RAG systems with hybrid search, re-ranking, and evaluation.

## Quick Start

### Installation

```bash
# Install required packages
pip install rank-bm25 numpy anthropic requests

# Optional: for cross-encoder re-ranking
pip install sentence-transformers
```

### Environment Variables

```bash
# Required for LLM-based re-ranking
export ANTHROPIC_API_KEY="your-api-key"

# Required for embeddings (if using OpenAI)
export OPENAI_API_KEY="your-api-key"
```

## Scripts

### 1. hybrid_search.py

Combine BM25 keyword search with semantic vector search.

**Features**:
- Adaptive weight selection based on query type
- Hebrew text preprocessing
- Sample corpus for testing

**Usage**:
```bash
# Basic usage
python hybrid_search.py --query "מה זה embeddings?" --top-k 10

# Custom weights
python hybrid_search.py \
  --query "RAG architecture" \
  --bm25-weight 0.6 \
  --semantic-weight 0.4

# With custom corpus
python hybrid_search.py \
  --query "explain semantic search" \
  --corpus-file corpus.json \
  --top-k 10
```

**Corpus Format** (`corpus.json`):
```json
[
  {
    "text": "Embeddings are vector representations of text",
    "metadata": {
      "video_id": "video1",
      "timestamp": "00:01:30"
    }
  }
]
```

**Output**: `hybrid_search_results.json` with ranked chunks and scores.

---

### 2. rerank.py

Re-rank retrieved chunks using heuristic, cross-encoder, or LLM methods.

**Features**:
- Multiple re-ranking methods
- Hebrew support (multilingual models)
- Batch processing

**Usage**:
```bash
# Heuristic re-ranking (fast, no API)
python rerank.py \
  --query "מה זה embeddings?" \
  --chunks results.json \
  --method heuristic \
  --top-k 5

# Cross-encoder re-ranking (best accuracy/cost)
python rerank.py \
  --query "explain RAG" \
  --chunks results.json \
  --method cross-encoder \
  --model multilingual \
  --top-k 5

# Claude re-ranking (highest accuracy)
python rerank.py \
  --query "vector search optimization" \
  --chunks results.json \
  --method claude \
  --top-k 5
```

**Chunks Format** (`results.json`):
```json
[
  {
    "text": "Embeddings are vector representations...",
    "relevance": 0.75,
    "metadata": {
      "video_id": "video1",
      "timestamp": "00:01:30"
    }
  }
]
```

**Output**: `reranked_results.json` with updated scores.

**Cross-Encoder Models**:
- `ms-marco`: Fast English model
- `multilingual`: Supports Hebrew (default)
- `distilroberta`: Semantic similarity

---

### 3. evaluate_rag.py

Evaluate RAG system performance with multiple metrics.

**Features**:
- Retrieval metrics (Recall@K, Precision@K, MRR, NDCG)
- Answer quality metrics
- Latency and cost tracking
- A/B testing support

**Usage**:
```bash
# Evaluate with test cases
python evaluate_rag.py \
  --test-cases test_cases.json \
  --rag-endpoint http://localhost:3000/api/chat \
  --metrics all \
  --top-k 5

# Sample test cases (no file needed)
python evaluate_rag.py \
  --generate-sample \
  --rag-endpoint http://localhost:3000/api/chat

# Specific metrics only
python evaluate_rag.py \
  --test-cases test.json \
  --rag-endpoint http://localhost:3000/api/chat \
  --metrics retrieval,latency
```

**Test Cases Format** (`test_cases.json`):
```json
[
  {
    "query": "מה זה embeddings?",
    "video_id": "video1",
    "expected_keywords": ["embeddings", "vector", "semantic"],
    "relevant_chunks": ["chunk_001", "chunk_004"],
    "relevance_scores": {
      "chunk_001": 1.0,
      "chunk_004": 0.8,
      "chunk_007": 0.5
    }
  }
]
```

**Output**: `rag_evaluation_results.json` with detailed metrics.

**Metrics**:
- `retrieval`: Recall@K, Precision@K, MRR, NDCG
- `answer`: Keyword coverage, length quality, citations
- `latency`: Response time breakdown
- `all`: All metrics

---

### 4. cache_optimizer.py

Analyze prompt caching efficiency and optimize cache strategy.

**Features**:
- Cache hit rate analysis
- Token usage breakdown
- Cost savings calculation
- Optimization recommendations

**Usage**:
```bash
# Analyze cache performance
python cache_optimizer.py \
  --chat-logs logs/chat_history.jsonl \
  --analyze-cache-hits

# Simulate different cache strategies
python cache_optimizer.py \
  --chat-logs logs/chat_history.jsonl \
  --simulate-strategy video_transcript

# Generate optimization report
python cache_optimizer.py \
  --chat-logs logs/chat_history.jsonl \
  --report-output cache_report.json
```

**Chat Log Format** (`chat_history.jsonl`):
```jsonl
{"query": "what is RAG?", "videoId": "video1", "usage": {"input_tokens": 5000, "cache_read_input_tokens": 4000}}
{"query": "explain embeddings", "videoId": "video1", "usage": {"input_tokens": 5200, "cache_read_input_tokens": 4100}}
```

**Output**: Cache analysis report with recommendations.

---

## Common Workflows

### Workflow 1: Test Hybrid Search

```bash
# 1. Run hybrid search on sample queries
python hybrid_search.py --query "מה זה RAG?" --top-k 10

# 2. Check results in hybrid_search_results.json
cat hybrid_search_results.json

# 3. Try different weight combinations
python hybrid_search.py --query "explain embeddings" --bm25-weight 0.5 --semantic-weight 0.5
```

### Workflow 2: Optimize Retrieval with Re-ranking

```bash
# 1. Get initial results with hybrid search
python hybrid_search.py --query "vector search optimization" --top-k 30

# 2. Re-rank results to top 5
python rerank.py \
  --query "vector search optimization" \
  --chunks hybrid_search_results.json \
  --method cross-encoder \
  --top-k 5

# 3. Compare scores before/after re-ranking
cat reranked_results.json
```

### Workflow 3: Evaluate RAG System

```bash
# 1. Create test cases (see format above)
# Save to test_cases.json

# 2. Start your RAG API
npm run dev  # (in LearnWithAvi root)

# 3. Run evaluation
python evaluate_rag.py \
  --test-cases test_cases.json \
  --rag-endpoint http://localhost:3000/api/chat \
  --top-k 5

# 4. Review results
cat rag_evaluation_results.json
```

### Workflow 4: Optimize Caching

```bash
# 1. Collect chat logs from production
# Export to chat_history.jsonl

# 2. Analyze cache performance
python cache_optimizer.py \
  --chat-logs chat_history.jsonl \
  --analyze-cache-hits

# 3. Review recommendations
# Implement suggested cache strategy in code
```

---

## Tips

### Performance

- **Hybrid Search**: Use higher BM25 weight (0.5-0.7) for Hebrew queries with technical terms
- **Re-ranking**: Always retrieve 3-5x more candidates than final top-K
- **Caching**: Cache video transcripts (semi-static) but not retrieved chunks (dynamic)

### Hebrew Optimization

- Hybrid search automatically handles Hebrew preprocessing
- Use `multilingual` cross-encoder model for Hebrew re-ranking
- Test with mixed Hebrew-English queries (common in technical content)

### Cost Optimization

- Heuristic re-ranking: $0 (free)
- Cross-encoder re-ranking: $0 (local model)
- Claude re-ranking: ~$0.002 per query (expensive but accurate)

### Debugging

- Add `--verbose` flag to scripts for detailed logging
- Check `*.json` output files for intermediate results
- Use sample data (no `--corpus-file` or `--test-cases`) for quick testing

---

## Troubleshooting

**Error: "rank_bm25 not installed"**
```bash
pip install rank-bm25
```

**Error: "sentence-transformers not installed"**
```bash
pip install sentence-transformers
# Note: Downloads models (~400MB) on first use
```

**Error: "ANTHROPIC_API_KEY not set"**
```bash
export ANTHROPIC_API_KEY="your-key"
# Or use different re-ranking method: --method heuristic
```

**Slow re-ranking**
- Use `heuristic` method for speed
- Reduce number of chunks to re-rank
- Use smaller cross-encoder model: `--model ms-marco`

---

## Integration with LearnWithAvi

These scripts are designed to work with LearnWithAvi's RAG pipeline:

1. **Export transcripts** to corpus format
2. **Test hybrid search** with sample queries
3. **Evaluate** against production API
4. **Integrate** best-performing strategies into TypeScript code

See `references/` directory for integration guides.

---

**Last Updated**: January 2026
