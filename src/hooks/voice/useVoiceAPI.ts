/**
 * useVoiceAPI - Voice chat API communication
 *
 * @module hooks/voice/useVoiceAPI
 * @description
 * Handles communication with /api/voice/chat endpoint.
 * Manages SSE streaming, transcription, and response parsing.
 */

'use client';

import { useState, useCallback, useRef } from 'react';

import { type ChatMessage } from '@/types';

/**
 * Transcription result from API
 */
export interface TranscriptionResult {
  text: string;
  language?: string;
}

/**
 * AI response state
 */
export interface AIResponse {
  content: string;
  audioUrl?: string;
  latency?: {
    stt: number;
    rag: number;
    llm: number;
    total: number;
  };
}

/**
 * Decode accumulated base64 audio chunks and create an object URL for playback.
 * Returns null if the chunks array is empty.
 */
function buildAudioUrl(base64Chunks: string[]): string | null {
  if (base64Chunks.length === 0) { return null; }
  // Decode each base64 chunk to a Uint8Array and merge them
  const byteArrays = base64Chunks.map((chunk) => {
    const binaryStr = atob(chunk);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  });
  const totalLength = byteArrays.reduce((acc, arr) => acc + arr.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of byteArrays) {
    merged.set(arr, offset);
    offset += arr.length;
  }
  const blob = new Blob([merged], { type: 'audio/mpeg' });
  return URL.createObjectURL(blob);
}

/**
 * Options for voice API call
 */
export interface UseVoiceAPIOptions {
  /** Video ID for RAG context */
  videoId?: string;

  /** Language for transcription */
  language?: 'he' | 'en' | 'auto';

  /** Enable TTS audio response */
  enableTTS?: boolean;

  /** Conversation history for context */
  conversationHistory?: ChatMessage[];

  /** Callback when transcription is received */
  onTranscription?: (result: TranscriptionResult) => void;

  /** Callback when content chunk is received */
  onContentChunk?: (chunk: string) => void;

  /** Callback when audio URL is received */
  onAudioURL?: (url: string) => void;

  /** Callback when response is complete */
  onComplete?: (response: AIResponse) => void;

  /** Callback on error */
  onError?: (error: string) => void;
}

/**
 * Return type for useVoiceAPI hook
 */
export interface UseVoiceAPIReturn {
  /** True when processing API request */
  isProcessing: boolean;

  /** Transcription result */
  transcription: TranscriptionResult | null;

  /** Current AI response */
  response: AIResponse;

  /** True if streaming content */
  isStreaming: boolean;

  /** Error message if request failed */
  error: string | null;

  /** Send audio to voice chat API */
  sendAudio: (audioBlob: Blob) => Promise<void>;

  /** Cancel ongoing request */
  cancel: () => void;

  /** Reset state */
  reset: () => void;
}

/**
 * useVoiceAPI - Communicate with voice chat API
 *
 * @example
 * ```tsx
 * const { sendAudio, transcription, response, isProcessing } = useVoiceAPI({
 *   videoId: 'mHThVfGmd6I',
 *   language: 'he',
 *   enableTTS: true,
 *   onTranscription: (result) => console.log('User said:', result.text),
 *   onComplete: (response) => console.log('AI response:', response.content)
 * });
 *
 * // Send recorded audio
 * await sendAudio(audioBlob);
 * ```
 *
 * @param options - Configuration options
 * @returns API state and controls
 */
export function useVoiceAPI(options: UseVoiceAPIOptions = {}): UseVoiceAPIReturn {
  const {
    videoId,
    language = 'auto',
    enableTTS = true,
    conversationHistory = [],
    onTranscription,
    onContentChunk,
    onAudioURL,
    onComplete,
    onError,
  } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [response, setResponse] = useState<AIResponse>({
    content: '',
    audioUrl: undefined,
    latency: undefined,
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Send audio to API
   */
  const sendAudio = useCallback(
    async (audioBlob: Blob): Promise<void> => {
      setIsProcessing(true);
      setError(null);
      setTranscription(null);
      setResponse({
        content: '',
        audioUrl: undefined,
        latency: undefined,
      });

      try {
        // Create FormData
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('language', language);
        if (videoId) {
          formData.append('videoId', videoId);
        }
        formData.append('enableTTS', enableTTS.toString());

        // Add conversation history
        if (conversationHistory.length > 0) {
          const history = conversationHistory.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }));
          formData.append('conversationHistory', JSON.stringify(history));
        }

        // Create abort controller
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        // Send request
        const apiResponse = await fetch('/api/voice/chat', {
          method: 'POST',
          body: formData,
          signal: abortController.signal,
        });

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json();
          throw new Error(errorData.message || 'Voice chat request failed');
        }

        // Read streaming response
        const reader = apiResponse.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';
        // Accumulate base64 audio chunks from `audio-chunk` SSE events
        const audioChunks: string[] = [];
        // Track the resolved audio URL so it's available when `done` fires
        let resolvedAudioUrl: string | undefined;

        setIsStreaming(true);

         
        while (true) {
          const { done, value } = await reader.read(); // eslint-disable-line no-await-in-loop

          if (done) {break;}

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');

          // Process complete SSE messages
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'transcription': {
                  const result: TranscriptionResult = {
                    text: data.text,
                    language: data.language,
                  };
                  setTranscription(result);
                  onTranscription?.(result);
                  break;
                }

                case 'content': {
                  fullContent += data.content;
                  setResponse((prev) => ({
                    ...prev,
                    content: prev.content + data.content,
                  }));
                  onContentChunk?.(data.content);
                  break;
                }

                // Legacy event type — kept for backward compatibility
                case 'audio': {
                  resolvedAudioUrl = data.audioUrl;
                  setResponse((prev) => ({
                    ...prev,
                    audioUrl: data.audioUrl,
                  }));
                  onAudioURL?.(data.audioUrl);
                  break;
                }

                // Streaming TTS: accumulate one base64-encoded audio chunk
                case 'audio-chunk': {
                  if (typeof data.chunk === 'string') {
                    audioChunks.push(data.chunk);
                  }
                  break;
                }

                // Streaming TTS: all chunks received — build the audio URL and play
                case 'audio-done': {
                  const url = buildAudioUrl(audioChunks);
                  if (url) {
                    resolvedAudioUrl = url;
                    setResponse((prev) => ({ ...prev, audioUrl: url }));
                    onAudioURL?.(url);
                  }
                  break;
                }

                case 'done': {
                  const finalResponse: AIResponse = {
                    content: data.fullContent || fullContent,
                    audioUrl: resolvedAudioUrl,
                    latency: data.latency,
                  };
                  setResponse(finalResponse);
                  setIsStreaming(false);
                  setIsProcessing(false);
                  onComplete?.(finalResponse);
                  break;
                }

                case 'error': {
                  throw new Error(data.error);
                }
              }
            }
          }
        }

        setIsStreaming(false);
        setIsProcessing(false);
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        const errorMsg = error.name === 'AbortError'
          ? 'Request cancelled'
          : `Voice chat error: ${error.message}`;

        setError(errorMsg);
        setIsProcessing(false);
        setIsStreaming(false);

        if (error.name !== 'AbortError') {
          console.error('Voice API error:', error);
          onError?.(errorMsg);
        }
      }
    },
    [
      videoId,
      language,
      enableTTS,
      conversationHistory,
      onTranscription,
      onContentChunk,
      onAudioURL,
      onComplete,
      onError,
    ]
  );

  /**
   * Cancel ongoing request
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessing(false);
    setIsStreaming(false);
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setTranscription(null);
    setResponse({
      content: '',
      audioUrl: undefined,
      latency: undefined,
    });
    setError(null);
  }, []);

  return {
    isProcessing,
    transcription,
    response,
    isStreaming,
    error,
    sendAudio,
    cancel,
    reset,
  };
}
