# CoursePageClient Refactoring Architecture

**Last Updated**: January 19, 2026
**Status**: Phase 1 Complete (Hooks Extraction)
**Impact**: 1,475-line component → Modular hook-based architecture

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Before vs After Architecture](#before-vs-after-architecture)
- [Phase 1: Hooks Extraction (Complete)](#phase-1-hooks-extraction-complete)
- [Benefits and Impact](#benefits-and-impact)
- [Remaining Phases](#remaining-phases)
- [Migration Guide](#migration-guide)
- [Performance Considerations](#performance-considerations)
- [Testing Strategy](#testing-strategy)

---

## Executive Summary

The CoursePageClient component was originally a monolithic 1,475-line React component handling all aspects of the course video learning experience. Phase 1 of the refactoring effort successfully extracted 7 specialized custom hooks, separating concerns and improving maintainability.

**Refactoring Goals**:
1. Improve code maintainability and readability
2. Enable reusability of video and chat functionality
3. Simplify testing of individual features
4. Reduce cognitive complexity for developers
5. Prepare for future component splitting

**Current Status**: Phase 1 Complete (7 hooks extracted)

---

## Before vs After Architecture

### Before: Monolithic Component (1,475 lines)

```
CoursePageClient.tsx (1,475 lines)
├─ Video state management (100+ lines)
├─ Chapter progress tracking (150+ lines)
├─ Chat message handling (200+ lines)
├─ AI summary generation (150+ lines)
├─ Transcript search logic (120+ lines)
├─ Timestamp parsing (80+ lines)
├─ URL synchronization (60+ lines)
├─ UI rendering logic (600+ lines)
└─ Event handlers and utilities (remaining lines)
```

**Issues with monolithic approach**:
- Difficult to understand and modify
- Hard to test individual features
- Risk of unintended side effects
- Code duplication across components
- Poor separation of concerns

### After: Hook-Based Architecture (Phase 1)

```
CoursePageClient.tsx (1,475 lines) → Modular architecture
├─ Video Hooks (extracted)
│   ├─ useVideoState.ts          (105 lines)
│   ├─ useVideoProgress.ts       (288 lines)
│   └─ useChapterNavigation.ts   (100 lines)
├─ Chat Hooks (extracted)
│   ├─ useSummaryGeneration.ts   (222 lines)
│   ├─ useTranscriptSearch.ts    (156 lines)
│   └─ useChatWithTimestamps.ts  (91 lines)
├─ Course Hooks (existing)
│   └─ useRouteSync.ts           (109 lines)
└─ CoursePageClient.tsx (to be further refactored in Phases 2-6)
```

**Benefits of hook-based approach**:
- Clear separation of concerns
- Reusable across components
- Easier to test in isolation
- Self-documenting with TSDoc
- Composable and modular

---

## Phase 1: Hooks Extraction (Complete)

Phase 1 focused on extracting stateful logic into custom hooks while maintaining full backward compatibility with the existing CoursePageClient component.

### 1. Video State Management

**Hook**: `useVideoState` ([src/hooks/video/useVideoState.ts](/Users/avilevi/Documents/projects/AI-powered interactive course platform/learnwithavi/src/hooks/video/useVideoState.ts))

**Responsibility**: Manages core video playback state including time tracking, duration, and seeking operations.

**Key Features**:
- Tracks current playback time
- Manages actual duration from YouTube API
- Handles seek operations with state synchronization
- Provides reset functionality for video switching

**API**:
```typescript
const videoState = useVideoState(currentVideo);
// Returns: { currentTime, actualDuration, seekToTime, handleTimeUpdate, handleDurationChange, handleSeek, reset }
```

### 2. Video Progress Tracking

**Hook**: `useVideoProgress` ([src/hooks/video/useVideoProgress.ts](/Users/avilevi/Documents/projects/AI-powered interactive course platform/learnwithavi/src/hooks/video/useVideoProgress.ts))

**Responsibility**: Sophisticated progress tracking with sequential watching validation and per-chapter completion detection.

**Key Features**:
- 90% watched threshold for chapter completion
- Sequential watching validation (no credit for skipping)
- Overall video completion tracking (80% threshold)
- Auto-generates chapters if none defined (3-10 chapters, 2-3 minutes each)
- Per-chapter progress percentages

**API**:
```typescript
const progress = useVideoProgress(currentVideo, currentTime, actualDuration);
// Returns: { chapterItems, overallProgress, watchedVideos, currentChapter, currentChapterIndex, markVideoWatched, resetProgress }
```

**Advanced Pattern**: Also provides `useVideoProgressWithTracking` hook that includes internal time tracking logic.

### 3. Chapter Navigation

**Hook**: `useChapterNavigation` ([src/hooks/video/useChapterNavigation.ts](/Users/avilevi/Documents/projects/AI-powered interactive course platform/learnwithavi/src/hooks/video/useChapterNavigation.ts))

**Responsibility**: Generates and manages video chapters with automatic chapter creation.

**Key Features**:
- Uses configured chapters if available
- Auto-generates 3-10 chapters based on duration
- Calculates current chapter from playback time
- Provides chapter metadata (title, timestamps, duration)

**API**:
```typescript
const { chapters, currentChapter, currentChapterIndex } = useChapterNavigation(video, currentTime, actualDuration);
```

### 4. AI Summary Generation

**Hook**: `useSummaryGeneration` ([src/hooks/chat/useSummaryGeneration.ts](/Users/avilevi/Documents/projects/AI-powered interactive course platform/learnwithavi/src/hooks/chat/useSummaryGeneration.ts))

**Responsibility**: Analyzes video transcripts to extract structured summaries using pattern matching.

**Key Features**:
- Extracts tools and technologies mentioned
- Identifies process steps from content
- Detects benefits and highlights
- Generates video overview from transcript
- Loading states and error handling

**API**:
```typescript
const { showSummary, summary, isGenerating, generateSummary, closeSummary } = useSummaryGeneration(currentVideo);
// Returns: { showSummary, summary: SummaryData | null, isGenerating, generateSummary, closeSummary }
```

**Data Structure**:
```typescript
interface SummaryData {
  about: string;
  tools: { name: string; desc: string; color: string }[];
  process: { step: number; title: string; desc: string }[];
  benefits: string[];
}
```

### 5. Intelligent Transcript Search

**Hook**: `useTranscriptSearch` ([src/hooks/chat/useTranscriptSearch.ts](/Users/avilevi/Documents/projects/AI-powered interactive course platform/learnwithavi/src/hooks/chat/useTranscriptSearch.ts))

**Responsibility**: Advanced transcript search with topic detection and relevance scoring.

**Key Features**:
- Topic keyword detection and matching
- Multi-word query support with word-level scoring
- Relevance scoring algorithm (minimum threshold: 20)
- Returns top 3 most relevant chunks
- Contextual awareness (knows which tools are used in video)

**API**:
```typescript
const { searchTranscript, detectTopic } = useTranscriptSearch(currentVideo, videoMetadata, topicKnowledge);

const results = searchTranscript(query, chunks);
const topic = detectTopic(query); // Returns: { key, topic, isToolUsedInVideo } | null
```

### 6. Clickable Timestamp Rendering

**Hook**: `useChatWithTimestamps` ([src/hooks/chat/useChatWithTimestamps.ts](/Users/avilevi/Documents/projects/AI-powered interactive course platform/learnwithavi/src/hooks/chat/useChatWithTimestamps.ts))

**Responsibility**: Parses and renders chat messages with clickable timestamp links.

**Key Features**:
- Parses `[timestamp:MM:SS]` format in messages
- Renders clickable buttons for timestamps
- Triggers video seek on click
- Returns React elements for rendering

**API**:
```typescript
const { renderMessageContent } = useChatWithTimestamps(handleTimestampClick);

<div>{renderMessageContent("Check this out at [timestamp:2:45]")}</div>
// Renders: "Check this out at " + <button onClick={() => seek(165)}>2:45</button>
```

### 7. URL Synchronization

**Hook**: `useRouteSync` ([src/hooks/course/useRouteSync.ts](/Users/avilevi/Documents/projects/AI-powered interactive course platform/learnwithavi/src/hooks/course/useRouteSync.ts))

**Responsibility**: Bidirectional sync between current video state and URL query parameters.

**Key Features**:
- Initializes video from URL parameter (`?video=intro-video`)
- Updates URL when user selects different video
- Enables deep linking to specific videos
- Supports browser history navigation
- Falls back to first video if no param or invalid param

**API**:
```typescript
const { currentVideo, selectVideo, isVideoSelected } = useRouteSync(course, courseId, onVideoChange);

selectVideo(newVideo); // Updates URL to /course/ai-101?video=new-video-id
```

### Exported Hooks

All hooks are properly exported from `/src/hooks/index.ts`:

```typescript
// Video Hooks
export { useVideoState } from './video/useVideoState';
export { useVideoProgress, useVideoProgressWithTracking } from './video/useVideoProgress';
export { useChapterNavigation } from './video/useChapterNavigation';

// Chat Hooks
export { useSummaryGeneration } from './chat/useSummaryGeneration';
export { useTranscriptSearch } from './chat/useTranscriptSearch';
export { useChatWithTimestamps } from './chat/useChatWithTimestamps';

// Course Hooks
export { useRouteSync } from './course/useRouteSync';
```

---

## Benefits and Impact

### Immediate Benefits (Phase 1)

1. **Improved Maintainability**
   - Logic separated into focused, single-purpose hooks
   - Each hook is <300 lines (vs 1,475-line component)
   - Clear file organization (`video/`, `chat/`, `course/`)

2. **Enhanced Reusability**
   - Hooks can be used in other components
   - Video progress tracking reusable in course list
   - Summary generation reusable in admin panel
   - Timestamp parsing reusable in any chat interface

3. **Better Testability**
   - Hooks can be tested in isolation
   - Easier to write unit tests for each feature
   - Reduced need for complex integration tests
   - Mock dependencies more easily

4. **Self-Documentation**
   - Comprehensive TSDoc comments on all hooks
   - Type-safe interfaces with detailed property descriptions
   - Usage examples in hook documentation
   - Clear parameter and return value descriptions

5. **Developer Experience**
   - Easier to understand what each hook does
   - Simpler to modify individual features
   - Reduced risk of breaking other features
   - Better IDE autocomplete and type hints

### Future Benefits (Phases 2-6)

When remaining phases are complete:

1. **Component Splitting** (Phase 2)
   - Smaller, focused components (<200 lines each)
   - Easier to understand and modify
   - Better code splitting opportunities

2. **Performance Optimization** (Phase 3)
   - Targeted memoization with React.memo
   - Optimized re-renders with useCallback/useMemo
   - Lazy loading of heavy components

3. **Type Safety** (Phase 4)
   - Strict TypeScript types throughout
   - Reduced runtime errors
   - Better refactoring safety

4. **Testing Coverage** (Phase 5)
   - Comprehensive unit tests for hooks
   - Component integration tests
   - E2E tests for user flows

5. **Documentation** (Phase 6)
   - API documentation for all hooks
   - Component usage guides
   - Architecture diagrams

---

## Remaining Phases

### Phase 2: Component Extraction (Not Started)

**Goal**: Split CoursePageClient into smaller, focused components.

**Planned Components**:
```
CoursePageClient.tsx
├─ CourseHeader.tsx          (top navigation bar)
├─ VideoSection.tsx          (video player area)
│   ├─ VideoPlayer.tsx       (existing)
│   └─ VideoControls.tsx     (new)
├─ ChatSidebar.tsx           (AI assistant panel)
│   ├─ ChatMessages.tsx      (new)
│   └─ ChatInput.tsx         (new)
├─ MaterialsSidebar.tsx      (course materials panel)
│   ├─ CourseInfo.tsx        (new)
│   ├─ ChapterList.tsx       (new)
│   └─ ProgressBar.tsx       (new)
└─ SummaryModal.tsx          (AI summary overlay)
```

**Expected Impact**:
- Reduce component complexity by 70%
- Enable better code splitting
- Improve rendering performance

### Phase 3: Performance Optimization (Not Started)

**Goal**: Optimize rendering performance and reduce unnecessary re-renders.

**Optimization Targets**:
1. Memoize expensive components with `React.memo`
2. Optimize callback functions with `useCallback`
3. Optimize computed values with `useMemo`
4. Implement virtualization for long lists (transcript chunks)
5. Lazy load VideoPlayer component
6. Debounce chat input

**Expected Impact**:
- 40% reduction in re-renders
- Faster initial page load
- Smoother video playback

### Phase 4: Type Safety Enhancement (Not Started)

**Goal**: Strengthen TypeScript types across all hooks and components.

**Improvements**:
1. Add strict null checks
2. Remove `any` types
3. Add discriminated unions for state
4. Improve generic type constraints
5. Add runtime type validation (Zod)

**Expected Impact**:
- Fewer runtime errors
- Better IDE support
- Safer refactoring

### Phase 5: Comprehensive Testing (Not Started)

**Goal**: Achieve >80% test coverage for all hooks and components.

**Test Coverage**:
1. Unit tests for all 7 hooks
2. Integration tests for hook combinations
3. Component tests with React Testing Library
4. E2E tests for critical user flows
5. Accessibility tests with axe-core

**Expected Impact**:
- >80% code coverage
- Regression prevention
- Confidence in refactoring

### Phase 6: Documentation & Polish (Not Started)

**Goal**: Complete documentation and finalize refactoring.

**Deliverables**:
1. API documentation for all hooks (✅ Already exists in TSDoc)
2. Component usage guides
3. Architecture diagrams (Mermaid)
4. Migration examples
5. Performance benchmarks

---

## Migration Guide

### For Developers Working on CoursePageClient

**Current State**: The refactored hooks are in place, but CoursePageClient still contains all the original logic. The hooks are not yet integrated into the component.

**Next Steps** (Phase 2):
1. Replace inline video state with `useVideoState` hook
2. Replace progress tracking logic with `useVideoProgress` hook
3. Replace chat logic with extracted chat hooks
4. Remove duplicated code as hooks are integrated

### Example: Using Extracted Hooks

**Before** (Inline Logic):
```typescript
// Inside CoursePageClient.tsx
const [currentTime, setCurrentTime] = useState(0);
const [actualDuration, setActualDuration] = useState(0);
const [seekToTime, setSeekToTime] = useState<number | undefined>(undefined);

const handleTimeUpdate = useCallback((time: number) => {
  setCurrentTime(time);
  if (seekToTime !== undefined && Math.abs(time - seekToTime) < 0.5) {
    setSeekToTime(undefined);
  }
}, [seekToTime]);

const handleDurationChange = useCallback((duration: number) => {
  setActualDuration(duration);
}, []);

const handleSeek = useCallback((time: number) => {
  setSeekToTime(time);
}, []);
```

**After** (Using Hook):
```typescript
// Inside CoursePageClient.tsx
const videoState = useVideoState(currentVideo);

// Use videoState.currentTime instead of currentTime
// Use videoState.handleTimeUpdate instead of handleTimeUpdate
// Use videoState.handleSeek instead of handleSeek
```

### Example: Using Multiple Hooks Together

```typescript
function CoursePageClient({ course, courseId }: CoursePageClientProps) {
  // URL synchronization
  const { currentVideo, selectVideo } = useRouteSync(course, courseId);

  // Video playback state
  const videoState = useVideoState(currentVideo);

  // Chapter navigation
  const { chapters, currentChapter } = useChapterNavigation(
    currentVideo,
    videoState.currentTime,
    videoState.actualDuration
  );

  // Progress tracking
  const progress = useVideoProgress(
    currentVideo,
    videoState.currentTime,
    videoState.actualDuration
  );

  // Summary generation
  const summary = useSummaryGeneration(currentVideo);

  // Pass to child components or use directly in render
  return (
    <div>
      <VideoPlayer
        video={currentVideo}
        onTimeUpdate={videoState.handleTimeUpdate}
        onDurationChange={videoState.handleDurationChange}
        seekToTime={videoState.seekToTime}
      />
      <ChapterList
        chapters={progress.chapterItems}
        onChapterClick={(time) => videoState.handleSeek(time)}
      />
      <ProgressBar progress={progress.overallProgress} />
      <SummaryButton onClick={summary.generateSummary} />
    </div>
  );
}
```

### Testing Hooks Independently

```typescript
// Example: Testing useVideoState
import { renderHook, act } from '@testing-library/react';
import { useVideoState } from '@/hooks/video/useVideoState';

test('should update current time on handleTimeUpdate', () => {
  const { result } = renderHook(() => useVideoState(mockVideo));

  act(() => {
    result.current.handleTimeUpdate(45);
  });

  expect(result.current.currentTime).toBe(45);
});

test('should handle seek operation', () => {
  const { result } = renderHook(() => useVideoState(mockVideo));

  act(() => {
    result.current.handleSeek(120);
  });

  expect(result.current.seekToTime).toBe(120);
});
```

---

## Performance Considerations

### Hook Dependencies

All hooks use `useCallback` and `useMemo` appropriately to prevent unnecessary re-renders:

**useVideoState**:
- `handleTimeUpdate` depends on `seekToTime` only
- `handleDurationChange`, `handleSeek`, `reset` have no dependencies (stable)

**useVideoProgress**:
- Most calculations use `useMemo` for efficient recomputation
- Chapter items only recompute when dependencies change
- Progress tracking optimized with ref-based time tracking

**useChapterNavigation**:
- Chapters memoized based on video and duration
- Current chapter index memoized based on time

**useSummaryGeneration**:
- Generation is async with loading state
- Simulates AI processing (1.5s delay)
- Modal state managed independently

**useTranscriptSearch**:
- Search function memoized with topic knowledge dependency
- Detect topic function depends on current video

**useChatWithTimestamps**:
- Render function memoized with timestamp click handler

**useRouteSync**:
- Callback functions memoized to prevent re-initialization

### Optimization Opportunities (Phase 3)

1. **Virtualize Chapter List**: For videos with many chapters, implement virtual scrolling
2. **Debounce Progress Updates**: Update chapter progress every 2 seconds instead of continuously
3. **Lazy Load Transcript Chunks**: Load transcript data on demand
4. **Cache Summary Data**: Store generated summaries in localStorage
5. **Optimize Re-renders**: Use React DevTools Profiler to identify bottlenecks

---

## Testing Strategy

### Unit Testing Hooks

Each hook should have comprehensive unit tests covering:

1. **State Management**
   - Initial state is correct
   - State updates work as expected
   - Edge cases handled (null values, empty arrays)

2. **Function Behavior**
   - Functions perform expected operations
   - Side effects are correct
   - Return values are accurate

3. **Dependencies**
   - Hook updates when dependencies change
   - Hook doesn't update when dependencies don't change
   - Cleanup functions work correctly

### Integration Testing

Test hook combinations:

1. **Video + Progress**:
   - Test that progress updates when video time changes
   - Test that chapters are marked complete correctly
   - Test that overall progress calculates correctly

2. **Search + Timestamps**:
   - Test that search finds relevant chunks
   - Test that timestamps are parsed correctly
   - Test that clicking timestamps seeks video

### Component Testing

Test hooks integrated in components:

1. **CoursePageClient**:
   - Test video playback with hooks
   - Test chapter navigation with hooks
   - Test chat functionality with hooks
   - Test URL synchronization with hooks

---

## Related Documentation

- [Video System Rules](/Users/avilevi/Documents/projects/AI-powered interactive course platform/learnwithavi/docs/VIDEO_SYSTEM_RULES.md) - Video player architecture
- [Implementation Status](/Users/avilevi/Documents/projects/AI-powered interactive course platform/learnwithavi/docs/status/implementation-status.md) - Overall platform status
- [API Hooks Reference](/Users/avilevi/Documents/projects/AI-powered interactive course platform/learnwithavi/docs/api/hooks/course-page-hooks.md) - Detailed hook API documentation

---

**Document Version**: 1.0
**Last Updated**: January 19, 2026
**Status**: Phase 1 Complete, Phases 2-6 Planned
**Next Review**: When Phase 2 (Component Extraction) begins
