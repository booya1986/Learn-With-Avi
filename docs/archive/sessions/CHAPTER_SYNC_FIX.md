# Chapter Sync Fix - January 18, 2026

## Issue Description

**Problem**: Chapter names were showing as generic "חלק 1, חלק 2, חלק 3" instead of actual chapter titles like "הקדמה ומה נבנה היום", "סקירת הפרויקט המוגמר", etc.

**Location**: Right sidebar of video player on course pages

**Root Cause**: The migration script (`scripts/migrate-config-to-db.ts`) was skipping existing videos, so chapters from `video-config.ts` were never synced to the database.

---

## Solution Implemented

### 1. Created Force Update Script

**File**: `scripts/force-update-chapters.ts`

**Purpose**: Manually force update all chapters from config to database

**Usage**:
```bash
npx tsx scripts/force-update-chapters.ts
```

**What it does**:
- Finds all videos in database
- Deletes existing chapters
- Recreates chapters from `video-config.ts`
- Reports summary of changes

### 2. Updated Migration Script

**File**: `scripts/migrate-config-to-db.ts`

**Changes**: Modified to update chapters for existing videos instead of skipping them

**Before** (lines 79-82):
```typescript
if (existingVideo) {
  console.log(`  ⏭️  Video "${videoConfig.title}" already exists. Skipping...`);
  continue;
}
```

**After** (lines 80-108):
```typescript
if (existingVideo) {
  console.log(`  📹 Video "${videoConfig.title}" already exists. Updating chapters...`);

  // Delete existing chapters
  if (existingVideo.chapters.length > 0) {
    await prisma.chapter.deleteMany({
      where: { videoId: existingVideo.id },
    });
    console.log(`     🗑️  Deleted ${existingVideo.chapters.length} old chapters`);
  }

  // Create new chapters from config
  if (videoConfig.chapters && videoConfig.chapters.length > 0) {
    for (let i = 0; i < videoConfig.chapters.length; i++) {
      const chapterConfig = videoConfig.chapters[i];
      await prisma.chapter.create({
        data: {
          videoId: existingVideo.id,
          title: chapterConfig.title,
          startTime: chapterConfig.startTime,
          endTime: chapterConfig.endTime,
          order: i,
        },
      });
    }
    console.log(`     ✅ Created ${videoConfig.chapters.length} new chapters`);
    chaptersCreated += videoConfig.chapters.length;
  }
  continue;
}
```

---

## Results

### Chapters Synced

**Video 1**: mHThVfGmd6I
- 10 chapters synced
- Chapters now show: "הקדמה ומה נבנה היום", "סקירת הפרויקט המוגמר", etc.

**Video 2**: zhkbBhrNn3s
- 6 chapters synced
- Chapters now show: "מבוא - מה זה MCP", "התקנת Claude Desktop", etc.

**Video 3**: 7oF2m3zivRY
- 6 chapters synced
- Chapters now show: "מה זה API - הסבר פשוט", "איך API עובד בפועל", etc.

**Total**: 22 chapters synced across 3 videos

### Visual Changes

**Timeline/Seek Bar**:
- ✅ Already working - divided into chapter segments with different colors
- ✅ Hover shows chapter name and time range
- ✅ Click to jump to specific chapter

**Right Sidebar Chapter List**:
- ✅ Now shows actual chapter names (e.g., "הקדמה ומה נבנה היום")
- ✅ Shows chapter duration and timestamps
- ✅ Highlights current active chapter
- ✅ Shows progress per chapter

---

## How to Use Going Forward

### When Adding New Videos

1. **Add video configuration** to `src/data/video-config.ts`:
```typescript
{
  youtubeId: 'YOUR_VIDEO_ID',
  title: 'Video Title',
  courseId: 'course_id',
  duration: 1308,
  chapters: [
    { title: 'Chapter 1 Title', startTime: 0, endTime: 90 },
    { title: 'Chapter 2 Title', startTime: 90, endTime: 210 },
    // ... more chapters
  ],
}
```

2. **Run migration script**:
```bash
npx tsx scripts/migrate-config-to-db.ts
```

3. **Result**: Video and chapters will be created in database

### When Updating Existing Video Chapters

1. **Update chapters** in `src/data/video-config.ts`

2. **Run migration script**:
```bash
npx tsx scripts/migrate-config-to-db.ts
```

3. **Result**: Chapters will be deleted and recreated with new data

### Alternative: Force Update Only Chapters

If you only want to update chapters without touching videos/courses:

```bash
npx tsx scripts/force-update-chapters.ts
```

---

## Files Modified

1. ✅ `scripts/migrate-config-to-db.ts` - Updated to always sync chapters
2. ✅ `scripts/force-update-chapters.ts` - New script for manual chapter sync
3. ✅ `CHANGELOG.md` - Documented the fix
4. ✅ `QUICK_START_TOMORROW.md` - Updated with script information
5. ✅ `docs/status/CHAPTER_SYNC_FIX.md` - This documentation

---

## Testing

### Verification Steps

1. ✅ Run migration script - all 22 chapters created
2. ✅ Start dev server - `npm run dev`
3. ✅ Visit course page - http://localhost:3000/he/course/ai-no-code
4. ✅ Click on Video 1
5. ✅ Check right sidebar - actual chapter names displayed
6. ✅ Hover over timeline - chapter names show in tooltip
7. ✅ Click chapters list - video jumps to correct timestamp

### Expected Behavior

**Right Sidebar**:
- Shows numbered list (1-10 for Video 1)
- Each entry shows chapter title in Hebrew
- Shows timestamp (e.g., "0:00") and duration (e.g., "1:30")
- Active chapter highlighted in blue
- Completed chapters show green checkmark
- Progress bar for active chapter

**Timeline**:
- Visual segments for each chapter
- Different colors/borders between segments
- Hover shows chapter name and time range
- Click to seek to that timestamp

---

## Maintenance Notes

### Important

- ✅ Migration script now **always updates chapters** for existing videos
- ✅ No need to manually delete and recreate videos
- ✅ Safe to run migration script multiple times
- ✅ Chapters are source of truth from `video-config.ts`

### Best Practices

1. **Single source of truth**: Always update `video-config.ts` first
2. **Run migration**: After config changes, run migration script
3. **Verify in browser**: Check that changes appear correctly
4. **Database is secondary**: Config file is authoritative

### Common Issues

**Issue**: Chapters still showing "חלק 1" after running script
**Solution**: Hard refresh browser (Cmd+Shift+R) to clear cache

**Issue**: Script says "0 chapters created"
**Solution**: Check that `video-config.ts` has `chapters` array defined for the video

**Issue**: Timeline not showing chapter segments
**Solution**: Verify `duration` is set correctly in video config

---

## Timeline

- **Date**: January 18, 2026
- **Discovery**: User reported chapters showing as "חלק 1, חלק 2"
- **Root Cause Identified**: Migration script skipping existing videos
- **Fix Implemented**: Updated migration script to update chapters
- **Testing**: All 22 chapters synced and displaying correctly
- **Status**: ✅ **RESOLVED**

---

## Related Files

- [scripts/migrate-config-to-db.ts](../../scripts/migrate-config-to-db.ts)
- [scripts/force-update-chapters.ts](../../scripts/force-update-chapters.ts)
- [src/data/video-config.ts](../../src/data/video-config.ts)
- [src/components/video/VideoPlayer.tsx](../../src/components/video/VideoPlayer.tsx)
- [src/app/course/[courseId]/CoursePageClient.tsx](../../src/app/course/[courseId]/CoursePageClient.tsx)

---

**Issue Status**: ✅ FIXED
**Verified**: January 18, 2026
**Impact**: All videos now display proper chapter names
