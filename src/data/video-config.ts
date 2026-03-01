import { type Course, type Video, type Chapter } from '@/types'

/**
 * VIDEO CONFIGURATION SYSTEM
 * =========================
 *
 * This file provides a simple way to add new YouTube videos to the platform.
 *
 * TO ADD A NEW VIDEO:
 * 1. Add a new entry to the `videoConfigs` array below
 * 2. Create a transcript file at: src/data/transcripts/{youtubeId}.ts (optional)
 * 3. The video will automatically appear in the specified course
 *
 * REQUIRED FIELDS:
 * - youtubeId: The YouTube video ID (from the URL)
 * - title: Video title (can be in Hebrew)
 * - courseId: Which course this video belongs to
 *
 * OPTIONAL FIELDS:
 * - description: Video description
 * - duration: Length in seconds (will be auto-detected if not provided)
 * - chapters: Array of chapter markers
 * - topics: Array of topic tags
 * - thumbnail: Custom thumbnail URL (defaults to YouTube thumbnail)
 */

export interface VideoConfig {
  youtubeId: string
  title: string
  description?: string
  courseId: string
  duration?: number // in seconds
  order?: number
  chapters?: ChapterConfig[]
  topics?: string[]
  thumbnail?: string
}

export interface ChapterConfig {
  title: string
  startTime: number // in seconds
  endTime: number
}

export interface CourseConfig {
  id: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  topics: string[]
  thumbnail?: string
}

/**
 * COURSE CONFIGURATIONS
 * Add new courses here
 */
export const courseConfigs: CourseConfig[] = [
  {
    id: 'ai-no-code',
    title: 'בניית אפליקציות AI ללא קוד',
    description:
      'למד איך לבנות אפליקציות AI מתקדמות בלי לכתוב שורת קוד אחת. מסיכומים קוליים ועד אוטומציות חכמות.',
    difficulty: 'beginner',
    topics: ['No-Code', 'AI', 'Automation'],
  },
  {
    id: 'ai-tools',
    title: 'כלי AI שכדאי להכיר',
    description: 'סקירה מעמיקה של כלי AI מובילים וכיצד להשתמש בהם בצורה יעילה.',
    difficulty: 'beginner',
    topics: ['AI', 'Tools', 'Productivity'],
  },
  {
    id: 'automation-advanced',
    title: 'אוטומציות מתקדמות',
    description: 'טכניקות מתקדמות לבניית אוטומציות חכמות עם AI.',
    difficulty: 'intermediate',
    topics: ['Automation', 'AI', 'Workflows'],
  },
]

/**
 * VIDEO CONFIGURATIONS
 * =====================
 * Add your YouTube videos here!
 *
 * Example:
 * {
 *   youtubeId: 'dQw4w9WgXcQ',  // YouTube video ID from URL
 *   title: 'הסרטון שלי',
 *   description: 'תיאור הסרטון',
 *   courseId: 'ai-no-code',    // Must match a course ID above
 *   duration: 600,              // 10 minutes in seconds
 *   chapters: [
 *     { title: 'מבוא', startTime: 0, endTime: 60 },
 *     { title: 'החלק העיקרי', startTime: 60, endTime: 300 },
 *     // ... more chapters
 *   ]
 * }
 */
export const videoConfigs: VideoConfig[] = [
  // ==========================================
  // AI NO-CODE COURSE VIDEOS
  // ==========================================
  {
    youtubeId: 'mHThVfGmd6I',
    title: 'איך בניתי אפליקציה שמייצרת סיכום קולי יומי של חדשות AI – לגמרי בלי קוד',
    description:
      'בסרטון הזה אני מראה איך בניתי אפליקציה שמייצרת סיכום קולי יומי של חדשות AI באופן אוטומטי לחלוטין, בלי לכתוב שורת קוד אחת.',
    courseId: 'ai-no-code',
    duration: 1308, // 21:48 - Real video duration
    order: 1,
    topics: ['No-Code', 'AI', 'Automation', 'News Summary'],
    chapters: [
      // Chapters based on actual 21:48 video content
      { title: 'הקדמה ומה נבנה היום', startTime: 0, endTime: 90 },
      { title: 'סקירת הפרויקט המוגמר', startTime: 90, endTime: 210 },
      { title: 'הגדרת Make ויצירת Scenario', startTime: 210, endTime: 390 },
      { title: 'חיבור News API לאיסוף חדשות', startTime: 390, endTime: 550 },
      { title: 'עיבוד וסינון הכתבות', startTime: 550, endTime: 700 },
      { title: 'חיבור ChatGPT לסיכום בעברית', startTime: 700, endTime: 870 },
      { title: 'המרה לשמע עם ElevenLabs', startTime: 870, endTime: 1020 },
      { title: 'שליחה אוטומטית לטלגרם', startTime: 1020, endTime: 1140 },
      { title: 'תזמון יומי ובדיקות', startTime: 1140, endTime: 1250 },
      { title: 'סיכום ורעיונות להרחבה', startTime: 1250, endTime: 1308 },
    ],
  },

  // ==========================================
  // ADD YOUR NEW VIDEOS BELOW
  // ==========================================

  // Example: Uncomment and modify to add a new video
  // {
  //   youtubeId: 'YOUR_YOUTUBE_ID',
  //   title: 'כותרת הסרטון שלך',
  //   description: 'תיאור קצר של הסרטון',
  //   courseId: 'ai-no-code', // or another course ID
  //   duration: 600, // duration in seconds
  //   order: 2,
  //   chapters: [
  //     { title: 'חלק 1', startTime: 0, endTime: 120 },
  //     { title: 'חלק 2', startTime: 120, endTime: 300 },
  //   ],
  // },
]

// ==========================================
// HELPER FUNCTIONS - Don't modify below
// ==========================================

/**
 * Convert VideoConfig to Video type
 */
function configToVideo(config: VideoConfig, index: number): Video {
  return {
    id: `${config.courseId}-${String(config.order || index + 1).padStart(3, '0')}`,
    youtubeId: config.youtubeId,
    title: config.title,
    description: config.description || '',
    duration: config.duration || 0,
    thumbnail:
      config.thumbnail || `https://img.youtube.com/vi/${config.youtubeId}/maxresdefault.jpg`,
    topic: config.topics?.[0] || 'General',
    courseId: config.courseId,
    order: config.order || index + 1,
    chapters: config.chapters as Chapter[],
  }
}

/**
 * Build courses from configuration
 */
export function buildCourses(): Course[] {
  return courseConfigs
    .map((courseConfig) => {
      const courseVideos = videoConfigs
        .filter((v) => v.courseId === courseConfig.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((v, i) => configToVideo(v, i))

      // Use first video's thumbnail as course thumbnail if not specified
      const thumbnail =
        courseConfig.thumbnail ||
        courseVideos[0]?.thumbnail ||
        'https://placehold.co/640x360?text=Course'

      return {
        id: courseConfig.id,
        title: courseConfig.title,
        description: courseConfig.description,
        thumbnail,
        videos: courseVideos,
        difficulty: courseConfig.difficulty,
        topics: courseConfig.topics,
      }
    })
    .filter((course) => course.videos.length > 0) // Only return courses with videos
}

/**
 * Get a specific video config by YouTube ID
 */
export function getVideoConfigByYoutubeId(youtubeId: string): VideoConfig | undefined {
  return videoConfigs.find((v) => v.youtubeId === youtubeId)
}

/**
 * Get all video configs for a course
 */
export function getVideoConfigsForCourse(courseId: string): VideoConfig[] {
  return videoConfigs.filter((v) => v.courseId === courseId)
}

// Export the built courses
export const courses = buildCourses()
