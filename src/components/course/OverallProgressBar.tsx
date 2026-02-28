import { formatTime } from "@/lib/utils";

/**
 * OverallProgressBar - Displays overall progress percentage and time for the video
 *
 * @param overallProgress - Progress percentage (0-100)
 * @param currentTime - Current playback time in seconds
 * @param videoDuration - Total video duration in seconds
 */
interface OverallProgressBarProps {
  overallProgress: number;
  currentTime: number;
  videoDuration: number;
}

export const OverallProgressBar = ({
  overallProgress,
  currentTime,
  videoDuration,
}: OverallProgressBarProps) => {
  return (
    <>
      {/* Header with Progress Percentage */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-900 dark:text-white">פרקים בסרטון</h3>
        <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
          {overallProgress}% הושלם
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{ background: 'linear-gradient(to right, #22c55e, #4ade80)', width: `${overallProgress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(videoDuration)}</span>
        </div>
      </div>
    </>
  );
}
