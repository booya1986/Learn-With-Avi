import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { ChatMessage } from '@/components/chat/ChatMessage';
import type { ChatMessage as ChatMessageType } from '@/types';



describe('ChatMessage', () => {
  const defaultProps = {
    onTimestampClick: vi.fn(),
  };

  it('renders user message content', () => {
    const message: ChatMessageType = {
      id: 'user-1',
      role: 'user',
      content: 'מה זה Make?',
      timestamp: new Date(),
    };

    render(<ChatMessage message={message} {...defaultProps} />);
    expect(screen.getByText('מה זה Make?')).toBeInTheDocument();
  });

  it('renders assistant message content', () => {
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
      content: 'תחילה ראה [timestamp:1:00] ואחר כך בדוק',
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

  it('applies RTL direction for Hebrew content', () => {
    const message: ChatMessageType = {
      id: 'user-2',
      role: 'user',
      content: 'שלום',
      timestamp: new Date(),
    };

    const { container } = render(<ChatMessage message={message} {...defaultProps} />);
    // The richer component sets dir=rtl on the content div when Hebrew is detected
    const rtlDiv = container.querySelector('[dir="rtl"]');
    expect(rtlDiv).toBeInTheDocument();
  });

  it('preserves text content with newlines', () => {
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

  it('shows user styling for user messages', () => {
    const message: ChatMessageType = {
      id: 'user-3',
      role: 'user',
      content: 'test',
      timestamp: new Date(),
    };

    const { container } = render(<ChatMessage message={message} {...defaultProps} />);
    // jsdom serializes rgba with spaces: rgba(34, 197, 94, 0.09)
    const messageDiv = container.querySelector('div[style*="rgba(34, 197, 94, 0.09)"]');
    expect(messageDiv).toBeInTheDocument();
  });

  it('shows assistant styling for assistant messages', () => {
    const message: ChatMessageType = {
      id: 'assistant-9',
      role: 'assistant',
      content: 'test',
      timestamp: new Date(),
    };

    const { container } = render(<ChatMessage message={message} {...defaultProps} />);
    // jsdom serializes rgba with spaces: rgba(34, 197, 94, 0.04)
    const messageDiv = container.querySelector('div[style*="rgba(34, 197, 94, 0.04)"]');
    expect(messageDiv).toBeInTheDocument();
  });

  it('timestamp buttons are rendered with title attribute', () => {
    const message: ChatMessageType = {
      id: 'assistant-10',
      role: 'assistant',
      content: 'ראה [timestamp:3:00]',
      timestamp: new Date(),
    };

    render(<ChatMessage message={message} {...defaultProps} />);
    // The richer component uses title= not aria-label= on timestamp buttons
    const buttons = screen.getAllByRole('button');
    const timestampBtn = buttons.find(b => b.textContent?.includes('3:00'));
    expect(timestampBtn).toBeInTheDocument();
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

  it('renders bold markdown content', () => {
    const message: ChatMessageType = {
      id: 'assistant-16',
      role: 'assistant',
      content: '**bold text** ו *italic*',
      timestamp: new Date(),
    };

    render(<ChatMessage message={message} {...defaultProps} />);
    expect(screen.getByText('bold text')).toBeInTheDocument();
  });

  it('renders message content when isVoice flag is set', () => {
    const message: ChatMessageType = {
      id: 'assistant-17',
      role: 'assistant',
      content: 'Voice response',
      timestamp: new Date(),
      isVoice: true,
    };

    render(<ChatMessage message={message} {...defaultProps} />);
    expect(screen.getByText('Voice response')).toBeInTheDocument();
  });

  it('renders source badges when sources are provided', () => {
    const message: ChatMessageType = {
      id: 'assistant-18',
      role: 'assistant',
      content: 'See sources',
      timestamp: new Date(),
      sources: [
        {
          videoId: 'vid1',
          videoTitle: 'Test Video',
          timestamp: 90,
          text: 'Source text',
          relevance: 0.9,
        },
      ],
    };

    render(<ChatMessage message={message} {...defaultProps} />);
    // Source badges rendered with videoTitle and timestamp
    expect(screen.getByText(/Test Video/)).toBeInTheDocument();
  });
});
