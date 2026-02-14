/**
 * Get Complete Video Data including chapters
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📹 Getting complete data for Video 1...\n');

  try {
    const video1 = await prisma.video.findUnique({
      where: { youtubeId: 'mHThVfGmd6I' },
      include: {
        chapters: {
          orderBy: { order: 'asc' },
        },
        course: true,
      },
    });

    if (video1) {
      console.log('Video 1 Complete Data:');
      console.log('======================');
      console.log('ID:', video1.id);
      console.log('YouTube ID:', video1.youtubeId);
      console.log('Title:', video1.title);
      console.log('Description:', video1.description);
      console.log('Duration:', video1.duration, 'seconds');
      console.log('Thumbnail:', video1.thumbnail);
      console.log('Topic:', video1.topic);
      console.log('Tags:', video1.tags);
      console.log('Course ID:', video1.courseId);
      console.log('Order:', video1.order);
      console.log('Published:', video1.published);
      console.log('\nChapters:');
      video1.chapters.forEach((chapter, index) => {
        console.log(`  ${index + 1}. ${chapter.title}`);
        console.log(`     Start: ${chapter.startTime}s, End: ${chapter.endTime}s, Order: ${chapter.order}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
