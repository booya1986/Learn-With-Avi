/**
 * Set Unique Thumbnails for Each Course
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎨 Setting unique thumbnails for each course...\n');

  // Course 1: ai-no-code - Uses first video thumbnail
  await prisma.course.update({
    where: { id: 'ai-no-code' },
    data: {
      thumbnail: 'https://img.youtube.com/vi/mHThVfGmd6I/maxresdefault.jpg',
    },
  });
  console.log('✅ ai-no-code: mHThVfGmd6I thumbnail');

  // Course 2: ai-tools - Uses second video thumbnail
  await prisma.course.update({
    where: { id: 'ai-tools' },
    data: {
      thumbnail: 'https://img.youtube.com/vi/zhkbBhrNn3s/maxresdefault.jpg',
    },
  });
  console.log('✅ ai-tools: zhkbBhrNn3s thumbnail');

  // Course 3: automation-advanced - Uses third video thumbnail
  await prisma.course.update({
    where: { id: 'automation-advanced' },
    data: {
      thumbnail: 'https://img.youtube.com/vi/7oF2m3zivRY/maxresdefault.jpg',
    },
  });
  console.log('✅ automation-advanced: 7oF2m3zivRY thumbnail');

  console.log('\n📊 Courses updated:\n');

  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { order: 'asc' },
  });

  courses.forEach((course, i) => {
    console.log(`${i + 1}. ${course.title}`);
    console.log(`   Thumbnail: ${course.thumbnail}`);
    console.log('');
  });

  await prisma.$disconnect();
}

main().catch(console.error);
