import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { type Course, type Video } from "@/types";

import { ChapterListItem, type ChapterItem } from "./ChapterListItem";
import { CourseInfoCard } from "./CourseInfoCard";
import { OverallProgressBar } from "./OverallProgressBar";

/**
 * MaterialsSidebar - Right sidebar displaying course info, progress, and chapter navigation
 *
 * This component displays:
 * - Course title, description, and tags
 * - Course metadata (type, level, duration, videos count)
 * - Overall video progress bar
 * - Chapter list with individual progress tracking
 *
 * @param course - Course object containing all course data
 * @param currentVideo - Currently playing video
 * @param currentTime - Current playback time in seconds
 * @param videoDuration - Total video duration in seconds
 * @param chapterItems - Array of chapters with progress data
 * @param overallProgress - Overall progress percentage (0-100)
 * @param onChapterClick - Callback when a chapter is clicked, receives startTime
 */
interface MaterialsSidebarProps {
  course: Course;
  currentVideo: Video | null;
  currentTime: number;
  videoDuration: number;
  chapterItems: ChapterItem[];
  overallProgress: number;
  onChapterClick: (startTime: number) => void;
  isLoading?: boolean; // True when course/video data is initially loading
}

export const MaterialsSidebar = ({
  course,
  currentVideo,
  currentTime,
  videoDuration,
  chapterItems,
  overallProgress,
  onChapterClick,
  isLoading = false,
}: MaterialsSidebarProps) => {
  return (
    <div className="w-80 flex-shrink-0 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hidden xl:block overflow-hidden">
      <ScrollArea className="h-[calc(100vh-57px)]">
        <div className="p-4">
          {isLoading ? (
            <MaterialsSidebarSkeleton />
          ) : (
            <>
              {/* Course Info Card with metadata */}
              <CourseInfoCard
                course={course}
                currentVideo={currentVideo}
                videoDuration={videoDuration}
              />

              {/* Video Chapters - Matching Timeline */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                {/* Overall Progress Bar */}
                <OverallProgressBar
                  overallProgress={overallProgress}
                  currentTime={currentTime}
                  videoDuration={videoDuration}
                />

                {/* Chapter List - Directly from video chapters */}
                <div className="space-y-1">
                  {chapterItems.map((chapter, idx) => (
                    <ChapterListItem
                      key={chapter.id}
                      chapter={chapter}
                      index={idx}
                      onChapterClick={onChapterClick}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

/**
 * MaterialsSidebarSkeleton - Skeleton UI shown while course data loads
 */
const MaterialsSidebarSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Course info skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2 mt-3">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>

      {/* Progress bar skeleton */}
      <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-3">
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Chapters skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-32 mb-3" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
