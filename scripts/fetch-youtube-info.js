/**
 * Fetch YouTube Video Information
 * Simple script to get video metadata without TypeScript complications
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
let YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/YOUTUBE_API_KEY=(.+)/);
    if (match) {
      YOUTUBE_API_KEY = match[1].trim();
    }
  } catch (error) {
    // Ignore if file doesn't exist
  }
}

function fetchVideoInfo(videoId) {
  return new Promise((resolve, reject) => {
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${YOUTUBE_API_KEY}&part=snippet,contentDetails`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

function parseDuration(isoDuration) {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

async function main() {
  if (!YOUTUBE_API_KEY) {
    console.error('ERROR: YOUTUBE_API_KEY not found in .env.local');
    process.exit(1);
  }

  const videoIds = ['zhkbBhrNn3s', '7oF2m3zivRY'];

  for (const videoId of videoIds) {
    console.log('\n========================================');
    console.log('Video ID:', videoId);
    console.log('========================================');

    try {
      const response = await fetchVideoInfo(videoId);

      if (!response.items || response.items.length === 0) {
        console.log('ERROR: Video not found or is private/deleted');
        continue;
      }

      const video = response.items[0];
      const snippet = video.snippet;
      const contentDetails = video.contentDetails;

      const durationSeconds = parseDuration(contentDetails.duration);
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;

      console.log('Title:', snippet.title);
      console.log('Channel:', snippet.channelTitle);
      console.log('Published:', snippet.publishedAt);
      console.log('Duration:', `${minutes}:${seconds.toString().padStart(2, '0')} (${durationSeconds} seconds)`);
      console.log('\nDescription (first 300 chars):');
      console.log(snippet.description.substring(0, 300) + '...');
      console.log('\nThumbnail:', snippet.thumbnails?.maxresdefault?.url || snippet.thumbnails?.high?.url);

      // Output as JSON for easy parsing
      console.log('\n--- JSON ---');
      console.log(JSON.stringify({
        youtubeId: videoId,
        title: snippet.title,
        description: snippet.description,
        duration: durationSeconds,
        channelTitle: snippet.channelTitle,
        publishedAt: snippet.publishedAt,
        thumbnail: snippet.thumbnails?.maxresdefault?.url || snippet.thumbnails?.high?.url
      }, null, 2));

    } catch (error) {
      console.error('ERROR fetching video:', error.message);
    }
  }
}

main().catch(console.error);
