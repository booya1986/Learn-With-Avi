# Voice Hooks Quick Reference

**Last Updated**: February 13, 2026

Quick reference guide for using the refactored voice chat hooks.

## Installation

All hooks are exported from `@/hooks/voice`:

```typescript
import {
  useMicrophone,
  useAudioRecorder,
  useVoiceAPI,
  useAudioPlayback,
  useWaveform,
} from '@/hooks/voice';
```

## useMicrophone

**Purpose**: Request microphone permission and get MediaStream

### Basic Usage

```typescript
const { stream, permission, requestAccess, stop } = useMicrophone();

// Request access
const handleRecord = async () => {
  const micStream = await requestAccess();
  if (micStream) {
    // Use stream for recording
  }
};

// Cleanup
useEffect(() => {
  return () => stop();
}, []);
```

### API

```typescript
interface UseMicrophoneReturn {
  stream: MediaStream | null;           // Current microphone stream
  permission: PermissionStatus;          // 'prompt' | 'granted' | 'denied' | 'unknown'
  isActive: boolean;                     // True if stream is active
  error: string | null;                  // Error message if failed
  requestAccess: () => Promise<MediaStream | null>;
  stop: () => void;                      // Stop stream and release resources
}
```

### Error Handling

```typescript
const { error, requestAccess } = useMicrophone();

const handleRecord = async () => {
  await requestAccess();
  if (error) {
    alert(error); // "Microphone access denied. Please enable..."
  }
};
```

## useAudioRecorder

**Purpose**: Record audio from MediaStream using MediaRecorder API

### Basic Usage

```typescript
const recorder = useAudioRecorder({
  onStop: (blob, url) => {
    console.log('Recording complete:', url);
    // Send blob to API
  },
});

// Start recording
const handleStart = async () => {
  const stream = await getMicrophoneStream();
  recorder.start(stream);
};

// Stop recording
const handleStop = () => {
  recorder.stop(); // onStop callback will be called with blob
};
```

### API

```typescript
interface UseAudioRecorderReturn {
  state: 'inactive' | 'recording' | 'paused';
  isRecording: boolean;
  audioBlob: Blob | null;               // Available after stop
  audioUrl: string | null;              // Object URL for playback
  duration: number;                     // Recording duration in seconds
  error: string | null;
  start: (stream: MediaStream) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;                    // Clear blob and reset state
}
```

### Advanced: Pause/Resume

```typescript
const { isRecording, pause, resume } = useAudioRecorder();

<button onClick={() => isRecording ? pause() : resume()}>
  {isRecording ? 'Pause' : 'Resume'}
</button>
```

## useVoiceAPI

**Purpose**: Send audio to `/api/voice/chat` and handle SSE response

### Basic Usage

```typescript
const voiceAPI = useVoiceAPI({
  videoId: 'mHThVfGmd6I',
  language: 'he',
  enableTTS: true,
  onTranscription: (result) => {
    console.log('User said:', result.text);
  },
  onComplete: (response) => {
    console.log('AI response:', response.content);
  },
});

// Send audio
await voiceAPI.sendAudio(audioBlob);
```

### API

```typescript
interface UseVoiceAPIReturn {
  isProcessing: boolean;                // True during API call
  transcription: TranscriptionResult | null;
  response: AIResponse;                 // { content, audioUrl, latency }
  isStreaming: boolean;                 // True during content streaming
  error: string | null;
  sendAudio: (audioBlob: Blob) => Promise<void>;
  cancel: () => void;                   // Cancel ongoing request
  reset: () => void;                    // Clear state
}
```

### Advanced: Streaming Events

```typescript
const voiceAPI = useVoiceAPI({
  onTranscription: (result) => {
    addMessage({ role: 'user', content: result.text });
  },
  onContentChunk: (chunk) => {
    appendToLastMessage(chunk); // Update UI in real-time
  },
  onAudioURL: (url) => {
    playAudio(url);
  },
  onComplete: (response) => {
    showLatencyMetrics(response.latency);
  },
  onError: (error) => {
    toast.error(error);
  },
});
```

### Context Management

```typescript
const voiceAPI = useVoiceAPI({
  videoId: currentVideo.id,
  conversationHistory: messages, // Previous messages for context
});

// Updates automatically when messages change
useEffect(() => {
  voiceAPI.reset(); // Clear when changing videos
}, [currentVideo.id]);
```

## useAudioPlayback

**Purpose**: Play audio responses with full controls

### Basic Usage

```typescript
const audio = useAudioPlayback({
  autoPlay: false,
  onEnd: () => console.log('Playback finished'),
});

// Play audio
await audio.play('https://example.com/audio.mp3');

// Control playback
audio.pause();
audio.resume();
audio.stop();
```

### API

```typescript
interface UseAudioPlaybackReturn {
  state: 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;                       // 0-1
  currentTime: number;                  // Seconds
  duration: number;                     // Total duration
  error: string | null;
  play: (audioUrl: string) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (time: number) => void;         // Jump to specific time
  setVolume: (volume: number) => void;  // 0-1
  toggleMute: () => void;
}
```

### Advanced: Custom Audio Player

```typescript
const audio = useAudioPlayback();

<div className="audio-player">
  <button onClick={() => audio.isPlaying ? audio.pause() : audio.resume()}>
    {audio.isPlaying ? 'Pause' : 'Play'}
  </button>

  <input
    type="range"
    min={0}
    max={audio.duration}
    value={audio.currentTime}
    onChange={(e) => audio.seek(Number(e.target.value))}
  />

  <span>{formatTime(audio.currentTime)} / {formatTime(audio.duration)}</span>

  <button onClick={audio.toggleMute}>
    {audio.isMuted ? 'Unmute' : 'Mute'}
  </button>
</div>
```

## useWaveform

**Purpose**: Generate animated waveform visualization

### Basic Usage

```typescript
const { barHeights } = useWaveform({
  barCount: 30,
  animationSpeed: 100,
  isActive: isRecording,
});

return (
  <div className="flex gap-1">
    {barHeights.map((height, i) => (
      <div
        key={i}
        className="w-1 bg-blue-500 rounded-full"
        style={{ height: `${height * 100}%` }}
      />
    ))}
  </div>
);
```

### API

```typescript
interface UseWaveformReturn {
  barHeights: number[];  // Array of heights (0-1) for each bar
  isAnimating: boolean;  // True when animation is active
}
```

### Configuration

```typescript
const waveform = useWaveform({
  barCount: 50,          // More bars = smoother waveform
  animationSpeed: 50,    // Faster updates (ms)
  isActive: isRecording, // Controls animation
});
```

## Common Patterns

### Push-to-Talk

```typescript
function PushToTalkButton() {
  const mic = useMicrophone();
  const recorder = useAudioRecorder({
    onStop: (blob) => {
      voiceAPI.sendAudio(blob);
      mic.stop();
    },
  });
  const voiceAPI = useVoiceAPI();

  const startRecording = async () => {
    const stream = await mic.requestAccess();
    if (stream) recorder.start(stream);
  };

  const stopRecording = () => {
    recorder.stop();
  };

  return (
    <button
      onMouseDown={startRecording}
      onMouseUp={stopRecording}
      onMouseLeave={stopRecording}
      onTouchStart={startRecording}
      onTouchEnd={stopRecording}
    >
      {recorder.isRecording ? 'Recording...' : 'Hold to Talk'}
    </button>
  );
}
```

### Auto-play Responses

```typescript
const audio = useAudioPlayback({ autoPlay: false });
const [isMuted, setIsMuted] = useState(false);

const voiceAPI = useVoiceAPI({
  onAudioURL: (url) => {
    if (!isMuted) {
      audio.play(url);
    }
  },
});

<button onClick={() => setIsMuted(!isMuted)}>
  {isMuted ? 'Unmute' : 'Mute'}
</button>
```

### Recording with Waveform

```typescript
function RecordingInterface() {
  const recorder = useAudioRecorder();
  const waveform = useWaveform({ isActive: recorder.isRecording });

  return (
    <>
      <button onClick={/* ... */}>Record</button>

      {recorder.isRecording && (
        <div className="flex gap-1">
          {waveform.barHeights.map((height, i) => (
            <div key={i} style={{ height: `${height * 100}%` }} />
          ))}
        </div>
      )}

      <span>{recorder.duration}s</span>
    </>
  );
}
```

### Error Handling Pattern

```typescript
function VoiceChat() {
  const mic = useMicrophone();
  const recorder = useAudioRecorder();
  const voiceAPI = useVoiceAPI();

  useEffect(() => {
    if (mic.error) toast.error(mic.error);
  }, [mic.error]);

  useEffect(() => {
    if (recorder.error) toast.error(recorder.error);
  }, [recorder.error]);

  useEffect(() => {
    if (voiceAPI.error) toast.error(voiceAPI.error);
  }, [voiceAPI.error]);

  // ... rest of component
}
```

## Cleanup

All hooks handle cleanup automatically, but always cleanup on unmount:

```typescript
useEffect(() => {
  return () => {
    mic.stop();
    recorder.stop();
    audio.stop();
    voiceAPI.cancel();
  };
}, [mic, recorder, audio, voiceAPI]);
```

## TypeScript Tips

### Import Types

```typescript
import type {
  UseMicrophoneReturn,
  UseAudioRecorderReturn,
  TranscriptionResult,
  AIResponse,
} from '@/hooks/voice';
```

### Custom Hook Wrapper

```typescript
function useVoiceChat(videoId: string) {
  const mic = useMicrophone();
  const recorder = useAudioRecorder();
  const voiceAPI = useVoiceAPI({ videoId });
  const audio = useAudioPlayback();

  const startRecording = useCallback(async () => {
    const stream = await mic.requestAccess();
    if (stream) recorder.start(stream);
  }, [mic, recorder]);

  const stopRecording = useCallback(() => {
    recorder.stop();
    mic.stop();
  }, [recorder, mic]);

  return {
    startRecording,
    stopRecording,
    isRecording: recorder.isRecording,
    transcription: voiceAPI.transcription,
    response: voiceAPI.response,
    isPlaying: audio.isPlaying,
  };
}
```

## Performance Tips

1. **Memoize callbacks**: Use `useCallback` for event handlers
2. **Cleanup resources**: Always stop streams and cancel requests
3. **Avoid re-renders**: Use `useMemo` for derived state
4. **Lazy initialization**: Don't request microphone until needed

## Troubleshooting

### Microphone not working
```typescript
const { error, permission } = useMicrophone();

if (permission === 'denied') {
  return <div>Please enable microphone in browser settings</div>;
}
```

### Recording fails
```typescript
const recorder = useAudioRecorder();

if (recorder.error) {
  console.error('Recording error:', recorder.error);
  // Check if MediaRecorder is supported
  if (!MediaRecorder.isTypeSupported('audio/webm')) {
    // Try different format
  }
}
```

### API timeout
```typescript
const voiceAPI = useVoiceAPI({
  onError: (error) => {
    if (error.includes('timeout')) {
      // Retry logic
    }
  },
});
```

## Related Documentation

- [Voice Components Architecture](../architecture/voice-components-architecture.md)
- [Voice Component Refactor](./VOICE_COMPONENT_REFACTOR.md)
- [Voice AI Tutor Implementation](../../VOICE_AI_TUTOR_IMPLEMENTATION.md)
