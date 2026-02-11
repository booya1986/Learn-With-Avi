#!/usr/bin/env python3
"""
Cache Optimizer for Claude API Prompt Caching

Analyzes chat logs to measure cache performance and recommend optimizations.

Usage:
    python cache_optimizer.py --chat-logs logs/chat_history.jsonl --analyze-cache-hits
    python cache_optimizer.py --simulate-strategy --video-id video_001
"""

import argparse
import json
from typing import List, Dict, Tuple
from datetime import datetime, timedelta
from collections import defaultdict
import statistics


class CacheAnalyzer:
    """Analyze Claude API cache performance from chat logs."""

    def __init__(self, pricing: Dict[str, float] = None):
        """
        Initialize cache analyzer.

        Args:
            pricing: Token pricing per million tokens (default: Claude Sonnet 4)
        """
        self.pricing = pricing or {
            'input': 3.00,           # Regular input tokens
            'cache_write': 3.00,     # Cache creation tokens
            'cache_read': 0.30,      # Cache read tokens (90% discount)
            'output': 15.00          # Output tokens
        }

        self.logs = []
        self.metrics = defaultdict(list)

    def load_logs(self, filepath: str):
        """Load chat logs from JSONL file."""
        with open(filepath, 'r', encoding='utf-8') as f:
            self.logs = [json.loads(line) for line in f]

        print(f"Loaded {len(self.logs)} chat requests from {filepath}")

    def analyze_cache_performance(self) -> Dict:
        """
        Analyze cache hit rates and cost savings.

        Returns:
            Dictionary with performance metrics
        """
        total_requests = len(self.logs)
        cache_hits = 0
        cache_misses = 0

        total_input_tokens = 0
        total_cache_read_tokens = 0
        total_cache_creation_tokens = 0
        total_output_tokens = 0

        costs_with_cache = []
        costs_without_cache = []

        for log in self.logs:
            usage = log.get('usage', {})

            input_tokens = usage.get('input_tokens', 0)
            cache_read = usage.get('cache_read_input_tokens', 0)
            cache_creation = usage.get('cache_creation_input_tokens', 0)
            output_tokens = usage.get('output_tokens', 0)

            # Track totals
            total_input_tokens += input_tokens
            total_cache_read_tokens += cache_read
            total_cache_creation_tokens += cache_creation
            total_output_tokens += output_tokens

            # Classify as cache hit or miss
            if cache_read > 0:
                cache_hits += 1
            else:
                cache_misses += 1

            # Calculate cost with caching
            cost_with_cache = (
                (input_tokens - cache_read) * self.pricing['input'] / 1_000_000 +
                cache_creation * self.pricing['cache_write'] / 1_000_000 +
                cache_read * self.pricing['cache_read'] / 1_000_000 +
                output_tokens * self.pricing['output'] / 1_000_000
            )
            costs_with_cache.append(cost_with_cache)

            # Calculate cost without caching (all tokens at regular price)
            cost_without_cache = (
                input_tokens * self.pricing['input'] / 1_000_000 +
                output_tokens * self.pricing['output'] / 1_000_000
            )
            costs_without_cache.append(cost_without_cache)

        # Calculate cache hit rate
        cache_hit_rate = cache_hits / total_requests if total_requests > 0 else 0

        # Calculate savings
        total_cost_with_cache = sum(costs_with_cache)
        total_cost_without_cache = sum(costs_without_cache)
        savings = total_cost_without_cache - total_cost_with_cache
        savings_percent = (savings / total_cost_without_cache * 100) if total_cost_without_cache > 0 else 0

        return {
            'total_requests': total_requests,
            'cache_hits': cache_hits,
            'cache_misses': cache_misses,
            'cache_hit_rate': cache_hit_rate,
            'total_input_tokens': total_input_tokens,
            'total_cache_read_tokens': total_cache_read_tokens,
            'total_cache_creation_tokens': total_cache_creation_tokens,
            'total_output_tokens': total_output_tokens,
            'total_cost_with_cache': total_cost_with_cache,
            'total_cost_without_cache': total_cost_without_cache,
            'savings': savings,
            'savings_percent': savings_percent,
            'avg_cost_per_request_with_cache': statistics.mean(costs_with_cache),
            'avg_cost_per_request_without_cache': statistics.mean(costs_without_cache)
        }

    def analyze_by_video(self) -> Dict[str, Dict]:
        """Analyze cache performance grouped by video ID."""
        video_metrics = defaultdict(lambda: {
            'requests': [],
            'cache_hits': 0,
            'cache_misses': 0
        })

        for log in self.logs:
            video_id = log.get('metadata', {}).get('video_id', 'unknown')
            usage = log.get('usage', {})
            cache_read = usage.get('cache_read_input_tokens', 0)

            video_metrics[video_id]['requests'].append(log)

            if cache_read > 0:
                video_metrics[video_id]['cache_hits'] += 1
            else:
                video_metrics[video_id]['cache_misses'] += 1

        # Calculate hit rates per video
        results = {}
        for video_id, metrics in video_metrics.items():
            total = len(metrics['requests'])
            hit_rate = metrics['cache_hits'] / total if total > 0 else 0

            results[video_id] = {
                'total_requests': total,
                'cache_hits': metrics['cache_hits'],
                'cache_misses': metrics['cache_misses'],
                'cache_hit_rate': hit_rate
            }

        return results

    def recommend_optimizations(self, metrics: Dict) -> List[str]:
        """
        Generate optimization recommendations based on metrics.

        Args:
            metrics: Performance metrics from analyze_cache_performance()

        Returns:
            List of actionable recommendations
        """
        recommendations = []

        # Low cache hit rate
        if metrics['cache_hit_rate'] < 0.5:
            recommendations.append(
                f"❌ Cache hit rate is low ({metrics['cache_hit_rate']*100:.1f}%). "
                f"Consider caching static content like system prompts and video transcripts."
            )

        # Good cache hit rate
        elif metrics['cache_hit_rate'] > 0.8:
            recommendations.append(
                f"✅ Excellent cache hit rate ({metrics['cache_hit_rate']*100:.1f}%)! "
                f"Caching strategy is working well."
            )

        # Moderate cache hit rate
        else:
            recommendations.append(
                f"⚠️ Moderate cache hit rate ({metrics['cache_hit_rate']*100:.1f}%). "
                f"Review cache breakpoints to improve hit rate."
            )

        # High cache creation overhead
        cache_overhead = (
            metrics['total_cache_creation_tokens'] /
            metrics['total_input_tokens']
            if metrics['total_input_tokens'] > 0 else 0
        )

        if cache_overhead > 0.3:
            recommendations.append(
                f"⚠️ High cache creation overhead ({cache_overhead*100:.1f}% of input tokens). "
                f"Consider reducing cache breakpoints or increasing cache reuse."
            )

        # Significant savings
        if metrics['savings_percent'] > 50:
            recommendations.append(
                f"💰 Excellent cost savings: ${metrics['savings']:.2f} ({metrics['savings_percent']:.1f}% reduction). "
                f"Current strategy is cost-effective."
            )

        # Potential for improvement
        elif metrics['cache_hit_rate'] < 0.8 and metrics['savings_percent'] < 50:
            potential_savings = metrics['total_cost_without_cache'] * 0.8 - metrics['total_cost_with_cache']
            recommendations.append(
                f"💡 Opportunity: Improving cache hit rate to 80% could save an additional ${potential_savings:.2f}. "
                f"Focus on caching video transcripts and system prompts."
            )

        # Low token usage (caching overhead not worth it)
        avg_tokens = metrics['total_input_tokens'] / metrics['total_requests']
        if avg_tokens < 1000:
            recommendations.append(
                f"ℹ️ Low average token count ({avg_tokens:.0f} tokens/request). "
                f"Caching may not provide significant benefits for short contexts."
            )

        return recommendations

    def simulate_caching_strategy(self, strategy: str = 'default') -> Dict:
        """
        Simulate different caching strategies.

        Args:
            strategy: 'default', 'aggressive', 'minimal'

        Returns:
            Simulated performance metrics
        """
        strategies = {
            'default': {
                'cache_system_prompt': True,
                'cache_video_transcript': True,
                'cache_conversation_history': False,
                'system_prompt_tokens': 500,
                'video_transcript_tokens': 10000,
                'conversation_tokens': 2000,
                'query_tokens': 100
            },
            'aggressive': {
                'cache_system_prompt': True,
                'cache_video_transcript': True,
                'cache_conversation_history': True,
                'system_prompt_tokens': 500,
                'video_transcript_tokens': 10000,
                'conversation_tokens': 2000,
                'query_tokens': 100
            },
            'minimal': {
                'cache_system_prompt': True,
                'cache_video_transcript': False,
                'cache_conversation_history': False,
                'system_prompt_tokens': 500,
                'video_transcript_tokens': 10000,
                'conversation_tokens': 2000,
                'query_tokens': 100
            }
        }

        config = strategies.get(strategy, strategies['default'])

        # Simulate 100 requests
        num_requests = 100
        cache_hit_probability = 0.85  # Assume 85% cache hits after initial request

        total_cost = 0
        total_cached_tokens = 0

        for i in range(num_requests):
            # First request: cache write
            if i == 0:
                cache_creation = 0
                if config['cache_system_prompt']:
                    cache_creation += config['system_prompt_tokens']
                if config['cache_video_transcript']:
                    cache_creation += config['video_transcript_tokens']
                if config['cache_conversation_history']:
                    cache_creation += config['conversation_tokens']

                uncached_tokens = config['query_tokens']

                cost = (
                    cache_creation * self.pricing['cache_write'] / 1_000_000 +
                    uncached_tokens * self.pricing['input'] / 1_000_000
                )

            # Subsequent requests: cache hit or miss
            else:
                # Simulate cache hit
                if i < num_requests * cache_hit_probability:
                    cache_read = 0
                    if config['cache_system_prompt']:
                        cache_read += config['system_prompt_tokens']
                    if config['cache_video_transcript']:
                        cache_read += config['video_transcript_tokens']
                    if config['cache_conversation_history']:
                        cache_read += config['conversation_tokens']

                    uncached_tokens = config['query_tokens']
                    total_cached_tokens += cache_read

                    cost = (
                        cache_read * self.pricing['cache_read'] / 1_000_000 +
                        uncached_tokens * self.pricing['input'] / 1_000_000
                    )

                # Cache miss (rare)
                else:
                    total_tokens = (
                        config['system_prompt_tokens'] +
                        config['video_transcript_tokens'] +
                        config['conversation_tokens'] +
                        config['query_tokens']
                    )

                    cost = total_tokens * self.pricing['input'] / 1_000_000

            total_cost += cost

        return {
            'strategy': strategy,
            'num_requests': num_requests,
            'total_cost': total_cost,
            'avg_cost_per_request': total_cost / num_requests,
            'total_cached_tokens': total_cached_tokens,
            'config': config
        }


def print_metrics(metrics: Dict):
    """Pretty print analysis metrics."""
    print("\n" + "="*60)
    print("CACHE PERFORMANCE ANALYSIS")
    print("="*60)

    print(f"\nRequest Statistics:")
    print(f"  Total requests: {metrics['total_requests']}")
    print(f"  Cache hits: {metrics['cache_hits']}")
    print(f"  Cache misses: {metrics['cache_misses']}")
    print(f"  Cache hit rate: {metrics['cache_hit_rate']*100:.1f}%")

    print(f"\nToken Usage:")
    print(f"  Total input tokens: {metrics['total_input_tokens']:,}")
    print(f"  Cache read tokens: {metrics['total_cache_read_tokens']:,} "
          f"({metrics['total_cache_read_tokens']/metrics['total_input_tokens']*100:.1f}%)")
    print(f"  Cache creation tokens: {metrics['total_cache_creation_tokens']:,}")
    print(f"  Output tokens: {metrics['total_output_tokens']:,}")

    print(f"\nCost Analysis:")
    print(f"  Cost WITH caching: ${metrics['total_cost_with_cache']:.4f}")
    print(f"  Cost WITHOUT caching: ${metrics['total_cost_without_cache']:.4f}")
    print(f"  Savings: ${metrics['savings']:.4f} ({metrics['savings_percent']:.1f}%)")

    print(f"\nAverage per Request:")
    print(f"  With caching: ${metrics['avg_cost_per_request_with_cache']:.6f}")
    print(f"  Without caching: ${metrics['avg_cost_per_request_without_cache']:.6f}")


def print_video_metrics(video_metrics: Dict[str, Dict]):
    """Pretty print per-video metrics."""
    print("\n" + "="*60)
    print("CACHE PERFORMANCE BY VIDEO")
    print("="*60)

    for video_id, metrics in sorted(video_metrics.items(), key=lambda x: x[1]['cache_hit_rate'], reverse=True):
        print(f"\nVideo: {video_id}")
        print(f"  Requests: {metrics['total_requests']}")
        print(f"  Cache hits: {metrics['cache_hits']}")
        print(f"  Cache hit rate: {metrics['cache_hit_rate']*100:.1f}%")


def main():
    parser = argparse.ArgumentParser(
        description='Analyze and optimize Claude API prompt caching'
    )
    parser.add_argument(
        '--chat-logs',
        type=str,
        help='Path to chat logs JSONL file'
    )
    parser.add_argument(
        '--analyze-cache-hits',
        action='store_true',
        help='Analyze cache hit rates and cost savings'
    )
    parser.add_argument(
        '--by-video',
        action='store_true',
        help='Analyze cache performance grouped by video'
    )
    parser.add_argument(
        '--simulate-strategy',
        action='store_true',
        help='Simulate different caching strategies'
    )
    parser.add_argument(
        '--strategy',
        type=str,
        choices=['default', 'aggressive', 'minimal'],
        default='default',
        help='Caching strategy to simulate'
    )

    args = parser.parse_args()

    analyzer = CacheAnalyzer()

    # Load logs if provided
    if args.chat_logs:
        analyzer.load_logs(args.chat_logs)

    # Analyze cache hits
    if args.analyze_cache_hits:
        if not analyzer.logs:
            print("Error: No logs loaded. Use --chat-logs to specify log file.")
            return

        metrics = analyzer.analyze_cache_performance()
        print_metrics(metrics)

        # Print recommendations
        recommendations = analyzer.recommend_optimizations(metrics)
        print("\n" + "="*60)
        print("RECOMMENDATIONS")
        print("="*60)
        for rec in recommendations:
            print(f"\n{rec}")

    # Analyze by video
    if args.by_video:
        if not analyzer.logs:
            print("Error: No logs loaded. Use --chat-logs to specify log file.")
            return

        video_metrics = analyzer.analyze_by_video()
        print_video_metrics(video_metrics)

    # Simulate strategy
    if args.simulate_strategy:
        print("\n" + "="*60)
        print(f"SIMULATING STRATEGY: {args.strategy.upper()}")
        print("="*60)

        simulation = analyzer.simulate_caching_strategy(args.strategy)

        print(f"\nStrategy: {simulation['strategy']}")
        print(f"Requests simulated: {simulation['num_requests']}")
        print(f"Total cost: ${simulation['total_cost']:.4f}")
        print(f"Avg cost per request: ${simulation['avg_cost_per_request']:.6f}")
        print(f"Total cached tokens: {simulation['total_cached_tokens']:,}")

        print(f"\nConfiguration:")
        for key, value in simulation['config'].items():
            print(f"  {key}: {value}")

        # Compare strategies
        print("\n" + "="*60)
        print("STRATEGY COMPARISON")
        print("="*60)

        for strategy_name in ['minimal', 'default', 'aggressive']:
            sim = analyzer.simulate_caching_strategy(strategy_name)
            print(f"{strategy_name:12} - ${sim['avg_cost_per_request']:.6f}/request")


if __name__ == '__main__':
    main()
