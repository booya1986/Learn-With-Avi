/**
 * Verify Videos Configuration
 * Checks if all videos are properly configured in the video-config.ts file
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'src', 'data', 'video-config.ts');
const configContent = fs.readFileSync(configPath, 'utf8');

// Extract video IDs from the configuration
const youtubeIdMatches = configContent.matchAll(/youtubeId:\s*['"]([^'"]+)['"]/g);
const videoIds = Array.from(youtubeIdMatches, match => match[1]);

console.log('========================================');
console.log('VIDEO CONFIGURATION VERIFICATION');
console.log('========================================\n');

console.log('Total videos configured:', videoIds.length);
console.log('\nVideo IDs found:');
videoIds.forEach((id, index) => {
  console.log(`  ${index + 1}. ${id}`);
});

console.log('\n========================================');
console.log('EXPECTED VIDEOS');
console.log('========================================\n');

const expectedVideos = ['mHThVfGmd6I', 'zhkbBhrNn3s', '7oF2m3zivRY'];

expectedVideos.forEach(id => {
  const found = videoIds.includes(id);
  const status = found ? '✓ FOUND' : '✗ MISSING';
  console.log(`  ${status}: ${id}`);
});

console.log('\n========================================');
console.log('CONFIGURATION STATUS');
console.log('========================================\n');

const allVideosPresent = expectedVideos.every(id => videoIds.includes(id));

if (allVideosPresent) {
  console.log('✓ All three videos are configured!');
  console.log('\nNext steps:');
  console.log('1. Visit http://localhost:3000 to see all videos');
  console.log('2. Update video titles, descriptions, and durations in:');
  console.log('   src/data/video-config.ts');
  console.log('3. Add actual transcripts to:');
  console.log('   - src/data/transcripts/zhkbBhrNn3s.ts');
  console.log('   - src/data/transcripts/7oF2m3zivRY.ts');
} else {
  console.log('✗ Some videos are missing from the configuration');
  console.log('\nMissing videos:');
  expectedVideos.forEach(id => {
    if (!videoIds.includes(id)) {
      console.log(`  - ${id}`);
    }
  });
}

console.log('\n========================================\n');
