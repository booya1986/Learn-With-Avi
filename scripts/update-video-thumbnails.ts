/**
 * Update Video Thumbnails Script
 * ================================
 *
 * Updates the thumbnails for existing videos in the database
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🖼️  Updating video thumbnails...\n');

  try {
    // Update video 2
    const video2 = await prisma.video.update({
      where: { youtubeId: 'zhkbBhrNn3s' },
      data: {
        thumbnail: 'https://img.youtube.com/vi/zhkbBhrNn3s/maxresdefault.jpg',
        title: 'Video 2 Title', // Update with proper title
        description: 'Video 2 Description', // Update with proper description
      },
    });
    console.log(`✅ Updated: ${video2.youtubeId} - ${video2.title}`);

    // Update video 3
    const video3 = await prisma.video.update({
      where: { youtubeId: '7oF2m3zivRY' },
      data: {
        thumbnail: 'https://img.youtube.com/vi/7oF2m3zivRY/maxresdefault.jpg',
        title: 'Video 3 Title', // Update with proper title
        description: 'Video 3 Description', // Update with proper description
      },
    });
    console.log(`✅ Updated: ${video3.youtubeId} - ${video3.title}`);

    console.log('\n🎉 Thumbnails updated successfully!');
  } catch (error) {
    console.error('❌ Error updating thumbnails:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
