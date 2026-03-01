/**
 * VoiceChatInterface - Push-to-talk voice AI tutoring interface
 *
 * @module components/voice/VoiceChatInterface
 *
 * @description
 * Complete voice-to-voice chat interface with:
 * - Push-to-talk recording with waveform visualization
 * - Real-time transcription display
 * - Streaming AI responses
 * - Audio playback for responses
 * - Latency metrics display
 * - Hebrew/English language toggle
 *
 * Target latency: <2 seconds (user stops speaking → hears first words)
 *
 * @refactored
 * Decomposed into focused hooks and components:
 * - useMicrophone: Permission and stream management
 * - useAudioRecorder: MediaRecorder recording
 * - useVoiceAPI: API communication
 * - useAudioPlayback: Audio playback
 * - MicrophoneButton: Push-to-talk button UI
 * - WaveformVisualizer: Waveform animation
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';

import { Mic, Volume2, VolumeX, Zap, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  useMicrophone,
  useAudioRecorder,
  useVoiceAPI,
  useAudioPlayback,
  useVoiceHistory,
} from '@/hooks/voice';
import { cn } from '@/lib/utils';
import { type ChatMessage } from '@/types';

import { MicrophoneButton, type MicButtonState } from './MicrophoneButton';
import { WaveformVisualizer } from './WaveformVisualizer';

interface VoiceChatInterfaceProps {
  /** Current video ID for RAG context */
  videoId?: string;

  /** Language for voice recognition and TTS */
  language?: 'he' | 'en' | 'auto';

  /** Conversation history for context */
  conversationHistory?: ChatMessage[];

  /** Callback when new message is added */
  onMessageAdd?: (message: ChatMessage) => void;

  /** Whether to enable TTS audio playback */
  enableTTS?: boolean;

  /** Custom className for styling */
  className?: string;
}

/**
 * VoiceChatInterface Component
 *
 * @example
 * ```tsx
 * <VoiceChatInterface
 *   videoId="mHThVfGmd6I"
 *   language="he"
 *   conversationHistory={messages}
 *   onMessageAdd={(msg) => setMessages([...messages, msg])}
 *   enableTTS={true}
 * />
 * ```
 */
export const VoiceChatInterface = ({
  videoId,
  language = 'auto',
  conversationHistory = [],
  onMessageAdd,
  enableTTS = true,
  className,
}: VoiceChatInterfaceProps) => {
  // Mute state
  const [isMuted, setIsMuted] = useState(false);

  // Persisted conversation history (scoped per videoId, survives page refresh)
  const voiceHistory = useVoiceHistory(videoId);

  // Merge persisted history with any externally supplied conversationHistory prop.
  // Persisted messages come first; prop-supplied messages are appended so the
  // caller can still inject context without overwriting stored history.
  const effectiveHistory: ChatMessage[] = voiceHistory.isLoaded
    ? [
        ...voiceHistory.messages.map((m) => ({
          id: `persisted-${m.timestamp}`,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp),
          isVoice: true as const,
        })),
        ...conversationHistory,
      ]
    : conversationHistory;

  // Hooks
  const microphone = useMicrophone();
  const recorder = useAudioRecorder({
    onStop: (audioBlob) => {
      // Send to API when recording stops
      void voiceAPI.sendAudio(audioBlob);
    },
  });
  const voiceAPI = useVoiceAPI({
    videoId,
    language,
    enableTTS,
    conversationHistory: effectiveHistory,
    onTranscription: (result) => {
      // Persist the user message immediately after transcription
      voiceHistory.addMessage('user', result.text);

      // Notify parent
      onMessageAdd?.({
        id: Date.now().toString(),
        role: 'user',
        content: result.text,
        timestamp: new Date(),
        isVoice: true,
      });
    },
    onAudioURL: (url) => {
      // Auto-play audio if not muted
      if (!isMuted) {
        void audioPlayback.play(url);
      }
    },
    onComplete: (response) => {
      // Persist the complete assistant response (not streaming tokens)
      if (response.content) {
        voiceHistory.addMessage('assistant', response.content);
      }

      // Notify parent
      onMessageAdd?.({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        isVoice: true,
      });
    },
  });
  const audioPlayback = useAudioPlayback({
    autoPlay: false,
  });

  /**
   * Start recording
   */
  const startRecording = useCallback(async () => {
    // Request microphone access
    const stream = await microphone.requestAccess();
    if (!stream) {
      console.error(microphone.error || 'Failed to access microphone');
      return;
    }

    // Start recording
    recorder.start(stream);
  }, [microphone, recorder]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(() => {
    recorder.stop();
    microphone.stop();
  }, [recorder, microphone]);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
    if (!isMuted && audioPlayback.isPlaying) {
      audioPlayback.stop();
    }
  }, [isMuted, audioPlayback]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      microphone.stop();
      recorder.stop();
      audioPlayback.stop();
      voiceAPI.cancel();
    };
  }, [microphone, recorder, audioPlayback, voiceAPI]);

  // Determine overall state
  const isProcessing = voiceAPI.isProcessing || voiceAPI.isStreaming;
  const canRecord = !isProcessing && !audioPlayback.isPlaying;

  // Determine button state
  let buttonState: MicButtonState = 'idle';
  if (recorder.isRecording) {
    buttonState = 'recording';
  } else if (isProcessing) {
    buttonState = 'processing';
  } else if (audioPlayback.isPlaying) {
    buttonState = 'playing';
  }

  return (
    <div className={cn('flex flex-col items-center gap-4 p-6', className)}>
      {/* Main Push-to-Talk Button */}
      <MicrophoneButton
        state={buttonState}
        disabled={!canRecord}
        onMouseDown={() => void startRecording()}
        onMouseUp={stopRecording}
        onMouseLeave={stopRecording}
        onTouchStart={() => void startRecording()}
        onTouchEnd={stopRecording}
      />

      {/* Instruction Text */}
      <div className="text-center">
        {recorder.isRecording ? (
          <p className="text-sm font-medium text-red-600">Release to send</p>
        ) : isProcessing ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {voiceAPI.isProcessing && !voiceAPI.transcription
              ? 'Transcribing...'
              : voiceAPI.isStreaming
              ? 'AI is thinking...'
              : 'Processing...'}
          </p>
        ) : audioPlayback.isPlaying ? (
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Playing response...
          </p>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">Hold to talk</p>
        )}
      </div>

      {/* Waveform Visualizer — driven by real microphone input when recording */}
      {recorder.isRecording ? <div className="w-full max-w-md">
          <WaveformVisualizer
            isActive={recorder.isRecording}
            audioSource={microphone.stream}
          />
        </div> : null}

      {/* Transcription Display */}
      {voiceAPI.transcription ? <div className="w-full max-w-md p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="flex items-start gap-2">
            <Mic size={16} className="mt-0.5 text-blue-600" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                You said ({voiceAPI.transcription.language || language}):
              </p>
              <p className="text-sm text-gray-900 dark:text-white">
                {voiceAPI.transcription.text}
              </p>
            </div>
          </div>
        </div> : null}

      {/* Response Display */}
      {voiceAPI.response.content ? <div className="w-full max-w-md p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start gap-2">
            <Volume2 size={16} className="mt-0.5 text-blue-600" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                AI Response:
              </p>
              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                {voiceAPI.response.content}
              </p>
            </div>
          </div>
        </div> : null}

      {/* Latency Display */}
      {voiceAPI.response.latency ? <div className="w-full max-w-md">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Zap size={12} />
              <span>Latency: {voiceAPI.response.latency.total}ms</span>
            </div>
            <div className="flex items-center gap-3">
              <span>STT: {voiceAPI.response.latency.stt}ms</span>
              <span>LLM: {voiceAPI.response.latency.llm}ms</span>
            </div>
          </div>
        </div> : null}

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMute}
          className="h-10 w-10 rounded-full"
          title={isMuted ? 'Unmute' : 'Mute'}
          aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </Button>

        {voiceHistory.messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={voiceHistory.clearHistory}
            className="h-10 gap-1.5 rounded-full px-3 text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
            title="Clear conversation history"
            aria-label="Clear voice conversation history"
          >
            <Trash2 size={14} />
            <span>Clear history</span>
          </Button>
        )}
      </div>
    </div>
  );
}
