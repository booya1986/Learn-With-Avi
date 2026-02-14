# Voice Components Architecture

**Last Updated**: February 13, 2026

## Overview

The voice chat system has been refactored into focused, testable modules following the Single Responsibility Principle. This document describes the architecture and data flow.

## Component Hierarchy

```
VoiceChatInterface (296 lines)
  ├─ MicrophoneButton (117 lines)
  │   └─ Button, Icons
  ├─ WaveformVisualizer (72 lines)
  │   └─ useWaveform hook (121 lines)
  └─ Transcription/Response Display
```

## Hook Dependencies

```
VoiceChatInterface
  ├─ useMicrophone (142 lines)
  │   └─ MediaStream management
  │
  ├─ useAudioRecorder (274 lines)
  │   └─ MediaRecorder API
  │       └─ Takes: MediaStream
  │       └─ Returns: Blob
  │
  ├─ useVoiceAPI (336 lines)
  │   └─ Fetch /api/voice/chat
  │       └─ Takes: Blob
  │       └─ Returns: SSE stream
  │
  └─ useAudioPlayback (322 lines)
      └─ HTMLAudioElement
          └─ Takes: Audio URL
          └─ Controls: play/pause/seek
```

## Data Flow

### Recording Flow

```
User Action
  ↓
onMouseDown → startRecording()
  ↓
useMicrophone.requestAccess()
  ↓ (returns MediaStream)
useAudioRecorder.start(stream)
  ↓ (user speaks)
[Recording... + Waveform Animation]
  ↓
onMouseUp → stopRecording()
  ↓
useAudioRecorder.stop()
  ↓ (returns Blob)
useVoiceAPI.sendAudio(blob)
```

### API Response Flow

```
useVoiceAPI.sendAudio(blob)
  ↓
POST /api/voice/chat (FormData)
  ↓
SSE Stream Events:
  ├─ transcription → Display user message
  ├─ content → Stream AI response text
  ├─ audio → Get audio URL
  │   ↓
  │   useAudioPlayback.play(url)
  │   ↓
  │   [Audio plays through speakers]
  └─ done → Display latency metrics
```

## Hook Responsibilities

### useMicrophone

**Purpose**: Manage microphone permissions and MediaStream

**Responsibilities**:
- Request `getUserMedia()` permission
- Create and configure MediaStream
- Handle permission denied errors
- Stop stream and release resources
- Track permission state

**Interface**:
```typescript
{
  stream: MediaStream | null
  permission: 'prompt' | 'granted' | 'denied' | 'unknown'
  isActive: boolean
  error: string | null
  requestAccess: () => Promise<MediaStream | null>
  stop: () => void
}
```

### useAudioRecorder

**Purpose**: Record audio using MediaRecorder API

**Responsibilities**:
- Create MediaRecorder instance
- Collect audio chunks
- Generate Blob and Object URL
- Track recording state and duration
- Handle recording errors

**Interface**:
```typescript
{
  state: 'inactive' | 'recording' | 'paused'
  isRecording: boolean
  audioBlob: Blob | null
  audioUrl: string | null
  duration: number
  error: string | null
  start: (stream: MediaStream) => void
  stop: () => void
  pause: () => void
  resume: () => void
  reset: () => void
}
```

### useVoiceAPI

**Purpose**: Communicate with voice chat API

**Responsibilities**:
- Construct FormData with audio and context
- Send POST request to `/api/voice/chat`
- Parse SSE streaming response
- Extract transcription, content, audio URL
- Track processing state and latency
- Handle request cancellation

**Interface**:
```typescript
{
  isProcessing: boolean
  transcription: TranscriptionResult | null
  response: AIResponse
  isStreaming: boolean
  error: string | null
  sendAudio: (audioBlob: Blob) => Promise<void>
  cancel: () => void
  reset: () => void
}
```

### useAudioPlayback

**Purpose**: Play audio responses

**Responsibilities**:
- Create and manage HTMLAudioElement
- Track playback state and progress
- Control volume and mute
- Seek to specific time
- Handle playback errors

**Interface**:
```typescript
{
  state: 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error'
  isPlaying: boolean
  isMuted: boolean
  volume: number
  currentTime: number
  duration: number
  error: string | null
  play: (audioUrl: string) => Promise<void>
  pause: () => void
  resume: () => void
  stop: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
}
```

### useWaveform

**Purpose**: Generate waveform visualization state

**Responsibilities**:
- Create array of bar heights
- Animate heights when active
- Provide smooth random animation
- Configurable bar count and speed

**Interface**:
```typescript
{
  barHeights: number[]
  isAnimating: boolean
}
```

## Component Responsibilities

### VoiceChatInterface

**Purpose**: Orchestrate voice chat flow

**Responsibilities**:
- Coordinate all hooks
- Manage mute state
- Handle user message callbacks
- Display transcription and responses
- Show latency metrics
- Provide mute controls

### MicrophoneButton

**Purpose**: Push-to-talk button UI

**Responsibilities**:
- Display current state (idle/recording/processing/playing)
- Handle mouse and touch events
- Show recording indicator
- Provide visual feedback (animations, colors)

### WaveformVisualizer

**Purpose**: Visual recording feedback

**Responsibilities**:
- Render animated waveform bars
- Use `useWaveform` hook for state
- Provide visual indication of recording

## State Management

All state is managed at the component level using React hooks. No global state management is needed for voice chat.

### State Flow

1. **User initiates recording** → `useMicrophone` stores stream
2. **Recording starts** → `useAudioRecorder` collects chunks
3. **Recording stops** → `useAudioRecorder` creates blob
4. **API call** → `useVoiceAPI` stores transcription and response
5. **Audio playback** → `useAudioPlayback` tracks playback state

## Error Handling

Each hook handles its own errors:

- **useMicrophone**: Permission denied, device not found
- **useAudioRecorder**: Recording failed, unsupported format
- **useVoiceAPI**: Network error, API error, invalid response
- **useAudioPlayback**: Playback failed, audio load error

Errors are exposed through the hook's `error` property and can be displayed by the component.

## Testing Strategy

### Unit Tests

Each hook should have unit tests:

```typescript
// useMicrophone.test.ts
describe('useMicrophone', () => {
  it('requests microphone access', async () => {
    // Mock getUserMedia
    // Test requestAccess()
  });

  it('handles permission denied', async () => {
    // Mock getUserMedia to reject
    // Verify error state
  });
});

// Similar for other hooks...
```

### Integration Tests

Test hook combinations:

```typescript
describe('Voice Chat Integration', () => {
  it('records and sends audio', async () => {
    // Setup mocks
    // Test: requestAccess → start → stop → sendAudio
    // Verify API called with correct data
  });
});
```

### E2E Tests

Test full user flow with Playwright:

```typescript
test('voice chat end-to-end', async ({ page }) => {
  await page.goto('/course/test');
  await page.click('[data-testid="mic-button"]');
  // Wait for recording indicator
  await page.mouse.up();
  // Wait for transcription
  // Wait for AI response
  // Verify audio plays
});
```

## Performance Considerations

### Memory

- **MediaStream**: Released immediately after recording stops
- **Blob URLs**: Revoked when component unmounts
- **Audio elements**: Cleaned up on unmount

### Network

- **FormData**: Efficient binary upload
- **SSE**: Streaming reduces perceived latency
- **Audio**: Plays as soon as URL is received

### CPU

- **Waveform**: Simple random animation (no FFT analysis)
- **Recording**: Native MediaRecorder (hardware accelerated)
- **Playback**: Native HTMLAudioElement

## Browser Compatibility

### Required APIs

- ✅ **MediaDevices.getUserMedia** - Chrome 53+, Safari 11+, Firefox 36+
- ✅ **MediaRecorder** - Chrome 47+, Safari 14.1+, Firefox 25+
- ✅ **Fetch API** - All modern browsers
- ✅ **ReadableStream** - Chrome 43+, Safari 10.1+, Firefox 65+
- ✅ **HTMLAudioElement** - All browsers

### Fallbacks

- If MediaRecorder unsupported → Show error message
- If getUserMedia denied → Show permission instructions
- If network fails → Show retry button

## Future Enhancements

### Potential Improvements

1. **Real-time audio visualization**: Use Web Audio API AnalyserNode for actual frequency analysis
2. **Voice activity detection**: Auto-stop when user stops speaking
3. **Audio compression**: Compress audio before upload to reduce latency
4. **Offline support**: Cache common responses for offline use
5. **Multiple languages**: Support language switching mid-conversation
6. **Speaker diarization**: Identify multiple speakers
7. **Noise cancellation**: Enhanced audio preprocessing

### Refactoring Opportunities

- Extract latency display into separate component
- Create reusable transcript display component
- Add audio player controls (seek bar, volume slider)
- Implement speech queue for multiple responses

## Related Documentation

- [Voice Component Refactor](../guides/VOICE_COMPONENT_REFACTOR.md) - Refactoring summary
- [Voice AI Tutor Implementation](../../VOICE_AI_TUTOR_IMPLEMENTATION.md) - Original implementation
- [Component Extraction Initiative](./component-extraction-initiative.md) - General refactoring guidelines
