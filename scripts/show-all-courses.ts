/**
 * Show All Courses - Make all courses visible with proper thumbnails
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Publishing all courses and setting thumbnails...\n');

  // Update ai-tools course
  await prisma.course.update({
    where: { id: 'ai-tools' },
    data: {
      published: true,
      thumbnail: 'https://img.youtube.com/vi/mHThVfGmd6I/maxresdefault.jpg', // Use a default thumbnail
    },
  });
  console.log('✅ Published: כלי AI שכדאי להכיר');

  // Update automation-advanced course
  await prisma.course.update({
    where: { id: 'automation-advanced' },
    data: {
      published: true,
      thumbnail: 'https://img.youtube.com/vi/mHThVfGmd6I/maxresdefault.jpg', // Use a default thumbnail
    },
  });
  console.log('✅ Published: אוטומציות מתקדמות');

  console.log('\n📊 All courses are now published:\n');

  const courses = await prisma.course.findMany({
    where: { published: true },
    include: {
      videos: {
        where: { published: true },
      },
    },
    orderBy: { order: 'asc' },
  });

  courses.forEach((course) => {
    console.log(`✅ ${course.title}`);
    console.log(`   Videos: ${course.videos.length}`);
    console.log(`   Thumbnail: ${course.thumbnail}`);
    console.log('');
  });

  await prisma.$disconnect();
}

main().catch(console.error);
