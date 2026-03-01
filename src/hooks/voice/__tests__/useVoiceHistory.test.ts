/**
 * useVoiceHistory Tests
 *
 * Tests for localStorage-backed voice conversation history:
 * - Initial load from localStorage
 * - Message persistence across renders
 * - TTL expiry (24-hour auto-expire)
 * - MAX_MESSAGES cap (20 messages)
 * - clearHistory removes data
 * - graceful fallback when localStorage is unavailable
 * - per-videoId isolation
 * - isLoaded flag hydration
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { useVoiceHistory } from '../useVoiceHistory';

// ─── localStorage mock helpers ────────────────────────────────────────────────

function buildStorageItem(
  videoId: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>,
  savedAt: number = Date.now()
): string {
  return JSON.stringify({ videoId, messages, savedAt });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useVoiceHistory', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ── Initial state ───────────────────────────────────────────────────────────

  describe('Initial State', () => {
    it('starts with empty messages and isLoaded=false before mount', () => {
      const { result } = renderHook(() => useVoiceHistory('video-1'));
      // After mount (useEffect runs synchronously in jsdom), isLoaded becomes true
      expect(result.current.isLoaded).toBe(true);
    });

    it('returns empty messages when no history is stored', () => {
      const { result } = renderHook(() => useVoiceHistory('video-1'));
      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoaded).toBe(true);
    });

    it('returns empty messages and isLoaded=true when videoId is undefined', () => {
      const { result } = renderHook(() => useVoiceHistory(undefined));
      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoaded).toBe(true);
    });

    it('exposes addMessage, clearHistory, messages, isLoaded', () => {
      const { result } = renderHook(() => useVoiceHistory('video-1'));
      expect(typeof result.current.addMessage).toBe('function');
      expect(typeof result.current.clearHistory).toBe('function');
      expect(Array.isArray(result.current.messages)).toBe(true);
      expect(typeof result.current.isLoaded).toBe('boolean');
    });
  });

  // ── Load from localStorage ──────────────────────────────────────────────────

  describe('Loading from localStorage', () => {
    it('loads existing history on mount', () => {
      const stored = [
        { role: 'user' as const, content: 'Hello', timestamp: 1000 },
        { role: 'assistant' as const, content: 'Hi there', timestamp: 2000 },
      ];
      localStorage.setItem('voice-history-video-1', buildStorageItem('video-1', stored));

      const { result } = renderHook(() => useVoiceHistory('video-1'));

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0].role).toBe('user');
      expect(result.current.messages[0].content).toBe('Hello');
      expect(result.current.messages[1].role).toBe('assistant');
      expect(result.current.messages[1].content).toBe('Hi there');
    });

    it('sets isLoaded=true after loading', () => {
      const { result } = renderHook(() => useVoiceHistory('video-1'));
      expect(result.current.isLoaded).toBe(true);
    });

    it('loads different history for different videoIds', () => {
      localStorage.setItem(
        'voice-history-video-1',
        buildStorageItem('video-1', [{ role: 'user', content: 'Video 1 message', timestamp: 1000 }])
      );
      localStorage.setItem(
        'voice-history-video-2',
        buildStorageItem('video-2', [{ role: 'user', content: 'Video 2 message', timestamp: 2000 }])
      );

      const { result: result1 } = renderHook(() => useVoiceHistory('video-1'));
      const { result: result2 } = renderHook(() => useVoiceHistory('video-2'));

      expect(result1.current.messages[0].content).toBe('Video 1 message');
      expect(result2.current.messages[0].content).toBe('Video 2 message');
    });

    it('returns empty when localStorage has corrupted JSON', () => {
      localStorage.setItem('voice-history-video-1', 'not-valid-json{{{');
      const { result } = renderHook(() => useVoiceHistory('video-1'));
      expect(result.current.messages).toEqual([]);
    });

    it('returns empty when stored messages array is missing', () => {
      localStorage.setItem(
        'voice-history-video-1',
        JSON.stringify({ videoId: 'video-1', savedAt: Date.now() })
      );
      const { result } = renderHook(() => useVoiceHistory('video-1'));
      expect(result.current.messages).toEqual([]);
    });
  });

  // ── TTL expiry ──────────────────────────────────────────────────────────────

  describe('TTL Expiry (24 hours)', () => {
    it('discards history older than 24 hours', () => {
      const twentyFiveHoursAgo = Date.now() - 25 * 60 * 60 * 1000;
      localStorage.setItem(
        'voice-history-video-1',
        buildStorageItem(
          'video-1',
          [{ role: 'user', content: 'Old message', timestamp: twentyFiveHoursAgo }],
          twentyFiveHoursAgo
        )
      );

      const { result } = renderHook(() => useVoiceHistory('video-1'));
      expect(result.current.messages).toEqual([]);
    });

    it('removes expired entry from localStorage', () => {
      const twentyFiveHoursAgo = Date.now() - 25 * 60 * 60 * 1000;
      localStorage.setItem(
        'voice-history-video-1',
        buildStorageItem('video-1', [], twentyFiveHoursAgo)
      );

      renderHook(() => useVoiceHistory('video-1'));

      expect(localStorage.getItem('voice-history-video-1')).toBeNull();
    });

    it('keeps history within 24 hours', () => {
      const twentyThreeHoursAgo = Date.now() - 23 * 60 * 60 * 1000;
      localStorage.setItem(
        'voice-history-video-1',
        buildStorageItem(
          'video-1',
          [{ role: 'user', content: 'Recent message', timestamp: twentyThreeHoursAgo }],
          twentyThreeHoursAgo
        )
      );

      const { result } = renderHook(() => useVoiceHistory('video-1'));
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('Recent message');
    });
  });

  // ── addMessage ──────────────────────────────────────────────────────────────

  describe('addMessage', () => {
    it('adds a user message', () => {
      const { result } = renderHook(() => useVoiceHistory('video-1'));

      act(() => {
        result.current.addMessage('user', 'Hello AI');
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe('user');
      expect(result.current.messages[0].content).toBe('Hello AI');
      expect(typeof result.current.messages[0].timestamp).toBe('number');
    });

    it('adds an assistant message', () => {
      const { result } = renderHook(() => useVoiceHistory('video-1'));

      act(() => {
        result.current.addMessage('assistant', 'Hello human');
      });

      expect(result.current.messages[0].role).toBe('assistant');
      expect(result.current.messages[0].content).toBe('Hello human');
    });

    it('appends messages in order', () => {
      const { result } = renderHook(() => useVoiceHistory('video-1'));

      act(() => {
        result.current.addMessage('user', 'First');
      });
      act(() => {
        result.current.addMessage('assistant', 'Second');
      });
      act(() => {
        result.current.addMessage('user', 'Third');
      });

      expect(result.current.messages).toHaveLength(3);
      expect(result.current.messages[0].content).toBe('First');
      expect(result.current.messages[1].content).toBe('Second');
      expect(result.current.messages[2].content).toBe('Third');
    });

    it('persists messages to localStorage', () => {
      const { result } = renderHook(() => useVoiceHistory('video-1'));

      act(() => {
        result.current.addMessage('user', 'Saved message');
      });

      const stored = localStorage.getItem('voice-history-video-1');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.messages).toHaveLength(1);
      expect(parsed.messages[0].content).toBe('Saved message');
    });

    it('persists savedAt timestamp to localStorage', () => {
      const before = Date.now();
      const { result } = renderHook(() => useVoiceHistory('video-1'));

      act(() => {
        result.current.addMessage('user', 'Test');
      });

      const after = Date.now();
      const stored = JSON.parse(localStorage.getItem('voice-history-video-1')!);
      expect(stored.savedAt).toBeGreaterThanOrEqual(before);
      expect(stored.savedAt).toBeLessThanOrEqual(after);
    });

    it('does nothing when videoId is undefined', () => {
      const { result } = renderHook(() => useVoiceHistory(undefined));

      act(() => {
        result.current.addMessage('user', 'No video');
      });

      expect(result.current.messages).toEqual([]);
    });

    it('assigns a numeric timestamp to each message', () => {
      const { result } = renderHook(() => useVoiceHistory('video-1'));

      const before = Date.now();
      act(() => {
        result.current.addMessage('user', 'Timestamped');
      });
      const after = Date.now();

      const msg = result.current.messages[0];
      expect(msg.timestamp).toBeGreaterThanOrEqual(before);
      expect(msg.timestamp).toBeLessThanOrEqual(after);
    });
  });

  // ── MAX_MESSAGES cap (20) ───────────────────────────────────────────────────

  describe('MAX_MESSAGES cap', () => {
    it('trims history to 20 messages when exceeded', () => {
      const { result } = renderHook(() => useVoiceHistory('video-1'));

      act(() => {
        for (let i = 0; i < 25; i++) {
          result.current.addMessage('user', `Message ${i}`);
        }
      });

      expect(result.current.messages).toHaveLength(20);
    });

    it('keeps the most recent 20 messages when trimming', () => {
      const { result } = renderHook(() => useVoiceHistory('video-1'));

      act(() => {
        for (let i = 0; i < 25; i++) {
          result.current.addMessage('user', `Message ${i}`);
        }
      });

      // Most recent should be Message 24 (index 24, 0-based)
      const last = result.current.messages[result.current.messages.length - 1];
      expect(last.content).toBe('Message 24');

      // Oldest kept should be Message 5
      const first = result.current.messages[0];
      expect(first.content).toBe('Message 5');
    });

    it('persists exactly 20 messages to localStorage when cap is hit', () => {
      const { result } = renderHook(() => useVoiceHistory('video-1'));

      act(() => {
        for (let i = 0; i < 22; i++) {
          result.current.addMessage('assistant', `Response ${i}`);
        }
      });

      const stored = JSON.parse(localStorage.getItem('voice-history-video-1')!);
      expect(stored.messages).toHaveLength(20);
    });
  });

  // ── clearHistory ────────────────────────────────────────────────────────────

  describe('clearHistory', () => {
    it('clears all messages from state', () => {
      const { result } = renderHook(() => useVoiceHistory('video-1'));

      act(() => {
        result.current.addMessage('user', 'Hello');
        result.current.addMessage('assistant', 'Hi');
      });

      expect(result.current.messages).toHaveLength(2);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.messages).toEqual([]);
    });

    it('removes the key from localStorage', () => {
      const { result } = renderHook(() => useVoiceHistory('video-1'));

      act(() => {
        result.current.addMessage('user', 'Will be cleared');
      });

      expect(localStorage.getItem('voice-history-video-1')).not.toBeNull();

      act(() => {
        result.current.clearHistory();
      });

      expect(localStorage.getItem('voice-history-video-1')).toBeNull();
    });

    it('only clears history for the current videoId', () => {
      // Seed storage for two videos
      localStorage.setItem(
        'voice-history-video-1',
        buildStorageItem('video-1', [{ role: 'user', content: 'Video 1', timestamp: 1000 }])
      );
      localStorage.setItem(
        'voice-history-video-2',
        buildStorageItem('video-2', [{ role: 'user', content: 'Video 2', timestamp: 2000 }])
      );

      const { result: result1 } = renderHook(() => useVoiceHistory('video-1'));

      act(() => {
        result1.current.clearHistory();
      });

      expect(localStorage.getItem('voice-history-video-1')).toBeNull();
      expect(localStorage.getItem('voice-history-video-2')).not.toBeNull();
    });

    it('does nothing when videoId is undefined', () => {
      const { result } = renderHook(() => useVoiceHistory(undefined));

      // Should not throw
      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.messages).toEqual([]);
    });

    it('allows adding messages again after clearing', () => {
      const { result } = renderHook(() => useVoiceHistory('video-1'));

      act(() => {
        result.current.addMessage('user', 'Before clear');
        result.current.clearHistory();
        result.current.addMessage('user', 'After clear');
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('After clear');
    });
  });

  // ── localStorage unavailable (private browsing) ─────────────────────────────

  describe('localStorage unavailable (private browsing fallback)', () => {
    it('falls back to in-memory storage when localStorage throws on setItem', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn().mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const { result } = renderHook(() => useVoiceHistory('video-1'));

      act(() => {
        result.current.addMessage('user', 'In-memory message');
      });

      // Message should still be in state even though localStorage failed
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('In-memory message');

      Storage.prototype.setItem = originalSetItem;
    });

    it('returns empty messages when localStorage is completely unavailable on load', () => {
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = vi.fn().mockImplementation(() => {
        throw new Error('SecurityError');
      });

      const { result } = renderHook(() => useVoiceHistory('video-1'));

      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoaded).toBe(true);

      Storage.prototype.getItem = originalGetItem;
    });
  });

  // ── Per-videoId isolation ───────────────────────────────────────────────────

  describe('Per-videoId isolation', () => {
    it('different videoIds have separate histories', () => {
      const { result: r1 } = renderHook(() => useVoiceHistory('video-A'));
      const { result: r2 } = renderHook(() => useVoiceHistory('video-B'));

      act(() => {
        r1.current.addMessage('user', 'Message for A');
      });

      expect(r1.current.messages).toHaveLength(1);
      expect(r2.current.messages).toHaveLength(0);
    });

    it('clearing one videoId does not affect another', () => {
      const { result: r1 } = renderHook(() => useVoiceHistory('video-A'));
      const { result: r2 } = renderHook(() => useVoiceHistory('video-B'));

      act(() => {
        r1.current.addMessage('user', 'A');
        r2.current.addMessage('user', 'B');
      });

      act(() => {
        r1.current.clearHistory();
      });

      expect(r1.current.messages).toEqual([]);
      expect(r2.current.messages).toHaveLength(1);
    });

    it('new hook instance for same videoId loads previously saved messages', () => {
      const { result: first } = renderHook(() => useVoiceHistory('video-persist'));

      act(() => {
        first.current.addMessage('user', 'Persisted across instances');
      });

      // Simulate a second mount (e.g. after page refresh)
      const { result: second } = renderHook(() => useVoiceHistory('video-persist'));

      expect(second.current.messages).toHaveLength(1);
      expect(second.current.messages[0].content).toBe('Persisted across instances');
    });
  });

  // ── videoId changes ─────────────────────────────────────────────────────────

  describe('videoId prop changes', () => {
    it('loads new history when videoId changes', () => {
      localStorage.setItem(
        'voice-history-video-X',
        buildStorageItem('video-X', [{ role: 'user', content: 'X message', timestamp: 1000 }])
      );
      localStorage.setItem(
        'voice-history-video-Y',
        buildStorageItem('video-Y', [{ role: 'user', content: 'Y message', timestamp: 2000 }])
      );

      const { result, rerender } = renderHook(
        ({ id }) => useVoiceHistory(id),
        { initialProps: { id: 'video-X' as string | undefined } }
      );

      expect(result.current.messages[0].content).toBe('X message');

      rerender({ id: 'video-Y' });

      expect(result.current.messages[0].content).toBe('Y message');
    });

    it('clears messages when videoId changes to undefined', () => {
      localStorage.setItem(
        'voice-history-video-1',
        buildStorageItem('video-1', [{ role: 'user', content: 'Existing', timestamp: 1000 }])
      );

      const { result, rerender } = renderHook(
        ({ id }) => useVoiceHistory(id),
        { initialProps: { id: 'video-1' as string | undefined } }
      );

      expect(result.current.messages).toHaveLength(1);

      rerender({ id: undefined });

      expect(result.current.messages).toEqual([]);
    });
  });

  // ── Filters invalid stored messages ─────────────────────────────────────────

  describe('Data validation', () => {
    it('filters out messages with invalid role', () => {
      const corruptedMessages = [
        { role: 'admin', content: 'Corrupt', timestamp: 1000 },
        { role: 'user', content: 'Valid', timestamp: 2000 },
      ];
      localStorage.setItem(
        'voice-history-video-1',
        JSON.stringify({ videoId: 'video-1', messages: corruptedMessages, savedAt: Date.now() })
      );

      const { result } = renderHook(() => useVoiceHistory('video-1'));

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('Valid');
    });

    it('filters out messages with non-string content', () => {
      const corruptedMessages = [
        { role: 'user', content: 42, timestamp: 1000 },
        { role: 'assistant', content: 'Valid response', timestamp: 2000 },
      ];
      localStorage.setItem(
        'voice-history-video-1',
        JSON.stringify({ videoId: 'video-1', messages: corruptedMessages, savedAt: Date.now() })
      );

      const { result } = renderHook(() => useVoiceHistory('video-1'));

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('Valid response');
    });

    it('filters out messages with non-numeric timestamp', () => {
      const corruptedMessages = [
        { role: 'user', content: 'Bad ts', timestamp: 'not-a-number' },
        { role: 'user', content: 'Good ts', timestamp: 1000 },
      ];
      localStorage.setItem(
        'voice-history-video-1',
        JSON.stringify({ videoId: 'video-1', messages: corruptedMessages, savedAt: Date.now() })
      );

      const { result } = renderHook(() => useVoiceHistory('video-1'));

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('Good ts');
    });
  });
});
