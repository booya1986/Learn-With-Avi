/**
 * Migration Script: Config Files to Database
 * ===========================================
 *
 * This script migrates course and video data from TypeScript config files
 * to the PostgreSQL database.
 *
 * Usage:
 *   npm run migrate:config
 *
 * What it does:
 *   1. Reads courseConfigs and videoConfigs from src/data/video-config.ts
 *   2. Creates Course records in the database
 *   3. Creates Video records with chapters
 *   4. Handles errors gracefully
 *   5. Logs progress
 */

import { PrismaClient } from '@prisma/client';
import { courseConfigs, videoConfigs } from '../src/data/video-config';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting migration from config to database...\n');

  let coursesCreated = 0;
  let videosCreated = 0;
  let chaptersCreated = 0;

  try {
    // Migrate courses
    console.log('📚 Migrating courses...');
    for (const courseConfig of courseConfigs) {
      // Check if course already exists
      const existingCourse = await prisma.course.findFirst({
        where: { id: courseConfig.id },
      });

      if (existingCourse) {
        console.log(`  ⏭️  Course "${courseConfig.title}" already exists. Skipping...`);
        continue;
      }

      // Create course
      const course = await prisma.course.create({
        data: {
          id: courseConfig.id,
          title: courseConfig.title,
          description: courseConfig.description,
          difficulty: courseConfig.difficulty,
          topics: courseConfig.topics,
          thumbnail: courseConfig.thumbnail || 'https://placehold.co/640x360?text=Course',
          published: true, // Publish by default
          order: coursesCreated,
        },
      });

      console.log(`  ✅ Created course: ${course.title}`);
      coursesCreated++;
    }

    console.log(`\n✅ Migrated ${coursesCreated} courses\n`);

    // Migrate videos
    console.log('🎥 Migrating videos...');
    for (const videoConfig of videoConfigs) {
      // Check if video already exists
      const existingVideo = await prisma.video.findUnique({
        where: { youtubeId: videoConfig.youtubeId },
      });

      if (existingVideo) {
        console.log(`  ⏭️  Video "${videoConfig.title}" already exists. Skipping...`);
        continue;
      }

      // Verify course exists
      const course = await prisma.course.findUnique({
        where: { id: videoConfig.courseId },
      });

      if (!course) {
        console.warn(`  ⚠️  Course "${videoConfig.courseId}" not found for video "${videoConfig.title}". Skipping...`);
        continue;
      }

      // Create video with chapters
      const video = await prisma.video.create({
        data: {
          youtubeId: videoConfig.youtubeId,
          title: videoConfig.title,
          description: videoConfig.description || '',
          duration: videoConfig.duration || 0,
          thumbnail: videoConfig.thumbnail || `https://img.youtube.com/vi/${videoConfig.youtubeId}/maxresdefault.jpg`,
          topic: videoConfig.topics?.[0] || 'General',
          tags: videoConfig.topics || [],
          courseId: videoConfig.courseId,
          order: videoConfig.order || 0,
          published: true, // Publish by default
          chapters: {
            create: videoConfig.chapters?.map((chapter, index) => ({
              title: chapter.title,
              startTime: chapter.startTime,
              endTime: chapter.endTime,
              order: index,
            })) || [],
          },
        },
        include: {
          chapters: true,
        },
      });

      console.log(`  ✅ Created video: ${video.title} (${video.chapters.length} chapters)`);
      videosCreated++;
      chaptersCreated += video.chapters.length;
    }

    console.log(`\n✅ Migrated ${videosCreated} videos with ${chaptersCreated} chapters\n`);

    console.log('🎉 Migration completed successfully!');
    console.log('\nSummary:');
    console.log(`  - Courses: ${coursesCreated}`);
    console.log(`  - Videos: ${videosCreated}`);
    console.log(`  - Chapters: ${chaptersCreated}`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
