/**
 * Check all courses and their videos
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📚 Checking all courses...\n');

  try {
    const courses = await prisma.course.findMany({
      include: {
        videos: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    console.log(`Found ${courses.length} courses:\n`);

    courses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title}`);
      console.log(`   ID: ${course.id}`);
      console.log(`   Published: ${course.published}`);
      console.log(`   Videos: ${course.videos.length}`);
      course.videos.forEach((video, vIndex) => {
        console.log(`     ${vIndex + 1}. ${video.title} (${video.youtubeId})`);
      });
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
