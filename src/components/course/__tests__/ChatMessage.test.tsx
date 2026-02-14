import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import type { ChatMessage as ChatMessageType } from '@/types';

import { ChatMessage } from '../ChatMessage';


describe('ChatMessage', () => {
  const defaultProps = {
    onTimestampClick: vi.fn(),
  };

  it('renders user message with correct styling', () => {
    const message: ChatMessageType = {
      id: 'user-1',
      role: 'user',
      content: 'מה זה Make?',
      timestamp: new Date(),
    };

    render(<ChatMessage message={message} {...defaultProps} />);
    expect(screen.getByText('מה זה Make?')).toBeInTheDocument();
  });

  it('renders assistant message with correct styling', () => {
    const message: ChatMessageType = {
      id: 'assistant-1',
      role: 'assistant',
      content: 'Make היא פלטפורמה לאוטומציה',
      timestamp: new Date(),
    };

    render(<ChatMessage message={message} {...defaultProps} />);
    expect(screen.getByText(/Make היא/)).toBeInTheDocument();
  });

  it('parses single timestamp correctly', () => {
    const message: ChatMessageType = {
      id: 'assistant-2',
      role: 'assistant',
      content: 'ראה [timestamp:3:45] בסרטון',
      timestamp: new Date(),
    };

    render(<ChatMessage message={message} {...defaultProps} />);
    expect(screen.getByRole('button', { name: /3:45/ })).toBeInTheDocument();
  });

  it('parses multiple timestamps in single message', () => {
    const message: ChatMessageType = {
      id: 'assistant-3',
      role: 'assistant',
      content: 'ראה [timestamp:1:30] ו[timestamp:5:45]',
      timestamp: new Date(),
    };

    const onTimestampClick = vi.fn();
    render(<ChatMessage message={message} onTimestampClick={onTimestampClick} />);

    expect(screen.getByRole('button', { name: /1:30/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /5:45/ })).toBeInTheDocument();
  });

  it('calls onTimestampClick with correct time in seconds', () => {
    const message: ChatMessageType = {
      id: 'assistant-4',
      role: 'assistant',
      content: 'ראה [timestamp:2:30]',
      timestamp: new Date(),
    };

    const onTimestampClick = vi.fn();
    render(<ChatMessage message={message} onTimestampClick={onTimestampClick} />);

    const timestampButton = screen.getByRole('button', { name: /2:30/ });
    fireEvent.click(timestampButton);

    expect(onTimestampClick).toHaveBeenCalledWith(150); // 2*60 + 30 = 150
  });

  it('handles timestamps with single digit seconds', () => {
    const message: ChatMessageType = {
      id: 'assistant-5',
      role: 'assistant',
      content: 'ראה [timestamp:1:05]',
      timestamp: new Date(),
    };

    const onTimestampClick = vi.fn();
    render(<ChatMessage message={message} onTimestampClick={onTimestampClick} />);

    const timestampButton = screen.getByRole('button', { name: /1:05/ });
    fireEvent.click(timestampButton);

    expect(onTimestampClick).toHaveBeenCalledWith(65); // 1*60 + 5 = 65
  });

  it('preserves text around timestamps', () => {
    const message: ChatMessageType = {
      id: 'assistant-6',
      role: 'assistant',
      content: 'תחילה ראה [timestamp:1:00] ואחר כך בדוק את [timestamp:2:00]',
      timestamp: new Date(),
    };

    render(<ChatMessage message={message} {...defaultProps} />);

    expect(screen.getByText(/תחילה ראה/)).toBeInTheDocument();
    expect(screen.getByText(/ואחר כך/)).toBeInTheDocument();
  });

  it('handles messages without timestamps', () => {
    const message: ChatMessageType = {
      id: 'assistant-7',
      role: 'assistant',
      content: 'זו הודעה רגילה ללא timestamp',
      timestamp: new Date(),
    };

    render(<ChatMessage message={message} {...defaultProps} />);
    expect(screen.getByText(/זו הודעה רגילה/)).toBeInTheDocument();
  });

  it('applies RTL direction to message', () => {
    const message: ChatMessageType = {
      id: 'user-2',
      role: 'user',
      content: 'שלום',
      timestamp: new Date(),
    };

    const { container } = render(<ChatMessage message={message} {...defaultProps} />);
    const messageDiv = container.firstChild;
    expect(messageDiv).toHaveAttribute('dir', 'rtl');
  });

  it('preserves whitespace and newlines in content', () => {
    const message: ChatMessageType = {
      id: 'assistant-8',
      role: 'assistant',
      content: 'שורה ראשונה\nשורה שנייה',
      timestamp: new Date(),
    };

    const { container } = render(<ChatMessage message={message} {...defaultProps} />);
    expect(container.textContent).toContain('שורה ראשונה');
    expect(container.textContent).toContain('שורה שנייה');
  });

  it('user message has correct background color class', () => {
    const message: ChatMessageType = {
      id: 'user-3',
      role: 'user',
      content: 'test',
      timestamp: new Date(),
    };

    const { container } = render(<ChatMessage message={message} {...defaultProps} />);
    const messageDiv = container.querySelector('.bg-blue-600');
    expect(messageDiv).toBeInTheDocument();
  });

  it('assistant message has correct background color class', () => {
    const message: ChatMessageType = {
      id: 'assistant-9',
      role: 'assistant',
      content: 'test',
      timestamp: new Date(),
    };

    const { container } = render(<ChatMessage message={message} {...defaultProps} />);
    const messageDiv = container.querySelector('.dark\\:bg-gray-800');
    expect(messageDiv).toBeInTheDocument();
  });

  it('timestamp buttons have correct styling', () => {
    const message: ChatMessageType = {
      id: 'assistant-10',
      role: 'assistant',
      content: 'ראה [timestamp:3:00]',
      timestamp: new Date(),
    };

    render(<ChatMessage message={message} {...defaultProps} />);
    const timestampButton = screen.getByRole('button');

    expect(timestampButton).toHaveClass('text-blue-600');
    expect(timestampButton).toHaveClass('hover:underline');
  });

  it('handles very long timestamps correctly', () => {
    const message: ChatMessageType = {
      id: 'assistant-11',
      role: 'assistant',
      content: 'ראה [timestamp:59:59]',
      timestamp: new Date(),
    };

    const onTimestampClick = vi.fn();
    render(<ChatMessage message={message} onTimestampClick={onTimestampClick} />);

    const timestampButton = screen.getByRole('button', { name: /59:59/ });
    fireEvent.click(timestampButton);

    expect(onTimestampClick).toHaveBeenCalledWith(3599); // 59*60 + 59
  });

  it('handles timestamp at 0:00', () => {
    const message: ChatMessageType = {
      id: 'assistant-12',
      role: 'assistant',
      content: 'ראה [timestamp:0:00]',
      timestamp: new Date(),
    };

    const onTimestampClick = vi.fn();
    render(<ChatMessage message={message} onTimestampClick={onTimestampClick} />);

    const timestampButton = screen.getByRole('button', { name: /0:00/ });
    fireEvent.click(timestampButton);

    expect(onTimestampClick).toHaveBeenCalledWith(0);
  });

  it('does not create button for incomplete timestamp pattern', () => {
    const message: ChatMessageType = {
      id: 'assistant-13',
      role: 'assistant',
      content: 'זה לא [timestamp:3:] valid',
      timestamp: new Date(),
    };

    render(<ChatMessage message={message} {...defaultProps} />);
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBe(0);
  });

  it('handles consecutive timestamps', () => {
    const message: ChatMessageType = {
      id: 'assistant-14',
      role: 'assistant',
      content: '[timestamp:1:00][timestamp:2:00][timestamp:3:00]',
      timestamp: new Date(),
    };

    render(<ChatMessage message={message} {...defaultProps} />);

    expect(screen.getByRole('button', { name: /1:00/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /2:00/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /3:00/ })).toBeInTheDocument();
  });

  it('has appropriate aria-label for accessibility', () => {
    const message: ChatMessageType = {
      id: 'assistant-15',
      role: 'assistant',
      content: 'ראה [timestamp:5:30]',
      timestamp: new Date(),
    };

    render(<ChatMessage message={message} {...defaultProps} />);
    const timestampButton = screen.getByRole('button');

    expect(timestampButton).toHaveAttribute('aria-label');
    expect(timestampButton.getAttribute('aria-label')).toMatch(/5:30/);
  });

  it('message bubble has proper max width', () => {
    const message: ChatMessageType = {
      id: 'user-4',
      role: 'user',
      content: 'test',
      timestamp: new Date(),
    };

    const { container } = render(<ChatMessage message={message} {...defaultProps} />);
    const messageBubble = container.querySelector('.max-w-\\[95\\%\\]');
    expect(messageBubble).toBeInTheDocument();
  });

  it('handles markdown-like content', () => {
    const message: ChatMessageType = {
      id: 'assistant-16',
      role: 'assistant',
      content: '**bold** ו *italic* עם [timestamp:1:00]',
      timestamp: new Date(),
    };

    render(<ChatMessage message={message} {...defaultProps} />);
    expect(screen.getByText(/bold/)).toBeInTheDocument();
  });
});
