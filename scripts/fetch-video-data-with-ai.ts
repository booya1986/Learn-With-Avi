/**
 * Fetch YouTube Video Data using AI Web Scraping
 *
 * This script uses Claude to extract video information from YouTube pages
 * without needing a YouTube API key.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface VideoData {
  youtubeId: string;
  title: string;
  description: string;
  duration: number; // in seconds
  language: string;
  chapters: Array<{
    title: string;
    startTime: number;
    endTime: number;
  }>;
}

async function fetchVideoData(youtubeId: string): Promise<VideoData> {
  console.log(`\n🔍 Fetching data for video: ${youtubeId}`);

  const url = `https://www.youtube.com/watch?v=${youtubeId}`;

  try {
    // Fetch the YouTube page HTML
    const response = await fetch(url);
    const html = await response.text();

    // Use Claude to extract the information from the HTML
    console.log('🤖 Using Claude to extract video information...');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `Extract the following information from this YouTube page HTML and return it as JSON:

1. Video title (exact title from the page)
2. Video description (first 200-300 characters)
3. Video duration in seconds (convert from MM:SS format to total seconds)
4. Language (Hebrew/English/other)
5. Chapters if available (with timestamps converted to seconds)

HTML Content:
${html.substring(0, 50000)} // First 50k chars to avoid token limits

Return ONLY valid JSON in this exact format:
{
  "title": "video title here",
  "description": "description here",
  "durationSeconds": 1234,
  "language": "Hebrew",
  "chapters": [
    {"title": "Chapter name", "startTimeSeconds": 0, "endTimeSeconds": 120},
    {"title": "Chapter name", "startTimeSeconds": 120, "endTimeSeconds": 300}
  ]
}

If chapters are not available, return an empty array.
If you cannot find duration, estimate based on typical video length or return 600 (10 minutes).
`
        }
      ]
    });

    // Parse Claude's response
    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Extract JSON from response (handle markdown code blocks and explanatory text)
    let jsonText = content.text.trim();

    // Remove markdown code blocks
    if (jsonText.includes('```json')) {
      const match = jsonText.match(/```json\s*([\s\S]*?)```/);
      if (match) {
        jsonText = match[1].trim();
      }
    } else if (jsonText.includes('```')) {
      const match = jsonText.match(/```\s*([\s\S]*?)```/);
      if (match) {
        jsonText = match[1].trim();
      }
    }

    // Find JSON object (starts with { and ends with })
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    console.log('📝 Extracted JSON:', jsonText.substring(0, 200) + '...');

    const extractedData = JSON.parse(jsonText);

    // Format chapters with order
    const chapters = extractedData.chapters.map((chapter: any, index: number) => ({
      title: chapter.title,
      startTime: chapter.startTimeSeconds,
      endTime: chapter.endTimeSeconds,
      order: index + 1,
    }));

    // If no chapters provided, create basic structure
    if (chapters.length === 0) {
      const duration = extractedData.durationSeconds;
      chapters.push(
        { title: 'מבוא', startTime: 0, endTime: Math.floor(duration * 0.2), order: 1 },
        { title: 'תוכן ראשי', startTime: Math.floor(duration * 0.2), endTime: Math.floor(duration * 0.8), order: 2 },
        { title: 'סיכום', startTime: Math.floor(duration * 0.8), endTime: duration, order: 3 }
      );
    }

    const videoData: VideoData = {
      youtubeId,
      title: extractedData.title,
      description: extractedData.description,
      duration: extractedData.durationSeconds,
      language: extractedData.language,
      chapters,
    };

    console.log('✅ Successfully extracted video data:');
    console.log(`   Title: ${videoData.title}`);
    console.log(`   Duration: ${videoData.duration}s (${Math.floor(videoData.duration / 60)}:${videoData.duration % 60})`);
    console.log(`   Language: ${videoData.language}`);
    console.log(`   Chapters: ${videoData.chapters.length}`);

    return videoData;

  } catch (error) {
    console.error(`❌ Error fetching data for ${youtubeId}:`, error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Fetching YouTube video data with AI...\n');

  const videoIds = ['zhkbBhrNn3s', '7oF2m3zivRY'];
  const results: VideoData[] = [];

  for (const videoId of videoIds) {
    const data = await fetchVideoData(videoId);
    results.push(data);

    // Wait a bit between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n📊 Summary of All Videos:\n');
  console.log('=' .repeat(80));

  results.forEach((video, index) => {
    console.log(`\nVideo ${index + 1} (${video.youtubeId}):`);
    console.log(`Title: ${video.title}`);
    console.log(`Description: ${video.description.substring(0, 100)}...`);
    console.log(`Duration: ${video.duration}s`);
    console.log(`Language: ${video.language}`);
    console.log(`Chapters: ${video.chapters.length}`);
    video.chapters.forEach(ch => {
      console.log(`  - ${ch.title} (${ch.startTime}s - ${ch.endTime}s)`);
    });
  });

  console.log('\n💾 Saving data to file...');

  // Save to a JSON file for easy reference
  const fs = require('fs');
  fs.writeFileSync(
    resolve(__dirname, '../video-data-extracted.json'),
    JSON.stringify(results, null, 2)
  );

  console.log('✅ Data saved to video-data-extracted.json');
  console.log('\n🎉 Done! Use this data to update src/data/video-config.ts');
}

main().catch(console.error);
