# Context Migration Guide

Step-by-step guide for migrating child components to use the new context system.

## Overview

This guide helps you update existing components to use React contexts instead of props. The migration eliminates prop drilling and creates cleaner, more maintainable components.

## Prerequisites

- Context system is implemented (`src/contexts/`)
- CoursePageClient already uses CourseProvider
- Component is a child/descendant of CourseProvider

## Step-by-Step Migration

### Step 1: Identify Props to Remove

Look at your component's props interface:

```tsx
// BEFORE
interface VideoPlayerProps {
  currentTime: number           // ← From VideoContext
  onTimeUpdate: (time: number) => void  // ← From VideoContext
  seekToTime?: number           // ← From VideoContext
  currentVideo: Video | null    // ← From VideoContext
}

function VideoPlayer({
  currentTime,
  onTimeUpdate,
  seekToTime,
  currentVideo,
}: VideoPlayerProps) {
  // Component logic
}
```

**Identify which context provides each prop:**
- Video-related → `VideoContext`
- Chat-related → `ChatContext`
- Quiz-related → `QuizContext`

### Step 2: Import Context Hooks

Add the appropriate context hooks to your imports:

```tsx
// AFTER
import { useVideoContext } from '@/contexts'

// Or import multiple contexts
import { useVideoContext, useChatContext } from '@/contexts'
```

### Step 3: Replace Props with Context

Remove props from function signature and get values from context:

```tsx
// AFTER
function VideoPlayer() {  // No props!
  const {
    currentTime,
    handleTimeUpdate,    // Note: renamed from onTimeUpdate
    seekToTime,
    currentVideo,
  } = useVideoContext()

  // Component logic remains the same
}
```

### Step 4: Update Parent Component

Remove props from parent component's JSX:

```tsx
// BEFORE
<VideoPlayer
  currentTime={currentTime}
  onTimeUpdate={handleTimeUpdate}
  seekToTime={seekToTime}
  currentVideo={currentVideo}
/>

// AFTER
<VideoPlayer />  {/* No props needed! */}
```

### Step 5: Handle Callbacks

If component calls parent callbacks, use context actions instead:

```tsx
// BEFORE
interface Props {
  onChapterClick: (startTime: number) => void
}

function ChapterList({ onChapterClick }: Props) {
  return (
    <button onClick={() => onChapterClick(120)}>
      Jump to Chapter
    </button>
  )
}

// AFTER
function ChapterList() {
  const { handleSeek } = useVideoContext()

  return (
    <button onClick={() => handleSeek(120)}>
      Jump to Chapter
    </button>
  )
}
```

## Context API Reference

### VideoContext

**State Values:**
| Prop | Type | Description |
|------|------|-------------|
| `currentVideo` | `Video \| null` | Currently playing video |
| `currentTime` | `number` | Current playback time (seconds) |
| `actualDuration` | `number` | Video duration from YouTube |
| `seekToTime` | `number \| undefined` | Target seek time |
| `currentChapter` | `Chapter \| undefined` | Active chapter |
| `currentStageIndex` | `number` | Current stage (1-based) |
| `videoDuration` | `number` | Duration (actual or fallback) |
| `overallProgress` | `number` | Progress percentage (0-100) |
| `liveTranscript` | `TranscriptChunk[]` | Current transcript chunks |
| `watchedVideos` | `Set<string>` | Set of watched video IDs |
| `chapterWatchedTime` | `Record<number, number>` | Watched seconds per chapter |

**Actions:**
| Method | Signature | Description |
|--------|-----------|-------------|
| `handleTimeUpdate` | `(time: number) => void` | Update playback time |
| `handleDurationChange` | `(duration: number) => void` | Update video duration |
| `handleSeek` | `(time: number) => void` | Seek to specific time |
| `setCurrentVideo` | `(video: Video \| null) => void` | Change video |

### ChatContext

**State Values:**
| Prop | Type | Description |
|------|------|-------------|
| `messages` | `ChatMessage[]` | Chat message history |
| `inputMessage` | `string` | Current input value |
| `isLoading` | `boolean` | API request in progress |
| `isListening` | `boolean` | Voice input active |
| `showSummary` | `boolean` | Summary modal visible |
| `isGeneratingSummary` | `boolean` | Summary generation in progress |
| `generatedSummaryData` | `SummaryData \| null` | Generated summary |

**Actions:**
| Method | Signature | Description |
|--------|-----------|-------------|
| `setInputMessage` | `(message: string) => void` | Update input value |
| `sendMessage` | `(videoId?, title?, desc?) => Promise<void>` | Send message to API |
| `toggleVoiceInput` | `() => void` | Toggle voice input |
| `handleKeyPress` | `(e: KeyboardEvent) => void` | Handle Enter key |
| `generateSummary` | `(videoId, title, desc) => void` | Generate summary |
| `setShowSummary` | `(show: boolean) => void` | Show/hide summary |

### QuizContext

**State Values:**
| Prop | Type | Description |
|------|------|-------------|
| `status` | `QuizStatus` | Quiz status (idle/loading/question/feedback/complete) |
| `currentQuestion` | `QuizQuestion \| null` | Active question |
| `feedback` | `QuizFeedbackData \| null` | Answer feedback |
| `sessionState` | `QuizSessionState \| null` | Session data |
| `isLoading` | `boolean` | Question generation in progress |
| `error` | `string \| null` | Error message |

**Actions:**
| Method | Signature | Description |
|--------|-----------|-------------|
| `startQuiz` | `() => Promise<void>` | Start quiz |
| `submitAnswer` | `(optionId: string) => void` | Submit answer |
| `nextQuestion` | `() => Promise<void>` | Load next question |
| `resetQuiz` | `() => void` | Reset quiz |

## Common Migration Patterns

### Pattern 1: Video Playback Component

```tsx
// BEFORE
interface Props {
  currentTime: number
  onTimeUpdate: (time: number) => void
  currentVideo: Video | null
}

function VideoPlayer({ currentTime, onTimeUpdate, currentVideo }: Props) {
  return (
    <div>
      <video onTimeUpdate={e => onTimeUpdate(e.currentTime)} />
      <span>{currentTime}s</span>
    </div>
  )
}

// AFTER
function VideoPlayer() {
  const { currentTime, handleTimeUpdate, currentVideo } = useVideoContext()

  return (
    <div>
      <video onTimeUpdate={e => handleTimeUpdate(e.currentTime)} />
      <span>{currentTime}s</span>
    </div>
  )
}
```

### Pattern 2: Chat Component

```tsx
// BEFORE
interface Props {
  messages: ChatMessage[]
  inputMessage: string
  onInputChange: (value: string) => void
  onSendMessage: () => void
}

function ChatInput({
  messages,
  inputMessage,
  onInputChange,
  onSendMessage,
}: Props) {
  return (
    <div>
      <input value={inputMessage} onChange={e => onInputChange(e.target.value)} />
      <button onClick={onSendMessage}>Send</button>
    </div>
  )
}

// AFTER
function ChatInput() {
  const {
    messages,
    inputMessage,
    setInputMessage,
    sendMessage,
  } = useChatContext()
  const { currentVideo } = useVideoContext()

  const handleSend = () => {
    sendMessage(
      currentVideo?.youtubeId,
      currentVideo?.title,
      currentVideo?.description
    )
  }

  return (
    <div>
      <input value={inputMessage} onChange={e => setInputMessage(e.target.value)} />
      <button onClick={handleSend}>Send</button>
    </div>
  )
}
```

### Pattern 3: Quiz Component

```tsx
// BEFORE
interface Props {
  quizState: UseQuizStateReturn
}

function QuizPanel({ quizState }: Props) {
  const { currentQuestion, submitAnswer, status } = quizState

  if (status === 'question' && currentQuestion) {
    return (
      <div>
        <h3>{currentQuestion.questionText}</h3>
        {currentQuestion.options.map(opt => (
          <button key={opt.id} onClick={() => submitAnswer(opt.id)}>
            {opt.text}
          </button>
        ))}
      </div>
    )
  }

  return null
}

// AFTER
function QuizPanel() {
  const { currentQuestion, submitAnswer, status } = useQuizContext()

  if (status === 'question' && currentQuestion) {
    return (
      <div>
        <h3>{currentQuestion.questionText}</h3>
        {currentQuestion.options.map(opt => (
          <button key={opt.id} onClick={() => submitAnswer(opt.id)}>
            {opt.text}
          </button>
        ))}
      </div>
    )
  }

  return null
}
```

### Pattern 4: Multiple Contexts

```tsx
// BEFORE
interface Props {
  currentTime: number          // VideoContext
  onTimestampClick: (t: number) => void  // VideoContext
  messages: ChatMessage[]      // ChatContext
}

function ChatMessage({ currentTime, onTimestampClick, messages }: Props) {
  // Logic
}

// AFTER
function ChatMessage() {
  const { currentTime, handleSeek } = useVideoContext()
  const { messages } = useChatContext()

  // Logic - same as before
}
```

## Checklist

Use this checklist for each component migration:

- [ ] Identify which contexts the component needs
- [ ] Import appropriate context hooks (`useVideoContext`, etc.)
- [ ] Remove props from component signature
- [ ] Replace prop usage with context values
- [ ] Update parent component to remove prop passing
- [ ] Test component renders correctly
- [ ] Test component interactions work
- [ ] Update component tests to use context providers
- [ ] Remove unused prop interfaces

## Testing After Migration

### 1. Update Test Setup

```tsx
// BEFORE
render(<VideoPlayer currentTime={120} onTimeUpdate={mockFn} />)

// AFTER
import { VideoProvider } from '@/contexts'

render(
  <VideoProvider initialVideo={mockVideo}>
    <VideoPlayer />
  </VideoProvider>
)
```

### 2. Use Custom Test Wrapper

```tsx
// test-utils.tsx
export function renderWithContexts(
  ui: ReactElement,
  options: { initialVideo?: Video; videoId?: string } = {}
) {
  return render(
    <CourseProvider
      initialVideo={options.initialVideo}
      videoId={options.videoId}
    >
      {ui}
    </CourseProvider>
  )
}

// In tests
renderWithContexts(<VideoPlayer />, { initialVideo: mockVideo })
```

### 3. Mock Context Values

```tsx
// Mock specific context
jest.mock('@/contexts', () => ({
  useVideoContext: () => ({
    currentTime: 120,
    handleSeek: mockSeek,
    currentVideo: mockVideo,
  }),
}))
```

## Common Issues & Solutions

### Issue 1: "useContext must be used within Provider"

**Error:**
```
Error: useVideoContext must be used within VideoProvider
```

**Solution:** Make sure component is wrapped by CourseProvider:

```tsx
// ✅ Correct
<CourseProvider>
  <YourComponent />
</CourseProvider>

// ❌ Wrong
<YourComponent />  // Not wrapped by provider
```

### Issue 2: Component Re-rendering Too Often

**Problem:** Component re-renders on every context update, even when its specific values haven't changed.

**Solution:** Destructure only the values you need:

```tsx
// ❌ Bad - re-renders on any context change
const videoContext = useVideoContext()

// ✅ Good - only re-renders when currentTime changes
const { currentTime } = useVideoContext()
```

### Issue 3: Callback Functions Not Stable

**Problem:** Callbacks passed to child components change on every render.

**Solution:** Context already uses `useCallback`, so you can safely pass callbacks directly:

```tsx
const { handleSeek } = useVideoContext()

// Safe to pass - handleSeek is memoized
<ChildComponent onSeek={handleSeek} />
```

### Issue 4: Tests Failing After Migration

**Problem:** Tests fail because component expects props but now uses contexts.

**Solution:** Update tests to provide contexts:

```tsx
// BEFORE
it('renders correctly', () => {
  render(<VideoPlayer currentTime={120} />)
})

// AFTER
it('renders correctly', () => {
  renderWithContexts(<VideoPlayer />, {
    initialVideo: { ...mockVideo, /* currentTime: 120 handled by context */ }
  })
})
```

## Next Steps

After migrating a component:

1. **Update Documentation:** Update component JSDoc to reflect context usage
2. **Remove Old Props:** Delete unused prop interfaces
3. **Simplify Parent:** Remove prop passing from parent components
4. **Test Thoroughly:** Run all tests and verify functionality
5. **Check Bundle Size:** Verify no increase in bundle size

## Example: Full Component Migration

### Before

```tsx
// VideoTimeline.tsx (BEFORE)
import { Video } from '@/types'

interface VideoTimelineProps {
  currentTime: number
  duration: number
  currentVideo: Video | null
  onSeek: (time: number) => void
  chapters?: Chapter[]
}

export function VideoTimeline({
  currentTime,
  duration,
  currentVideo,
  onSeek,
  chapters,
}: VideoTimelineProps) {
  const progress = (currentTime / duration) * 100

  return (
    <div className="timeline">
      <div className="progress-bar" style={{ width: `${progress}%` }} />
      <div className="chapters">
        {chapters?.map((ch, i) => (
          <button
            key={i}
            onClick={() => onSeek(ch.startTime)}
            className={currentTime >= ch.startTime ? 'active' : ''}
          >
            {ch.title}
          </button>
        ))}
      </div>
    </div>
  )
}
```

### After

```tsx
// VideoTimeline.tsx (AFTER)
import { useVideoContext } from '@/contexts'

export function VideoTimeline() {
  const {
    currentTime,
    videoDuration,
    currentVideo,
    handleSeek,
  } = useVideoContext()

  const progress = (currentTime / videoDuration) * 100
  const chapters = currentVideo?.chapters

  return (
    <div className="timeline">
      <div className="progress-bar" style={{ width: `${progress}%` }} />
      <div className="chapters">
        {chapters?.map((ch, i) => (
          <button
            key={i}
            onClick={() => handleSeek(ch.startTime)}
            className={currentTime >= ch.startTime ? 'active' : ''}
          >
            {ch.title}
          </button>
        ))}
      </div>
    </div>
  )
}
```

**Changes:**
- Removed 5 props from signature
- Imported `useVideoContext`
- No other logic changes
- Same functionality

## Resources

- [Context Architecture Overview](../architecture/CONTEXT_ARCHITECTURE.md)
- [Context API Reference](../../src/contexts/README.md)
- [Visual Diagrams](../architecture/CONTEXT_DIAGRAM.md)
- [TypeScript Types](../../src/types/index.ts)

---

**Questions?** Refer to the comprehensive README in `src/contexts/README.md` or check existing migrated components like `CoursePageClient.tsx` for examples.
