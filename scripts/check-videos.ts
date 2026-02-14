/**
 * Check Videos in Database
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📹 Checking videos in database...\n');

  try {
    const videos = await prisma.video.findMany({
      orderBy: { order: 'asc' },
      select: {
        id: true,
        youtubeId: true,
        title: true,
        thumbnail: true,
        order: true,
        published: true,
      },
    });

    console.log(`Found ${videos.length} videos:\n`);

    videos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`);
      console.log(`   YouTube ID: ${video.youtubeId}`);
      console.log(`   Thumbnail: ${video.thumbnail}`);
      console.log(`   Order: ${video.order}`);
      console.log(`   Published: ${video.published}`);
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
