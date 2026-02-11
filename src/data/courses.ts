import { Course, Video, Chapter } from '@/types'
import { courses as configuredCourses } from './video-config'
import { prisma } from '@/lib/prisma'

/**
 * LearnWithAvi Course Data
 * ========================
 *
 * This file now fetches course data from the database.
 * Falls back to config files if database is unavailable.
 *
 * TO ADD NEW VIDEOS:
 * 1. Use the admin panel at /admin/courses
 * 2. Or edit src/data/video-config.ts and run: npm run migrate:config
 *
 * TO ADD TRANSCRIPTS:
 * 1. Use the admin panel at /admin/videos/{videoId}
 * 2. Or create a file at src/data/transcripts/{youtubeId}.ts
 */

/**
 * Convert database Course to app Course type
 */
function dbToAppCourse(dbCourse: any): Course {
  return {
    id: dbCourse.id,
    title: dbCourse.title,
    description: dbCourse.description,
    thumbnail: dbCourse.thumbnail,
    difficulty: dbCourse.difficulty as 'beginner' | 'intermediate' | 'advanced',
    topics: dbCourse.topics,
    videos: dbCourse.videos?.map(dbToAppVideo) || [],
  }
}

/**
 * Convert database Video to app Video type
 */
function dbToAppVideo(dbVideo: any): Video {
  return {
    id: dbVideo.id,
    youtubeId: dbVideo.youtubeId,
    title: dbVideo.title,
    description: dbVideo.description,
    duration: dbVideo.duration,
    thumbnail: dbVideo.thumbnail,
    topic: dbVideo.topic,
    courseId: dbVideo.courseId,
    order: dbVideo.order,
    chapters:
      dbVideo.chapters?.map(
        (ch: any): Chapter => ({
          title: ch.title,
          startTime: ch.startTime,
          endTime: ch.endTime,
        })
      ) || [],
  }
}

/**
 * Get all published courses with their videos
 * @returns Promise<Course[]> - Array of published courses
 */
export async function getCourses(): Promise<Course[]> {
  try {
    const dbCourses = await prisma.course.findMany({
      where: { published: true },
      include: {
        videos: {
          where: { published: true },
          orderBy: { order: 'asc' },
          include: {
            chapters: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
      orderBy: { order: 'asc' },
    })

    return dbCourses.map(dbToAppCourse)
  } catch (error) {
    console.error('Error fetching courses from database, falling back to config:', error)
    return configuredCourses
  }
}

/**
 * Get a course by ID
 * @param courseId - Course ID
 * @returns Promise<Course | undefined>
 */
export async function getCourseById(courseId: string): Promise<Course | undefined> {
  try {
    const dbCourse = await prisma.course.findUnique({
      where: { id: courseId, published: true },
      include: {
        videos: {
          where: { published: true },
          orderBy: { order: 'asc' },
          include: {
            chapters: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    return dbCourse ? dbToAppCourse(dbCourse) : undefined
  } catch (error) {
    console.error('Error fetching course from database, falling back to config:', error)
    return configuredCourses.find((course) => course.id === courseId)
  }
}

/**
 * Get a video by ID
 * @param videoId - Video ID
 * @returns Promise<Video | undefined>
 */
export async function getVideoById(videoId: string): Promise<Video | undefined> {
  try {
    const dbVideo = await prisma.video.findUnique({
      where: { id: videoId, published: true },
      include: {
        chapters: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return dbVideo ? dbToAppVideo(dbVideo) : undefined
  } catch (error) {
    console.error('Error fetching video from database, falling back to config:', error)
    for (const course of configuredCourses) {
      const video = course.videos.find((v) => v.id === videoId)
      if (video) return video
    }
    return undefined
  }
}

/**
 * Get a video by YouTube ID
 * @param youtubeId - YouTube video ID
 * @returns Promise<Video | undefined>
 */
export async function getVideoByYoutubeId(youtubeId: string): Promise<Video | undefined> {
  try {
    const dbVideo = await prisma.video.findUnique({
      where: { youtubeId, published: true },
      include: {
        chapters: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return dbVideo ? dbToAppVideo(dbVideo) : undefined
  } catch (error) {
    console.error('Error fetching video from database, falling back to config:', error)
    for (const course of configuredCourses) {
      const video = course.videos.find((v) => v.youtubeId === youtubeId)
      if (video) return video
    }
    return undefined
  }
}

/**
 * Get featured courses (first 3)
 * @returns Promise<Course[]>
 */
export async function getFeaturedCourses(): Promise<Course[]> {
  try {
    const courses = await getCourses()
    return courses.slice(0, 3)
  } catch (error) {
    console.error('Error fetching featured courses:', error)
    return configuredCourses.slice(0, 3)
  }
}

/**
 * Get all videos across all courses
 * @returns Promise<Video[]>
 */
export async function getAllVideos(): Promise<Video[]> {
  try {
    const dbVideos = await prisma.video.findMany({
      where: { published: true },
      include: {
        chapters: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: [{ courseId: 'asc' }, { order: 'asc' }],
    })

    return dbVideos.map(dbToAppVideo)
  } catch (error) {
    console.error('Error fetching all videos from database, falling back to config:', error)
    return configuredCourses.flatMap((course) => course.videos)
  }
}

/**
 * Get the course for a specific video
 * @param videoId - Video ID or YouTube ID
 * @returns Promise<Course | undefined>
 */
export async function getCourseForVideo(videoId: string): Promise<Course | undefined> {
  try {
    // Try to find by video ID first
    const video = await prisma.video.findFirst({
      where: {
        OR: [{ id: videoId }, { youtubeId: videoId }],
        published: true,
      },
      include: {
        course: {
          include: {
            videos: {
              where: { published: true },
              orderBy: { order: 'asc' },
              include: {
                chapters: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
    })

    return video?.course ? dbToAppCourse(video.course) : undefined
  } catch (error) {
    console.error('Error fetching course for video from database, falling back to config:', error)
    return configuredCourses.find((course) =>
      course.videos.some((v) => v.id === videoId || v.youtubeId === videoId)
    )
  }
}

// Export legacy synchronous constant for backwards compatibility
// This will use cached data or config fallback
export const courses: Course[] = configuredCourses
