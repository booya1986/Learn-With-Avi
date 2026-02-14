/**
 * Render the LearnWithAvi promotional video for WhatsApp
 *
 * Usage:
 *   npx tsx scripts/render-promo.ts
 *
 * Output: out/promo-whatsapp.mp4
 *
 * WhatsApp specs:
 * - Format: MP4 (H.264)
 * - Resolution: 1080x1920 (vertical/portrait)
 * - Duration: ~21.5 seconds (fast-paced)
 * - Max file size: 16MB (we target ~4MB)
 */

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";

async function renderPromo() {
  console.log("📦 Bundling Remotion project...");

  const bundleLocation = await bundle({
    entryPoint: path.resolve(__dirname, "../remotion/index.ts"),
    webpackOverride: (config) => config,
  });

  console.log("🎬 Selecting composition...");

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "PromoVideo",
  });

  const outputPath = path.resolve(__dirname, "../out/promo-whatsapp.mp4");

  console.log("🎥 Rendering video...");
  console.log(`   Resolution: ${composition.width}x${composition.height}`);
  console.log(`   Duration: ${composition.durationInFrames / composition.fps}s`);
  console.log(`   Output: ${outputPath}`);

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: outputPath,
    // WhatsApp-optimized settings
    videoBitrate: "2M", // High quality, ~4MB for 21s video
    audioBitrate: "128K",
    audioCodec: "aac",
  });

  console.log(`\n✅ Video rendered successfully!`);
  console.log(`📁 Output: ${outputPath}`);
  console.log(`📱 Ready to share on WhatsApp!`);
}

renderPromo().catch((err) => {
  console.error("❌ Render failed:", err);
  process.exit(1);
});
