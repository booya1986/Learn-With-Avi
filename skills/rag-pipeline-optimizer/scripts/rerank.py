#!/usr/bin/env python3
"""
Semantic Re-ranking Script for LearnWithAvi RAG Pipeline

Re-ranks retrieved chunks using cross-encoder models or Claude API for improved relevance.

Usage:
    python rerank.py --query "מה זה embeddings?" --chunks results.json --top-k 5
    python rerank.py --query "explain RAG" --chunks results.json --method claude
    python rerank.py --query "Hebrew NLP" --chunks results.json --method cross-encoder --model ms-marco
"""

import argparse
import json
import os
from typing import List, Dict, Tuple
from pathlib import Path

try:
    from anthropic import Anthropic
except ImportError:
    Anthropic = None
    print("Warning: anthropic not installed. Claude reranking unavailable.")
    print("Install with: pip install anthropic")


def rerank_with_scoring(
    query: str,
    chunks: List[Dict],
    method: str = "heuristic",
    top_k: int = 5,
    model: str = None
) -> List[Dict]:
    """
    Re-rank chunks using specified method.

    Args:
        query: User query string
        chunks: List of retrieved chunks with initial scores
        method: Reranking method ('heuristic', 'claude', 'cross-encoder')
        top_k: Number of results to return
        model: Model identifier for method (optional)

    Returns:
        List of re-ranked chunks with updated scores
    """
    if method == "heuristic":
        return rerank_heuristic(query, chunks, top_k)
    elif method == "claude":
        return rerank_with_claude(query, chunks, top_k, model)
    elif method == "cross-encoder":
        return rerank_with_cross_encoder(query, chunks, top_k, model)
    else:
        raise ValueError(f"Unknown reranking method: {method}")


def rerank_heuristic(
    query: str,
    chunks: List[Dict],
    top_k: int = 5
) -> List[Dict]:
    """
    Re-rank using heuristic scoring (fast, no API calls).

    Scoring factors:
    - Query term overlap (weighted by position)
    - Chunk length (penalize very short/long chunks)
    - Initial retrieval score
    - Diversity (penalize very similar consecutive chunks)

    Args:
        query: User query
        chunks: Retrieved chunks
        top_k: Number of results

    Returns:
        Re-ranked chunks
    """
    query_lower = query.lower()
    query_terms = set(query_lower.split())

    scored_chunks = []
    for chunk in chunks:
        text_lower = chunk.get('text', '').lower()

        # Factor 1: Term overlap score
        chunk_terms = set(text_lower.split())
        overlap = len(query_terms & chunk_terms)
        overlap_score = overlap / len(query_terms) if query_terms else 0.0

        # Factor 2: Exact phrase match bonus
        phrase_bonus = 1.2 if query_lower in text_lower else 1.0

        # Factor 3: Length penalty (prefer 50-300 words)
        word_count = len(chunk['text'].split())
        if 50 <= word_count <= 300:
            length_score = 1.0
        elif word_count < 50:
            length_score = 0.8
        else:
            length_score = 0.9

        # Factor 4: Initial relevance score (from retrieval)
        initial_score = chunk.get('relevance', 0.5)

        # Factor 5: Position in query (earlier terms more important)
        position_score = 0.0
        for i, term in enumerate(query_lower.split()):
            if term in text_lower:
                # Earlier terms get higher weight
                position_weight = 1.0 - (i * 0.1)
                position_score += position_weight
        position_score = min(position_score / len(query_lower.split()), 1.0)

        # Combine scores with weights
        final_score = (
            0.30 * overlap_score +
            0.25 * phrase_bonus +
            0.10 * length_score +
            0.25 * initial_score +
            0.10 * position_score
        )

        scored_chunks.append({
            **chunk,
            'rerank_score': final_score,
            'rerank_factors': {
                'overlap': overlap_score,
                'phrase_bonus': phrase_bonus,
                'length': length_score,
                'initial': initial_score,
                'position': position_score
            }
        })

    # Sort by rerank score
    scored_chunks.sort(key=lambda x: x['rerank_score'], reverse=True)

    # Apply diversity filter (remove very similar consecutive chunks)
    diverse_chunks = []
    for chunk in scored_chunks:
        is_diverse = True
        for existing in diverse_chunks:
            # Check similarity (simple word overlap)
            chunk_words = set(chunk['text'].lower().split())
            existing_words = set(existing['text'].lower().split())
            overlap_ratio = len(chunk_words & existing_words) / len(chunk_words | existing_words)

            # If too similar (>70% overlap), skip
            if overlap_ratio > 0.7:
                is_diverse = False
                break

        if is_diverse:
            diverse_chunks.append(chunk)

        if len(diverse_chunks) >= top_k:
            break

    return diverse_chunks


def rerank_with_claude(
    query: str,
    chunks: List[Dict],
    top_k: int = 5,
    model: str = None
) -> List[Dict]:
    """
    Re-rank using Claude API for semantic relevance scoring.

    Args:
        query: User query
        chunks: Retrieved chunks
        top_k: Number of results
        model: Claude model (default: claude-sonnet-4-20250514)

    Returns:
        Re-ranked chunks with Claude relevance scores
    """
    if Anthropic is None:
        print("Error: anthropic package not installed")
        return rerank_heuristic(query, chunks, top_k)

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY not set")
        return rerank_heuristic(query, chunks, top_k)

    client = Anthropic(api_key=api_key)
    model = model or "claude-sonnet-4-20250514"

    # Prepare prompt for Claude
    chunks_text = ""
    for i, chunk in enumerate(chunks):
        chunks_text += f"\n[Chunk {i+1}]\n{chunk['text'][:500]}\n"  # Limit to 500 chars per chunk

    prompt = f"""You are a relevance scoring expert. Rate how relevant each chunk is to the user's query.

Query: {query}

Chunks to score:
{chunks_text}

For each chunk, provide a relevance score from 0.0 to 1.0, where:
- 1.0 = Perfectly answers the query
- 0.7-0.9 = Highly relevant
- 0.4-0.6 = Somewhat relevant
- 0.0-0.3 = Not relevant

Respond with ONLY a JSON array of scores, like: [0.95, 0.82, 0.65, ...]
"""

    try:
        response = client.messages.create(
            model=model,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )

        # Parse scores
        scores_text = response.content[0].text.strip()
        scores = json.loads(scores_text)

        # Validate scores
        if len(scores) != len(chunks):
            print(f"Warning: Claude returned {len(scores)} scores for {len(chunks)} chunks")
            return rerank_heuristic(query, chunks, top_k)

        # Attach scores to chunks
        scored_chunks = []
        for chunk, score in zip(chunks, scores):
            scored_chunks.append({
                **chunk,
                'rerank_score': score,
                'rerank_method': 'claude'
            })

        # Sort by score
        scored_chunks.sort(key=lambda x: x['rerank_score'], reverse=True)

        return scored_chunks[:top_k]

    except Exception as e:
        print(f"Error using Claude for reranking: {e}")
        print("Falling back to heuristic reranking")
        return rerank_heuristic(query, chunks, top_k)


def rerank_with_cross_encoder(
    query: str,
    chunks: List[Dict],
    top_k: int = 5,
    model: str = None
) -> List[Dict]:
    """
    Re-rank using cross-encoder model (requires sentence-transformers).

    Cross-encoders process query-chunk pairs together, providing more accurate
    relevance scores than bi-encoders (embeddings).

    Args:
        query: User query
        chunks: Retrieved chunks
        top_k: Number of results
        model: Cross-encoder model name

    Returns:
        Re-ranked chunks with cross-encoder scores
    """
    try:
        from sentence_transformers import CrossEncoder
    except ImportError:
        print("Error: sentence-transformers not installed")
        print("Install with: pip install sentence-transformers")
        return rerank_heuristic(query, chunks, top_k)

    # Default models
    model_map = {
        "ms-marco": "cross-encoder/ms-marco-MiniLM-L-6-v2",  # Fast, English
        "multilingual": "cross-encoder/mmarco-mMiniLMv2-L12-H384-v1",  # Supports Hebrew
        "distilroberta": "cross-encoder/stsb-distilroberta-base"  # Semantic similarity
    }

    model_name = model_map.get(model, model_map["multilingual"])

    print(f"Loading cross-encoder model: {model_name}")
    try:
        cross_encoder = CrossEncoder(model_name)
    except Exception as e:
        print(f"Error loading model: {e}")
        return rerank_heuristic(query, chunks, top_k)

    # Prepare query-chunk pairs
    pairs = [[query, chunk['text']] for chunk in chunks]

    # Score all pairs
    print(f"Scoring {len(pairs)} query-chunk pairs...")
    scores = cross_encoder.predict(pairs)

    # Attach scores to chunks
    scored_chunks = []
    for chunk, score in zip(chunks, scores):
        # Convert numpy float to Python float
        score_float = float(score)

        scored_chunks.append({
            **chunk,
            'rerank_score': score_float,
            'rerank_method': f'cross-encoder ({model_name})'
        })

    # Sort by score
    scored_chunks.sort(key=lambda x: x['rerank_score'], reverse=True)

    return scored_chunks[:top_k]


def load_chunks_from_file(file_path: str) -> List[Dict]:
    """
    Load chunks from JSON file.

    Expected format:
    [
        {
            "text": "chunk content",
            "relevance": 0.85,
            "metadata": {...}
        },
        ...
    ]

    Args:
        file_path: Path to JSON file

    Returns:
        List of chunks
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Handle different input formats
    if isinstance(data, list):
        return data
    elif isinstance(data, dict) and 'results' in data:
        return data['results']
    else:
        raise ValueError("Unexpected JSON format. Expected list or dict with 'results' key.")


def main():
    parser = argparse.ArgumentParser(
        description='Re-rank retrieved chunks for improved relevance'
    )
    parser.add_argument(
        '--query',
        type=str,
        required=True,
        help='Search query (Hebrew or English)'
    )
    parser.add_argument(
        '--chunks',
        type=str,
        help='Path to JSON file with retrieved chunks (optional, uses sample if not provided)'
    )
    parser.add_argument(
        '--top-k',
        type=int,
        default=5,
        help='Number of results to return (default: 5)'
    )
    parser.add_argument(
        '--method',
        type=str,
        choices=['heuristic', 'claude', 'cross-encoder'],
        default='heuristic',
        help='Reranking method (default: heuristic)'
    )
    parser.add_argument(
        '--model',
        type=str,
        help='Model identifier for reranking method'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='reranked_results.json',
        help='Output file for reranked results (default: reranked_results.json)'
    )

    args = parser.parse_args()

    # Load chunks
    if args.chunks:
        print(f"Loading chunks from {args.chunks}")
        chunks = load_chunks_from_file(args.chunks)
    else:
        print("Using sample chunks (pass --chunks for custom data)")
        # Sample chunks for testing
        chunks = [
            {
                'text': 'Embeddings הם ייצוג וקטורי של טקסט שמאפשר לבצע חיפוש סמנטי מדויק',
                'relevance': 0.75,
                'metadata': {'video_id': 'video1', 'timestamp': '00:01:30'}
            },
            {
                'text': 'RAG system combines retrieval with generation using embeddings and vector databases',
                'relevance': 0.68,
                'metadata': {'video_id': 'video1', 'timestamp': '00:03:15'}
            },
            {
                'text': 'Vector embeddings capture semantic meaning of text in high-dimensional space',
                'relevance': 0.82,
                'metadata': {'video_id': 'video2', 'timestamp': '00:05:20'}
            },
            {
                'text': 'ChromaDB is a vector database for storing and querying embeddings efficiently',
                'relevance': 0.65,
                'metadata': {'video_id': 'video1', 'timestamp': '00:02:45'}
            },
            {
                'text': 'Machine learning models can be fine-tuned using LoRA for efficiency',
                'relevance': 0.45,
                'metadata': {'video_id': 'video2', 'timestamp': '00:07:10'}
            }
        ]

    print(f"\nReranking {len(chunks)} chunks for query: {args.query}")
    print(f"Method: {args.method}")
    print("=" * 60)

    # Perform reranking
    reranked = rerank_with_scoring(
        query=args.query,
        chunks=chunks,
        method=args.method,
        top_k=args.top_k,
        model=args.model
    )

    # Display results
    print(f"\nTop {len(reranked)} results after reranking:\n")
    for i, result in enumerate(reranked, 1):
        print(f"{i}. Rerank Score: {result['rerank_score']:.4f} "
              f"(Original: {result.get('relevance', 'N/A')})")
        print(f"   Text: {result['text'][:120]}...")

        # Show rerank factors if available
        if 'rerank_factors' in result:
            factors = result['rerank_factors']
            print(f"   Factors: overlap={factors['overlap']:.2f}, "
                  f"phrase={factors['phrase_bonus']:.2f}, "
                  f"length={factors['length']:.2f}")

        print(f"   Metadata: {result.get('metadata', {})}")
        print()

    # Export results
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(reranked, f, ensure_ascii=False, indent=2)
    print(f"Reranked results saved to {args.output}")

    # Show improvement summary
    if len(chunks) > 0 and len(reranked) > 0:
        avg_original = sum(c.get('relevance', 0) for c in chunks[:args.top_k]) / min(len(chunks), args.top_k)
        avg_reranked = sum(r['rerank_score'] for r in reranked) / len(reranked)
        print(f"\nAverage score improvement: {avg_original:.3f} → {avg_reranked:.3f}")


if __name__ == '__main__':
    main()
