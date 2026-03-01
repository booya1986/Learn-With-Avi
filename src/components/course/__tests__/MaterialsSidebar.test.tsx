import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import type { Course, Video, ChapterItem } from '@/types';

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

  it('renders the sidebar with Chapters heading', () => {
    render(<MaterialsSidebar {...defaultProps} />);
    expect(screen.getByText('Chapters')).toBeInTheDocument();
  });

  it('displays all chapter titles', () => {
    render(<MaterialsSidebar {...defaultProps} />);
    expect(screen.getByText('Introduction')).toBeInTheDocument();
    expect(screen.getByText('Setup Make')).toBeInTheDocument();
    expect(screen.getByText('AI Integration')).toBeInTheDocument();
  });

  it('renders correct number of chapter buttons', () => {
    render(<MaterialsSidebar {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(mockChapterItems.length);
  });

  it('highlights the active chapter with green background', () => {
    const { container } = render(<MaterialsSidebar {...defaultProps} />);
    // Active chapter has rgba(34,197,94,0.08) background via inline style
    const activeBtn = container.querySelector('button[style*="rgba(34, 197, 94, 0.08)"]');
    expect(activeBtn).toBeInTheDocument();
  });

  it('shows checkmark for completed chapters', () => {
    render(<MaterialsSidebar {...defaultProps} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('calls onChapterClick with correct startTime when chapter is clicked', () => {
    const onChapterClick = vi.fn();
    render(<MaterialsSidebar {...defaultProps} onChapterClick={onChapterClick} />);

    const buttons = screen.getAllByRole('button');
    // Click "AI Integration" (3rd button, startTime=300)
    fireEvent.click(buttons[2]);
    expect(onChapterClick).toHaveBeenCalledWith(300);
  });

  it('shows overall progress percentage', () => {
    render(<MaterialsSidebar {...defaultProps} overallProgress={25} />);
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('renders overall progress bar', () => {
    const { container } = render(<MaterialsSidebar {...defaultProps} overallProgress={50} />);
    const progressBar = container.querySelector('div[style*="width: 50%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('handles empty chapters gracefully', () => {
    render(<MaterialsSidebar {...defaultProps} chapterItems={[]} />);
    expect(screen.getByText('Chapters')).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('handles null currentVideo gracefully', () => {
    render(<MaterialsSidebar {...defaultProps} currentVideo={null} />);
    expect(screen.getByText('Chapters')).toBeInTheDocument();
  });

  it('displays chapter numbers for non-completed chapters', () => {
    render(<MaterialsSidebar {...defaultProps} />);
    // Chapter 1 (active, index 0) and Chapter 3 (inactive, index 2)
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('handles rapid chapter clicks without errors', () => {
    const onChapterClick = vi.fn();
    render(<MaterialsSidebar {...defaultProps} onChapterClick={onChapterClick} />);

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[0]);

    expect(onChapterClick).toHaveBeenCalledTimes(3);
  });

  it('renders as an aside element', () => {
    const { container } = render(<MaterialsSidebar {...defaultProps} />);
    expect(container.querySelector('aside')).toBeInTheDocument();
  });

  it('has dark background styling', () => {
    const { container } = render(<MaterialsSidebar {...defaultProps} />);
    const aside = container.querySelector('aside');
    // jsdom converts hex to rgb
    expect(aside?.style.background).toBe('rgb(20, 20, 20)');
  });

  it('shows "Overall" label in progress section', () => {
    render(<MaterialsSidebar {...defaultProps} />);
    expect(screen.getByText('Overall')).toBeInTheDocument();
  });
});
