/**
 * Apply Video Data from JSON to Configuration
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';

config({ path: resolve(__dirname, '../.env.local') });

interface ChapterInput {
  time: string;
  title: string;
}

interface VideoInput {
  youtubeId: string;
  title: string;
  description: string;
  duration: string;
  language: string;
  chapters: ChapterInput[];
}

interface VideoData {
  videos: VideoInput[];
}

function convertDurationToSeconds(duration: string): number {
  const parts = duration.split(':').map(Number);
  if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 600; // fallback
}

function convertChapters(chapters: ChapterInput[], totalDuration: number): any[] {
  return chapters.map((chapter, index) => {
    const [mins, secs] = chapter.time.split(':').map(Number);
    const startTime = mins * 60 + secs;

    // Calculate end time as start of next chapter or end of video
    const nextChapter = chapters[index + 1];
    let endTime: number;
    if (nextChapter) {
      const [nextMins, nextSecs] = nextChapter.time.split(':').map(Number);
      endTime = nextMins * 60 + nextSecs;
    } else {
      endTime = totalDuration;
    }

    return {
      title: chapter.title,
      startTime,
      endTime,
      order: index + 1,
    };
  });
}

async function main() {
  console.log('📥 Loading video data from JSON...\n');

  const dataPath = resolve(__dirname, '../video-data-complete.json');

  if (!fs.existsSync(dataPath)) {
    console.error('❌ Error: video-data-complete.json not found!');
    console.log('\nPlease create the file with video information.');
    console.log('You can use video-data-template.json as a starting point.');
    process.exit(1);
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const data: VideoData = JSON.parse(rawData);

  console.log(`✅ Found ${data.videos.length} videos\n`);

  // Read current video-config.ts
  const configPath = resolve(__dirname, '../src/data/video-config.ts');
  let configContent = fs.readFileSync(configPath, 'utf-8');

  console.log('📝 Updating video configuration...\n');

  for (const video of data.videos) {
    const duration = convertDurationToSeconds(video.duration);
    const chapters = convertChapters(video.chapters, duration);

    console.log(`\n📹 Processing: ${video.title}`);
    console.log(`   YouTube ID: ${video.youtubeId}`);
    console.log(`   Duration: ${video.duration} (${duration}s)`);
    console.log(`   Language: ${video.language}`);
    console.log(`   Chapters: ${chapters.length}`);

    // Create the video config entry
    const videoConfig = {
      youtubeId: video.youtubeId,
      title: video.title,
      description: video.description,
      courseId: 'ai-no-code',
      duration: duration,
      order: video.youtubeId === 'zhkbBhrNn3s' ? 2 : 3,
      topics: ['No-Code', 'AI', 'Automation'],
      thumbnail: `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`,
      chapters: chapters,
    };

    // Find and replace the placeholder for this video
    const videoIdPattern = new RegExp(
      `{[\\s\\S]*?youtubeId:\\s*['"]${video.youtubeId}['"][\\s\\S]*?},`,
      'g'
    );

    const replacement = `{
    youtubeId: '${videoConfig.youtubeId}',
    title: '${videoConfig.title.replace(/'/g, "\\'")}',
    description: '${videoConfig.description.replace(/'/g, "\\'")}',
    courseId: '${videoConfig.courseId}',
    duration: ${videoConfig.duration},
    order: ${videoConfig.order},
    topics: ${JSON.stringify(videoConfig.topics)},
    thumbnail: '${videoConfig.thumbnail}',
    chapters: ${JSON.stringify(videoConfig.chapters, null, 6).replace(/"([^"]+)":/g, '$1:')},
  },`;

    if (configContent.match(videoIdPattern)) {
      configContent = configContent.replace(videoIdPattern, replacement);
      console.log(`   ✅ Updated in video-config.ts`);
    } else {
      console.log(`   ⚠️ Could not find entry for ${video.youtubeId} in video-config.ts`);
    }
  }

  // Write updated config
  fs.writeFileSync(configPath, configContent);

  console.log('\n✅ Video configuration updated successfully!');
  console.log('\n📊 Summary:');
  data.videos.forEach((video, index) => {
    console.log(`\n${index + 1}. ${video.title}`);
    console.log(`   ID: ${video.youtubeId}`);
    console.log(`   Duration: ${video.duration}`);
    console.log(`   Chapters: ${video.chapters.length}`);
  });

  console.log('\n🎯 Next steps:');
  console.log('1. Run: npx tsx scripts/migrate-config-to-db.ts');
  console.log('2. Restart dev server: npm run dev');
  console.log('3. Visit: http://localhost:3000/he\n');
}

main().catch(console.error);
