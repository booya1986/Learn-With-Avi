/**
 * Fetch YouTube Video Data using oEmbed API (no API key required)
 * This will get basic info, then we'll manually enhance it
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import * as readline from 'readline';

config({ path: resolve(__dirname, '../.env.local') });

interface VideoInfo {
  youtubeId: string;
  title: string;
  authorName: string;
  thumbnailUrl: string;
}

async function fetchOEmbedData(youtubeId: string): Promise<VideoInfo> {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return {
      youtubeId,
      title: data.title,
      authorName: data.author_name,
      thumbnailUrl: data.thumbnail_url,
    };
  } catch (error) {
    console.error(`❌ Error fetching oEmbed data for ${youtubeId}:`, error);
    throw error;
  }
}

async function askUserForDetails(video: VideoInfo): Promise<any> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(query, resolve);
    });
  };

  console.log(`\n${'='.repeat(80)}`);
  console.log(`📹 Video: ${video.title}`);
  console.log(`   YouTube ID: ${video.youtubeId}`);
  console.log(`   Channel: ${video.authorName}`);
  console.log(`   Watch: https://www.youtube.com/watch?v=${video.youtubeId}`);
  console.log(`${'='.repeat(80)}\n`);

  console.log('Please visit the YouTube URL above and provide the following information:\n');

  const description = await question('Video description (first 200-300 chars): ');
  const durationInput = await question('Video duration (MM:SS format, e.g., 21:48): ');
  const language = await question('Language (Hebrew/English/other): ');
  const hasChapters = await question('Does the video have chapters? (yes/no): ');

  let chapters: Array<{ title: string; timestamp: string }> = [];

  if (hasChapters.toLowerCase() === 'yes') {
    console.log('\nEnter chapters (one per line, format: "00:00 Chapter Title"). Press Enter on empty line when done:\n');

    while (true) {
      const chapterInput = await question('Chapter: ');
      if (!chapterInput.trim()) break;

      const match = chapterInput.match(/^(\d+:\d+)\s+(.+)$/);
      if (match) {
        chapters.push({ timestamp: match[1], title: match[2] });
      } else {
        console.log('Invalid format. Use: MM:SS Chapter Title');
      }
    }
  }

  rl.close();

  // Convert duration to seconds
  const [minutes, seconds] = durationInput.split(':').map(Number);
  const durationSeconds = minutes * 60 + seconds;

  // Convert chapters to proper format
  const formattedChapters = chapters.map((chapter, index) => {
    const [mins, secs] = chapter.timestamp.split(':').map(Number);
    const startTime = mins * 60 + secs;
    const nextChapter = chapters[index + 1];
    let endTime: number;

    if (nextChapter) {
      const [nextMins, nextSecs] = nextChapter.timestamp.split(':').map(Number);
      endTime = nextMins * 60 + nextSecs;
    } else {
      endTime = durationSeconds;
    }

    return {
      title: chapter.title,
      startTime,
      endTime,
      order: index + 1,
    };
  });

  // If no chapters, create default structure
  if (formattedChapters.length === 0) {
    formattedChapters.push(
      { title: 'מבוא', startTime: 0, endTime: Math.floor(durationSeconds * 0.2), order: 1 },
      { title: 'תוכן ראשי', startTime: Math.floor(durationSeconds * 0.2), endTime: Math.floor(durationSeconds * 0.8), order: 2 },
      { title: 'סיכום', startTime: Math.floor(durationSeconds * 0.8), endTime: durationSeconds, order: 3 }
    );
  }

  return {
    youtubeId: video.youtubeId,
    title: video.title,
    description: description,
    duration: durationSeconds,
    language: language,
    chapters: formattedChapters,
  };
}

async function main() {
  console.log('🚀 Fetching YouTube video data...\n');
  console.log('Step 1: Getting basic info from YouTube oEmbed API (no API key needed)');
  console.log('Step 2: You\'ll provide additional details\n');

  const videoIds = ['zhkbBhrNn3s', '7oF2m3zivRY'];
  const results: any[] = [];

  for (const videoId of videoIds) {
    console.log(`\n📥 Fetching basic info for ${videoId}...`);
    const videoInfo = await fetchOEmbedData(videoId);
    console.log(`✅ Got title: ${videoInfo.title}`);

    const fullData = await askUserForDetails(videoInfo);
    results.push(fullData);
  }

  console.log('\n\n📊 Summary of All Videos:\n');
  console.log('=' .repeat(80));

  results.forEach((video, index) => {
    console.log(`\nVideo ${index + 1} (${video.youtubeId}):`);
    console.log(`Title: ${video.title}`);
    console.log(`Description: ${video.description.substring(0, 100)}...`);
    console.log(`Duration: ${video.duration}s (${Math.floor(video.duration / 60)}:${video.duration % 60})`);
    console.log(`Language: ${video.language}`);
    console.log(`Chapters: ${video.chapters.length}`);
    video.chapters.forEach((ch: any) => {
      console.log(`  - ${ch.title} (${ch.startTime}s - ${ch.endTime}s)`);
    });
  });

  console.log('\n💾 Saving data to file...');

  const fs = require('fs');
  fs.writeFileSync(
    resolve(__dirname, '../video-data-extracted.json'),
    JSON.stringify(results, null, 2)
  );

  console.log('✅ Data saved to video-data-extracted.json');
  console.log('\n🎉 Done! Next step: Run the update script to apply this data.');
}

main().catch(console.error);
