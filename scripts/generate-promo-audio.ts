/**
 * Generate all audio assets for the promo video using ElevenLabs APIs
 *
 * Usage:
 *   npx tsx scripts/generate-promo-audio.ts
 *
 * Requires:
 *   ELEVENLABS_API_KEY in .env.local
 *
 * Generates:
 *   public/audio/promo/narration-*.mp3  (6 narration clips)
 *   public/audio/promo/sfx-*.mp3        (6 sound effects)
 *   public/audio/promo/music-ambient.mp3 (1 background track)
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Rachel
const OUTPUT_DIR = path.resolve(__dirname, "../public/audio/promo");

if (!API_KEY) {
  console.error("❌ ELEVENLABS_API_KEY not found in .env.local");
  process.exit(1);
}

// --- Narration lines (Apple-style: short, confident, declarative) ---
const narrationLines = [
  { id: "1-intro", text: "Introducing a smarter way to learn." },
  { id: "2-chat", text: "Ask anything. Get instant, intelligent answers." },
  { id: "3-voice", text: "Have a real conversation. In any language." },
  { id: "4-video", text: "Every video, made smarter." },
  { id: "5-stats", text: "Real results that speak for themselves." },
  { id: "6-cta", text: "Start your journey today. It's free." },
];

// --- Sound effects prompts ---
const sfxPrompts = [
  {
    id: "bass-boom",
    text: "soft deep sub bass note, warm and round, like an Apple product reveal, minimal low tone",
    duration: 2,
  },
  {
    id: "whoosh-1",
    text: "very soft gentle tonal sweep, clean minimal transition, like a quiet breath of air, Apple keynote style",
    duration: 1,
  },
  {
    id: "whoosh-2",
    text: "soft gentle tonal transition, clean airy sweep, minimal and elegant, Apple style",
    duration: 1,
  },
  {
    id: "whoosh-3",
    text: "gentle soft tonal shift, clean airy minimal transition, elegant and quiet",
    duration: 1,
  },
  {
    id: "rising-tone",
    text: "gentle soft ascending tone, clean digital chime, minimal and warm, Apple notification style",
    duration: 1.5,
  },
  {
    id: "button-click",
    text: "soft satisfying click pop, premium Apple UI button sound, gentle and minimal",
    duration: 0.5,
  },
  {
    id: "counting-tick",
    text: "soft rapid digital counting tick, clean minimal beep, like a scorecard number ticking up",
    duration: 2,
  },
];

// --- Background music prompt ---
const musicPrompt = {
  id: "ambient",
  text: "subtle ambient electronic pad, minimal, cinematic, soft warm synthesizer drone, gentle and calming background music",
  duration: 22,
};

async function generateNarration(
  text: string,
  outputFile: string
): Promise<void> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": API_KEY!,
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.7, // Steadier for narration
        similarity_boost: 0.8,
        style: 0.15, // Slight warmth
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`TTS failed (${response.status}): ${err}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputFile, buffer);
}

async function generateSFX(
  text: string,
  durationSeconds: number,
  outputFile: string
): Promise<void> {
  const url = "https://api.elevenlabs.io/v1/sound-generation";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": API_KEY!,
    },
    body: JSON.stringify({
      text,
      duration_seconds: durationSeconds,
      prompt_influence: 0.3,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`SFX generation failed (${response.status}): ${err}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputFile, buffer);
}

async function main() {
  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log("🎙️  Generating narration clips...\n");

  for (const line of narrationLines) {
    const outputFile = path.join(OUTPUT_DIR, `narration-${line.id}.mp3`);

    // Skip if already generated
    if (fs.existsSync(outputFile)) {
      console.log(`   ⏭️  narration-${line.id}.mp3 (exists, skipping)`);
      continue;
    }

    process.stdout.write(`   🔊 "${line.text}" → narration-${line.id}.mp3`);
    await generateNarration(line.text, outputFile);
    const size = (fs.statSync(outputFile).size / 1024).toFixed(1);
    console.log(` (${size}KB)`);
  }

  console.log("\n🎵 Generating sound effects...\n");

  for (const sfx of sfxPrompts) {
    const outputFile = path.join(OUTPUT_DIR, `sfx-${sfx.id}.mp3`);

    if (fs.existsSync(outputFile)) {
      console.log(`   ⏭️  sfx-${sfx.id}.mp3 (exists, skipping)`);
      continue;
    }

    process.stdout.write(
      `   💥 "${sfx.text.slice(0, 40)}..." → sfx-${sfx.id}.mp3`
    );
    await generateSFX(sfx.text, sfx.duration, outputFile);
    const size = (fs.statSync(outputFile).size / 1024).toFixed(1);
    console.log(` (${size}KB)`);
  }

  console.log("\n🎶 Generating background music...\n");

  const musicFile = path.join(OUTPUT_DIR, `music-${musicPrompt.id}.mp3`);
  if (fs.existsSync(musicFile)) {
    console.log(`   ⏭️  music-${musicPrompt.id}.mp3 (exists, skipping)`);
  } else {
    process.stdout.write(
      `   🎹 ambient pad (${musicPrompt.duration}s) → music-${musicPrompt.id}.mp3`
    );
    await generateSFX(musicPrompt.text, musicPrompt.duration, musicFile);
    const size = (fs.statSync(musicFile).size / 1024).toFixed(1);
    console.log(` (${size}KB)`);
  }

  // Summary
  const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith(".mp3"));
  const totalSize = files.reduce(
    (sum, f) => sum + fs.statSync(path.join(OUTPUT_DIR, f)).size,
    0
  );

  console.log(`\n✅ Done! Generated ${files.length} audio files`);
  console.log(
    `📁 Output: public/audio/promo/ (${(totalSize / 1024).toFixed(0)}KB total)`
  );
  console.log(`\nFiles:`);
  for (const f of files.sort()) {
    const size = (fs.statSync(path.join(OUTPUT_DIR, f)).size / 1024).toFixed(1);
    console.log(`   ${f} (${size}KB)`);
  }
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
