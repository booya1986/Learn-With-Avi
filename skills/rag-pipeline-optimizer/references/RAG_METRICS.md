# RAG Evaluation Metrics

Comprehensive guide to measuring and improving RAG system quality for educational platforms.

## Table of Contents

1. [Overview](#overview)
2. [Retrieval Metrics](#retrieval-metrics)
3. [Generation Metrics](#generation-metrics)
4. [End-to-End Metrics](#end-to-end-metrics)
5. [Cost & Performance Metrics](#cost--performance-metrics)
6. [A/B Testing Framework](#ab-testing-framework)
7. [Monitoring & Alerting](#monitoring--alerting)

---

## Overview

### Why RAG Metrics Matter

RAG systems have two components that need separate evaluation:
1. **Retrieval**: Are we finding the right context chunks?
2. **Generation**: Is the LLM producing good answers with that context?

Both must work well for a successful RAG system.

### Metric Categories

| Category | Focus | Example Metrics |
|----------|-------|----------------|
| **Retrieval** | Context quality | Recall@K, Precision@K, MRR |
| **Generation** | Answer quality | Faithfulness, Relevance |
| **End-to-End** | User experience | Answer correctness, Citation accuracy |
| **Performance** | Speed & cost | Latency, Token usage, Cache hit rate |

---

## Retrieval Metrics

### 1. Recall@K

**Definition**: Proportion of relevant chunks retrieved in top-K results.

**Formula**:
```
Recall@K = (Number of relevant chunks in top K) / (Total relevant chunks)
```

**Example**:
```python
def recall_at_k(retrieved_chunks: list, relevant_chunks: list, k: int) -> float:
    """
    Calculate Recall@K.

    Args:
        retrieved_chunks: List of retrieved chunk IDs
        relevant_chunks: List of all relevant chunk IDs
        k: Number of top results to consider

    Returns:
        Recall score (0-1)
    """
    top_k = retrieved_chunks[:k]
    hits = sum(1 for chunk_id in top_k if chunk_id in relevant_chunks)
    return hits / len(relevant_chunks) if relevant_chunks else 0.0

# Example
retrieved = ['chunk_5', 'chunk_2', 'chunk_9', 'chunk_1', 'chunk_7']
relevant = ['chunk_2', 'chunk_5', 'chunk_12']

recall = recall_at_k(retrieved, relevant, k=5)
# recall = 2/3 = 0.667
# (Found chunk_5 and chunk_2, missed chunk_12)
```

**When to Use**: Measure if your system finds all relevant information.

**Target Values**:
- Recall@5: 0.7+ (good)
- Recall@10: 0.85+ (good)
- Recall@20: 0.95+ (excellent)

---

### 2. Precision@K

**Definition**: Proportion of retrieved chunks that are relevant.

**Formula**:
```
Precision@K = (Number of relevant chunks in top K) / K
```

**Example**:
```python
def precision_at_k(retrieved_chunks: list, relevant_chunks: list, k: int) -> float:
    """
    Calculate Precision@K.

    Args:
        retrieved_chunks: List of retrieved chunk IDs
        relevant_chunks: List of all relevant chunk IDs
        k: Number of top results to consider

    Returns:
        Precision score (0-1)
    """
    top_k = retrieved_chunks[:k]
    hits = sum(1 for chunk_id in top_k if chunk_id in relevant_chunks)
    return hits / k if k > 0 else 0.0

# Example
retrieved = ['chunk_5', 'chunk_2', 'chunk_9', 'chunk_1', 'chunk_7']
relevant = ['chunk_2', 'chunk_5', 'chunk_12']

precision = precision_at_k(retrieved, relevant, k=5)
# precision = 2/5 = 0.4
# (2 relevant out of 5 retrieved)
```

**When to Use**: Measure retrieval quality vs noise.

**Trade-off**: Precision ↔ Recall
- High K → better recall, worse precision
- Low K → better precision, worse recall

**Target Values**:
- Precision@5: 0.6+ (good)
- Precision@10: 0.4+ (acceptable)

---

### 3. Mean Reciprocal Rank (MRR)

**Definition**: Average of reciprocal ranks of the first relevant result.

**Formula**:
```
MRR = (1 / rank of first relevant result)

For multiple queries:
MRR = average(1/rank₁, 1/rank₂, ..., 1/rankₙ)
```

**Example**:
```python
def mean_reciprocal_rank(retrieved_chunks: list, relevant_chunks: list) -> float:
    """
    Calculate MRR for a single query.

    Args:
        retrieved_chunks: List of retrieved chunk IDs (in rank order)
        relevant_chunks: List of all relevant chunk IDs

    Returns:
        MRR score (0-1)
    """
    for i, chunk_id in enumerate(retrieved_chunks, start=1):
        if chunk_id in relevant_chunks:
            return 1.0 / i
    return 0.0

# Example
retrieved = ['chunk_9', 'chunk_1', 'chunk_5', 'chunk_2', 'chunk_7']
relevant = ['chunk_2', 'chunk_5', 'chunk_12']

mrr = mean_reciprocal_rank(retrieved, relevant)
# mrr = 1/3 = 0.333
# (First relevant chunk is chunk_5 at rank 3)
```

**When to Use**: Measure how quickly users find relevant information.

**Target Values**:
- MRR > 0.5: Good (relevant in top 2)
- MRR > 0.7: Excellent (relevant in top 1-2)

---

### 4. Normalized Discounted Cumulative Gain (NDCG@K)

**Definition**: Ranking quality metric that considers both relevance and position.

**Formula**:
```
DCG@K = Σ(relevanceᵢ / log₂(i + 1)) for i=1 to K

NDCG@K = DCG@K / IDCG@K

where IDCG@K is the ideal DCG (perfect ranking)
```

**Example**:
```python
import math

def ndcg_at_k(
    retrieved_chunks: list,
    relevance_scores: dict,
    k: int
) -> float:
    """
    Calculate NDCG@K.

    Args:
        retrieved_chunks: List of retrieved chunk IDs
        relevance_scores: Dict mapping chunk_id to relevance (0-1)
        k: Number of top results

    Returns:
        NDCG score (0-1)
    """
    def dcg(scores: list) -> float:
        return sum(score / math.log2(i + 2) for i, score in enumerate(scores))

    # Actual DCG
    top_k = retrieved_chunks[:k]
    actual_scores = [relevance_scores.get(chunk_id, 0.0) for chunk_id in top_k]
    actual_dcg = dcg(actual_scores)

    # Ideal DCG
    ideal_scores = sorted(relevance_scores.values(), reverse=True)[:k]
    ideal_dcg = dcg(ideal_scores)

    return actual_dcg / ideal_dcg if ideal_dcg > 0 else 0.0

# Example
retrieved = ['chunk_5', 'chunk_2', 'chunk_9', 'chunk_1']
relevance = {
    'chunk_1': 0.3,
    'chunk_2': 0.9,
    'chunk_5': 0.7,
    'chunk_9': 0.1
}

ndcg = ndcg_at_k(retrieved, relevance, k=4)
# Penalizes that highly relevant chunk_2 is at rank 2, not rank 1
```

**When to Use**: When you have graded relevance scores (not binary relevant/not-relevant).

**Target Values**:
- NDCG@5 > 0.7: Good ranking quality
- NDCG@10 > 0.75: Excellent ranking quality

---

### 5. Hit Rate (Success@K)

**Definition**: Proportion of queries that retrieve at least one relevant chunk in top-K.

**Formula**:
```
Hit Rate@K = (Queries with ≥1 relevant chunk in top K) / (Total queries)
```

**Example**:
```python
def hit_rate_at_k(query_results: list[dict], k: int) -> float:
    """
    Calculate Hit Rate@K across multiple queries.

    Args:
        query_results: List of {retrieved: [...], relevant: [...]}
        k: Top K results

    Returns:
        Hit rate (0-1)
    """
    hits = 0
    for result in query_results:
        top_k = result['retrieved'][:k]
        if any(chunk_id in result['relevant'] for chunk_id in top_k):
            hits += 1

    return hits / len(query_results) if query_results else 0.0

# Example
results = [
    {'retrieved': ['a', 'b', 'c'], 'relevant': ['b']},  # Hit
    {'retrieved': ['d', 'e', 'f'], 'relevant': ['g']},  # Miss
    {'retrieved': ['h', 'i', 'j'], 'relevant': ['h']},  # Hit
]

hit_rate = hit_rate_at_k(results, k=3)
# hit_rate = 2/3 = 0.667
```

**When to Use**: Measure overall retrieval success rate.

**Target Values**:
- Hit Rate@5 > 0.85: Good
- Hit Rate@10 > 0.95: Excellent

---

## Generation Metrics

### 1. Faithfulness

**Definition**: Does the answer stay true to the retrieved context?

**Measurement**:
- **Automated**: Use LLM judge to check if answer is supported by context
- **Manual**: Human labelers verify citations

**Example (LLM Judge)**:
```python
async def measure_faithfulness(
    answer: str,
    context: str,
    llm_client
) -> float:
    """
    Use LLM to judge if answer is faithful to context.

    Returns:
        Faithfulness score (0-1)
    """
    prompt = f"""
    Context: {context}

    Answer: {answer}

    Is the answer fully supported by the context? Rate 0-10.
    - 10: Every claim is supported by context
    - 5: Partially supported, some claims not in context
    - 0: Contradicts or ignores context

    Respond with only a number 0-10.
    """

    response = await llm_client.complete(prompt)
    score = int(response.strip())
    return score / 10.0

# Example
context = "Embeddings are vector representations of text."
answer = "Embeddings represent text as vectors, which enables semantic search."

faithfulness = await measure_faithfulness(answer, context, llm_client)
# faithfulness = 0.9 (mostly faithful, adds "semantic search" inference)
```

**Target Values**:
- Faithfulness > 0.85: Good (minimal hallucination)
- Faithfulness > 0.95: Excellent (very faithful)

---

### 2. Answer Relevance

**Definition**: Does the answer actually address the user's question?

**Measurement**:
```python
async def measure_answer_relevance(
    question: str,
    answer: str,
    llm_client
) -> float:
    """
    Use LLM to judge answer relevance to question.

    Returns:
        Relevance score (0-1)
    """
    prompt = f"""
    Question: {question}

    Answer: {answer}

    How relevant is the answer to the question? Rate 0-10.
    - 10: Directly answers the question
    - 5: Partially addresses the question
    - 0: Completely irrelevant

    Respond with only a number 0-10.
    """

    response = await llm_client.complete(prompt)
    score = int(response.strip())
    return score / 10.0
```

**Target Values**:
- Answer Relevance > 0.8: Good
- Answer Relevance > 0.9: Excellent

---

### 3. Context Utilization

**Definition**: Does the answer effectively use the retrieved context?

**Measurement**:
- Check if key facts from context appear in answer
- Verify citation/timestamp references

**Example**:
```python
def measure_context_utilization(
    answer: str,
    context_chunks: list[str]
) -> float:
    """
    Measure how much of the context is used in the answer.

    Returns:
        Utilization score (0-1)
    """
    # Extract key phrases from context (simplified)
    context_phrases = set()
    for chunk in context_chunks:
        # Extract noun phrases, key terms (simplified)
        words = chunk.lower().split()
        context_phrases.update(words)

    # Check how many appear in answer
    answer_words = set(answer.lower().split())
    overlap = context_phrases & answer_words

    return len(overlap) / len(context_phrases) if context_phrases else 0.0
```

**Target Values**:
- Context Utilization > 0.3: Good (uses key information)
- Context Utilization > 0.5: Excellent (comprehensive use)

---

## End-to-End Metrics

### 1. Answer Correctness

**Definition**: Is the final answer correct?

**Measurement**:
- **Manual**: Human labelers (gold standard)
- **Semi-Automated**: LLM judge vs reference answer

**Example**:
```python
def compare_to_reference(
    answer: str,
    reference: str,
    llm_client
) -> float:
    """
    Compare answer to reference answer using LLM.

    Returns:
        Similarity score (0-1)
    """
    prompt = f"""
    Reference Answer: {reference}

    Generated Answer: {answer}

    How similar are these answers in meaning? Rate 0-10.
    - 10: Essentially identical meaning
    - 5: Partially overlapping
    - 0: Completely different

    Respond with only a number 0-10.
    """

    response = llm_client.complete(prompt)
    score = int(response.strip())
    return score / 10.0
```

**Target Values**:
- Answer Correctness > 0.8: Good
- Answer Correctness > 0.9: Excellent

---

### 2. Citation Quality

**Definition**: Are timestamps/citations accurate and helpful?

**Measurement**:
```python
def measure_citation_quality(answer: str, chunks: list[dict]) -> dict:
    """
    Measure quality of citations in answer.

    Returns:
        Dict with citation metrics
    """
    # Extract citations from answer (e.g., [00:03:45])
    citation_pattern = r'\[(\d{2}:\d{2}:\d{2})\]'
    citations = re.findall(citation_pattern, answer)

    # Check if citations match retrieved chunks
    chunk_timestamps = [chunk['timestamp'] for chunk in chunks]

    valid_citations = sum(
        1 for citation in citations
        if citation in chunk_timestamps
    )

    return {
        'total_citations': len(citations),
        'valid_citations': valid_citations,
        'citation_accuracy': valid_citations / len(citations) if citations else 0.0,
        'has_citations': len(citations) > 0
    }
```

**Target Values**:
- Citation Accuracy > 0.9: Good (most citations valid)
- Has Citations: True (all answers should cite sources)

---

## Cost & Performance Metrics

### 1. Latency

**Measurement**:
```python
import time

async def measure_rag_latency(query: str, rag_system) -> dict:
    """
    Measure latency breakdown of RAG system.

    Returns:
        Dict with timing metrics
    """
    timings = {}

    # Retrieval time
    start = time.time()
    chunks = await rag_system.retrieve(query)
    timings['retrieval'] = time.time() - start

    # Generation time
    start = time.time()
    answer = await rag_system.generate(query, chunks)
    timings['generation'] = time.time() - start

    # Total time
    timings['total'] = timings['retrieval'] + timings['generation']

    return timings

# Example output
# {
#   'retrieval': 0.15,  # 150ms
#   'generation': 1.2,  # 1200ms
#   'total': 1.35       # 1350ms
# }
```

**Target Values**:
- Total Latency < 2s: Good (acceptable for users)
- Total Latency < 1s: Excellent (feels instant)

**Breakdown**:
- Retrieval: 100-300ms (embeddings + vector search)
- Generation: 800-1500ms (LLM inference)

---

### 2. Token Usage & Cost

**Measurement**:
```python
def calculate_rag_cost(
    input_tokens: int,
    output_tokens: int,
    cached_tokens: int = 0,
    model: str = "claude-sonnet-4"
) -> dict:
    """
    Calculate cost of RAG query.

    Args:
        input_tokens: Input tokens (prompt + context)
        output_tokens: Generated tokens
        cached_tokens: Cached input tokens (prompt caching)
        model: Model name

    Returns:
        Dict with cost breakdown
    """
    # Claude Sonnet 4 pricing (as of Jan 2026)
    pricing = {
        'claude-sonnet-4': {
            'input': 3.00 / 1_000_000,   # $3 per 1M tokens
            'output': 15.00 / 1_000_000, # $15 per 1M tokens
            'cache_write': 3.75 / 1_000_000,
            'cache_read': 0.30 / 1_000_000  # 90% discount
        }
    }

    prices = pricing[model]

    # Calculate costs
    uncached_tokens = input_tokens - cached_tokens
    input_cost = uncached_tokens * prices['input']
    cache_cost = cached_tokens * prices['cache_read']
    output_cost = output_tokens * prices['output']

    total_cost = input_cost + cache_cost + output_cost

    return {
        'input_tokens': input_tokens,
        'output_tokens': output_tokens,
        'cached_tokens': cached_tokens,
        'input_cost': input_cost,
        'cache_cost': cache_cost,
        'output_cost': output_cost,
        'total_cost': total_cost,
        'cache_savings': (cached_tokens * prices['input']) - cache_cost
    }

# Example
cost = calculate_rag_cost(
    input_tokens=5000,
    output_tokens=200,
    cached_tokens=4000,  # 80% cached
    model='claude-sonnet-4'
)
# {
#   'total_cost': 0.00525,  # $0.00525 per query
#   'cache_savings': 0.0108  # Saved $0.0108
# }
```

**Target Values**:
- Cost per query < $0.01: Good
- Cache hit rate > 70%: Good
- Cache hit rate > 90%: Excellent

---

### 3. Cache Hit Rate

**Measurement**:
```python
def calculate_cache_hit_rate(usage_data: list[dict]) -> dict:
    """
    Calculate cache hit rate from API usage data.

    Args:
        usage_data: List of API responses with usage info

    Returns:
        Cache statistics
    """
    total_input_tokens = 0
    total_cached_tokens = 0

    for usage in usage_data:
        total_input_tokens += usage.get('input_tokens', 0)
        total_cached_tokens += usage.get('cache_read_input_tokens', 0)

    cache_hit_rate = total_cached_tokens / total_input_tokens if total_input_tokens else 0.0

    return {
        'total_input_tokens': total_input_tokens,
        'total_cached_tokens': total_cached_tokens,
        'cache_hit_rate': cache_hit_rate,
        'estimated_savings_percent': cache_hit_rate * 90  # 90% cost reduction on cached tokens
    }
```

**Target Values**:
- Cache Hit Rate > 70%: Good (substantial savings)
- Cache Hit Rate > 85%: Excellent (optimal caching)

---

## A/B Testing Framework

### Setting Up A/B Tests

```python
import random
from enum import Enum

class RAGVariant(Enum):
    BASELINE = "baseline"
    HYBRID_SEARCH = "hybrid_search"
    WITH_RERANKING = "with_reranking"

def assign_variant(user_id: str) -> RAGVariant:
    """
    Assign user to A/B test variant (deterministic based on user_id).
    """
    # Hash user_id to get consistent assignment
    hash_value = hash(user_id) % 100

    if hash_value < 33:
        return RAGVariant.BASELINE
    elif hash_value < 66:
        return RAGVariant.HYBRID_SEARCH
    else:
        return RAGVariant.WITH_RERANKING

async def rag_query_with_ab_test(query: str, user_id: str) -> dict:
    """
    Execute RAG query with A/B test variant.
    """
    variant = assign_variant(user_id)

    # Log variant assignment
    log_ab_event('query', user_id, variant)

    # Execute appropriate variant
    if variant == RAGVariant.BASELINE:
        result = await baseline_rag(query)
    elif variant == RAGVariant.HYBRID_SEARCH:
        result = await hybrid_rag(query)
    else:
        result = await reranked_rag(query)

    # Attach variant to result
    result['ab_variant'] = variant.value

    return result
```

### Analyzing A/B Test Results

```python
def analyze_ab_test(results: list[dict]) -> dict:
    """
    Analyze A/B test results across variants.

    Args:
        results: List of query results with metrics and variant

    Returns:
        Comparison of variants
    """
    from collections import defaultdict

    # Group by variant
    variant_metrics = defaultdict(lambda: {
        'latency': [],
        'recall': [],
        'answer_quality': []
    })

    for result in results:
        variant = result['ab_variant']
        variant_metrics[variant]['latency'].append(result['latency'])
        variant_metrics[variant]['recall'].append(result['recall_at_5'])
        variant_metrics[variant]['answer_quality'].append(result['answer_score'])

    # Calculate averages
    comparison = {}
    for variant, metrics in variant_metrics.items():
        comparison[variant] = {
            'avg_latency': statistics.mean(metrics['latency']),
            'avg_recall': statistics.mean(metrics['recall']),
            'avg_answer_quality': statistics.mean(metrics['answer_quality']),
            'sample_size': len(metrics['latency'])
        }

    return comparison

# Example output
# {
#   'baseline': {
#     'avg_latency': 1.2,
#     'avg_recall': 0.65,
#     'avg_answer_quality': 0.75,
#     'sample_size': 1000
#   },
#   'hybrid_search': {
#     'avg_latency': 1.3,
#     'avg_recall': 0.78,  # +13% improvement
#     'avg_answer_quality': 0.82,  # +7% improvement
#     'sample_size': 995
#   }
# }
```

---

## Monitoring & Alerting

### Key Metrics to Monitor

```python
# Production monitoring dashboard
MONITORING_METRICS = {
    # Performance
    'p50_latency': {'target': '<1.5s', 'alert': '>2s'},
    'p95_latency': {'target': '<3s', 'alert': '>5s'},
    'p99_latency': {'target': '<5s', 'alert': '>10s'},

    # Quality (sample-based evaluation)
    'recall_at_5': {'target': '>0.7', 'alert': '<0.5'},
    'answer_relevance': {'target': '>0.8', 'alert': '<0.6'},
    'faithfulness': {'target': '>0.85', 'alert': '<0.7'},

    # Cost
    'cost_per_query': {'target': '<$0.01', 'alert': '>$0.02'},
    'cache_hit_rate': {'target': '>70%', 'alert': '<50%'},

    # Errors
    'error_rate': {'target': '<1%', 'alert': '>5%'},
    'retrieval_failures': {'target': '<0.5%', 'alert': '>2%'},
}
```

### Alerting Logic

```python
def check_metric_health(metric_name: str, current_value: float) -> dict:
    """
    Check if metric is within acceptable range.

    Returns:
        Health status and alert level
    """
    thresholds = MONITORING_METRICS.get(metric_name, {})
    target = thresholds.get('target')
    alert = thresholds.get('alert')

    # Parse threshold (handle '>', '<', etc.)
    # Simplified for example

    if violates_alert_threshold(current_value, alert):
        return {
            'status': 'critical',
            'alert': True,
            'message': f'{metric_name} is {current_value}, exceeds alert threshold {alert}'
        }
    elif violates_target_threshold(current_value, target):
        return {
            'status': 'warning',
            'alert': False,
            'message': f'{metric_name} is {current_value}, below target {target}'
        }
    else:
        return {
            'status': 'healthy',
            'alert': False,
            'message': f'{metric_name} is {current_value}, within target'
        }
```

---

## Best Practices Summary

### Do's

✅ **Track multiple metrics** (not just one)
✅ **Separate retrieval from generation** metrics
✅ **Use LLM judges** for scalable evaluation
✅ **Monitor latency percentiles** (not just average)
✅ **Measure cache hit rate** for cost optimization
✅ **Run A/B tests** before deploying changes
✅ **Set up alerts** for quality degradation

### Don'ts

❌ **Don't rely on single metric** (optimize for multiple)
❌ **Don't skip human evaluation** (gold standard)
❌ **Don't ignore tail latency** (P95, P99)
❌ **Don't forget to measure cost** (tokens add up)
❌ **Don't deploy without testing** (use staging environment)

---

## LearnWithAvi Integration

### Logging Query Metrics

```typescript
// src/lib/rag-metrics.ts

export interface RAGQueryMetrics {
  query: string;
  videoId?: string;
  retrievalTime: number;
  generationTime: number;
  totalTime: number;
  tokensUsed: {
    input: number;
    output: number;
    cached: number;
  };
  retrievedChunks: number;
  answerLength: number;
  hasCitations: boolean;
  timestamp: string;
}

export function logQueryMetrics(metrics: RAGQueryMetrics): void {
  // Log to analytics/monitoring system
  console.log('[RAG Metrics]', JSON.stringify(metrics));

  // Send to monitoring service (Datadog, CloudWatch, etc.)
  // monitoringClient.sendMetrics(metrics);
}
```

### Implementing in Chat API

```typescript
// src/app/api/chat/route.ts

export async function POST(req: Request) {
  const startTime = Date.now();
  const { message, videoId } = await req.json();

  // Retrieval
  const retrievalStart = Date.now();
  const chunks = await queryChunks(message, 5, videoId);
  const retrievalTime = Date.now() - retrievalStart;

  // Generation
  const generationStart = Date.now();
  const response = await claude.messages.create({
    // ... generation config
  });
  const generationTime = Date.now() - generationStart;

  // Log metrics
  logQueryMetrics({
    query: message,
    videoId,
    retrievalTime,
    generationTime,
    totalTime: Date.now() - startTime,
    tokensUsed: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
      cached: response.usage.cache_read_input_tokens || 0
    },
    retrievedChunks: chunks.length,
    answerLength: response.content[0].text.length,
    hasCitations: response.content[0].text.includes('['),
    timestamp: new Date().toISOString()
  });

  return Response.json({ answer: response.content[0].text });
}
```

---

**Last Updated**: January 2026
