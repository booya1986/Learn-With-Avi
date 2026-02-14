import { CheckCircle2 } from "lucide-react";

import { cn, formatTime } from "@/lib/utils";

/**
 * ChapterItem represents a single chapter in the video timeline
 */
export interface ChapterItem {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: string;
  isActive: boolean;
  isCompleted: boolean;
  progress: number; // 0-100 progress within this chapter
}

/**
 * ChapterListItem - Individual chapter item with progress visualization
 *
 * @param chapter - Chapter data with title, timing, and progress info
 * @param index - Index of the chapter (0-based)
 * @param onChapterClick - Callback when chapter is clicked, receives startTime
 */
interface ChapterListItemProps {
  chapter: ChapterItem;
  index: number;
  onChapterClick: (startTime: number) => void;
}

export const ChapterListItem = ({ chapter, index, onChapterClick }: ChapterListItemProps) => {
  return (
    <button
      onClick={() => onChapterClick(chapter.startTime)}
      className={cn(
        "w-full flex items-center gap-2 p-2 rounded-lg transition-all duration-200",
        chapter.isActive
          ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-400 dark:border-blue-600"
          : chapter.isCompleted
            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
            : "bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      )}
    >
      {/* Chapter Number / Status */}
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold",
          chapter.isActive
            ? "bg-blue-500 text-white"
            : chapter.isCompleted
              ? "bg-green-500 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
        )}
      >
        {chapter.isCompleted ? (
          <CheckCircle2 className="w-3 h-3" />
        ) : (
          index + 1
        )}
      </div>

      {/* Chapter Info */}
      <div className="flex-1 min-w-0 text-right" dir="rtl">
        <div
          className={cn(
            "text-xs font-medium truncate",
            chapter.isActive
              ? "text-blue-700 dark:text-blue-300"
              : chapter.isCompleted
                ? "text-green-700 dark:text-green-400"
                : "text-gray-900 dark:text-white"
          )}
        >
          {chapter.title}
        </div>

        {/* Progress bar - show for active chapter or any chapter with progress */}
        {(chapter.isActive || (chapter.progress > 0 && !chapter.isCompleted)) ? <div className="mt-1">
            <div
              className={cn(
                "h-0.5 rounded-full overflow-hidden",
                chapter.isActive
                  ? "bg-blue-200 dark:bg-blue-800"
                  : "bg-gray-200 dark:bg-gray-700"
              )}
            >
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  chapter.isActive ? "bg-blue-500" : "bg-gray-400 dark:bg-gray-500"
                )}
                style={{ width: `${chapter.progress}%` }}
              />
            </div>
            <span className="text-[9px] text-gray-400 mt-0.5 block">
              {chapter.progress}% נצפה
            </span>
          </div> : null}
      </div>

      {/* Timestamp */}
      <div className="flex flex-col items-end flex-shrink-0">
        <span
          className={cn(
            "text-[10px] font-mono",
            chapter.isActive
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-400"
          )}
        >
          {formatTime(chapter.startTime)}
        </span>
        <span className="text-[10px] text-gray-400">
          {chapter.duration}
        </span>
      </div>
    </button>
  );
}
