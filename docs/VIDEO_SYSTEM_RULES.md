# LearnWithAvi - Video System Rules & Documentation

This document tracks all rules and behaviors for the video learning platform to ensure consistency across all videos.

## Table of Contents
1. [Chapter Progress Tracking](#chapter-progress-tracking)
2. [Video Duration Handling](#video-duration-handling)
3. [Auto-Generated Chapters](#auto-generated-chapters)
4. [UI/UX Rules](#uiux-rules)
5. [Adding New Videos](#adding-new-videos)

---

## Chapter Progress Tracking

### Core Rules

1. **Chapters are ONLY marked as complete when the user actually watches them**
   - A chapter is marked complete when the user has watched at least **90%** of its duration
   - Simply seeking/jumping past a chapter does NOT mark it as complete
   - Progress is tracked per chapter based on actual time spent watching

2. **Progress Calculation**
   - Each chapter tracks `watchedSeconds` independently
   - Progress = `(watchedSeconds / chapterDuration) * 100`
   - Only continuous watching counts (time delta < 3 seconds between updates)
   - Jumping/seeking resets the tracking for the new position

3. **Visual Indicators**
   - **Active chapter**: Blue border, blue progress bar, chapter number in blue circle
   - **Completed chapter**: Green background, checkmark icon, green text
   - **Partially watched**: Shows gray progress bar with "X% נצפה" (X% watched)
   - **Not started**: Gray background, gray number

### Example Scenarios

| Scenario | Result |
|----------|--------|
| User watches chapters 1, 2, 3 sequentially | All marked complete |
| User jumps directly to chapter 5 | Only chapter 5 progress tracks, others stay at 0% |
| User watches 50% of chapter 3, then jumps to 7 | Chapter 3 shows 50% progress, chapter 7 starts tracking |
| User watches 95% of chapter 4 | Chapter 4 marked as complete (>90% threshold) |

---

## Video Duration Handling

### Duration Sources (Priority Order)

1. **Actual YouTube Duration** (highest priority)
   - Retrieved from YouTube player via `onReady` event
   - Stored in `actualDuration` state
   - Always takes precedence when available

2. **Config Duration** (fallback)
   - Defined in `video-config.ts`
   - Used before YouTube player loads
   - Should match actual video for best UX

### Duration Flow

```
YouTube Player loads
       ↓
onReady event fires
       ↓
getDuration() called
       ↓
actualDuration state updated
       ↓
All UI uses actualDuration
```

### Key Variables

```typescript
// In course page
const videoDuration = actualDuration > 0 ? actualDuration : (currentVideo?.duration || 0);
```

---

## Auto-Generated Chapters

When a video has no chapters defined in config, the system auto-generates them:

### Auto-Generation Rules

1. **Chapter Count**: `Math.max(3, Math.min(10, Math.ceil(duration / 120)))`
   - Minimum: 3 chapters
   - Maximum: 10 chapters
   - Target: ~1 chapter per 2 minutes

2. **Chapter Naming**: `חלק ${index + 1}` (Part 1, Part 2, etc.)

3. **Equal Distribution**: Chapters are evenly distributed across video duration

### Example

| Video Duration | Auto-Generated Chapters |
|----------------|------------------------|
| 5 minutes | 3 chapters (~1:40 each) |
| 10 minutes | 5 chapters (2:00 each) |
| 20 minutes | 10 chapters (2:00 each) |
| 30 minutes | 10 chapters (3:00 each) |

---

## UI/UX Rules

### Right Sidebar

1. **Overflow Prevention**
   - Sidebar has `overflow-hidden` class
   - Content wrapped in `ScrollArea` component
   - Height: `calc(100vh - 57px)` (accounts for header)

2. **Chapter List Behavior**
   - Clickable chapters seek to that timestamp
   - Current chapter highlighted with blue border
   - Completed chapters show green checkmark
   - Partially watched chapters show progress bar

### Progress Indicators

1. **Overall Progress Bar**
   - Shows current position in video
   - Blue gradient fill
   - Displays `currentTime / videoDuration`

2. **Chapter Progress**
   - Only shown for active or partially-watched chapters
   - Active: Blue progress bar
   - Partial: Gray progress bar with percentage label

### RTL Support

- All Hebrew text uses `dir="rtl"`
- Chapter titles, descriptions, and labels are right-aligned
- Progress percentages use Hebrew: "X% נצפה"

---

## Adding New Videos

### Minimum Required Fields

```typescript
{
  youtubeId: 'VIDEO_ID',     // YouTube video ID from URL
  title: 'כותרת הסרטון',      // Video title
  courseId: 'course-id',     // Must match existing course
}
```

### Recommended Fields

```typescript
{
  youtubeId: 'VIDEO_ID',
  title: 'כותרת הסרטון',
  description: 'תיאור קצר של הסרטון',
  courseId: 'course-id',
  duration: 1308,            // Duration in seconds (auto-detected but recommended)
  order: 1,                  // Order within course
  topics: ['Topic1', 'Topic2'],
  chapters: [
    { title: 'מבוא', startTime: 0, endTime: 90 },
    { title: 'החלק העיקרי', startTime: 90, endTime: 300 },
    // ... more chapters covering full video
  ],
}
```

### Chapter Best Practices

1. **Cover full video duration**: Last chapter's `endTime` should match video duration
2. **No gaps**: Each chapter's `startTime` should equal previous chapter's `endTime`
3. **Meaningful titles**: Use descriptive Hebrew titles
4. **Reasonable length**: Aim for 1-5 minute chapters

### Transcript (Optional)

Create transcript file at `src/data/transcripts/{youtubeId}.ts`:

```typescript
import { TranscriptChunk } from '@/types';

export const chunks: TranscriptChunk[] = [
  {
    id: 'VIDEO_ID-001',
    videoId: 'VIDEO_ID',
    text: 'טקסט הקטע...',
    startTime: 0,
    endTime: 30,
  },
  // ... more chunks
];
```

Register in `src/data/transcripts/index.ts`.

---

## State Management

### Key State Variables

| State | Type | Purpose |
|-------|------|---------|
| `currentVideo` | `Video \| null` | Currently playing video |
| `currentTime` | `number` | Current playback position (seconds) |
| `actualDuration` | `number` | Real duration from YouTube |
| `chapterWatchedTime` | `Record<number, number>` | Seconds watched per chapter |
| `lastRecordedTime` | `number` | Last recorded time (for delta calc) |

### State Reset Triggers

- **Video change**: Reset `currentTime`, `actualDuration`, `chapterWatchedTime`, `lastRecordedTime`
- **Player ready**: Update `actualDuration`
- **Time update**: Update `currentTime`, `chapterWatchedTime` (if continuous)

---

## File Locations

| File | Purpose |
|------|---------|
| `src/data/video-config.ts` | Video and course configuration |
| `src/data/courses.ts` | Course helper functions |
| `src/data/transcripts/` | Video transcripts |
| `src/components/video/VideoPlayer.tsx` | YouTube player wrapper |
| `src/app/course/[courseId]/page.tsx` | Main course page |

---

## Changelog

### 2025-01-16
- Implemented actual watched time tracking per chapter
- Chapters only marked complete when 90%+ watched
- Added auto-chapter generation for videos without chapters
- Fixed right sidebar overflow
- Added progress indicator for partially watched chapters
- Extended transcript to cover full 21:48 video duration
