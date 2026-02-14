/**
 * Automated Transcript Generation Script
 * ========================================
 *
 * Generates transcripts for YouTube videos automatically:
 * 1. Tries YouTube auto-captions first (free, instant)
 * 2. Falls back to OpenAI Whisper API (requires audio download)
 * 3. Auto-updates the transcript registry
 *
 * Usage:
 *   npx tsx scripts/generate-transcript.ts <youtube-id>       # Single video
 *   npx tsx scripts/generate-transcript.ts --all              # All videos without transcripts
 *   npx tsx scripts/generate-transcript.ts --check            # Check which videos need transcripts
 *
 * Prerequisites for Whisper fallback:
 *   brew install yt-dlp ffmpeg  # macOS
 *   pip install yt-dlp          # or via pip
 */

import { config } from 'dotenv';
import { resolve, join } from 'path';
import { writeFileSync, existsSync, readFileSync, unlinkSync, mkdirSync } from 'fs';
import { execSync, spawn } from 'child_process';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

import { YoutubeTranscript } from 'youtube-transcript';
import OpenAI from 'openai';
import { createReadStream } from 'fs';

// Types
interface TranscriptItem {
  text: string;
  duration: number;
  offset: number;
}

interface TranscriptChunk {
  id: string;
  videoId: string;
  text: string;
  startTime: number;
  endTime: number;
}

// Configuration
const TRANSCRIPTS_DIR = resolve(__dirname, '../src/data/transcripts');
const TEMP_DIR = resolve(__dirname, '../.temp');
const TARGET_CHUNK_DURATION = 25; // seconds

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Video configurations (imported from video-config.ts)
 */
async function getVideoConfigs() {
  const { videoConfigs } = await import('../src/data/video-config');
  return videoConfigs;
}

/**
 * Check if a video has a transcript with actual content
 */
function hasTranscriptContent(videoId: string): boolean {
  const filePath = join(TRANSCRIPTS_DIR, `${videoId}.ts`);

  if (!existsSync(filePath)) {
    return false;
  }

  const content = readFileSync(filePath, 'utf-8');
  // Check if the transcriptChunks array has actual content (not empty)
  const hasContent = content.includes('transcriptChunks: TranscriptChunk[] = [') &&
    !content.includes('transcriptChunks: TranscriptChunk[] = [\n\n];') &&
    !content.includes('transcriptChunks: TranscriptChunk[] = [];');

  // Also check if there are actual chunk entries
  const chunkCount = (content.match(/id: '/g) || []).length;
  return chunkCount > 0;
}

/**
 * Check which videos need transcripts
 */
async function checkMissingTranscripts(): Promise<string[]> {
  const configs = await getVideoConfigs();
  const missing: string[] = [];

  for (const config of configs) {
    if (!hasTranscriptContent(config.youtubeId)) {
      missing.push(config.youtubeId);
    }
  }

  return missing;
}

/**
 * Fetch transcript from YouTube auto-captions
 */
async function fetchYouTubeTranscript(videoId: string): Promise<TranscriptItem[] | null> {
  try {
    console.log('  📝 Fetching YouTube auto-captions...');
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'he', // Try Hebrew first
    });

    if (transcript && transcript.length > 0) {
      console.log(`  ✅ Found ${transcript.length} segments (Hebrew)`);
      return transcript;
    }
  } catch {
    // Try English if Hebrew not available
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: 'en',
      });

      if (transcript && transcript.length > 0) {
        console.log(`  ✅ Found ${transcript.length} segments (English)`);
        return transcript;
      }
    } catch {
      // Try without language preference
      try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);

        if (transcript && transcript.length > 0) {
          console.log(`  ✅ Found ${transcript.length} segments (auto-detect)`);
          return transcript;
        }
      } catch {
        console.log('  ⚠️  No YouTube captions available');
      }
    }
  }

  return null;
}

/**
 * Check if yt-dlp is installed
 */
function isYtDlpInstalled(): boolean {
  try {
    execSync('which yt-dlp', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Download audio from YouTube using yt-dlp
 */
async function downloadAudio(videoId: string): Promise<string | null> {
  if (!isYtDlpInstalled()) {
    console.log('  ❌ yt-dlp not installed. Install with: brew install yt-dlp');
    return null;
  }

  // Create temp directory if it doesn't exist
  if (!existsSync(TEMP_DIR)) {
    mkdirSync(TEMP_DIR, { recursive: true });
  }

  const outputPath = join(TEMP_DIR, `${videoId}.mp3`);
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  console.log('  📥 Downloading audio with yt-dlp...');

  return new Promise((resolve) => {
    const process = spawn('yt-dlp', [
      '-x',
      '--audio-format', 'mp3',
      '--audio-quality', '0',
      '-o', outputPath,
      url,
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderr = '';

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0 && existsSync(outputPath)) {
        console.log('  ✅ Audio downloaded successfully');
        resolve(outputPath);
      } else {
        console.log('  ❌ Failed to download audio');
        if (stderr) {
          console.log('  Error:', stderr.slice(0, 200));
        }
        resolve(null);
      }
    });

    process.on('error', () => {
      console.log('  ❌ yt-dlp process error');
      resolve(null);
    });
  });
}

/**
 * Transcribe audio using OpenAI Whisper API
 */
async function transcribeWithWhisper(audioPath: string): Promise<TranscriptItem[] | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.log('  ❌ OPENAI_API_KEY not set. Cannot use Whisper.');
    return null;
  }

  console.log('  🎤 Transcribing with OpenAI Whisper...');

  try {
    const response = await openai.audio.transcriptions.create({
      file: createReadStream(audioPath),
      model: 'whisper-1',
      language: 'he', // Hebrew
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    // Clean up audio file
    unlinkSync(audioPath);

    if (response.segments && response.segments.length > 0) {
      console.log(`  ✅ Transcribed ${response.segments.length} segments`);

      // Convert Whisper segments to our format
      return response.segments.map((seg) => ({
        text: seg.text,
        offset: Math.floor(seg.start * 1000), // Convert to ms
        duration: Math.floor((seg.end - seg.start) * 1000),
      }));
    }

    return null;
  } catch (error) {
    console.log('  ❌ Whisper transcription failed:', error instanceof Error ? error.message : 'Unknown error');

    // Clean up audio file on error
    if (existsSync(audioPath)) {
      unlinkSync(audioPath);
    }

    return null;
  }
}

/**
 * Merge transcript items into chunks (20-30 seconds each)
 */
function mergeIntoChunks(items: TranscriptItem[], videoId: string): TranscriptChunk[] {
  const chunks: TranscriptChunk[] = [];
  let currentChunk: { text: string; startTime: number; duration: number } | null = null;
  let chunkIndex = 1;

  for (const item of items) {
    const itemStartTime = Math.floor(item.offset / 1000);
    const itemDuration = Math.floor(item.duration / 1000);

    if (!currentChunk) {
      currentChunk = {
        text: item.text.trim(),
        startTime: itemStartTime,
        duration: itemDuration,
      };
    } else if (currentChunk.duration < TARGET_CHUNK_DURATION) {
      currentChunk.text += ' ' + item.text.trim();
      currentChunk.duration += itemDuration;
    } else {
      chunks.push({
        id: `${videoId}-chunk-${String(chunkIndex).padStart(3, '0')}`,
        videoId: videoId,
        text: currentChunk.text,
        startTime: currentChunk.startTime,
        endTime: currentChunk.startTime + currentChunk.duration,
      });
      chunkIndex++;
      currentChunk = {
        text: item.text.trim(),
        startTime: itemStartTime,
        duration: itemDuration,
      };
    }
  }

  if (currentChunk) {
    chunks.push({
      id: `${videoId}-chunk-${String(chunkIndex).padStart(3, '0')}`,
      videoId: videoId,
      text: currentChunk.text,
      startTime: currentChunk.startTime,
      endTime: currentChunk.startTime + currentChunk.duration,
    });
  }

  return chunks;
}

/**
 * Generate TypeScript transcript file content
 */
function generateTranscriptFile(videoId: string, chunks: TranscriptChunk[]): string {
  const chunksCode = chunks
    .map(
      (chunk) => `  {
    id: '${chunk.id}',
    videoId: '${chunk.videoId}',
    text: \`${chunk.text.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`,
    startTime: ${chunk.startTime},
    endTime: ${chunk.endTime},
  }`
    )
    .join(',\n');

  return `import { TranscriptChunk } from '@/types';

/**
 * Transcript chunks for YouTube video: ${videoId}
 * Auto-generated on ${new Date().toISOString().split('T')[0]}
 */
export const transcriptChunks: TranscriptChunk[] = [
${chunksCode}
];

/**
 * Video summary
 * TODO: Generate using Claude API or add manually
 */
export const videoSummary = \`
## סיכום הסרטון

[Video summary will be auto-generated]

### נושאים עיקריים:
1. [Topic 1]
2. [Topic 2]
3. [Topic 3]

### טיפים חשובים:
- [Key tip 1]
- [Key tip 2]
\`;

/**
 * Get all transcript chunks for this video
 */
export function getTranscriptChunks(): TranscriptChunk[] {
  return transcriptChunks;
}

/**
 * Get video summary
 */
export function getSummary(): string {
  return videoSummary;
}
`;
}

/**
 * Update the transcript registry index file
 */
function updateTranscriptRegistry(videoId: string): void {
  const indexPath = join(TRANSCRIPTS_DIR, 'index.ts');
  let indexContent = readFileSync(indexPath, 'utf-8');

  // Check if already registered
  if (indexContent.includes(`'./${videoId}'`) || indexContent.includes(`'./${videoId}.ts'`)) {
    console.log('  ℹ️  Already registered in index.ts');
    return;
  }

  // Add import statement
  const importLine = `import { transcriptChunks as ${videoId.replace(/-/g, '_')}Chunks } from './${videoId}';`;

  // Find the last import line and add after it
  const lastImportMatch = indexContent.match(/^import .+;$/gm);
  if (lastImportMatch) {
    const lastImport = lastImportMatch[lastImportMatch.length - 1];
    indexContent = indexContent.replace(lastImport, `${lastImport}\n${importLine}`);
  }

  // Add to registry object
  const registryEntry = `\n  '${videoId}': ${videoId.replace(/-/g, '_')}Chunks,`;

  // Find the closing of the registry object and add before it
  indexContent = indexContent.replace(
    /};(\s*\/\*\*)/,
    `${registryEntry}\n};$1`
  );

  writeFileSync(indexPath, indexContent);
  console.log('  ✅ Updated transcript registry (index.ts)');
}

/**
 * Generate transcript for a single video
 */
async function generateTranscript(videoId: string): Promise<boolean> {
  console.log(`\n🎥 Processing video: ${videoId}`);

  // Check if already has transcript
  if (hasTranscriptContent(videoId)) {
    console.log('  ✅ Transcript already exists with content');
    return true;
  }

  // Try YouTube captions first
  let items = await fetchYouTubeTranscript(videoId);

  // Fall back to Whisper if needed
  if (!items) {
    console.log('  🔄 Falling back to Whisper API...');

    const audioPath = await downloadAudio(videoId);
    if (audioPath) {
      items = await transcribeWithWhisper(audioPath);
    }
  }

  if (!items || items.length === 0) {
    console.log('  ❌ Could not generate transcript');
    console.log('  💡 Options:');
    console.log('     1. Install yt-dlp: brew install yt-dlp');
    console.log('     2. Set OPENAI_API_KEY in .env.local');
    console.log('     3. Manually add transcript to the file');
    return false;
  }

  // Merge into chunks
  console.log('  🔄 Processing transcript into chunks...');
  const chunks = mergeIntoChunks(items, videoId);
  console.log(`  ✅ Created ${chunks.length} chunks`);

  // Generate and save file
  const content = generateTranscriptFile(videoId, chunks);
  const filePath = join(TRANSCRIPTS_DIR, `${videoId}.ts`);
  writeFileSync(filePath, content);
  console.log(`  💾 Saved to: ${filePath}`);

  // Update registry
  updateTranscriptRegistry(videoId);

  return true;
}

/**
 * Main CLI handler
 */
async function main() {
  const arg = process.argv[2];

  if (!arg) {
    console.log('Usage:');
    console.log('  npx tsx scripts/generate-transcript.ts <youtube-id>  # Single video');
    console.log('  npx tsx scripts/generate-transcript.ts --all         # All missing');
    console.log('  npx tsx scripts/generate-transcript.ts --check       # Check status');
    process.exit(1);
  }

  console.log('🚀 Transcript Generator\n');

  if (arg === '--check') {
    console.log('📋 Checking transcript status...\n');
    const configs = await getVideoConfigs();

    for (const config of configs) {
      const hasContent = hasTranscriptContent(config.youtubeId);
      const status = hasContent ? '✅' : '❌';
      console.log(`${status} ${config.youtubeId}: ${config.title.slice(0, 50)}...`);
    }

    const missing = await checkMissingTranscripts();
    console.log(`\n📊 Summary: ${configs.length - missing.length}/${configs.length} videos have transcripts`);

    if (missing.length > 0) {
      console.log(`\n💡 Run 'npx tsx scripts/generate-transcript.ts --all' to generate missing transcripts`);
    }

    return;
  }

  if (arg === '--all') {
    console.log('🔄 Generating all missing transcripts...\n');
    const missing = await checkMissingTranscripts();

    if (missing.length === 0) {
      console.log('✅ All videos have transcripts!');
      return;
    }

    console.log(`Found ${missing.length} videos without transcripts:\n`);

    let success = 0;
    let failed = 0;

    for (const videoId of missing) {
      const result = await generateTranscript(videoId);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    console.log(`\n📊 Summary: ${success} succeeded, ${failed} failed`);
    return;
  }

  // Single video
  await generateTranscript(arg);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
