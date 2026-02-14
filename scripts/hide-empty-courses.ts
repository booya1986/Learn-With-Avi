/**
 * Hide Empty Courses - Only show courses with videos
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Hiding empty courses...\n');

  // Unpublish courses with no videos
  const result = await prisma.$executeRaw`
    UPDATE "Course"
    SET published = false
    WHERE id IN (
      SELECT c.id
      FROM "Course" c
      LEFT JOIN "Video" v ON c.id = v."courseId" AND v.published = true
      GROUP BY c.id
      HAVING COUNT(v.id) = 0
    )
  `;

  console.log(`✅ Unpublished ${result} empty courses\n`);

  // Show current state
  const courses = await prisma.course.findMany({
    include: {
      videos: {
        where: { published: true },
      },
    },
    orderBy: { order: 'asc' },
  });

  console.log('📊 Current courses:\n');
  courses.forEach((course) => {
    const status = course.published ? '✅ Published' : '❌ Hidden';
    console.log(`${status} - ${course.title}`);
    console.log(`   Videos: ${course.videos.length}`);
    console.log('');
  });

  await prisma.$disconnect();
}

main().catch(console.error);
