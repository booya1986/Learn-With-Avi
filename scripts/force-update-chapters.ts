/**
 * Force Update Chapters Script
 * =============================
 *
 * This script forces an update of all chapters from video-config.ts to the database.
 * It deletes existing chapters and recreates them with the latest configuration.
 *
 * Usage:
 *   npx tsx scripts/force-update-chapters.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';
import { videoConfigs } from '../src/data/video-config';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Force updating chapters from config to database...\n');

  let videosUpdated = 0;
  let chaptersDeleted = 0;
  let chaptersCreated = 0;

  try {
    for (const videoConfig of videoConfigs) {
      // Find the video in database
      const existingVideo = await prisma.video.findUnique({
        where: { youtubeId: videoConfig.youtubeId },
        include: { chapters: true },
      });

      if (!existingVideo) {
        console.log(`  ⏭️  Video "${videoConfig.title}" not found in database. Skipping...`);
        continue;
      }

      console.log(`\n📹 Updating video: ${videoConfig.title}`);
      console.log(`   YouTube ID: ${videoConfig.youtubeId}`);

      // Delete existing chapters
      if (existingVideo.chapters.length > 0) {
        const deleteResult = await prisma.chapter.deleteMany({
          where: { videoId: existingVideo.id },
        });
        console.log(`   🗑️  Deleted ${deleteResult.count} existing chapters`);
        chaptersDeleted += deleteResult.count;
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
          chaptersCreated++;
        }
        console.log(`   ✅ Created ${videoConfig.chapters.length} chapters`);
        videosUpdated++;
      } else {
        console.log(`   ⚠️  No chapters defined in config`);
      }
    }

    console.log(`\n🎉 Update completed successfully!\n`);
    console.log(`Summary:`);
    console.log(`  - Videos updated: ${videosUpdated}`);
    console.log(`  - Chapters deleted: ${chaptersDeleted}`);
    console.log(`  - Chapters created: ${chaptersCreated}`);

  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
