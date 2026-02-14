/**
 * Update Existing Videos in Database
 *
 * This script updates videos that already exist in the database
 * with new information from the config file.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';
import { videoConfigs } from '../src/data/video-config';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating existing videos in database...\n');

  const videosToUpdate = videoConfigs.filter(v =>
    v.youtubeId === 'zhkbBhrNn3s' || v.youtubeId === '7oF2m3zivRY'
  );

  console.log(`Found ${videosToUpdate.length} videos to update\n`);

  for (const videoConfig of videosToUpdate) {
    console.log(`📹 Updating: ${videoConfig.title}`);
    console.log(`   YouTube ID: ${videoConfig.youtubeId}`);

    try {
      // Update the video
      const video = await prisma.video.update({
        where: { youtubeId: videoConfig.youtubeId },
        data: {
          title: videoConfig.title,
          description: videoConfig.description || '',
          duration: videoConfig.duration || 600,
          thumbnail: videoConfig.thumbnail || `https://img.youtube.com/vi/${videoConfig.youtubeId}/maxresdefault.jpg`,
          topic: videoConfig.topics?.[0] || 'No-Code',
          tags: videoConfig.topics || ['No-Code', 'AI'],
          order: videoConfig.order || 1,
        },
      });

      console.log(`   ✅ Video updated`);

      // Delete existing chapters for this video
      await prisma.chapter.deleteMany({
        where: { videoId: video.id },
      });

      console.log(`   🗑️  Removed old chapters`);

      // Create new chapters
      if (videoConfig.chapters && videoConfig.chapters.length > 0) {
        for (let i = 0; i < videoConfig.chapters.length; i++) {
          const chapter = videoConfig.chapters[i];
          await prisma.chapter.create({
            data: {
              title: chapter.title,
              startTime: chapter.startTime,
              endTime: chapter.endTime,
              order: i + 1,
              videoId: video.id,
            },
          });
        }

        console.log(`   ✅ Created ${videoConfig.chapters.length} chapters`);
      }

      console.log('');
    } catch (error) {
      console.error(`   ❌ Error updating video:`, error);
    }
  }

  console.log('🎉 Update completed!');
  console.log('\n📊 Verifying updates...\n');

  // Verify the updates
  for (const videoConfig of videosToUpdate) {
    const video = await prisma.video.findUnique({
      where: { youtubeId: videoConfig.youtubeId },
      include: { chapters: true },
    });

    if (video) {
      console.log(`✅ ${video.title}`);
      console.log(`   Duration: ${video.duration}s`);
      console.log(`   Chapters: ${video.chapters.length}`);
      console.log('');
    }
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
