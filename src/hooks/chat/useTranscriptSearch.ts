/**
 * useTranscriptSearch - Search and rank transcript chunks
 *
 * Implements intelligent transcript search with:
 * - Topic detection and keyword matching
 * - Multi-word query support
 * - Relevance scoring algorithm
 * - Minimum relevance threshold filtering
 *
 * @example
 * ```tsx
 * const { searchTranscript, detectTopic } = useTranscriptSearch(
 *   currentVideo,
 *   videoMetadata,
 *   topicKnowledge
 * );
 *
 * const results = searchTranscript(query, chunks);
 * const topic = detectTopic(query);
 * ```
 */

import { useCallback } from 'react';

import { type getSampleChunksForVideo } from '@/data/sample-transcripts';
import { type Video } from '@/types';

export interface TopicInfo {
  keywords: string[];
  explanation: string;
  inVideo: boolean;
  usedInVideo?: boolean;
  videoContext?: string;
}

export interface VideoMetadata {
  title: string;
  description: string;
  toolsUsed: string[];
  mainTopic: string;
}

export interface DetectedTopic {
  key: string;
  topic: TopicInfo;
  isToolUsedInVideo: boolean;
}

export interface UseTranscriptSearchReturn {
  /** Search transcript chunks by query */
  searchTranscript: (
    query: string,
    chunks: ReturnType<typeof getSampleChunksForVideo>
  ) => ReturnType<typeof getSampleChunksForVideo>;

  /** Detect topic from query */
  detectTopic: (query: string) => DetectedTopic | null;
}

/**
 * Custom hook for transcript search functionality
 *
 * @param video - Current video object
 * @param videoMetadata - Video metadata mapping
 * @param topicKnowledge - Topic knowledge base
 * @returns Search functions
 */
export function useTranscriptSearch(
  video: Video | null,
  videoMetadata: Record<string, VideoMetadata>,
  topicKnowledge: Record<string, TopicInfo>
): UseTranscriptSearchReturn {
  /**
   * Search transcript function with intelligent ranking
   */
  const searchTranscript = useCallback(
    (query: string, chunks: ReturnType<typeof getSampleChunksForVideo>) => {
      const queryLower = query.toLowerCase();
      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

      const detectedTopicKey = Object.entries(topicKnowledge).find(([, topic]) =>
        topic.keywords.some(kw => queryLower.includes(kw.toLowerCase()))
      )?.[0];

      const scoredChunks = chunks.map(chunk => {
        const textLower = chunk.text.toLowerCase();
        let score = 0;

        if (detectedTopicKey) {
          const topicKeywords = topicKnowledge[detectedTopicKey].keywords;
          const chunkMentionsTopic = topicKeywords.some(kw =>
            textLower.includes(kw.toLowerCase())
          );

          if (chunkMentionsTopic) {
            score += 50;
            const keywordMentions = topicKeywords.filter(kw =>
              textLower.includes(kw.toLowerCase())
            ).length;
            score += keywordMentions * 15;
          } else {
            return { chunk, score: 0 };
          }
        } else {
          if (textLower.includes(queryLower)) {
            score += 100;
          }
          queryWords.forEach(word => {
            if (textLower.includes(word)) {
              score += 10;
              if (word.length > 4) {score += 5;}
            }
          });
        }

        return { chunk, score };
      });

      const MINIMUM_RELEVANCE_SCORE = 20;

      return scoredChunks
        .filter(item => item.score >= MINIMUM_RELEVANCE_SCORE)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(item => item.chunk);
    },
    [topicKnowledge]
  );

  /**
   * Detect topic from query
   */
  const detectTopic = useCallback(
    (query: string): DetectedTopic | null => {
      const queryLower = query.toLowerCase();

      for (const [key, topic] of Object.entries(topicKnowledge)) {
        if (topic.keywords.some(kw => queryLower.includes(kw))) {
          const currentVideoMeta = video ? videoMetadata[video.youtubeId] : null;
          const isToolUsedInVideo = currentVideoMeta
            ? currentVideoMeta.toolsUsed.includes(key)
            : false;

          return { key, topic, isToolUsedInVideo };
        }
      }
      return null;
    },
    [topicKnowledge, video, videoMetadata]
  );

  return {
    searchTranscript,
    detectTopic,
  };
}
