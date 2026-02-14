/**
 * Cleanup and Finalize - Keep only the 3 videos in ai-no-code course
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up and finalizing...\n');

  try {
    // Delete empty courses
    console.log('Deleting empty courses...');
    await prisma.course.delete({ where: { id: 'test-course-1' } }).catch(() => console.log('  test-course-1 already deleted'));
    await prisma.course.delete({ where: { id: 'ai-tools' } }).catch(() => console.log('  ai-tools already deleted'));
    await prisma.course.delete({ where: { id: 'automation-advanced' } }).catch(() => console.log('  automation-advanced already deleted'));
    console.log('✅ Empty courses deleted\n');

    // Keep only ai-no-code course
    console.log('Updating ai-no-code course...');
    await prisma.course.update({
      where: { id: 'ai-no-code' },
      data: {
        published: true,
        order: 0,
      },
    });
    console.log('✅ ai-no-code course is ready\n');

    // Verify final state
    console.log('📊 Final State:');
    console.log('================\n');

    const courses = await prisma.course.findMany({
      where: { published: true },
      include: {
        videos: {
          where: { published: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    courses.forEach((course) => {
      console.log(`Course: ${course.title}`);
      console.log(`Videos: ${course.videos.length}`);
      course.videos.forEach((video, index) => {
        console.log(`  ${index + 1}. ${video.title}`);
        console.log(`     YouTube: https://www.youtube.com/watch?v=${video.youtubeId}`);
        console.log(`     Thumbnail: ${video.thumbnail}`);
      });
      console.log('');
    });

    console.log('🎉 Done! You should now see 1 course with 3 videos!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
