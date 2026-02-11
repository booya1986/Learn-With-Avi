# Adding Videos to LearnWithAvi

This guide explains how to add your YouTube videos to the platform.

## Quick Start: Add a New Video

### Step 1: Edit video-config.ts

Open `src/data/video-config.ts` and add your video to the `videoConfigs` array:

```typescript
{
  youtubeId: 'YOUR_YOUTUBE_ID',     // From: youtube.com/watch?v=YOUR_YOUTUBE_ID
  title: 'כותרת הסרטון',            // Video title (Hebrew supported)
  description: 'תיאור קצר',         // Short description
  courseId: 'ai-no-code',           // Course ID (see available courses below)
  duration: 600,                     // Duration in seconds (10 min = 600)
  order: 2,                          // Order within the course
  chapters: [                        // Optional chapter markers
    { title: 'מבוא', startTime: 0, endTime: 60 },
    { title: 'החלק העיקרי', startTime: 60, endTime: 300 },
    { title: 'סיכום', startTime: 300, endTime: 600 },
  ],
}
```

### Step 2: Add a Transcript (Optional but Recommended)

Create a new file at `src/data/transcripts/{youtubeId}.ts`:

```typescript
import { TranscriptChunk } from '@/types';

export const chunks: TranscriptChunk[] = [
  {
    id: 'YOUR_YOUTUBE_ID-001',
    videoId: 'YOUR_YOUTUBE_ID',
    text: 'הטקסט של הקטע הראשון...',
    startTime: 0,
    endTime: 30,
  },
  {
    id: 'YOUR_YOUTUBE_ID-002',
    videoId: 'YOUR_YOUTUBE_ID',
    text: 'הטקסט של הקטע השני...',
    startTime: 30,
    endTime: 60,
  },
  // Continue for the entire video...
];
```

Then register it in `src/data/transcripts/index.ts`:

```typescript
import { chunks as yourVideoChunks } from './YOUR_YOUTUBE_ID';

export const transcriptRegistry = {
  'mHThVfGmd6I': aiNoCodeTranscriptChunks,
  'YOUR_YOUTUBE_ID': yourVideoChunks,  // Add this line
};
```

## Available Courses

| Course ID | Title | Difficulty |
|-----------|-------|------------|
| `ai-no-code` | בניית אפליקציות AI ללא קוד | Beginner |
| `ai-tools` | כלי AI שכדאי להכיר | Beginner |
| `automation-advanced` | אוטומציות מתקדמות | Intermediate |

## Add a New Course

Edit `src/data/video-config.ts` and add to the `courseConfigs` array:

```typescript
{
  id: 'my-new-course',
  title: 'הקורס החדש שלי',
  description: 'תיאור הקורס',
  difficulty: 'beginner', // or 'intermediate' or 'advanced'
  topics: ['Topic1', 'Topic2'],
}
```

## Getting YouTube Video ID

The YouTube video ID is the part after `v=` in the URL:

- URL: `https://www.youtube.com/watch?v=mHThVfGmd6I`
- Video ID: `mHThVfGmd6I`

For short URLs like `https://youtu.be/mHThVfGmd6I`, the ID is after the `/`.

## File Structure

```
src/data/
├── README.md              # This file
├── video-config.ts        # Main configuration for videos and courses
├── courses.ts             # Helper functions (don't edit directly)
├── sample-transcripts.ts  # Sample transcript data
└── transcripts/
    ├── index.ts           # Transcript registry
    └── {youtubeId}.ts     # Individual transcript files
```

## Tips

1. **Duration**: You can leave duration as 0 initially - it will be detected from YouTube
2. **Chapters**: Adding chapters improves navigation and user experience
3. **Transcripts**: Transcripts enable the AI assistant to answer questions about video content
4. **Order**: Use the `order` field to control video sequence within a course
5. **Topics**: Topics appear as tags and help with filtering
