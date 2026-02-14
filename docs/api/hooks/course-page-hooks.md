# Course Page Hooks API Reference

**Last Updated**: January 19, 2026
**Hook Count**: 7 specialized hooks
**Location**: `/src/hooks/`

This document provides complete API documentation for all custom hooks extracted from the CoursePageClient refactoring (Phase 1).

---

## Table of Contents

- [Video Hooks](#video-hooks)
  - [useVideoState](#usevideostateee)
  - [useVideoProgress](#usevideoprogress)
  - [useChapterNavigation](#usechapternavigation)
- [Chat Hooks](#chat-hooks)
  - [useSummaryGeneration](#usesummarygeneration)
  - [useTranscriptSearch](#usetranscriptsearch)
  - [useChatWithTimestamps](#usechatwithtimestamps)
- [Course Hooks](#course-hooks)
  - [useRouteSync](#useroutesync)
- [Common Patterns](#common-patterns)
- [Best Practices](#best-practices)

---

## Video Hooks

### useVideoState

**File**: `/src/hooks/video/useVideoState.ts`

**Purpose**: Manages core video playback state including time tracking, duration management, and seeking operations.

#### API Signature

```typescript
function useVideoState(video: Video | null): UseVideoStateReturn

interface UseVideoStateReturn {
  /** Current playback time in seconds */
  currentTime: number;

  /** Actual video duration from YouTube (0 until loaded) */
  actualDuration: number;

  /** Target time for seeking (undefined when not seeking) */
  seekToTime: number | undefined;

  /** Update current playback time */
  handleTimeUpdate: (time: number) => void;

  /** Update video duration when loaded */
  handleDurationChange: (duration: number) => void;

  /** Seek to specific time in video */
  handleSeek: (time: number) => void;

  /** Reset state (useful when switching videos) */
  reset: () => void;
}
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `video` | `Video \| null` | Current video object, or null if no video selected |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `currentTime` | `number` | Current playback position in seconds |
| `actualDuration` | `number` | Actual video duration from YouTube API (0 until loaded) |
| `seekToTime` | `number \| undefined` | Target time for seeking, cleared after seek completes |
| `handleTimeUpdate` | `(time: number) => void` | Called by video player on timeupdate events (~250ms intervals) |
| `handleDurationChange` | `(duration: number) => void` | Called once when video metadata loads |
| `handleSeek` | `(time: number) => void` | Triggers seek to specified time |
| `reset` | `() => void` | Resets all state (use when switching videos) |

#### Usage Example

```typescript
import { useVideoState } from '@/hooks';

function VideoContainer({ video }: { video: Video }) {
  const videoState = useVideoState(video);

  return (
    <div>
      <VideoPlayer
        video={video}
        onTimeUpdate={videoState.handleTimeUpdate}
        onDurationChange={videoState.handleDurationChange}
        seekToTime={videoState.seekToTime}
      />
      <div>
        Current time: {formatTime(videoState.currentTime)} / {formatTime(videoState.actualDuration)}
      </div>
      <button onClick={() => videoState.handleSeek(120)}>
        Jump to 2:00
      </button>
    </div>
  );
}
```

#### Implementation Details

- **Seek Detection**: Clears `seekToTime` when video reaches target (within 0.5s tolerance)
- **Time Updates**: Receives time updates from video player ~4 times per second
- **State Persistence**: State resets when video changes (use `reset()` manually if needed)
- **Performance**: Uses `useCallback` for all handlers to prevent re-renders

#### When to Use

- Managing basic video playback state
- Implementing custom video controls
- Building video timeline scrubbers
- Creating chapter navigation interfaces

---

### useVideoProgress

**File**: `/src/hooks/video/useVideoProgress.ts`

**Purpose**: Sophisticated progress tracking with sequential watching validation, per-chapter completion detection, and 90% watched threshold.

#### API Signature

```typescript
function useVideoProgress(
  video: Video | null,
  currentTime: number,
  actualDuration: number
): UseVideoProgressReturn

interface UseVideoProgressReturn {
  /** Chapter items with progress and completion status */
  chapterItems: ChapterItem[];

  /** Overall video progress (0-100) */
  overallProgress: number;

  /** Set of watched video IDs */
  watchedVideos: Set<string>;

  /** Current chapter being watched */
  currentChapter: Chapter | undefined;

  /** Current chapter index */
  currentChapterIndex: number;

  /** Mark video as watched */
  markVideoWatched: (videoId: string) => void;

  /** Reset progress for current video */
  resetProgress: () => void;
}

interface ChapterItem {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: string;        // Formatted as "MM:SS"
  isActive: boolean;       // Currently being watched
  isCompleted: boolean;    // 90% watched threshold met
  progress: number;        // 0-100 percentage
}
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `video` | `Video \| null` | Current video object |
| `currentTime` | `number` | Current playback time in seconds |
| `actualDuration` | `number` | Actual video duration (0 until loaded) |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `chapterItems` | `ChapterItem[]` | Array of chapters with progress information |
| `overallProgress` | `number` | Overall video progress as percentage (0-100) |
| `watchedVideos` | `Set<string>` | Set of video IDs marked as watched (80% threshold) |
| `currentChapter` | `Chapter \| undefined` | Currently active chapter |
| `currentChapterIndex` | `number` | Index of current chapter (-1 if none) |
| `markVideoWatched` | `(videoId: string) => void` | Manually mark video as watched |
| `resetProgress` | `() => void` | Reset all progress tracking for current video |

#### Usage Example

```typescript
import { useVideoProgress } from '@/hooks';

function VideoProgress({ video, currentTime, actualDuration }: Props) {
  const progress = useVideoProgress(video, currentTime, actualDuration);

  return (
    <div>
      {/* Overall Progress */}
      <div className="progress-bar">
        <div style={{ width: `${progress.overallProgress}%` }} />
      </div>

      {/* Chapter List */}
      <div className="chapters">
        {progress.chapterItems.map((chapter) => (
          <div
            key={chapter.id}
            className={chapter.isActive ? 'active' : ''}
          >
            <div>{chapter.title}</div>
            <div>{chapter.duration}</div>
            <div>
              {chapter.isCompleted ? (
                <CheckIcon />
              ) : (
                <span>{chapter.progress}%</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Current Chapter Info */}
      {progress.currentChapter && (
        <div>
          Currently watching: {progress.currentChapter.title}
        </div>
      )}
    </div>
  );
}
```

#### Implementation Details

- **Sequential Watching**: Only counts time if delta < 3 seconds (prevents skipping credit)
- **90% Threshold**: Chapter marked complete when 90% of its duration watched
- **80% Overall**: Video marked as watched when user reaches 80% of total duration
- **Auto-Generated Chapters**: Creates 3-10 chapters if video has none defined
- **Chapter Duration**: Each auto-generated chapter is 2-3 minutes (120 seconds)
- **Progress Calculation**: Based on actual watched time, not current playback position
- **Time Tracking**: Uses ref to prevent stale closure issues

#### Advanced Usage

For components that need to track progress internally:

```typescript
import { useVideoProgressWithTracking } from '@/hooks';

function VideoPlayerWithTracking({ video, currentTime, actualDuration }: Props) {
  const progress = useVideoProgressWithTracking(video, currentTime, actualDuration);

  // Call trackProgress from handleTimeUpdate
  useEffect(() => {
    progress.trackProgress(currentTime);
  }, [currentTime, progress]);

  return (
    <div>
      <ProgressBar value={progress.overallProgress} />
      <ChapterList chapters={progress.chapterItems} />
    </div>
  );
}
```

#### When to Use

- Displaying chapter progress in video player
- Building course completion dashboards
- Tracking learner engagement metrics
- Implementing achievement systems
- Creating study progress reports

---

### useChapterNavigation

**File**: `/src/hooks/video/useChapterNavigation.ts`

**Purpose**: Generates and manages video chapters with automatic chapter creation when none are configured.

#### API Signature

```typescript
function useChapterNavigation(
  video: Video | null,
  currentTime: number,
  actualDuration: number
): UseChapterNavigationReturn

interface UseChapterNavigationReturn {
  /** Generated or configured chapters */
  chapters: Chapter[];

  /** Current chapter being watched */
  currentChapter: Chapter | undefined;

  /** Current chapter index */
  currentChapterIndex: number;
}

interface Chapter {
  title: string;
  startTime: number;
  endTime: number;
}
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `video` | `Video \| null` | Current video object |
| `currentTime` | `number` | Current playback time in seconds |
| `actualDuration` | `number` | Actual video duration (0 until loaded) |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `chapters` | `Chapter[]` | Array of chapters (configured or auto-generated) |
| `currentChapter` | `Chapter \| undefined` | Currently active chapter based on time |
| `currentChapterIndex` | `number` | Index of current chapter (-1 if none) |

#### Usage Example

```typescript
import { useChapterNavigation } from '@/hooks';

function ChapterTimeline({ video, currentTime, actualDuration, onSeek }: Props) {
  const { chapters, currentChapter, currentChapterIndex } = useChapterNavigation(
    video,
    currentTime,
    actualDuration
  );

  return (
    <div className="timeline">
      {chapters.map((chapter, index) => (
        <button
          key={index}
          onClick={() => onSeek(chapter.startTime)}
          className={index === currentChapterIndex ? 'active' : ''}
        >
          <div>{chapter.title}</div>
          <div>{formatTime(chapter.startTime)} - {formatTime(chapter.endTime)}</div>
        </button>
      ))}

      {currentChapter && (
        <div className="current-chapter">
          Now playing: {currentChapter.title}
        </div>
      )}
    </div>
  );
}
```

#### Implementation Details

- **Configured Chapters**: Uses `video.chapters` if available
- **Auto-Generation**: Creates chapters if video has none
- **Chapter Count**: 3-10 chapters based on video duration
- **Chapter Length**: ~2-3 minutes (120 seconds) each
- **Chapter Naming**: Auto-generated chapters named "Chapter 1", "Chapter 2", etc. (Hebrew: "חלק 1", "חלק 2")
- **Time-based Detection**: Finds current chapter using `currentTime >= startTime && currentTime < endTime`
- **Performance**: Memoized with `useMemo` to prevent unnecessary recalculations

#### When to Use

- Building chapter navigation interfaces
- Creating video timeline visualizations
- Implementing chapter-based bookmarks
- Displaying table of contents for videos
- Auto-segmenting long videos

---

## Chat Hooks

### useSummaryGeneration

**File**: `/src/hooks/chat/useSummaryGeneration.ts`

**Purpose**: AI-powered video summary generation from transcript analysis using pattern matching.

#### API Signature

```typescript
function useSummaryGeneration(
  video: Video | null
): UseSummaryGenerationReturn

interface UseSummaryGenerationReturn {
  /** Whether summary modal is visible */
  showSummary: boolean;

  /** Generated summary data */
  summary: SummaryData | null;

  /** Whether summary is being generated */
  isGenerating: boolean;

  /** Generate summary from transcript */
  generateSummary: () => void;

  /** Close summary modal */
  closeSummary: () => void;
}

interface SummaryData {
  about: string;
  tools: { name: string; desc: string; color: string }[];
  process: { step: number; title: string; desc: string }[];
  benefits: string[];
}
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `video` | `Video \| null` | Current video object |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `showSummary` | `boolean` | Whether summary modal should be displayed |
| `summary` | `SummaryData \| null` | Generated summary data (null until generated) |
| `isGenerating` | `boolean` | Loading state during summary generation |
| `generateSummary` | `() => void` | Trigger summary generation |
| `closeSummary` | `() => void` | Close summary modal |

#### Usage Example

```typescript
import { useSummaryGeneration } from '@/hooks';

function VideoSummary({ video }: { video: Video }) {
  const { showSummary, summary, isGenerating, generateSummary, closeSummary } = useSummaryGeneration(video);

  return (
    <>
      <button onClick={generateSummary}>
        Generate AI Summary
      </button>

      {showSummary && (
        <Modal onClose={closeSummary}>
          {isGenerating ? (
            <LoadingSpinner />
          ) : summary ? (
            <div>
              <h3>About</h3>
              <p>{summary.about}</p>

              <h3>Tools Used</h3>
              <ul>
                {summary.tools.map((tool, i) => (
                  <li key={i} className={tool.color}>
                    <strong>{tool.name}</strong>: {tool.desc}
                  </li>
                ))}
              </ul>

              <h3>Process</h3>
              <ol>
                {summary.process.map((step) => (
                  <li key={step.step}>
                    <strong>{step.title}</strong>: {step.desc}
                  </li>
                ))}
              </ol>

              <h3>Benefits</h3>
              <ul>
                {summary.benefits.map((benefit, i) => (
                  <li key={i}>{benefit}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </Modal>
      )}
    </>
  );
}
```

#### Implementation Details

- **Pattern Matching**: Uses regex patterns to detect tools (Make, ChatGPT, ElevenLabs, etc.)
- **Transcript Analysis**: Analyzes full transcript text for keywords
- **Process Extraction**: Identifies process steps from chunk content
- **Benefit Detection**: Detects key phrases indicating benefits
- **Loading Simulation**: 1.5s delay to simulate AI processing
- **Fallback Content**: Provides default content if no patterns match
- **Color Coding**: Each tool has associated color scheme for UI

#### Detected Tools

| Tool | Keywords | Description |
|------|----------|-------------|
| Make (Integromat) | make, integromat | Visual automation platform |
| News API | news api, newsapi | News aggregation service |
| ChatGPT | chatgpt, gpt, openai | AI text summarization |
| ElevenLabs | elevenlabs, eleven labs | Text-to-speech service |
| Telegram | telegram, טלגרם | Messaging app automation |

#### When to Use

- Providing quick video overviews to learners
- Generating study summaries
- Creating course previews
- Building knowledge extraction tools
- Implementing auto-documentation

---

### useTranscriptSearch

**File**: `/src/hooks/chat/useTranscriptSearch.ts`

**Purpose**: Intelligent transcript search with topic detection, keyword matching, and relevance scoring.

#### API Signature

```typescript
function useTranscriptSearch(
  video: Video | null,
  videoMetadata: Record<string, VideoMetadata>,
  topicKnowledge: Record<string, TopicInfo>
): UseTranscriptSearchReturn

interface UseTranscriptSearchReturn {
  /** Search transcript chunks by query */
  searchTranscript: (
    query: string,
    chunks: TranscriptChunk[]
  ) => TranscriptChunk[];

  /** Detect topic from query */
  detectTopic: (query: string) => DetectedTopic | null;
}

interface VideoMetadata {
  title: string;
  description: string;
  toolsUsed: string[];
  mainTopic: string;
}

interface TopicInfo {
  keywords: string[];
  explanation: string;
  inVideo: boolean;
  usedInVideo?: boolean;
  videoContext?: string;
}

interface DetectedTopic {
  key: string;
  topic: TopicInfo;
  isToolUsedInVideo: boolean;
}
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `video` | `Video \| null` | Current video object |
| `videoMetadata` | `Record<string, VideoMetadata>` | Video metadata mapping by YouTube ID |
| `topicKnowledge` | `Record<string, TopicInfo>` | Topic knowledge base |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `searchTranscript` | `(query, chunks) => chunks` | Search function returning top 3 relevant chunks |
| `detectTopic` | `(query) => topic \| null` | Detect topic from query string |

#### Usage Example

```typescript
import { useTranscriptSearch } from '@/hooks';
import { getSampleChunksForVideo } from '@/data/sample-transcripts';

function ChatSearch({ video, videoMetadata, topicKnowledge }: Props) {
  const { searchTranscript, detectTopic } = useTranscriptSearch(
    video,
    videoMetadata,
    topicKnowledge
  );

  const handleSearch = (query: string) => {
    const chunks = getSampleChunksForVideo(video.youtubeId);
    const results = searchTranscript(query, chunks);

    // Check if query is about a known topic
    const topic = detectTopic(query);

    if (topic && topic.isToolUsedInVideo) {
      console.log(`This video uses ${topic.key}!`);
      console.log(`Explanation: ${topic.topic.explanation}`);
    }

    return results;
  };

  return (
    <SearchInput onSearch={handleSearch} />
  );
}
```

#### Implementation Details

**Scoring Algorithm**:
1. **Topic Detection**: Check if query matches known topic keywords (+50 base score)
2. **Keyword Matching**: Each topic keyword found in chunk (+15 score)
3. **Exact Match**: Full query found in chunk text (+100 score)
4. **Word-Level**: Each query word found (+10 score, +5 bonus for long words)
5. **Minimum Threshold**: Only return chunks with score >= 20
6. **Top Results**: Returns top 3 highest-scoring chunks

**Topic Detection**:
- Matches query against topic keyword lists
- Checks if topic is covered in current video
- Identifies if tool is actually used in the video
- Provides contextual information about topic

**Performance**:
- Memoized with `useCallback` to prevent re-creation
- Efficient string matching with `toLowerCase()`
- Early return for non-matching chunks

#### When to Use

- Building AI chat interfaces with RAG
- Implementing transcript search features
- Creating intelligent question answering
- Building topic-aware responses
- Implementing semantic search fallbacks

---

### useChatWithTimestamps

**File**: `/src/hooks/chat/useChatWithTimestamps.ts`

**Purpose**: Parse and render chat messages with clickable timestamp links that jump to specific video times.

#### API Signature

```typescript
function useChatWithTimestamps(
  onTimestampClick: (time: number) => void
): UseChatWithTimestampsReturn

interface UseChatWithTimestampsReturn {
  /** Render message content with clickable timestamps */
  renderMessageContent: (content: string) => React.ReactNode;
}
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `onTimestampClick` | `(time: number) => void` | Callback when timestamp is clicked |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `renderMessageContent` | `(content: string) => React.ReactNode` | Renders message with clickable timestamps |

#### Usage Example

```typescript
import { useChatWithTimestamps } from '@/hooks';

function ChatMessage({ message, onSeek }: Props) {
  const { renderMessageContent } = useChatWithTimestamps(onSeek);

  return (
    <div className="message">
      {renderMessageContent(message.content)}
    </div>
  );
}

// Message content:
// "Check out this section at [timestamp:2:45] where he explains the API"
//
// Rendered output:
// "Check out this section at " + <button onClick={() => onSeek(165)}>2:45</button> + " where he explains the API"
```

#### Implementation Details

**Timestamp Format**: `[timestamp:MM:SS]`

**Parsing**:
- Regex pattern: `/\[timestamp:(\d+):(\d+)\]/g`
- Extracts minutes and seconds
- Converts to total seconds: `minutes * 60 + seconds`
- Creates clickable button element

**Rendering**:
- Returns array of text strings and React button elements
- Buttons have `onClick` handler calling `onTimestampClick`
- Styled with blue text color and hover underline
- Inline display preserves text flow

**Edge Cases**:
- Handles multiple timestamps in one message
- Preserves text before, between, and after timestamps
- Falls back to original content if no timestamps found

#### Styling

Default button classes:
```typescript
className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline font-medium mx-0.5"
```

#### When to Use

- Rendering AI chat responses with video references
- Building interactive transcripts
- Creating timestamped annotations
- Implementing video bookmarks in chat
- Generating clickable study notes

---

## Course Hooks

### useRouteSync

**File**: `/src/hooks/course/useRouteSync.ts`

**Purpose**: Bidirectional synchronization between current video state and URL query parameters for deep linking and history support.

#### API Signature

```typescript
function useRouteSync(
  course: Course | null,
  courseId: string,
  onVideoChange?: (video: Video) => void
): UseRouteSyncReturn

interface UseRouteSyncReturn {
  /** Currently selected video (null if none selected) */
  currentVideo: Video | null;

  /** Select a new video and update URL */
  selectVideo: (video: Video) => void;

  /** Check if a video is currently selected */
  isVideoSelected: (videoId: string) => boolean;
}
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `course` | `Course \| null` | Course object containing videos |
| `courseId` | `string` | Course ID for URL construction |
| `onVideoChange` | `(video: Video) => void` | Optional callback when video changes |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `currentVideo` | `Video \| null` | Currently selected video |
| `selectVideo` | `(video: Video) => void` | Select video and update URL |
| `isVideoSelected` | `(videoId: string) => boolean` | Check if video is selected |

#### Usage Example

```typescript
import { useRouteSync } from '@/hooks';

function CoursePage({ course, courseId }: Props) {
  const { currentVideo, selectVideo, isVideoSelected } = useRouteSync(
    course,
    courseId,
    (video) => console.log('Video changed:', video.title)
  );

  return (
    <div>
      {/* Video Player */}
      {currentVideo && (
        <VideoPlayer video={currentVideo} />
      )}

      {/* Video List */}
      <ul>
        {course.videos.map((video) => (
          <li
            key={video.id}
            onClick={() => selectVideo(video)}
            className={isVideoSelected(video.id) ? 'active' : ''}
          >
            {video.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

#### Implementation Details

**URL Format**: `/course/[courseId]?video=[videoId]`

**Initialization**:
1. Reads `video` query parameter from URL
2. Finds matching video in course
3. Falls back to first video if param missing or invalid
4. Calls `onVideoChange` callback if provided

**URL Updates**:
- Uses Next.js `router.push()` with `scroll: false` option
- Preserves browser history for back/forward navigation
- Updates URL without page reload

**Deep Linking**:
- Users can share direct links to specific videos
- URLs like `/course/ai-101?video=intro-video` work correctly
- Browser back/forward buttons navigate between videos

#### When to Use

- Course page video navigation
- Implementing shareable video links
- Supporting browser history
- Building video playlists
- Creating bookmarkable content

---

## Common Patterns

### Combining Multiple Hooks

Most components will use multiple hooks together. Here's a comprehensive example:

```typescript
import {
  useRouteSync,
  useVideoState,
  useVideoProgress,
  useChapterNavigation,
  useSummaryGeneration,
  useChatWithTimestamps
} from '@/hooks';

function CourseVideoPage({ course, courseId }: Props) {
  // 1. URL synchronization
  const { currentVideo, selectVideo } = useRouteSync(course, courseId);

  // 2. Video playback state
  const videoState = useVideoState(currentVideo);

  // 3. Chapter navigation
  const { chapters, currentChapter } = useChapterNavigation(
    currentVideo,
    videoState.currentTime,
    videoState.actualDuration
  );

  // 4. Progress tracking
  const progress = useVideoProgress(
    currentVideo,
    videoState.currentTime,
    videoState.actualDuration
  );

  // 5. AI summary
  const summary = useSummaryGeneration(currentVideo);

  // 6. Timestamp rendering
  const { renderMessageContent } = useChatWithTimestamps(videoState.handleSeek);

  return (
    <div className="course-page">
      {/* Video Player */}
      <VideoPlayer
        video={currentVideo}
        onTimeUpdate={videoState.handleTimeUpdate}
        onDurationChange={videoState.handleDurationChange}
        seekToTime={videoState.seekToTime}
      />

      {/* Progress Display */}
      <ProgressBar value={progress.overallProgress} />

      {/* Chapter List */}
      <ChapterList
        chapters={progress.chapterItems}
        onChapterClick={(time) => videoState.handleSeek(time)}
      />

      {/* Summary Button */}
      <button onClick={summary.generateSummary}>
        Generate Summary
      </button>

      {/* Video List */}
      <VideoList
        videos={course.videos}
        currentVideoId={currentVideo?.id}
        onSelectVideo={selectVideo}
      />
    </div>
  );
}
```

### Hook Composition

Create custom composite hooks for specific use cases:

```typescript
import { useVideoState, useVideoProgress, useChapterNavigation } from '@/hooks';

// Composite hook for video player with progress
function useVideoPlayer(video: Video | null) {
  const state = useVideoState(video);
  const progress = useVideoProgress(video, state.currentTime, state.actualDuration);
  const navigation = useChapterNavigation(video, state.currentTime, state.actualDuration);

  return {
    // Video state
    ...state,
    // Progress
    progress: progress.overallProgress,
    chapters: progress.chapterItems,
    // Navigation
    currentChapter: navigation.currentChapter,
    // Convenience methods
    isComplete: progress.overallProgress === 100,
    canNavigateNext: progress.currentChapterIndex < progress.chapterItems.length - 1,
  };
}
```

---

## Best Practices

### 1. Hook Dependencies

Always pass required dependencies to hooks:

```typescript
// ✅ Good: All dependencies provided
const { chapters } = useChapterNavigation(video, currentTime, actualDuration);

// ❌ Bad: Missing dependencies (will use stale data)
const { chapters } = useChapterNavigation(video, 0, 0);
```

### 2. Memoization

Hooks are already memoized internally, but you can further optimize:

```typescript
// ✅ Good: Memoize expensive computations
const formattedChapters = useMemo(
  () => progress.chapterItems.map(formatChapter),
  [progress.chapterItems]
);

// ❌ Bad: Re-computing on every render
const formattedChapters = progress.chapterItems.map(formatChapter);
```

### 3. Effect Dependencies

When using hook return values in effects:

```typescript
// ✅ Good: Include all dependencies
useEffect(() => {
  if (progress.currentChapter) {
    trackChapterView(progress.currentChapter.id);
  }
}, [progress.currentChapter]);

// ❌ Bad: Missing dependency
useEffect(() => {
  if (progress.currentChapter) {
    trackChapterView(progress.currentChapter.id);
  }
}, []); // Will only run once
```

### 4. Null Safety

Always check for null before using hook data:

```typescript
// ✅ Good: Null checks
if (currentVideo) {
  const { chapters } = useChapterNavigation(currentVideo, time, duration);
  renderChapters(chapters);
}

// ❌ Bad: Assumes currentVideo exists
const { chapters } = useChapterNavigation(currentVideo, time, duration);
renderChapters(chapters); // May crash if currentVideo is null
```

### 5. State Updates

Don't update hook state externally:

```typescript
// ✅ Good: Use provided methods
videoState.handleSeek(120);

// ❌ Bad: Trying to update state directly (won't work)
videoState.currentTime = 120; // This won't do anything
```

### 6. Performance

Avoid creating new objects/arrays in dependencies:

```typescript
// ✅ Good: Stable reference
const metadata = useMemo(() => ({ title: video.title }), [video.title]);
const { searchTranscript } = useTranscriptSearch(video, metadata, topicKnowledge);

// ❌ Bad: New object on every render
const { searchTranscript } = useTranscriptSearch(
  video,
  { title: video.title }, // New object every time
  topicKnowledge
);
```

---

## Related Documentation

- [Course Page Refactoring Architecture](/Users/avilevi/Documents/projects/AI-powered interactive course platform/learnwithavi/docs/architecture/course-page-refactoring.md) - Overall refactoring plan
- [Implementation Status](/Users/avilevi/Documents/projects/AI-powered interactive course platform/learnwithavi/docs/status/implementation-status.md) - Project status
- [Video System Rules](/Users/avilevi/Documents/projects/AI-powered interactive course platform/learnwithavi/docs/VIDEO_SYSTEM_RULES.md) - Video player architecture

---

**Document Version**: 1.0
**Last Updated**: January 19, 2026
**Hook Count**: 7 custom hooks
**Lines of Code**: ~1,100 lines (extracted from 1,475-line component)
