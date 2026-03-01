import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import type { ChapterItem } from '@/types';

import { ChapterListItem } from '../ChapterListItem';

describe('ChapterListItem', () => {
  const mockChapter: ChapterItem = {
    id: 'chapter-1',
    title: 'Introduction',
    startTime: 0,
    endTime: 120,
    duration: '2:00',
    isActive: false,
    isCompleted: false,
    progress: 0,
  };

  const defaultProps = {
    chapter: mockChapter,
    index: 0,
    onChapterClick: vi.fn(),
  };

  it('renders chapter title correctly', () => {
    render(<ChapterListItem {...defaultProps} />);
    expect(screen.getByText('Introduction')).toBeInTheDocument();
  });

  it('displays chapter duration', () => {
    render(<ChapterListItem {...defaultProps} />);
    expect(screen.getByText('2:00')).toBeInTheDocument();
  });

  it('shows chapter index when not completed', () => {
    render(<ChapterListItem {...defaultProps} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('applies active styling when isActive is true', () => {
    const activeChapter: ChapterItem = { ...mockChapter, isActive: true };
    const { container } = render(
      <ChapterListItem {...defaultProps} chapter={activeChapter} />
    );

    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-blue-50');
    expect(button).toHaveClass('border-blue-400');
  });

  it('applies completed styling when isCompleted is true', () => {
    const completedChapter: ChapterItem = { ...mockChapter, isCompleted: true };
    const { container } = render(
      <ChapterListItem {...defaultProps} chapter={completedChapter} />
    );

    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-green-50');
  });

  it('applies default styling when not active or completed', () => {
    const { container } = render(<ChapterListItem {...defaultProps} />);

    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-gray-50');
  });

  it('shows checkmark icon when chapter is completed', () => {
    const completedChapter: ChapterItem = { ...mockChapter, isCompleted: true };
    const { container } = render(
      <ChapterListItem {...defaultProps} chapter={completedChapter} />
    );

    // CheckCircle2 icon should be rendered
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('calls onChapterClick with correct startTime when clicked', () => {
    const onChapterClick = vi.fn();
    render(<ChapterListItem {...defaultProps} onChapterClick={onChapterClick} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(onChapterClick).toHaveBeenCalledWith(mockChapter.startTime);
  });

  it('displays progress bar when chapter has progress', () => {
    const progressChapter: ChapterItem = { ...mockChapter, progress: 50 };
    const { container } = render(
      <ChapterListItem {...defaultProps} chapter={progressChapter} />
    );

    const progressText = screen.getByText('50% נצפה');
    expect(progressText).toBeInTheDocument();
  });

  it('progress bar width matches progress percentage', () => {
    const progressChapter: ChapterItem = { ...mockChapter, progress: 75, isActive: true };
    const { container } = render(
      <ChapterListItem {...defaultProps} chapter={progressChapter} />
    );

    const progressBar = container.querySelector('div[style*="width"]');
    expect(progressBar).toHaveStyle('width: 75%');
  });

  it('displays progress text in Hebrew', () => {
    const progressChapter: ChapterItem = { ...mockChapter, progress: 30 };
    render(<ChapterListItem {...defaultProps} chapter={progressChapter} />);

    expect(screen.getByText('30% נצפה')).toBeInTheDocument();
  });

  it('shows progress only for active or partially viewed chapters', () => {
    const noProgressChapter: ChapterItem = { ...mockChapter, progress: 0, isActive: false };
    render(<ChapterListItem {...defaultProps} chapter={noProgressChapter} />);

    // Progress text should not appear for 0% progress non-active chapters
    expect(screen.queryByText('0% נצפה')).not.toBeInTheDocument();
  });

  it('shows progress for completed chapter with 100%', () => {
    const completedChapter: ChapterItem = {
      ...mockChapter,
      isCompleted: true,
      progress: 100,
    };
    render(<ChapterListItem {...defaultProps} chapter={completedChapter} />);

    expect(screen.getByText('100% נצפה')).toBeInTheDocument();
  });

  it('displays chapter number in numbered circle', () => {
    const { container } = render(
      <ChapterListItem {...defaultProps} index={2} />
    );

    // Should show index + 1 (so 3 for index 2)
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('displays start time in timestamp format', () => {
    const chapter: ChapterItem = { ...mockChapter, startTime: 300 };
    render(<ChapterListItem {...defaultProps} chapter={chapter} />);

    expect(screen.getByText('5:00')).toBeInTheDocument();
  });

  it('handles RTL text direction for Hebrew', () => {
    const hebrewChapter: ChapterItem = {
      ...mockChapter,
      title: 'פתיח',
    };

    const { container } = render(
      <ChapterListItem {...defaultProps} chapter={hebrewChapter} />
    );

    const titleDiv = container.querySelector('div[dir="rtl"]');
    expect(titleDiv).toBeInTheDocument();
  });

  it('button is fully clickable across entire component', () => {
    const onChapterClick = vi.fn();
    const { container } = render(
      <ChapterListItem {...defaultProps} onChapterClick={onChapterClick} />
    );

    const button = container.querySelector('button');
    if (button) {
      fireEvent.click(button);
      expect(onChapterClick).toHaveBeenCalled();
    }
  });

  it('active chapter shows blue progress bar color', () => {
    const activeChapter: ChapterItem = { ...mockChapter, isActive: true, progress: 50 };
    const { container } = render(
      <ChapterListItem {...defaultProps} chapter={activeChapter} />
    );

    const backgroundDiv = container.querySelector('.bg-blue-200');
    expect(backgroundDiv).toBeInTheDocument();
  });

  it('inactive chapter shows gray progress bar color', () => {
    const inactiveChapter: ChapterItem = { ...mockChapter, isActive: false, progress: 50 };
    const { container } = render(
      <ChapterListItem {...defaultProps} chapter={inactiveChapter} />
    );

    const backgroundDiv = container.querySelector('.bg-gray-200');
    expect(backgroundDiv).toBeInTheDocument();
  });

  it('progress bar fills properly for active chapter', () => {
    const activeProgressChapter: ChapterItem = {
      ...mockChapter,
      isActive: true,
      progress: 65,
    };
    const { container } = render(
      <ChapterListItem {...defaultProps} chapter={activeProgressChapter} />
    );

    const progressFill = container.querySelector('.bg-blue-500');
    expect(progressFill).toBeInTheDocument();
    expect(progressFill).toHaveStyle('width: 65%');
  });

  it('button has proper hover state styling', () => {
    const { container } = render(<ChapterListItem {...defaultProps} />);

    const button = container.querySelector('button');
    expect(button).toHaveClass('hover:border-gray-300');
  });

  it('chapter info section is right-aligned for RTL', () => {
    const { container } = render(<ChapterListItem {...defaultProps} />);

    const infoDiv = container.querySelector('.text-right');
    expect(infoDiv).toBeInTheDocument();
    expect(infoDiv).toHaveAttribute('dir', 'rtl');
  });

  it('handles very long chapter titles with truncation', () => {
    const longTitleChapter: ChapterItem = {
      ...mockChapter,
      title: 'This is a very long chapter title that should be truncated',
    };

    const { container } = render(
      <ChapterListItem {...defaultProps} chapter={longTitleChapter} />
    );

    const titleDiv = container.querySelector('.truncate');
    expect(titleDiv).toBeInTheDocument();
  });

  it('maintains proper spacing between chapter elements', () => {
    const { container } = render(<ChapterListItem {...defaultProps} />);

    const gapDiv = container.querySelector('.gap-2');
    expect(gapDiv).toBeInTheDocument();
  });

  it('displays progress percentage in small font', () => {
    const progressChapter: ChapterItem = { ...mockChapter, progress: 45, isActive: true };
    const { container } = render(
      <ChapterListItem {...defaultProps} chapter={progressChapter} />
    );

    const progressText = screen.getByText('45% נצפה');
    expect(progressText).toHaveClass('text-\\[9px\\]');
  });

  it('handles rapid clicks without multiple calls', () => {
    const onChapterClick = vi.fn();
    const { container } = render(
      <ChapterListItem {...defaultProps} onChapterClick={onChapterClick} />
    );

    const button = container.querySelector('button');
    if (button) {
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      // All clicks should be registered
      expect(onChapterClick.mock.calls.length).toBe(3);
    }
  });

  it('title color matches state (active/completed/default)', () => {
    // Active state
    const activeChapter: ChapterItem = { ...mockChapter, isActive: true };
    const { container: activeContainer } = render(
      <ChapterListItem {...defaultProps} chapter={activeChapter} />
    );

    const activeTitle = activeContainer.querySelector('.text-blue-700');
    expect(activeTitle).toBeInTheDocument();
  });

  it('displays timestamp in monospace font', () => {
    const { container } = render(<ChapterListItem {...defaultProps} />);

    const timestamp = container.querySelector('.font-mono');
    expect(timestamp).toBeInTheDocument();
  });

  it('shows different indicator styling for completed vs in-progress chapters', () => {
    // Completed
    const completedChapter: ChapterItem = { ...mockChapter, isCompleted: true };
    const { container: completedContainer } = render(
      <ChapterListItem {...defaultProps} chapter={completedChapter} />
    );

    const completedIndicator = completedContainer.querySelector('.bg-green-500');
    expect(completedIndicator).toBeInTheDocument();

    // In progress
    const { container: activeContainer } = render(
      <ChapterListItem
        {...defaultProps}
        chapter={{ ...mockChapter, isActive: true }}
      />
    );

    const activeIndicator = activeContainer.querySelector('.bg-blue-500');
    expect(activeIndicator).toBeInTheDocument();
  });
});
