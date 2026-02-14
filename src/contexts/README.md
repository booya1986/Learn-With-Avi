# Course Contexts

Context-based state management for the LearnWithAvi course page. This system eliminates prop drilling and creates a cleaner component API.

## Overview

The course page uses **React Context API** to share state across all components without passing props through multiple levels. This makes components more maintainable, testable, and easier to refactor.

## Architecture

```
CourseProvider (combines all contexts)
├── VideoProvider - Video playback, progress, chapters
├── ChatProvider - AI chat messages and summaries
└── QuizProvider - Adaptive quiz state
```

## Installation

Import contexts from a single entry point:

```tsx
import { CourseProvider, useVideoContext, useChatContext, useQuizContext } from '@/contexts'
```

## Usage

### 1. Wrap Your Page with CourseProvider

```tsx
// src/app/[locale]/course/[courseId]/CoursePageClient.tsx
export default function CoursePageClient({ course, courseId }: Props) {
  return (
    <CourseProvider
      initialVideo={course.videos[0]}
      videoId={course.videos[0]?.youtubeId}
    >
      <CoursePageContent course={course} courseId={courseId} />
    </CourseProvider>
  )
}
```

### 2. Access Contexts in Child Components

Components can now access state directly without props:

```tsx
function VideoPlayer() {
  const { currentTime, handleSeek } = useVideoContext()

  return (
    <div>
      <p>Current time: {currentTime}s</p>
      <button onClick={() => handleSeek(120)}>Jump to 2:00</button>
    </div>
  )
}
```

## Contexts

### VideoContext

Manages video playback state, progress tracking, and chapter navigation.

**State:**
- `currentVideo: Video | null` - Currently playing video
- `currentTime: number` - Current playback time in seconds
- `actualDuration: number` - Video duration from YouTube
- `seekToTime: number | undefined` - Target seek time
- `currentChapter: Chapter | undefined` - Active chapter
- `currentStageIndex: number` - Current stage (1-based)
- `watchedVideos: Set<string>` - IDs of watched videos
- `chapterWatchedTime: Record<number, number>` - Watched seconds per chapter
- `videoDuration: number` - Duration (actual or fallback)
- `overallProgress: number` - Progress percentage (0-100)
- `liveTranscript: TranscriptChunk[]` - Current transcript chunks

**Actions:**
- `handleTimeUpdate(time: number)` - Update playback time
- `handleDurationChange(duration: number)` - Update video duration
- `handleSeek(time: number)` - Seek to specific time
- `setCurrentVideo(video: Video | null)` - Change video and reset state

**Example:**
```tsx
function ChapterList() {
  const { currentChapter, handleSeek } = useVideoContext()

  return (
    <div>
      {chapters.map(ch => (
        <button
          key={ch.title}
          onClick={() => handleSeek(ch.startTime)}
          className={ch === currentChapter ? 'active' : ''}
        >
          {ch.title}
        </button>
      ))}
    </div>
  )
}
```

### ChatContext

Manages AI chat messages, streaming responses, and summary generation.

**State:**
- `messages: ChatMessage[]` - Chat message history
- `inputMessage: string` - Current input value
- `isLoading: boolean` - API request in progress
- `isListening: boolean` - Voice input active
- `showSummary: boolean` - Summary modal visible
- `isGeneratingSummary: boolean` - Summary generation in progress
- `generatedSummaryData: SummaryData | null` - Generated summary

**Actions:**
- `setInputMessage(message: string)` - Update input value
- `sendMessage(videoId, title, description)` - Send message to Claude API
- `toggleVoiceInput()` - Toggle voice input on/off
- `handleKeyPress(e: KeyboardEvent)` - Handle Enter key
- `generateSummary(videoId, title, description)` - Generate AI summary
- `setShowSummary(show: boolean)` - Show/hide summary modal

**Example:**
```tsx
function ChatInput() {
  const { inputMessage, setInputMessage, sendMessage, isLoading } = useChatContext()
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
      <input
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
      />
      <button onClick={handleSend} disabled={isLoading}>
        Send
      </button>
    </div>
  )
}
```

### QuizContext

Manages adaptive quiz state with Bloom's Taxonomy progression.

**State:**
- `status: QuizStatus` - Current quiz status (idle, loading, question, feedback, complete)
- `currentQuestion: QuizQuestion | null` - Active question
- `feedback: QuizFeedbackData | null` - Answer feedback
- `sessionState: QuizSessionState | null` - Session data
- `isLoading: boolean` - Question generation in progress
- `error: string | null` - Error message

**Actions:**
- `startQuiz()` - Start new quiz or restore session
- `submitAnswer(optionId: string)` - Submit answer
- `nextQuestion()` - Load next question
- `resetQuiz()` - Reset to idle state

**Example:**
```tsx
function QuizPanel() {
  const { currentQuestion, submitAnswer, status, feedback } = useQuizContext()

  if (status === 'idle') {
    return <button onClick={startQuiz}>Start Quiz</button>
  }

  if (status === 'question' && currentQuestion) {
    return (
      <div>
        <h3>{currentQuestion.questionText}</h3>
        {currentQuestion.options.map(opt => (
          <button
            key={opt.id}
            onClick={() => submitAnswer(opt.id)}
          >
            {opt.text}
          </button>
        ))}
      </div>
    )
  }

  if (status === 'feedback' && feedback) {
    return (
      <div>
        <p>{feedback.isCorrect ? 'Correct!' : 'Incorrect'}</p>
        <p>{feedback.explanation}</p>
        <button onClick={nextQuestion}>Next</button>
      </div>
    )
  }

  return null
}
```

## Benefits

### Before (Prop Drilling)

```tsx
// CoursePageClient.tsx - 586 lines
function CoursePageClient() {
  const [currentTime, setCurrentTime] = useState(0)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  // ... 20+ state variables

  return (
    <div>
      <VideoSection
        currentTime={currentTime}
        onTimeUpdate={setCurrentTime}
        messages={messages}
        inputMessage={inputMessage}
        onInputChange={setInputMessage}
        // ... 15+ props
      />
      <ChatSidebar
        messages={messages}
        inputMessage={inputMessage}
        onInputChange={setInputMessage}
        // ... 10+ props
      />
    </div>
  )
}
```

### After (Context-Based)

```tsx
// CoursePageClient.tsx - ~200 lines
export default function CoursePageClient({ course }) {
  return (
    <CourseProvider initialVideo={course.videos[0]}>
      <div>
        <VideoSection />  {/* No props! */}
        <ChatSidebar />   {/* No props! */}
      </div>
    </CourseProvider>
  )
}

// VideoSection.tsx
function VideoSection() {
  const { currentTime, handleTimeUpdate } = useVideoContext()
  // Direct access to needed state
}
```

**Improvements:**
- 80% less prop passing
- Cleaner component signatures
- Better testability (mock contexts)
- Easier refactoring
- More maintainable code

## Testing

### Mocking Contexts in Tests

```tsx
import { VideoProvider } from '@/contexts'

describe('VideoPlayer', () => {
  it('seeks to chapter start time', () => {
    const mockSeek = jest.fn()

    render(
      <VideoProvider initialVideo={mockVideo}>
        <VideoPlayer />
      </VideoProvider>
    )

    // Component can access context
  })
})
```

### Custom Test Wrapper

```tsx
// test-utils.tsx
export function renderWithContexts(
  ui: ReactElement,
  { initialVideo, videoId, ...options }: Options = {}
) {
  return render(
    <CourseProvider initialVideo={initialVideo} videoId={videoId}>
      {ui}
    </CourseProvider>,
    options
  )
}

// Usage
renderWithContexts(<VideoPlayer />, { initialVideo: mockVideo })
```

## Performance

### Memoization

All context values are memoized with `useMemo` to prevent unnecessary re-renders:

```tsx
const value = useMemo(
  () => ({
    currentTime,
    handleSeek,
    // ... other values
  }),
  [currentTime, handleSeek] // Only re-compute when dependencies change
)
```

### Selective Subscriptions

Components only re-render when the specific context values they use change:

```tsx
function TimeDisplay() {
  const { currentTime } = useVideoContext()
  // Only re-renders when currentTime changes
  return <span>{currentTime}s</span>
}

function VideoTitle() {
  const { currentVideo } = useVideoContext()
  // Only re-renders when currentVideo changes
  return <h1>{currentVideo?.title}</h1>
}
```

## Migration Guide

### Step 1: Identify Prop Drilling

Look for props passed through 3+ component levels:

```tsx
// Bad - prop drilling
<Parent>
  <Middle seekTime={seekTime} onSeek={onSeek}>
    <Child seekTime={seekTime} onSeek={onSeek}>
      <GrandChild seekTime={seekTime} onSeek={onSeek} />
    </Child>
  </Middle>
</Parent>
```

### Step 2: Move to Context

```tsx
// Good - context
<CourseProvider>
  <Parent>
    <Middle>
      <Child>
        <GrandChild />  {/* Access via useVideoContext() */}
      </Child>
    </Middle>
  </Parent>
</CourseProvider>
```

### Step 3: Update Components

```tsx
// Before
interface Props {
  seekTime: number
  onSeek: (time: number) => void
}

function Component({ seekTime, onSeek }: Props) {
  return <button onClick={() => onSeek(120)}>Jump</button>
}

// After
function Component() {
  const { seekToTime, handleSeek } = useVideoContext()
  return <button onClick={() => handleSeek(120)}>Jump</button>
}
```

## Best Practices

### 1. Use Contexts for Cross-Cutting Concerns

**Good for:**
- Video playback state (shared by player, timeline, chapters)
- Chat messages (shared by sidebar, modal, notifications)
- Quiz state (shared by panel, progress bar, results)

**Not good for:**
- Local UI state (modal open/closed)
- Form inputs (use local state)
- Temporary flags

### 2. Keep Contexts Focused

Each context should have a single responsibility:
- VideoContext = video only
- ChatContext = chat only
- QuizContext = quiz only

Don't create a single "mega context" with everything.

### 3. Provide Clear APIs

Export clear hook names:
```tsx
export function useVideoContext() // ✅ Clear
export function useVideo()        // ❌ Ambiguous
```

### 4. Document Context Values

Add JSDoc comments to context value types:

```tsx
export interface VideoContextValue {
  /** Current playback time in seconds */
  currentTime: number

  /** Seek to specific time in video */
  handleSeek: (time: number) => void
}
```

### 5. Handle Errors Gracefully

Always validate context exists:

```tsx
export function useVideoContext() {
  const context = useContext(VideoContext)
  if (!context) {
    throw new Error('useVideoContext must be used within VideoProvider')
  }
  return context
}
```

## Troubleshooting

### "Cannot read property of undefined"

**Problem:** Component using context is not wrapped by provider.

**Solution:**
```tsx
// Make sure component is inside provider
<CourseProvider>
  <YourComponent />  {/* ✅ Can use contexts */}
</CourseProvider>

<YourComponent />  {/* ❌ Cannot use contexts */}
```

### Infinite Re-renders

**Problem:** Context value not memoized, causing all consumers to re-render constantly.

**Solution:**
```tsx
// Bad
return <VideoContext.Provider value={{ currentTime, handleSeek }}>

// Good
const value = useMemo(
  () => ({ currentTime, handleSeek }),
  [currentTime, handleSeek]
)
return <VideoContext.Provider value={value}>
```

### Stale Closures

**Problem:** Event handlers capture old state values.

**Solution:** Use `useCallback` with proper dependencies:

```tsx
const handleSeek = useCallback((time: number) => {
  setSeekToTime(time)
  // Any other state used here must be in dependencies
}, [/* dependencies */])
```

## File Structure

```
src/contexts/
├── index.ts               # Centralized exports
├── VideoContext.tsx       # Video playback context (206 lines)
├── ChatContext.tsx        # Chat and summary context (280 lines)
├── QuizContext.tsx        # Quiz state context (64 lines)
├── CourseProvider.tsx     # Combined provider (58 lines)
└── README.md              # This file
```

## Related Documentation

- [Component Architecture](../components/CLAUDE.md)
- [Custom Hooks](../hooks/README.md)
- [TypeScript Types](../types/index.ts)
- [Course Page Implementation](../app/[locale]/course/[courseId]/CoursePageClient.tsx)

## License

MIT - Part of LearnWithAvi platform
