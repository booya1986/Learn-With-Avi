import React from "react";

import { BookOpen, BarChart3, Clock, FileText } from "lucide-react";

import { formatTime } from "@/lib/utils";
import { type Course, type Video } from "@/types";

/**
 * CourseInfoCard - Displays course title, description, tags, and metadata
 *
 * @param course - Course object with title, description, topics, difficulty
 * @param currentVideo - Currently playing video (optional)
 * @param videoDuration - Duration of current video in seconds
 *
 * Memoized to prevent unnecessary re-renders when video playback changes.
 */
interface CourseInfoCardProps {
  course: Course;
  currentVideo: Video | null;
  videoDuration: number;
}

export const CourseInfoCard = React.memo(function CourseInfoCard({ course, currentVideo, videoDuration }: CourseInfoCardProps) {
  return (
    <>
      {/* Course Title Card */}
      <div className="mb-5">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight" dir="rtl">
          {currentVideo?.title || course.title}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Course by <span className="text-blue-600 dark:text-blue-400 underline">Avi Levi</span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 line-clamp-3" dir="rtl">
          {currentVideo?.description || course.description}
        </p>

        {/* Tags - Dynamic from course.topics */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {course.topics.map((topic, idx) => {
            const colorMap: Record<string, string> = {
              'AI': 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
              'No-Code': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
              'Automation': 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
              'News Summary': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
              'Machine Learning': 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
              'Python': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
            };
            const defaultColor = 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800';
            const colorClass = colorMap[topic] || defaultColor;

            return (
              <span
                key={idx}
                className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${colorClass}`}
              >
                {topic}
              </span>
            );
          })}
        </div>
      </div>

      {/* Course Meta - Dynamic from course data */}
      <div className="space-y-2 mb-5 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Type</span>
          </div>
          <span className="font-medium text-gray-900 dark:text-white text-right">Pre-recorded</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <BarChart3 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Level</span>
          </div>
          <span className="font-medium text-gray-900 dark:text-white capitalize text-right">
            {course.difficulty === 'beginner' ? 'Beginner' :
             course.difficulty === 'intermediate' ? 'Intermediate' :
             course.difficulty === 'advanced' ? 'Advanced' : course.difficulty}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Duration</span>
          </div>
          <span className="font-medium text-gray-900 dark:text-white text-right">
            {currentVideo?.chapters?.length || 0} Ch, {formatTime(videoDuration)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <FileText className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Videos</span>
          </div>
          <span className="font-medium text-gray-900 dark:text-white text-right">
            {course.videos.length} {course.videos.length === 1 ? 'Video' : 'Videos'}
          </span>
        </div>
      </div>
    </>
  );
})
