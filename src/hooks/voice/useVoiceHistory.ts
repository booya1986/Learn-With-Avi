/**
 * useVoiceHistory - Persist voice conversation history to localStorage
 *
 * @module hooks/voice/useVoiceHistory
 * @description
 * Custom hook that persists voice conversation messages to localStorage,
 * scoped per videoId with a 24-hour TTL and a 20-message cap.
 *
 * Features:
 * - Key format: `voice-history-{videoId}` (isolated per video)
 * - Max 20 messages (matches server-side Zod validation limit)
 * - TTL: 24 hours (auto-expire stale conversations on load)
 * - Debounced writes (only on complete messages, not streaming tokens)
 * - Graceful fallback when localStorage is unavailable (private browsing)
 *
 * @example
 * ```tsx
 * const { messages, addMessage, clearHistory, isLoaded } = useVoiceHistory('mHThVfGmd6I')
 *
 * // Save a user message after transcription is received
 * addMessage('user', transcriptionText)
 *
 * // Save assistant response after streaming is done
 * addMessage('assistant', fullResponseContent)
 *
 * // Clear all history for this video
 * clearHistory()
 * ```
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

/** A single persisted voice conversation message */
export interface VoiceHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number; // Unix epoch ms
}

/** Serialized shape stored in localStorage */
interface PersistedHistory {
  videoId: string;
  messages: VoiceHistoryMessage[];
  savedAt: number; // Unix epoch ms — used for TTL check
}

/** Return type for useVoiceHistory hook */
export interface UseVoiceHistoryReturn {
  /** Current messages array (from localStorage or in-memory fallback) */
  messages: VoiceHistoryMessage[];

  /**
   * Adds a message, trims to MAX_MESSAGES, and persists.
   * Safe to call after streaming is done (not on every token).
   */
  addMessage: (role: 'user' | 'assistant', content: string) => void;

  /** Clears history for the current videoId */
  clearHistory: () => void;

  /**
   * True once the initial load from localStorage is complete.
   * Prevents a flash of empty state before hydration.
   */
  isLoaded: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_MESSAGES = 20;
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Storage helpers ──────────────────────────────────────────────────────────

function storageKey(videoId: string): string {
  return `voice-history-${videoId}`;
}

/** Returns false when localStorage is unavailable (private browsing, etc.) */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__voice_history_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function loadFromStorage(videoId: string): VoiceHistoryMessage[] {
  if (!isLocalStorageAvailable()) return [];

  try {
    const raw = localStorage.getItem(storageKey(videoId));
    if (!raw) return [];

    const parsed: PersistedHistory = JSON.parse(raw);

    // TTL check — discard if older than 24 hours
    if (Date.now() - parsed.savedAt > TTL_MS) {
      localStorage.removeItem(storageKey(videoId));
      return [];
    }

    // Validate shape (guard against corrupted data)
    if (!Array.isArray(parsed.messages)) return [];

    return parsed.messages.filter(
      (m) =>
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        typeof m.timestamp === 'number'
    );
  } catch {
    // Corrupted JSON or other parse error — return empty
    return [];
  }
}

function saveToStorage(videoId: string, messages: VoiceHistoryMessage[]): void {
  if (!isLocalStorageAvailable()) return;

  try {
    const payload: PersistedHistory = {
      videoId,
      messages,
      savedAt: Date.now(),
    };
    localStorage.setItem(storageKey(videoId), JSON.stringify(payload));
  } catch {
    // Quota exceeded or other write error — silently ignore
  }
}

function removeFromStorage(videoId: string): void {
  if (!isLocalStorageAvailable()) return;

  try {
    localStorage.removeItem(storageKey(videoId));
  } catch {
    // Ignore removal errors
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useVoiceHistory - Persist voice conversation history across page refreshes.
 *
 * @param videoId - The video ID to scope the history to. Pass undefined to
 *   disable persistence (e.g. when no video is selected). An empty array
 *   with isLoaded=true will be returned.
 */
export function useVoiceHistory(
  videoId: string | undefined
): UseVoiceHistoryReturn {
  const [messages, setMessages] = useState<VoiceHistoryMessage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Track the latest messages in a ref so save callbacks don't go stale
  const messagesRef = useRef<VoiceHistoryMessage[]>([]);

  // ── Initial load from localStorage ────────────────────────────────────────
  useEffect(() => {
    if (!videoId) {
      setMessages([]);
      setIsLoaded(true);
      return;
    }

    const loaded = loadFromStorage(videoId);
    messagesRef.current = loaded;
    setMessages(loaded);
    setIsLoaded(true);
  }, [videoId]);

  // ── addMessage ─────────────────────────────────────────────────────────────
  const addMessage = useCallback(
    (role: 'user' | 'assistant', content: string) => {
      if (!videoId) return;

      const newMessage: VoiceHistoryMessage = {
        role,
        content,
        timestamp: Date.now(),
      };

      setMessages((prev) => {
        const updated = [...prev, newMessage];
        // Trim to MAX_MESSAGES — keep the most recent ones
        const trimmed =
          updated.length > MAX_MESSAGES
            ? updated.slice(updated.length - MAX_MESSAGES)
            : updated;

        messagesRef.current = trimmed;
        saveToStorage(videoId, trimmed);
        return trimmed;
      });
    },
    [videoId]
  );

  // ── clearHistory ───────────────────────────────────────────────────────────
  const clearHistory = useCallback(() => {
    if (!videoId) return;

    messagesRef.current = [];
    setMessages([]);
    removeFromStorage(videoId);
  }, [videoId]);

  return { messages, addMessage, clearHistory, isLoaded };
}
