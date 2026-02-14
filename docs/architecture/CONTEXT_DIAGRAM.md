# Context Architecture Diagram

## Provider Hierarchy

```
CourseProvider
│
├─── VideoProvider
│    ├─ currentVideo
│    ├─ currentTime
│    ├─ videoDuration
│    ├─ currentChapter
│    ├─ liveTranscript
│    ├─ overallProgress
│    └─ handleSeek()
│
├─── ChatProvider
│    ├─ messages
│    ├─ inputMessage
│    ├─ isLoading
│    ├─ showSummary
│    ├─ summaryData
│    └─ sendMessage()
│
└─── QuizProvider
     ├─ currentQuestion
     ├─ status
     ├─ feedback
     ├─ sessionState
     ├─ startQuiz()
     └─ submitAnswer()
```

## Data Flow

### Before (Prop Drilling)

```
┌─────────────────────────────────────────┐
│         CoursePageClient                │
│  ┌────────────────────────────────────┐ │
│  │ State (20+ variables)              │ │
│  │ - currentTime                      │ │
│  │ - messages                         │ │
│  │ - quizState                        │ │
│  │ - inputMessage                     │ │
│  │ - ...                              │ │
│  └────────────────────────────────────┘ │
└─────────────────┬───────────────────────┘
                  │ Props (15+)
        ┌─────────┴─────────┐
        ↓                   ↓
┌──────────────┐    ┌──────────────┐
│ VideoSection │    │ ChatSidebar  │
│              │    │              │
│ Props (10+)  │    │ Props (10+)  │
└──────┬───────┘    └──────┬───────┘
       │ Props            │ Props
       ↓                  ↓
┌──────────────┐    ┌──────────────┐
│ VideoPlayer  │    │ ChatInput    │
│              │    │              │
│ Props (8+)   │    │ Props (8+)   │
└──────────────┘    └──────────────┘
```

### After (Context-Based)

```
┌─────────────────────────────────────────┐
│         CoursePageClient                │
│                                         │
│  ┌────────────────────────────────────┐│
│  │       CourseProvider               ││
│  │                                    ││
│  │  ┌──────────────┐                 ││
│  │  │VideoContext  │                 ││
│  │  │- currentTime │                 ││
│  │  │- handleSeek()│                 ││
│  │  └──────────────┘                 ││
│  │                                    ││
│  │  ┌──────────────┐                 ││
│  │  │ChatContext   │                 ││
│  │  │- messages    │                 ││
│  │  │- sendMsg()   │                 ││
│  │  └──────────────┘                 ││
│  │                                    ││
│  │  ┌──────────────┐                 ││
│  │  │QuizContext   │                 ││
│  │  │- status      │                 ││
│  │  │- startQuiz() │                 ││
│  │  └──────────────┘                 ││
│  └────────────────────────────────────┘│
└─────────────────────────────────────────┘
        │ No props needed!
        │
┌───────┴─────────────────────────┐
│                                 │
▼                                 ▼
┌──────────────┐          ┌──────────────┐
│ VideoSection │          │ ChatSidebar  │
│              │          │              │
│ No props!    │          │ No props!    │
└──────┬───────┘          └──────┬───────┘
       │                         │
       │ useVideoContext()       │ useChatContext()
       │                         │
       ▼                         ▼
┌──────────────┐          ┌──────────────┐
│ VideoPlayer  │          │ ChatInput    │
│              │          │              │
│ Context API  │          │ Context API  │
└──────────────┘          └──────────────┘
```

## Context Composition

### Component Tree with Contexts

```
┌─────────────────────────────────────────────────────────┐
│                    CourseProvider                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │              VideoProvider                        │ │
│  │  ┌─────────────────────────────────────────────┐ │ │
│  │  │           ChatProvider                      │ │ │
│  │  │  ┌───────────────────────────────────────┐ │ │ │
│  │  │  │        QuizProvider                   │ │ │ │
│  │  │  │  ┌─────────────────────────────────┐ │ │ │ │
│  │  │  │  │    CoursePageContent            │ │ │ │ │
│  │  │  │  │                                 │ │ │ │ │
│  │  │  │  │  ┌─────────────┐               │ │ │ │ │
│  │  │  │  │  │ VideoSection│               │ │ │ │ │
│  │  │  │  │  │  - Player   │ ←─────────────┼─┼─┼─┼─┼─ useVideoContext()
│  │  │  │  │  │  - Timeline │               │ │ │ │ │
│  │  │  │  │  └─────────────┘               │ │ │ │ │
│  │  │  │  │                                 │ │ │ │ │
│  │  │  │  │  ┌─────────────┐               │ │ │ │ │
│  │  │  │  │  │ ChatSidebar │               │ │ │ │ │
│  │  │  │  │  │  - Messages │ ←─────────────┼─┼─┼─┼─┼─ useChatContext()
│  │  │  │  │  │  - Input    │               │ │ │ │ │
│  │  │  │  │  └─────────────┘               │ │ │ │ │
│  │  │  │  │                                 │ │ │ │ │
│  │  │  │  │  ┌─────────────┐               │ │ │ │ │
│  │  │  │  │  │ QuizPanel   │               │ │ │ │ │
│  │  │  │  │  │  - Question │ ←─────────────┼─┼─┼─┼─┼─ useQuizContext()
│  │  │  │  │  │  - Options  │               │ │ │ │ │
│  │  │  │  │  └─────────────┘               │ │ │ │ │
│  │  │  │  │                                 │ │ │ │ │
│  │  │  │  └─────────────────────────────────┘ │ │ │ │
│  │  │  └───────────────────────────────────────┘ │ │ │
│  │  └─────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## State Access Pattern

### Consuming Contexts

```typescript
// Any component can access contexts directly

function VideoPlayer() {
  const { currentTime, handleSeek } = useVideoContext()
  // Use state directly
}

function ChatInput() {
  const { inputMessage, setInputMessage, sendMessage } = useChatContext()
  // Use state directly
}

function QuizQuestion() {
  const { currentQuestion, submitAnswer } = useQuizContext()
  // Use state directly
}
```

## Context Interactions

### Cross-Context Communication

```
VideoContext
    ↓ currentVideo.youtubeId
ChatContext
    → sendMessage(videoId, title, desc)

VideoContext
    ↓ handleSeek(time)
    ← User clicks timestamp in chat
ChatContext
```

### Example Flow: User Clicks Timestamp

```
1. User clicks timestamp in ChatMessage
   ↓
2. ChatMessage calls onTimestampClick(120)
   ↓
3. CoursePageContent receives callback
   ↓
4. Calls videoContext.handleSeek(120)
   ↓
5. VideoContext updates seekToTime state
   ↓
6. VideoPlayer receives new seekToTime from context
   ↓
7. VideoPlayer seeks to 2:00 in video
```

## Benefits Visualization

### Code Reduction

```
BEFORE:
┌─────────────────────────────┐
│  CoursePageClient           │
│  586 lines                  │
│  ███████████████████████    │
└─────────────────────────────┘

AFTER:
┌─────────────────────────────┐
│  CoursePageClient           │
│  ~200 lines                 │
│  ████████                   │
└─────────────────────────────┘

Reduction: 66% fewer lines
```

### Prop Passing Reduction

```
BEFORE:
Component A → Component B (15 props) → Component C (10 props) → Component D (8 props)

AFTER:
Component A → Component B (0 props) → Component C (0 props) → Component D (useContext)

Reduction: 80% fewer props
```

## Performance Optimization

### Selective Re-rendering

```
VideoContext updates currentTime
    ↓
Only components using currentTime re-render
    ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ VideoPlayer  │  │ TimeDisplay  │  │ ChatSidebar  │
│ ✅ Re-render │  │ ✅ Re-render │  │ ❌ No render │
└──────────────┘  └──────────────┘  └──────────────┘
    Uses              Uses              Doesn't use
    currentTime       currentTime       currentTime
```

### Memoization Strategy

```typescript
// Context provider memoizes value
const value = useMemo(
  () => ({
    currentTime,    // Changes frequently
    handleSeek,     // Stable reference (useCallback)
    currentVideo,   // Changes rarely
  }),
  [currentTime, handleSeek, currentVideo]
)

// Only re-renders when dependencies actually change
```

## Testing Architecture

### Test Wrapper Pattern

```
┌─────────────────────────────┐
│      Test Suite             │
│  ┌─────────────────────┐    │
│  │  renderWithContexts │    │
│  │                     │    │
│  │  ┌───────────────┐ │    │
│  │  │CourseProvider │ │    │
│  │  │  ┌─────────┐  │ │    │
│  │  │  │Component│  │ │    │
│  │  │  │ to test │  │ │    │
│  │  │  └─────────┘  │ │    │
│  │  └───────────────┘ │    │
│  └─────────────────────┘    │
└─────────────────────────────┘

// Mock contexts easily
renderWithContexts(<VideoPlayer />, {
  initialVideo: mockVideo
})
```

## Summary

The context architecture provides:

1. **Separation of Concerns:** Each context manages one domain
2. **No Prop Drilling:** Components access state directly
3. **Type Safety:** Full TypeScript support throughout
4. **Performance:** Optimized with memoization
5. **Testability:** Easy to mock and test
6. **Maintainability:** Clear, documented APIs

---

For detailed usage examples, see:
- [Context README](../../src/contexts/README.md)
- [Implementation Summary](./CONTEXT_ARCHITECTURE.md)
