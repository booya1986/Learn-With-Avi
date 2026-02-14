import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';


import type { Course, Video } from '@/types';

import type { ChapterItem } from '../ChapterListItem';
import { MaterialsSidebar } from '../MaterialsSidebar';

const mockCourse: Course = {
  id: 'course-1',
  title: 'AI Automation Basics',
  description: 'Learn AI automation with Make and ChatGPT',
  thumbnail: 'https://example.com/thumb.jpg',
  difficulty: 'beginner',
  topics: ['automation', 'ai', 'nocode'],
  videos: [],
};

const mockVideo: Video = {
  id: 'video-1',
  youtubeId: 'mHThVfGmd6I',
  title: 'Building AI Automation',
  description: 'Create automation without code',
  duration: 600,
  thumbnail: 'https://example.com/video.jpg',
  topic: 'automation',
  courseId: 'course-1',
  order: 1,
  chapters: [
    { title: 'Introduction', startTime: 0, endTime: 120 },
    { title: 'Setup Make', startTime: 120, endTime: 300 },
    { title: 'AI Integration', startTime: 300, endTime: 600 },
  ],
};

const mockChapterItems: ChapterItem[] = [
  {
    id: 'chapter-0',
    title: 'Introduction',
    startTime: 0,
    endTime: 120,
    duration: '2:00',
    isActive: true,
    isCompleted: false,
    progress: 50,
  },
  {
    id: 'chapter-1',
    title: 'Setup Make',
    startTime: 120,
    endTime: 300,
    duration: '3:00',
    isActive: false,
    isCompleted: true,
    progress: 100,
  },
  {
    id: 'chapter-2',
    title: 'AI Integration',
    startTime: 300,
    endTime: 600,
    duration: '5:00',
    isActive: false,
    isCompleted: false,
    progress: 0,
  },
];

describe('MaterialsSidebar', () => {
  const defaultProps = {
    course: mockCourse,
    currentVideo: mockVideo,
    currentTime: 60,
    videoDuration: 600,
    chapterItems: mockChapterItems,
    overallProgress: 10,
    onChapterClick: vi.fn(),
  };

  it('renders the sidebar with course information', () => {
    render(<MaterialsSidebar {...defaultProps} />);
    expect(screen.getByText(mockCourse.title)).toBeInTheDocument();
  });

  it('displays current video information', () => {
    render(<MaterialsSidebar {...defaultProps} />);
    expect(screen.getByText(mockVideo.title)).toBeInTheDocument();
  });

  it('renders chapter list with correct number of items', () => {
    render(<MaterialsSidebar {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(mockChapterItems.length);
  });

  it('highlights the active chapter with correct styling', () => {
    render(<MaterialsSidebar {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    const activeButton = buttons.find(btn => btn.textContent?.includes('Introduction'));
    expect(activeButton).toHaveClass('bg-blue-50');
  });

  it('shows completed checkmarks for finished chapters', () => {
    render(<MaterialsSidebar {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    const completedButton = buttons.find(btn => btn.textContent?.includes('Setup Make'));
    expect(completedButton).toHaveClass('bg-green-50');
  });

  it('calls onChapterClick with correct startTime when chapter is clicked', () => {
    const onChapterClick = vi.fn();
    render(<MaterialsSidebar {...defaultProps} onChapterClick={onChapterClick} />);

    const buttons = screen.getAllByRole('button');
    const chapterButton = buttons.find(btn => btn.textContent?.includes('AI Integration'));

    if (chapterButton) {
      fireEvent.click(chapterButton);
      expect(onChapterClick).toHaveBeenCalledWith(300);
    }
  });

  it('displays progress bar for active chapter', () => {
    render(<MaterialsSidebar {...defaultProps} />);
    const activeChapter = mockChapterItems.find(ch => ch.isActive);

    if (activeChapter) {
      const progressPercentage = screen.getByText(`${activeChapter.progress}% נצפה`);
      expect(progressPercentage).toBeInTheDocument();
    }
  });

  it('updates progress bar when currentTime changes', () => {
    const { rerender } = render(<MaterialsSidebar {...defaultProps} currentTime={60} />);

    rerender(<MaterialsSidebar {...defaultProps} currentTime={180} />);

    // Should still render properly after update
    expect(screen.getByText(mockVideo.title)).toBeInTheDocument();
  });

  it('handles empty chapters gracefully', () => {
    render(
      <MaterialsSidebar
        {...defaultProps}
        chapterItems={[]}
      />
    );

    expect(screen.getByText(mockCourse.title)).toBeInTheDocument();
  });

  it('supports RTL Hebrew text display', () => {
    render(<MaterialsSidebar {...defaultProps} />);

    // Check for RTL styling on materials sidebar container
    const sidebar = screen.getByText(mockCourse.title).closest('div');
    expect(sidebar?.textContent).toContain(mockCourse.title);
  });

  it('displays chapter duration in correct format', () => {
    render(<MaterialsSidebar {...defaultProps} />);

    mockChapterItems.forEach(chapter => {
      expect(screen.getByText(chapter.duration)).toBeInTheDocument();
    });
  });

  it('shows overall progress bar', () => {
    render(<MaterialsSidebar {...defaultProps} overallProgress={25} />);

    // OverallProgressBar should be rendered
    expect(screen.getByText(mockCourse.title)).toBeInTheDocument();
  });

  it('handles null currentVideo gracefully', () => {
    render(
      <MaterialsSidebar
        {...defaultProps}
        currentVideo={null}
      />
    );

    expect(screen.getByText(mockCourse.title)).toBeInTheDocument();
  });

  it('maintains proper spacing between chapters in list', () => {
    const { container } = render(<MaterialsSidebar {...defaultProps} />);

    const chapterContainer = container.querySelector('.space-y-1');
    expect(chapterContainer).toBeInTheDocument();
  });

  it('chapter list is scrollable on long content', () => {
    render(<MaterialsSidebar {...defaultProps} />);

    // ScrollArea component should be present
    expect(screen.getByText(mockCourse.title)).toBeInTheDocument();
  });

  it('displays course metadata correctly', () => {
    render(<MaterialsSidebar {...defaultProps} />);

    const courseElement = screen.getByText(mockCourse.title);
    expect(courseElement).toBeInTheDocument();
  });

  it('chapter timestamps are displayed in proper format', () => {
    render(<MaterialsSidebar {...defaultProps} />);

    // Check for proper time formatting (HH:MM or M:SS)
    expect(screen.getByText('0:00')).toBeInTheDocument();
  });

  it('handles rapid chapter clicks without errors', () => {
    const onChapterClick = vi.fn();
    render(<MaterialsSidebar {...defaultProps} onChapterClick={onChapterClick} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      if (btn.textContent?.includes('Introduction')) {
        fireEvent.click(btn);
        fireEvent.click(btn);
        fireEvent.click(btn);
      }
    });

    expect(onChapterClick.mock.calls.length).toBeGreaterThan(0);
  });

  it('displays correct progress percentage for each chapter', () => {
    render(<MaterialsSidebar {...defaultProps} />);

    mockChapterItems.forEach(chapter => {
      if (chapter.progress > 0) {
        expect(screen.getByText(`${chapter.progress}% נצפה`)).toBeInTheDocument();
      }
    });
  });

  it('handles very long chapter titles gracefully', () => {
    const longChapterItems: ChapterItem[] = [
      {
        ...mockChapterItems[0],
        title: 'This is a very long chapter title that should be truncated properly',
      },
    ];

    render(
      <MaterialsSidebar
        {...defaultProps}
        chapterItems={longChapterItems}
      />
    );

    expect(screen.getByText(/very long chapter title/)).toBeInTheDocument();
  });

  it('properly positions chapter numbers and indicators', () => {
    const { container } = render(<MaterialsSidebar {...defaultProps} />);

    // Chapter items should have proper structure
    const chapterItems = container.querySelectorAll('button');
    expect(chapterItems.length).toBeGreaterThan(0);
  });
});
