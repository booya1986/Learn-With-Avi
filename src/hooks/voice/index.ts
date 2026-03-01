/**
 * Voice hooks - Modular voice chat functionality
 *
 * @module hooks/voice
 * @description
 * Focused hooks for voice chat components following Single Responsibility Principle.
 * Each hook handles one specific aspect of voice chat functionality.
 */

export { useMicrophone } from './useMicrophone';
export type { UseMicrophoneReturn, PermissionStatus } from './useMicrophone';

export { useAudioRecorder } from './useAudioRecorder';
export type {
  UseAudioRecorderReturn,
  UseAudioRecorderOptions,
  RecordingState,
} from './useAudioRecorder';

export { useVoiceAPI } from './useVoiceAPI';
export type {
  UseVoiceAPIReturn,
  UseVoiceAPIOptions,
  TranscriptionResult,
  AIResponse,
} from './useVoiceAPI';

export { useAudioPlayback } from './useAudioPlayback';
export type {
  UseAudioPlaybackReturn,
  UseAudioPlaybackOptions,
  PlaybackState,
} from './useAudioPlayback';

export { useWaveform } from './useWaveform';
export type { UseWaveformReturn, UseWaveformOptions } from './useWaveform';

export { useVoiceHistory } from './useVoiceHistory';
export type {
  UseVoiceHistoryReturn,
  VoiceHistoryMessage,
} from './useVoiceHistory';
