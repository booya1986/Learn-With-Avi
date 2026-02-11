#!/usr/bin/env python3
"""
Hybrid Search Script for LearnWithAvi RAG Pipeline

Combines BM25 keyword search with semantic vector search for optimal retrieval.

Usage:
    python hybrid_search.py --query "מה זה embeddings?" --top-k 10
    python hybrid_search.py --query "RAG architecture" --bm25-weight 0.6 --semantic-weight 0.4
"""

import argparse
import json
import pickle
import re
from typing import List, Dict, Tuple
from pathlib import Path

try:
    from rank_bm25 import BM25Okapi
    import numpy as np
except ImportError:
    print("Error: Required packages not installed.")
    print("Install with: pip install rank-bm25 numpy")
    exit(1)


def hebrew_tokenize(text: str) -> List[str]:
    """
    Tokenize Hebrew/English mixed text for BM25.

    Args:
        text: Input text (Hebrew, English, or mixed)

    Returns:
        List of normalized tokens
    """
    # Remove Hebrew nikud (diacritics)
    text = re.sub(r'[\u0591-\u05C7]', '', text)

    # Normalize Hebrew final letters (ך→כ, ם→מ, ן→נ, ף→פ, ץ→צ)
    final_to_normal = str.maketrans('ךםןףץ', 'כמנפצ')
    text = text.translate(final_to_normal)

    # Extract words (Hebrew, English, numbers)
    tokens = re.findall(r'\b\w+\b', text)

    # Lowercase for case-insensitive matching
    tokens = [t.lower() for t in tokens]

    return tokens


def normalize_scores(scores: Dict[int, float]) -> Dict[int, float]:
    """
    Normalize scores to [0, 1] range using min-max normalization.

    Args:
        scores: Dictionary mapping chunk_id to raw score

    Returns:
        Dictionary mapping chunk_id to normalized score
    """
    if not scores:
        return {}

    score_values = list(scores.values())
    min_score = min(score_values)
    max_score = max(score_values)

    # Avoid division by zero
    if max_score == min_score:
        return {k: 1.0 for k in scores.keys()}

    normalized = {
        chunk_id: (score - min_score) / (max_score - min_score)
        for chunk_id, score in scores.items()
    }

    return normalized


def detect_query_type(query: str) -> str:
    """
    Detect query type for adaptive weight selection.

    Args:
        query: User query string

    Returns:
        Query type: 'code', 'technical', 'conceptual', or 'mixed'
    """
    query_lower = query.lower()

    # Check for code indicators
    code_keywords = ['code', 'function', 'class', 'import', 'def', 'example', 'snippet']
    if any(keyword in query_lower for keyword in code_keywords):
        return 'code'

    # Check for technical terms (usually all-caps or English in Hebrew query)
    if re.search(r'\b[A-Z]{2,}\b', query):  # RAG, API, ML, NLP, etc.
        return 'technical'

    # Check for conceptual/explanatory queries
    conceptual_keywords = ['מה זה', 'explain', 'תסביר', 'how', 'why', 'what is', 'איך']
    if any(keyword in query_lower for keyword in conceptual_keywords):
        return 'conceptual'

    return 'mixed'


def hybrid_search(
    query: str,
    corpus: List[Dict],
    bm25_index: BM25Okapi,
    top_k: int = 10,
    bm25_weight: float = 0.3,
    semantic_weight: float = 0.7,
    adaptive_weights: bool = True
) -> List[Dict]:
    """
    Perform hybrid search combining BM25 and semantic scores.

    Args:
        query: User query string
        corpus: List of document chunks with text and metadata
        bm25_index: Precomputed BM25 index
        top_k: Number of results to return
        bm25_weight: Weight for BM25 scores (0-1)
        semantic_weight: Weight for semantic scores (0-1)
        adaptive_weights: Whether to auto-adjust weights based on query type

    Returns:
        List of ranked chunks with combined scores
    """
    # Adaptive weight selection
    if adaptive_weights:
        query_type = detect_query_type(query)
        weight_map = {
            'code': (0.7, 0.3),
            'technical': (0.6, 0.4),
            'conceptual': (0.2, 0.8),
            'mixed': (0.3, 0.7)
        }
        bm25_weight, semantic_weight = weight_map[query_type]
        print(f"Detected query type: {query_type}")
        print(f"Using weights: BM25={bm25_weight}, Semantic={semantic_weight}")

    # Tokenize query
    query_tokens = hebrew_tokenize(query)

    # BM25 search
    bm25_scores = bm25_index.get_scores(query_tokens)
    bm25_results = {i: score for i, score in enumerate(bm25_scores)}

    # Normalize BM25 scores
    bm25_normalized = normalize_scores(bm25_results)

    # For this demo, simulate semantic scores (in production, use actual embeddings)
    # In LearnWithAvi, replace this with ChromaDB query
    semantic_scores = simulate_semantic_scores(query, corpus)
    semantic_normalized = normalize_scores(semantic_scores)

    # Combine scores
    combined_scores = {}
    all_ids = set(bm25_normalized.keys()) | set(semantic_normalized.keys())

    for chunk_id in all_ids:
        bm25_score = bm25_normalized.get(chunk_id, 0.0)
        semantic_score = semantic_normalized.get(chunk_id, 0.0)

        combined_scores[chunk_id] = (
            bm25_weight * bm25_score +
            semantic_weight * semantic_score
        )

    # Sort by combined score
    ranked_ids = sorted(
        combined_scores.items(),
        key=lambda x: x[1],
        reverse=True
    )[:top_k]

    # Build results with metadata
    results = []
    for chunk_id, combined_score in ranked_ids:
        chunk = corpus[chunk_id]
        results.append({
            'chunk_id': chunk_id,
            'text': chunk['text'],
            'metadata': chunk.get('metadata', {}),
            'scores': {
                'combined': combined_score,
                'bm25': bm25_normalized.get(chunk_id, 0.0),
                'semantic': semantic_normalized.get(chunk_id, 0.0)
            }
        })

    return results


def simulate_semantic_scores(query: str, corpus: List[Dict]) -> Dict[int, float]:
    """
    Simulate semantic similarity scores (placeholder for actual embeddings).

    In production, replace with:
        query_embedding = openai.embeddings.create(input=query)
        results = chromadb.query(query_embedding)

    Args:
        query: User query
        corpus: Document chunks

    Returns:
        Dictionary mapping chunk_id to simulated semantic score
    """
    # Simple heuristic: Jaccard similarity on tokens
    query_tokens = set(hebrew_tokenize(query))

    scores = {}
    for i, chunk in enumerate(corpus):
        chunk_tokens = set(hebrew_tokenize(chunk['text']))

        # Jaccard similarity
        intersection = len(query_tokens & chunk_tokens)
        union = len(query_tokens | chunk_tokens)

        scores[i] = intersection / union if union > 0 else 0.0

    return scores


def build_bm25_index(corpus: List[Dict]) -> BM25Okapi:
    """
    Build BM25 index from corpus.

    Args:
        corpus: List of document chunks

    Returns:
        BM25Okapi index
    """
    tokenized_corpus = [
        hebrew_tokenize(chunk['text'])
        for chunk in corpus
    ]

    return BM25Okapi(tokenized_corpus)


def load_sample_corpus() -> List[Dict]:
    """
    Load sample corpus for testing (replace with actual transcript data).

    Returns:
        List of document chunks
    """
    return [
        {
            'text': 'Embeddings הם ייצוג וקטורי של טקסט שמאפשר לבצע חיפוש סמנטי',
            'metadata': {'video_id': 'video1', 'timestamp': '00:01:30'}
        },
        {
            'text': 'RAG system combines retrieval with generation for accurate answers',
            'metadata': {'video_id': 'video1', 'timestamp': '00:03:15'}
        },
        {
            'text': 'LoRA is a technique for efficient fine-tuning of large language models',
            'metadata': {'video_id': 'video2', 'timestamp': '00:05:20'}
        },
        {
            'text': 'בעזרת ChromaDB אפשר לאחסן ולחפש embeddings בצורה יעילה',
            'metadata': {'video_id': 'video1', 'timestamp': '00:02:45'}
        },
        {
            'text': 'The code for RAG implementation uses OpenAI embeddings and Claude API',
            'metadata': {'video_id': 'video2', 'timestamp': '00:07:10'}
        }
    ]


def main():
    parser = argparse.ArgumentParser(
        description='Hybrid search combining BM25 and semantic search'
    )
    parser.add_argument(
        '--query',
        type=str,
        required=True,
        help='Search query (Hebrew or English)'
    )
    parser.add_argument(
        '--top-k',
        type=int,
        default=10,
        help='Number of results to return (default: 10)'
    )
    parser.add_argument(
        '--bm25-weight',
        type=float,
        default=0.3,
        help='Weight for BM25 scores, 0-1 (default: 0.3)'
    )
    parser.add_argument(
        '--semantic-weight',
        type=float,
        default=0.7,
        help='Weight for semantic scores, 0-1 (default: 0.7)'
    )
    parser.add_argument(
        '--adaptive-weights',
        action='store_true',
        default=True,
        help='Auto-adjust weights based on query type (default: True)'
    )
    parser.add_argument(
        '--corpus-file',
        type=str,
        help='Path to corpus JSON file (optional, uses sample data if not provided)'
    )

    args = parser.parse_args()

    # Load corpus
    if args.corpus_file:
        with open(args.corpus_file, 'r', encoding='utf-8') as f:
            corpus = json.load(f)
    else:
        print("Using sample corpus (pass --corpus-file for custom data)")
        corpus = load_sample_corpus()

    # Build BM25 index
    print(f"Building BM25 index for {len(corpus)} chunks...")
    bm25_index = build_bm25_index(corpus)

    # Perform hybrid search
    print(f"\nSearching for: {args.query}")
    print("=" * 60)

    results = hybrid_search(
        query=args.query,
        corpus=corpus,
        bm25_index=bm25_index,
        top_k=args.top_k,
        bm25_weight=args.bm25_weight,
        semantic_weight=args.semantic_weight,
        adaptive_weights=args.adaptive_weights
    )

    # Display results
    print(f"\nTop {len(results)} results:\n")
    for i, result in enumerate(results, 1):
        print(f"{i}. Score: {result['scores']['combined']:.4f} "
              f"(BM25: {result['scores']['bm25']:.4f}, "
              f"Semantic: {result['scores']['semantic']:.4f})")
        print(f"   Text: {result['text'][:100]}...")
        print(f"   Metadata: {result['metadata']}")
        print()

    # Export results
    output_file = 'hybrid_search_results.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"Results saved to {output_file}")


if __name__ == '__main__':
    main()
