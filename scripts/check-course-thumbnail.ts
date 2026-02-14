import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const course = await prisma.course.findUnique({
    where: { id: 'ai-no-code' },
    include: {
      videos: {
        orderBy: { order: 'asc' },
      },
    },
  });

  console.log('Course:', course?.title);
  console.log('Course Thumbnail:', course?.thumbnail);
  console.log('Course Published:', course?.published);
  console.log('\nVideos:');
  course?.videos.forEach((v, i) => {
    console.log(`\n${i + 1}. ${v.title}`);
    console.log(`   Thumbnail: ${v.thumbnail}`);
    console.log(`   Published: ${v.published}`);
  });

  await prisma.$disconnect();
}

main();
