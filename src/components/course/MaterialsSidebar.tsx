import { ScrollArea } from "@/components/ui/scroll-area";
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
}

export const MaterialsSidebar = ({
  course,
  currentVideo,
  currentTime,
  videoDuration,
  chapterItems,
  overallProgress,
  onChapterClick,
}: MaterialsSidebarProps) => {
  return (
    <div className="w-80 flex-shrink-0 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hidden xl:block overflow-hidden">
      <ScrollArea className="h-[calc(100vh-57px)]">
        <div className="p-4">
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
        </div>
      </ScrollArea>
    </div>
  );
}
