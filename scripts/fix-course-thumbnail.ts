/**
 * Fix Course Thumbnail - Use first video's YouTube thumbnail
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing course thumbnail...\n');

  // Update the course to use the first video's thumbnail
  const course = await prisma.course.update({
    where: { id: 'ai-no-code' },
    data: {
      thumbnail: 'https://img.youtube.com/vi/mHThVfGmd6I/maxresdefault.jpg',
    },
  });

  console.log('✅ Course thumbnail updated!');
  console.log(`   Course: ${course.title}`);
  console.log(`   New Thumbnail: ${course.thumbnail}\n`);

  await prisma.$disconnect();
}

main().catch(console.error);
