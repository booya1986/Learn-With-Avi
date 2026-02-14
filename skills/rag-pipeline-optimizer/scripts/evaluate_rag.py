#!/usr/bin/env python3
"""
RAG Evaluation Script for LearnWithAvi

Measure retrieval accuracy, answer quality, and RAG system performance.

Usage:
    python evaluate_rag.py --test-cases test_cases.json --rag-endpoint http://localhost:3000/api/chat
    python evaluate_rag.py --test-cases test_cases.json --metrics accuracy,relevance,latency
    python evaluate_rag.py --generate-test-cases --video-id mHThVfGmd6I --num-questions 10
"""

import argparse
import json
import time
import statistics
from typing import List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime

try:
    import requests
except ImportError:
    print("Error: requests not installed")
    print("Install with: pip install requests")
    exit(1)


def calculate_recall_at_k(
    retrieved_chunks: List[Dict],
    relevant_chunks: List[str],
    k: int = 5
) -> float:
    """
    Calculate Recall@K: proportion of relevant chunks in top-K results.

    Args:
        retrieved_chunks: Retrieved chunks with relevance scores
        relevant_chunks: List of known relevant chunk IDs
        k: Top K results to consider

    Returns:
        Recall@K score (0-1)
    """
    if not relevant_chunks:
        return 0.0

    top_k_ids = [chunk.get('id', chunk.get('chunk_id', '')) for chunk in retrieved_chunks[:k]]

    retrieved_relevant = sum(1 for chunk_id in top_k_ids if chunk_id in relevant_chunks)

    return retrieved_relevant / len(relevant_chunks)


def calculate_precision_at_k(
    retrieved_chunks: List[Dict],
    relevant_chunks: List[str],
    k: int = 5
) -> float:
    """
    Calculate Precision@K: proportion of top-K results that are relevant.

    Args:
        retrieved_chunks: Retrieved chunks
        relevant_chunks: List of known relevant chunk IDs
        k: Top K results to consider

    Returns:
        Precision@K score (0-1)
    """
    if k == 0:
        return 0.0

    top_k_ids = [chunk.get('id', chunk.get('chunk_id', '')) for chunk in retrieved_chunks[:k]]

    retrieved_relevant = sum(1 for chunk_id in top_k_ids if chunk_id in relevant_chunks)

    return retrieved_relevant / k


def calculate_mrr(
    retrieved_chunks: List[Dict],
    relevant_chunks: List[str]
) -> float:
    """
    Calculate Mean Reciprocal Rank (MRR).

    MRR = 1 / rank of first relevant result

    Args:
        retrieved_chunks: Retrieved chunks
        relevant_chunks: List of known relevant chunk IDs

    Returns:
        MRR score (0-1)
    """
    for i, chunk in enumerate(retrieved_chunks, 1):
        chunk_id = chunk.get('id', chunk.get('chunk_id', ''))
        if chunk_id in relevant_chunks:
            return 1.0 / i

    return 0.0


def calculate_ndcg(
    retrieved_chunks: List[Dict],
    relevance_scores: Dict[str, float],
    k: int = 5
) -> float:
    """
    Calculate Normalized Discounted Cumulative Gain (NDCG@K).

    NDCG measures ranking quality with position-based discounting.

    Args:
        retrieved_chunks: Retrieved chunks
        relevance_scores: Dictionary mapping chunk_id to relevance (0-1)
        k: Top K results to consider

    Returns:
        NDCG@K score (0-1)
    """
    import math

    def dcg(scores: List[float]) -> float:
        """Calculate DCG."""
        return sum(score / math.log2(i + 2) for i, score in enumerate(scores))

    # Actual DCG
    top_k = retrieved_chunks[:k]
    actual_scores = [
        relevance_scores.get(chunk.get('id', chunk.get('chunk_id', '')), 0.0)
        for chunk in top_k
    ]
    actual_dcg = dcg(actual_scores)

    # Ideal DCG (perfect ranking)
    ideal_scores = sorted(relevance_scores.values(), reverse=True)[:k]
    ideal_dcg = dcg(ideal_scores)

    if ideal_dcg == 0:
        return 0.0

    return actual_dcg / ideal_dcg


def evaluate_retrieval_quality(
    retrieved_chunks: List[Dict],
    test_case: Dict[str, Any],
    k: int = 5
) -> Dict[str, float]:
    """
    Evaluate retrieval quality using multiple metrics.

    Args:
        retrieved_chunks: Retrieved chunks from RAG system
        test_case: Test case with ground truth
        k: Top K results to consider

    Returns:
        Dictionary of metric scores
    """
    relevant_chunks = test_case.get('relevant_chunks', [])
    relevance_scores = test_case.get('relevance_scores', {})

    metrics = {
        'recall_at_k': calculate_recall_at_k(retrieved_chunks, relevant_chunks, k),
        'precision_at_k': calculate_precision_at_k(retrieved_chunks, relevant_chunks, k),
        'mrr': calculate_mrr(retrieved_chunks, relevant_chunks),
    }

    # NDCG only if relevance scores provided
    if relevance_scores:
        metrics['ndcg_at_k'] = calculate_ndcg(retrieved_chunks, relevance_scores, k)

    return metrics


def evaluate_answer_quality(
    answer: str,
    test_case: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Evaluate answer quality (requires human labels or LLM judge).

    Args:
        answer: Generated answer
        test_case: Test case with expected answer

    Returns:
        Dictionary of quality metrics
    """
    expected_answer = test_case.get('expected_answer', '')
    expected_keywords = test_case.get('expected_keywords', [])

    # Simple keyword-based evaluation
    answer_lower = answer.lower()
    keyword_hits = sum(1 for kw in expected_keywords if kw.lower() in answer_lower)
    keyword_coverage = keyword_hits / len(expected_keywords) if expected_keywords else 0.0

    # Length check (reasonable answer length)
    word_count = len(answer.split())
    length_quality = 1.0 if 20 <= word_count <= 500 else 0.7

    # Check for citations/timestamps
    has_citations = '[' in answer or 'timestamp' in answer.lower()

    return {
        'keyword_coverage': keyword_coverage,
        'length_quality': length_quality,
        'has_citations': has_citations,
        'word_count': word_count
    }


def query_rag_endpoint(
    endpoint: str,
    query: str,
    video_id: Optional[str] = None,
    timeout: int = 30
) -> Dict[str, Any]:
    """
    Query the RAG API endpoint.

    Args:
        endpoint: API endpoint URL
        query: User query
        video_id: Optional video ID filter
        timeout: Request timeout in seconds

    Returns:
        Response data with answer, chunks, timing
    """
    payload = {
        'message': query
    }

    if video_id:
        payload['videoId'] = video_id

    start_time = time.time()

    try:
        response = requests.post(
            endpoint,
            json=payload,
            timeout=timeout,
            headers={'Content-Type': 'application/json'}
        )

        latency = time.time() - start_time

        if response.status_code == 200:
            data = response.json()
            return {
                'success': True,
                'answer': data.get('answer', data.get('response', '')),
                'chunks': data.get('sources', data.get('chunks', [])),
                'latency': latency,
                'tokens': data.get('usage', {})
            }
        else:
            return {
                'success': False,
                'error': f"HTTP {response.status_code}: {response.text}",
                'latency': latency
            }

    except Exception as e:
        latency = time.time() - start_time
        return {
            'success': False,
            'error': str(e),
            'latency': latency
        }


def run_evaluation(
    test_cases: List[Dict],
    rag_endpoint: str,
    metrics: List[str],
    k: int = 5
) -> Dict[str, Any]:
    """
    Run full RAG evaluation on test cases.

    Args:
        test_cases: List of test cases
        rag_endpoint: RAG API endpoint
        metrics: List of metrics to compute
        k: Top K for retrieval metrics

    Returns:
        Evaluation results with aggregate metrics
    """
    results = []
    all_latencies = []
    all_retrieval_metrics = {
        'recall_at_k': [],
        'precision_at_k': [],
        'mrr': [],
        'ndcg_at_k': []
    }
    all_answer_metrics = {
        'keyword_coverage': [],
        'length_quality': [],
        'has_citations': []
    }

    print(f"\nEvaluating {len(test_cases)} test cases...")
    print("=" * 60)

    for i, test_case in enumerate(test_cases, 1):
        query = test_case['query']
        video_id = test_case.get('video_id')

        print(f"\n[{i}/{len(test_cases)}] Query: {query[:80]}...")

        # Query RAG system
        response = query_rag_endpoint(rag_endpoint, query, video_id)

        if not response['success']:
            print(f"  ❌ Error: {response['error']}")
            results.append({
                'test_case': test_case,
                'success': False,
                'error': response['error']
            })
            continue

        latency = response['latency']
        all_latencies.append(latency)

        print(f"  ✓ Latency: {latency:.2f}s")

        # Evaluate retrieval quality
        retrieval_metrics = {}
        if 'retrieval' in metrics or 'all' in metrics:
            retrieval_metrics = evaluate_retrieval_quality(
                response['chunks'],
                test_case,
                k=k
            )

            for metric_name, value in retrieval_metrics.items():
                if metric_name in all_retrieval_metrics:
                    all_retrieval_metrics[metric_name].append(value)

            print(f"  Retrieval: Recall@{k}={retrieval_metrics.get('recall_at_k', 0):.3f}, "
                  f"Precision@{k}={retrieval_metrics.get('precision_at_k', 0):.3f}, "
                  f"MRR={retrieval_metrics.get('mrr', 0):.3f}")

        # Evaluate answer quality
        answer_metrics = {}
        if 'answer' in metrics or 'all' in metrics:
            answer_metrics = evaluate_answer_quality(
                response['answer'],
                test_case
            )

            for metric_name, value in answer_metrics.items():
                if metric_name in all_answer_metrics:
                    if isinstance(value, bool):
                        all_answer_metrics[metric_name].append(1.0 if value else 0.0)
                    else:
                        all_answer_metrics[metric_name].append(value)

            print(f"  Answer: Keywords={answer_metrics.get('keyword_coverage', 0):.2f}, "
                  f"Length={answer_metrics['word_count']} words")

        # Store result
        results.append({
            'test_case': test_case,
            'success': True,
            'answer': response['answer'],
            'chunks': response['chunks'],
            'latency': latency,
            'tokens': response.get('tokens', {}),
            'retrieval_metrics': retrieval_metrics,
            'answer_metrics': answer_metrics
        })

    # Calculate aggregate metrics
    aggregate = {
        'total_test_cases': len(test_cases),
        'successful': sum(1 for r in results if r.get('success', False)),
        'failed': sum(1 for r in results if not r.get('success', True)),
    }

    if all_latencies:
        aggregate['latency'] = {
            'mean': statistics.mean(all_latencies),
            'median': statistics.median(all_latencies),
            'min': min(all_latencies),
            'max': max(all_latencies),
            'p95': statistics.quantiles(all_latencies, n=20)[18] if len(all_latencies) > 1 else all_latencies[0]
        }

    # Aggregate retrieval metrics
    for metric_name, values in all_retrieval_metrics.items():
        if values:
            aggregate[metric_name] = {
                'mean': statistics.mean(values),
                'median': statistics.median(values),
                'min': min(values),
                'max': max(values)
            }

    # Aggregate answer metrics
    for metric_name, values in all_answer_metrics.items():
        if values:
            aggregate[metric_name] = {
                'mean': statistics.mean(values),
                'median': statistics.median(values)
            }

    return {
        'timestamp': datetime.now().isoformat(),
        'config': {
            'endpoint': rag_endpoint,
            'metrics': metrics,
            'k': k
        },
        'aggregate': aggregate,
        'results': results
    }


def generate_sample_test_cases() -> List[Dict]:
    """
    Generate sample test cases for demonstration.

    Returns:
        List of test cases
    """
    return [
        {
            'query': 'מה זה embeddings?',
            'video_id': 'video1',
            'expected_keywords': ['embeddings', 'vector', 'semantic'],
            'relevant_chunks': ['chunk_001', 'chunk_004'],
            'relevance_scores': {
                'chunk_001': 1.0,
                'chunk_004': 0.8,
                'chunk_007': 0.5
            }
        },
        {
            'query': 'How does RAG work?',
            'video_id': 'video1',
            'expected_keywords': ['retrieval', 'generation', 'context'],
            'relevant_chunks': ['chunk_010', 'chunk_015'],
            'relevance_scores': {
                'chunk_010': 1.0,
                'chunk_015': 0.9
            }
        },
        {
            'query': 'Explain ChromaDB vector search',
            'video_id': 'video2',
            'expected_keywords': ['ChromaDB', 'vector', 'search', 'similarity'],
            'relevant_chunks': ['chunk_025', 'chunk_030'],
            'relevance_scores': {
                'chunk_025': 1.0,
                'chunk_030': 0.7
            }
        }
    ]


def main():
    parser = argparse.ArgumentParser(
        description='Evaluate RAG system performance'
    )
    parser.add_argument(
        '--test-cases',
        type=str,
        help='Path to test cases JSON file'
    )
    parser.add_argument(
        '--rag-endpoint',
        type=str,
        default='http://localhost:3000/api/chat',
        help='RAG API endpoint (default: http://localhost:3000/api/chat)'
    )
    parser.add_argument(
        '--metrics',
        type=str,
        default='all',
        help='Comma-separated metrics to compute (all, retrieval, answer, latency)'
    )
    parser.add_argument(
        '--top-k',
        type=int,
        default=5,
        help='Top K for retrieval metrics (default: 5)'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='rag_evaluation_results.json',
        help='Output file for results (default: rag_evaluation_results.json)'
    )
    parser.add_argument(
        '--generate-sample',
        action='store_true',
        help='Generate and use sample test cases'
    )

    args = parser.parse_args()

    # Load or generate test cases
    if args.generate_sample or not args.test_cases:
        print("Using sample test cases")
        test_cases = generate_sample_test_cases()
    else:
        print(f"Loading test cases from {args.test_cases}")
        with open(args.test_cases, 'r', encoding='utf-8') as f:
            test_cases = json.load(f)

    # Parse metrics
    metrics = [m.strip() for m in args.metrics.split(',')]

    # Run evaluation
    print(f"\nRAG Evaluation")
    print(f"Endpoint: {args.rag_endpoint}")
    print(f"Metrics: {', '.join(metrics)}")
    print(f"Top-K: {args.top_k}")

    evaluation_results = run_evaluation(
        test_cases=test_cases,
        rag_endpoint=args.rag_endpoint,
        metrics=metrics,
        k=args.top_k
    )

    # Display summary
    print("\n" + "=" * 60)
    print("EVALUATION SUMMARY")
    print("=" * 60)

    agg = evaluation_results['aggregate']
    print(f"\nTest Cases: {agg['successful']}/{agg['total_test_cases']} successful")

    if 'latency' in agg:
        lat = agg['latency']
        print(f"\nLatency:")
        print(f"  Mean: {lat['mean']:.3f}s")
        print(f"  Median: {lat['median']:.3f}s")
        print(f"  P95: {lat['p95']:.3f}s")

    if 'recall_at_k' in agg:
        print(f"\nRetrieval Metrics:")
        for metric in ['recall_at_k', 'precision_at_k', 'mrr', 'ndcg_at_k']:
            if metric in agg:
                print(f"  {metric}: {agg[metric]['mean']:.3f} "
                      f"(median: {agg[metric]['median']:.3f})")

    if 'keyword_coverage' in agg:
        print(f"\nAnswer Quality:")
        for metric in ['keyword_coverage', 'length_quality', 'has_citations']:
            if metric in agg:
                print(f"  {metric}: {agg[metric]['mean']:.3f}")

    # Save results
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(evaluation_results, f, ensure_ascii=False, indent=2)

    print(f"\nDetailed results saved to {args.output}")


if __name__ == '__main__':
    main()
