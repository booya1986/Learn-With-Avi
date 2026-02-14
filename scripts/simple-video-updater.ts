/**
 * Simple Video Data Updater
 *
 * This script automatically opens the YouTube videos in your browser
 * and provides a simple form to paste the information.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { exec } from 'child_process';
import * as fs from 'fs';

config({ path: resolve(__dirname, '../.env.local') });

const VIDEO_DATA = {
  'zhkbBhrNn3s': {
    youtubeId: 'zhkbBhrNn3s',
    order: 2,
    courseId: 'ai-no-code',
    topics: ['No-Code', 'AI', 'Automation'],
    thumbnail: 'https://img.youtube.com/vi/zhkbBhrNn3s/maxresdefault.jpg',
  },
  '7oF2m3zivRY': {
    youtubeId: '7oF2m3zivRY',
    order: 3,
    courseId: 'ai-no-code',
    topics: ['No-Code', 'AI', 'Automation'],
    thumbnail: 'https://img.youtube.com/vi/7oF2m3zivRY/maxresdefault.jpg',
  },
};

function openInBrowser(url: string): void {
  const command = process.platform === 'darwin' ? 'open' :
                  process.platform === 'win32' ? 'start' : 'xdg-open';

  exec(`${command} "${url}"`, (error) => {
    if (error) {
      console.log(`⚠️ Could not auto-open browser. Please visit: ${url}`);
    }
  });
}

async function main() {
  console.log('🚀 YouTube Video Data Collector\n');
  console.log('=' .repeat(80));
  console.log('This script will help you collect video information from YouTube.\n');
  console.log('Instructions:');
  console.log('1. I\'ll open each YouTube video in your browser');
  console.log('2. You\'ll copy the information and paste it into a simple form');
  console.log('3. The script will update your video configuration automatically\n');
  console.log('='  .repeat(80));

  const videoIds = ['zhkbBhrNn3s', '7oF2m3zivRY'];

  console.log('\n📋 Data Collection Form\n');
  console.log('For each video, please copy the following from YouTube:');
  console.log('  • Title (exact title from the video page)');
  console.log('  • Description (first 200-300 characters)');
  console.log('  • Duration (e.g., if video shows 21:48, that\'s the duration)');
  console.log('  • Chapters (if the video has chapter markers)\n');
  console.log('=' .repeat(80));

  for (const videoId of videoIds) {
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    console.log(`\n\n📹 VIDEO: ${videoId}`);
    console.log(`Opening in browser: ${url}`);
    console.log('=' .repeat(80));

    openInBrowser(url);

    console.log('\n✋ Please STOP HERE and visit the YouTube video in your browser.');
    console.log('Then come back here and fill in this data:\n');
    console.log(`For Video ID: ${videoId}`);
    console.log('Copy and paste the following information:\n');

    console.log('Title: [PASTE VIDEO TITLE HERE]');
    console.log('Description: [PASTE FIRST 200-300 CHARACTERS OF DESCRIPTION]');
    console.log('Duration: [e.g., 21:48 or 10:30]');
    console.log('Language: [Hebrew or English]');
    console.log('Chapters (if any, one per line):');
    console.log('  00:00 - Chapter 1 name');
    console.log('  05:30 - Chapter 2 name');
    console.log('  ...\n');
    console.log('=' .repeat(80));
    console.log('\nWhen you have this information, please create a JSON file at:');
    console.log(`  video-data-${videoId}.json`);
    console.log('\nWith this exact format:');
    console.log(`{
  "title": "Paste title here",
  "description": "Paste description here",
  "duration": "21:48",
  "language": "Hebrew",
  "chapters": [
    {"time": "00:00", "title": "Chapter name"},
    {"time": "05:30", "title": "Next chapter"}
  ]
}\n`);
  }

  console.log('\n\n' + '=' .repeat(80));
  console.log('📝 ALTERNATIVE: Use the Template Below');
  console.log('=' .repeat(80));
  console.log('\nIf you prefer, copy this template and fill it in:\n');

  const template = {
    videos: [
      {
        youtubeId: 'zhkbBhrNn3s',
        title: '[PASTE TITLE FROM YOUTUBE]',
        description: '[PASTE DESCRIPTION FROM YOUTUBE]',
        duration: '[e.g., 21:48]',
        language: '[Hebrew/English]',
        chapters: [
          { time: '00:00', title: '[Chapter name]' },
          { time: '05:30', title: '[Next chapter]' },
        ],
      },
      {
        youtubeId: '7oF2m3zivRY',
        title: '[PASTE TITLE FROM YOUTUBE]',
        description: '[PASTE DESCRIPTION FROM YOUTUBE]',
        duration: '[e.g., 21:48]',
        language: '[Hebrew/English]',
        chapters: [
          { time: '00:00', title: '[Chapter name]' },
          { time: '05:30', title: '[Next chapter]' },
        ],
      },
    ],
  };

  const templatePath = resolve(__dirname, '../video-data-template.json');
  fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));

  console.log(`\n✅ Template saved to: video-data-template.json`);
  console.log('\nFill in the template and save it as: video-data-complete.json');
  console.log('Then run: npx tsx scripts/apply-video-data.ts\n');
  console.log('=' .repeat(80));
}

main().catch(console.error);
