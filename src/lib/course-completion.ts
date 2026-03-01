/**
 * Course Completion Detection
 *
 * Called fire-and-forget after a video is marked as completed.
 * Checks whether all published videos in the course are now completed
 * for a given user. If so, sets CourseEnrollment.completedAt = now().
 *
 * This function is intentionally non-throwing — any error is logged
 * and swallowed so it never blocks the calling HTTP response.
 */

import { logError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'

/**
 * Check if the user has completed all published videos in the course.
 * If yes, stamps `completedAt` on the enrollment.
 *
 * Safe to call multiple times — idempotent (will not overwrite an existing
 * completedAt timestamp).
 *
 * @param userId   The student's user ID
 * @param courseId The course ID to check
 */
export async function checkAndMarkCourseCompletion(
  userId: string,
  courseId: string
): Promise<void> {
  try {
    // Count total published videos in the course
    const totalPublished = await prisma.video.count({
      where: { courseId, published: true },
    })

    // A course with no published videos cannot be completed
    if (totalPublished === 0) {
      return
    }

    // Count how many published videos this user has completed
    // We join through VideoId — only count progress records whose video
    // is published (to guard against progress recorded on later-unpublished videos)
    const completedCount = await prisma.userProgress.count({
      where: {
        userId,
        courseId,
        isCompleted: true,
        video: { published: true },
      },
    })

    if (completedCount < totalPublished) {
      return
    }

    // All published videos are completed — stamp the enrollment
    // Only update if completedAt is still null (don't overwrite existing completion)
    await prisma.courseEnrollment.updateMany({
      where: {
        userId,
        courseId,
        completedAt: null,
      },
      data: {
        completedAt: new Date(),
      },
    })
  } catch (error) {
    // Non-fatal: log but do not rethrow — caller uses fire-and-forget
    logError('checkAndMarkCourseCompletion error', error, { userId, courseId })
  }
}
