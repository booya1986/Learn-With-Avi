/**
 * YouTube Data API Integration
 *
 * Provides utilities for validating YouTube videos and extracting metadata.
 * Used by the admin panel to import videos into the course library.
 *
 * SECURITY: API key is never exposed to the client
 * FALLBACK: Gracefully handles missing API key
 */

import { google } from 'googleapis'
import { getConfig } from './config'
import { logError } from './errors'

const youtube = google.youtube('v3')

/**
 * YouTube video metadata returned from validation
 */
export interface YouTubeMetadata {
  id: string
  title: string
  description: string
  thumbnail: string
  duration: number // in seconds
  channelTitle: string
  publishedAt: string
}

/**
 * Validation result with metadata or error
 */
export interface ValidationResult {
  valid: boolean
  error?: string
  metadata?: YouTubeMetadata
}

/**
 * Video chapter extracted from description
 */
export interface VideoChapter {
  title: string
  startTime: number // in seconds
  endTime: number // in seconds
}

/**
 * Extract YouTube video ID from various URL formats
 *
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 *
 * @param url YouTube URL
 * @returns Video ID or null if invalid
 */
export function extractYouTubeId(url: string): string | null {
  try {
    // Handle direct video IDs (11 characters, alphanumeric with _ and -)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url
    }

    // Parse URL
    const urlObj = new URL(url)

    // youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v')
      if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return videoId
      }

      // youtube.com/embed/VIDEO_ID or youtube.com/v/VIDEO_ID
      const pathMatch = urlObj.pathname.match(/\/(embed|v)\/([a-zA-Z0-9_-]{11})/)
      if (pathMatch) {
        return pathMatch[2]
      }
    }

    // youtu.be/VIDEO_ID
    if (urlObj.hostname === 'youtu.be') {
      const videoId = urlObj.pathname.slice(1) // Remove leading /
      if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return videoId
      }
    }

    return null
  } catch (error) {
    // Invalid URL
    return null
  }
}

/**
 * Parse ISO 8601 duration (PT1H2M10S) to seconds
 *
 * Examples:
 * - PT1H2M10S = 3730 seconds (1 hour, 2 minutes, 10 seconds)
 * - PT15M30S = 930 seconds (15 minutes, 30 seconds)
 * - PT45S = 45 seconds
 *
 * @param isoDuration ISO 8601 duration string
 * @returns Duration in seconds
 */
export function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)

  if (!match) {
    return 0
  }

  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)

  return hours * 3600 + minutes * 60 + seconds
}

/**
 * Validate a YouTube video and fetch its metadata
 *
 * Uses YouTube Data API v3 to fetch video details.
 * Requires YOUTUBE_API_KEY environment variable.
 *
 * @param videoId YouTube video ID (11 characters)
 * @returns Validation result with metadata or error
 */
export async function validateYouTubeVideo(videoId: string): Promise<ValidationResult> {
  try {
    const config = getConfig()

    // Check if YouTube API key is configured
    if (!config.youtubeApiKey) {
      return {
        valid: false,
        error: 'YouTube API key not configured. Please add YOUTUBE_API_KEY to .env.local',
      }
    }

    // Validate video ID format
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return {
        valid: false,
        error: 'Invalid YouTube video ID format',
      }
    }

    // Fetch video details from YouTube API
    const response = await youtube.videos.list({
      key: config.youtubeApiKey,
      part: ['snippet', 'contentDetails'],
      id: [videoId],
    })

    // Check if video exists
    if (!response.data.items || response.data.items.length === 0) {
      return {
        valid: false,
        error: 'Video not found or is private/deleted',
      }
    }

    const video = response.data.items[0]
    const snippet = video.snippet
    const contentDetails = video.contentDetails

    if (!snippet || !contentDetails) {
      return {
        valid: false,
        error: 'Failed to fetch video metadata',
      }
    }

    // Extract thumbnail (prefer maxres, fallback to high, then default)
    const thumbnails = snippet.thumbnails
    const thumbnail =
      thumbnails?.maxres?.url || thumbnails?.high?.url || thumbnails?.default?.url || ''

    // Parse duration
    const duration = contentDetails.duration ? parseDuration(contentDetails.duration) : 0

    const metadata: YouTubeMetadata = {
      id: videoId,
      title: snippet.title || 'Untitled Video',
      description: snippet.description || '',
      thumbnail,
      duration,
      channelTitle: snippet.channelTitle || 'Unknown Channel',
      publishedAt: snippet.publishedAt || new Date().toISOString(),
    }

    return {
      valid: true,
      metadata,
    }
  } catch (error) {
    logError('validateYouTubeVideo', error)

    // Check for specific YouTube API errors
    if (error && typeof error === 'object' && 'code' in error) {
      const apiError = error as { code: number; message: string }

      if (apiError.code === 403) {
        return {
          valid: false,
          error: 'YouTube API quota exceeded. Please try again later.',
        }
      }

      if (apiError.code === 400) {
        return {
          valid: false,
          error: 'Invalid request to YouTube API',
        }
      }
    }

    return {
      valid: false,
      error: 'Failed to validate YouTube video. Please try again.',
    }
  }
}

/**
 * Extract video chapters from description
 *
 * Parses timestamps in the format:
 * - 00:00 Introduction
 * - 1:30 Chapter One
 * - 10:45 Chapter Two
 *
 * @param description Video description text
 * @param videoDuration Total video duration in seconds (for calculating endTime)
 * @returns Array of chapters with timestamps
 */
export function parseChapters(description: string, videoDuration: number): VideoChapter[] {
  const chapters: VideoChapter[] = []

  // Regex to match timestamps: 00:00, 0:00, 1:30:45, etc.
  const timestampRegex = /(?:^|\n)(\d{1,2}:?\d{2}:?\d{0,2})\s+(.+?)(?=\n|$)/g

  let match
  while ((match = timestampRegex.exec(description)) !== null) {
    const timestamp = match[1]
    const title = match[2].trim()

    // Parse timestamp to seconds
    const parts = timestamp.split(':').map(Number)
    let seconds = 0

    if (parts.length === 2) {
      // MM:SS
      seconds = parts[0] * 60 + parts[1]
    } else if (parts.length === 3) {
      // HH:MM:SS
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2]
    } else {
      continue // Invalid format
    }

    chapters.push({
      title,
      startTime: seconds,
      endTime: 0, // Will be set later
    })
  }

  // Sort chapters by start time
  chapters.sort((a, b) => a.startTime - b.startTime)

  // Set endTime for each chapter (next chapter's startTime or video duration)
  for (let i = 0; i < chapters.length; i++) {
    if (i < chapters.length - 1) {
      chapters[i].endTime = chapters[i + 1].startTime
    } else {
      chapters[i].endTime = videoDuration
    }
  }

  return chapters
}

/**
 * Fetch YouTube chapters from video description
 *
 * Combines video validation and chapter extraction.
 *
 * @param videoId YouTube video ID
 * @returns Array of chapters or empty array if none found
 */
export async function fetchYouTubeChapters(videoId: string): Promise<VideoChapter[]> {
  try {
    const result = await validateYouTubeVideo(videoId)

    if (!result.valid || !result.metadata) {
      return []
    }

    const chapters = parseChapters(result.metadata.description, result.metadata.duration)

    return chapters
  } catch (error) {
    logError('fetchYouTubeChapters', error)
    return []
  }
}
