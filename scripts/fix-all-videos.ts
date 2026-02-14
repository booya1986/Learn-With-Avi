/**
 * Fix All Videos - Make them identical in format
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing all videos to have consistent format...\n');

  try {
    // Update video 1
    const video1 = await prisma.video.update({
      where: { youtubeId: 'mHThVfGmd6I' },
      data: {
        title: 'איך בניתי אפליקציה שמייצרת סיכום קולי יומי של חדשות AI – לגמרי בלי קוד',
        description: 'בסרטון הזה אני מראה איך בניתי אפליקציה שמייצרת סיכום קולי יומי של חדשות AI באופן אוטומטי לחלוטין, בלי לכתוב שורת קוד אחת.',
        thumbnail: 'https://img.youtube.com/vi/mHThVfGmd6I/maxresdefault.jpg',
        duration: 1308,
        order: 1,
      },
    });
    console.log(`✅ Updated Video 1: ${video1.title.substring(0, 50)}...`);

    // Update video 2
    const video2 = await prisma.video.update({
      where: { youtubeId: 'zhkbBhrNn3s' },
      data: {
        title: 'Video 2 Title - UPDATE WITH ACTUAL TITLE',
        description: 'Video 2 Description - UPDATE WITH ACTUAL DESCRIPTION',
        thumbnail: 'https://img.youtube.com/vi/zhkbBhrNn3s/maxresdefault.jpg',
        duration: 600,
        order: 2,
      },
    });
    console.log(`✅ Updated Video 2: ${video2.title}`);

    // Update video 3
    const video3 = await prisma.video.update({
      where: { youtubeId: '7oF2m3zivRY' },
      data: {
        title: 'Video 3 Title - UPDATE WITH ACTUAL TITLE',
        description: 'Video 3 Description - UPDATE WITH ACTUAL DESCRIPTION',
        thumbnail: 'https://img.youtube.com/vi/7oF2m3zivRY/maxresdefault.jpg',
        duration: 600,
        order: 3,
      },
    });
    console.log(`✅ Updated Video 3: ${video3.title}`);

    console.log('\n🎉 All videos updated successfully!');
    console.log('\nAll videos now use the same thumbnail format:');
    console.log('https://img.youtube.com/vi/{VIDEO_ID}/maxresdefault.jpg');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
