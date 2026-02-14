# YouTube Video Ingestion System - Setup Guide

## 📋 Overview

This guide will help you set up the complete YouTube video ingestion system that allows admins to paste a YouTube URL and automatically fetch all video data including metadata, chapters, and transcripts.

---

## 🎯 What You Get

When you paste a YouTube URL, the system automatically:

1. ✅ **Fetches video metadata** - Title, description, thumbnail, duration
2. ✅ **Extracts chapters** - From video description timestamps
3. ✅ **Fetches transcript** - YouTube auto-captions (if available)
4. ✅ **Saves to database** - Video record with chapters
5. ✅ **Generates transcript file** - TypeScript file with chunked transcript

---

## 🔑 Step 1: Get YouTube API Key

### A. Create Google Cloud Project

1. **Visit**: https://console.cloud.google.com/
2. **Create New Project**:
   - Click the project dropdown at the top
   - Click "New Project"
   - Name: `LearnWithAvi-YouTube`
   - Click "Create"

### B. Enable YouTube Data API v3

1. **Navigate to APIs & Services** → **Library**
2. **Search**: `YouTube Data API v3`
3. **Click** on the result
4. **Click** "Enable"

### C. Create API Credentials

1. **Go to**: APIs & Services → **Credentials**
2. **Click**: "Create Credentials" → "API Key"
3. **Copy** the generated key (format: `AIzaSyD...`)

### D. Restrict API Key (Recommended for Security)

1. **Click** on the newly created API key
2. **Under "API restrictions"**:
   - Select "Restrict key"
   - Check: **YouTube Data API v3**
3. **Click** "Save"

### E. Add to Environment Variables

Open your `.env.local` file and add:

```bash
YOUTUBE_API_KEY=AIzaSyD...your-key-here...
```

**Restart your development server** after adding the key.

---

## 🚀 Step 2: Using the System

### Option A: Admin UI (Recommended)

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Visit admin panel**:
   ```
   http://localhost:3000/admin/videos/ingest
   ```

3. **Login** (if not already):
   - Email: `admin@learnwithavi.com`
   - Password: `admin123`

4. **Ingest video**:
   - Paste YouTube URL
   - Select course
   - Click "Ingest Video"

5. **Complete manual steps** (shown in the success message):
   - Add export to `src/data/transcripts/index.ts`
   - Restart dev server
   - View your video!

### Option B: Command Line Script

```bash
npx tsx scripts/ingest-video.ts "https://www.youtube.com/watch?v=VIDEO_ID" "ai-no-code"
```

**Arguments**:
- First: YouTube URL (any format)
- Second: Course ID (e.g., `ai-no-code`, `web-dev`)

---

## 📊 Step 3: What Gets Created

### 1. Database Records

**Video table**:
```
{
  youtubeId: "VIDEO_ID",
  title: "Video Title",
  description: "Full description...",
  duration: 1308,
  thumbnail: "https://img.youtube.com/...",
  courseId: "ai-no-code",
  published: true,
  order: 0
}
```

**Chapters table** (if timestamps found in description):
```
[
  { title: "Introduction", startTime: 0, endTime: 90, order: 0 },
  { title: "Main Topic", startTime: 90, endTime: 210, order: 1 },
  ...
]
```

### 2. Transcript File

Generated at: `src/data/transcripts/{VIDEO_ID}.ts`

```typescript
export const transcriptChunks: TranscriptChunk[] = [
  {
    id: 'VIDEO_ID-chunk-001',
    videoId: 'VIDEO_ID',
    text: 'Transcript text here...',
    startTime: 0,
    endTime: 25,
  },
  // ... more chunks
];
```

### 3. Manual Step Required

Add export to `src/data/transcripts/index.ts`:

```typescript
export * from './VIDEO_ID';
```

---

## 🎬 Step 4: Adding Chapters to YouTube Videos

For the system to extract chapters automatically, add timestamps to your YouTube video description:

### Format:

```
0:00 Introduction
1:30 Setup and Prerequisites
5:45 Building the Application
12:20 Testing and Deployment
```

### Rules:
- Timestamps must be at the start of a line
- Format: `MM:SS` or `H:MM:SS`
- Must have at least one space after the timestamp
- Chapter title follows the timestamp

### Example Description:

```
Learn how to build an AI-powered app from scratch!

📑 Chapters:
0:00 Introduction and What We'll Build
1:30 Setting Up the Development Environment
5:45 Creating the Frontend
12:20 Integrating AI APIs
18:00 Testing and Deployment

🔗 Resources:
- GitHub: https://github.com/...
- Documentation: https://...
```

---

## 📝 Step 5: Handling Transcripts

### A. YouTube Auto-Captions Available ✅

If your video has auto-captions enabled:
- ✅ Transcript is fetched automatically
- ✅ Split into 25-second chunks
- ✅ Saved to transcript file
- ✅ AI chat works immediately

### B. No Auto-Captions Available ⚠️

If your video doesn't have auto-captions:

**Option 1: Enable Auto-Captions on YouTube**
1. Go to YouTube Studio
2. Select your video
3. Click "Subtitles" in the left menu
4. Wait for auto-captions to generate
5. Re-run ingestion script

**Option 2: Use Whisper API** (Manual setup required)
```bash
# Download audio
yt-dlp -x --audio-format mp3 "https://youtube.com/watch?v=VIDEO_ID"

# Transcribe with Whisper (requires OpenAI API key)
# See: https://platform.openai.com/docs/guides/speech-to-text
```

**Option 3: Add Manually**
1. Copy transcript from YouTube (if available manually)
2. Format into chunks using the template
3. Add to `src/data/transcripts/{VIDEO_ID}.ts`

---

## 🛠️ Troubleshooting

### Error: "YouTube API key not configured"

**Solution**: Add `YOUTUBE_API_KEY` to `.env.local` and restart server

### Error: "YouTube API quota exceeded"

**Solution**:
- YouTube API has daily quotas (10,000 units/day by default)
- Each video metadata fetch costs ~3 units
- Wait 24 hours or request quota increase from Google

### Error: "Video not found or is private/deleted"

**Solution**:
- Check that the YouTube video is public
- Verify the video ID is correct
- Try accessing the video directly on YouTube

### Error: "Failed to fetch transcript"

**Reasons**:
- Video doesn't have auto-captions enabled
- Captions are manually added (not auto-generated)
- Video is age-restricted or embeds disabled

**Solutions**:
- Enable auto-captions on YouTube
- Use Whisper API (manual setup)
- Add transcript manually

### Transcript File Not Working

**Checklist**:
1. ✅ File exists at `src/data/transcripts/{VIDEO_ID}.ts`
2. ✅ Export added to `src/data/transcripts/index.ts`
3. ✅ Development server restarted
4. ✅ No TypeScript errors in the file

---

## 📚 API Endpoints

### POST `/api/admin/videos/ingest`

Ingest a YouTube video programmatically.

**Request**:
```json
{
  "youtubeUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
  "courseId": "ai-no-code"
}
```

**Response** (Success):
```json
{
  "success": true,
  "video": {
    "id": "...",
    "youtubeId": "VIDEO_ID",
    "title": "Video Title",
    "duration": 1308,
    "chaptersCount": 10,
    "transcriptChunksCount": 52
  },
  "transcriptGenerated": true,
  "message": "Video ingested successfully with transcript",
  "nextSteps": [
    "Add export to src/data/transcripts/index.ts",
    "Restart development server"
  ]
}
```

**Response** (Error):
```json
{
  "error": "YouTube API key not configured"
}
```

---

## 🎯 Complete Workflow Example

Let's ingest a real video step by step:

### 1. Get Your YouTube Video URL

Example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`

### 2. Make Sure Video Has:
- ✅ Public visibility
- ✅ Chapters in description (optional but recommended)
- ✅ Auto-captions enabled (optional but recommended)

### 3. Run Ingestion

**Via Admin UI**:
```
http://localhost:3000/admin/videos/ingest
→ Paste URL
→ Select course
→ Click "Ingest Video"
```

**Via Script**:
```bash
npx tsx scripts/ingest-video.ts "https://www.youtube.com/watch?v=dQw4w9WgXcQ" "ai-no-code"
```

### 4. Complete Manual Steps

**Add export to index**:
```bash
echo "export * from './dQw4w9WgXcQ';" >> src/data/transcripts/index.ts
```

**Restart server**:
```bash
pkill -f "next dev"
npm run dev
```

### 5. View Your Video

```
http://localhost:3000/he/course/ai-no-code
```

---

## 💡 Best Practices

### For Video Creators

1. **Add chapters** to video descriptions
2. **Enable auto-captions** on YouTube
3. **Use clear timestamps** (0:00, 1:30, 5:45)
4. **Make videos public** (not unlisted or private)

### For Administrators

1. **Test with a sample video** first
2. **Verify transcript generated** before publishing
3. **Add video summary** to transcript file manually
4. **Check AI chat works** after ingestion
5. **Keep API key secure** (never commit to git)

### For Developers

1. **Always restart server** after adding new transcripts
2. **Use TypeScript** for transcript files (type safety)
3. **Keep chunks 20-30 seconds** for optimal RAG performance
4. **Test video playback** with chapters
5. **Monitor API quota** usage

---

## 📊 Cost Estimation

### YouTube API

**Free Tier**: 10,000 units/day

**Cost per video**:
- Fetch metadata: 3 units
- **Videos per day**: ~3,000 videos (well within limits)

### OpenAI Whisper API (Optional)

**Cost**: $0.006 per minute

**Example**:
- 20-minute video = $0.12
- 60-minute video = $0.36

---

## 🔐 Security Notes

1. **Never expose API key** in client-side code
2. **Restrict API key** to YouTube Data API v3 only
3. **Use environment variables** (`.env.local`)
4. **Add `.env.local` to `.gitignore`**
5. **Require authentication** for ingestion endpoints

---

## 📞 Support

If you encounter issues:

1. **Check logs**: Terminal output shows detailed error messages
2. **Verify API key**: Test with a simple curl request
3. **Check quotas**: View usage in Google Cloud Console
4. **Review transcript file**: Look for syntax errors
5. **Restart server**: Many issues fixed by restart

---

## 🎉 Summary

You now have a complete YouTube video ingestion system:

✅ **Admin UI** for easy video ingestion
✅ **Command-line script** for batch operations
✅ **Automatic metadata** extraction
✅ **Chapter detection** from timestamps
✅ **Transcript generation** with fallbacks
✅ **Database integration** with Prisma
✅ **Type-safe** TypeScript implementation

**Ready to ingest videos?** Start with the Admin UI at:
```
http://localhost:3000/admin/videos/ingest
```

---

**Questions or need help?** Check the troubleshooting section or review the API documentation.
