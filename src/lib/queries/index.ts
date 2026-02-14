/**
 * Centralized Query Functions with Multi-Layer Caching
 *
 * Export all query functions for easy imports throughout the app.
 *
 * USAGE:
 * // Import specific functions
 * import { getCourseWithVideos, getVideoWithChapters } from '@/lib/queries';
 *
 * // Or import all
 * import * as queries from '@/lib/queries';
 */

// Course queries
export {
  getCourseWithVideos,
  getPublishedCourses,
  getFeaturedCourses,
  getCourseForVideo,
  courseExists,
  getCourseCount,
  getCoursesByDifficulty,
  getCoursesByTopic,
  searchCourses,
} from './course';

// Video queries
export {
  getVideoWithChapters,
  getVideoByYoutubeId,
  getAllVideos,
  getVideosByCourse,
  getVideosByTopic,
  videoExists,
  getVideoCount,
  getVideoCountByCourse,
  searchVideos,
  getNextVideo,
  getPreviousVideo,
  getChapterByTimestamp,
} from './video';

// Cache utilities (for admin panel and maintenance)
export {
  invalidateCourseCache,
  invalidateVideoCache,
  invalidateTranscriptCache,
  clearAllCache,
  getCacheStats,
  resetCacheStats,
  CACHE_TTL,
} from '../cache';
