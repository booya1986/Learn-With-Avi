/**
 * Setup All Three Videos - Complete Migration
 * ============================================
 *
 * This script ensures all three videos are set up identically with:
 * - Proper YouTube thumbnails
 * - Correct course assignment (ai-no-code)
 * - Proper ordering
 * - Placeholder chapters
 * - Published status
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Setting up all three videos...\n');

  try {
    // First, ensure the ai-no-code course exists
    const course = await prisma.course.upsert({
      where: { id: 'ai-no-code' },
      update: {},
      create: {
        id: 'ai-no-code',
        title: 'בניית אפליקציות AI ללא קוד',
        description: 'למד איך לבנות אפליקציות AI מתקדמות בלי לכתוב שורת קוד אחת. מסיכומים קוליים ועד אוטומציות חכמות.',
        difficulty: 'beginner',
        topics: ['No-Code', 'AI', 'Automation'],
        thumbnail: 'https://img.youtube.com/vi/mHThVfGmd6I/maxresdefault.jpg',
        published: true,
        order: 0,
      },
    });
    console.log(`✅ Course ready: ${course.title}\n`);

    // Video 1: mHThVfGmd6I
    console.log('📹 Video 1: mHThVfGmd6I');
    const video1 = await prisma.video.upsert({
      where: { youtubeId: 'mHThVfGmd6I' },
      update: {
        title: 'איך בניתי אפליקציה שמייצרת סיכום קולי יומי של חדשות AI – לגמרי בלי קוד',
        description: 'בסרטון הזה אני מראה איך בניתי אפליקציה שמייצרת סיכום קולי יומי של חדשות AI באופן אוטומטי לחלוטין, בלי לכתוב שורת קוד אחת.',
        thumbnail: 'https://img.youtube.com/vi/mHThVfGmd6I/maxresdefault.jpg',
        duration: 1308,
        topic: 'No-Code',
        tags: ['No-Code', 'AI', 'Automation', 'News Summary'],
        courseId: 'ai-no-code',
        order: 1,
        published: true,
      },
      create: {
        youtubeId: 'mHThVfGmd6I',
        title: 'איך בניתי אפליקציה שמייצרת סיכום קולי יומי של חדשות AI – לגמרי בלי קוד',
        description: 'בסרטון הזה אני מראה איך בניתי אפליקציה שמייצרת סיכום קולי יומי של חדשות AI באופן אוטומטי לחלוטין, בלי לכתוב שורת קוד אחת.',
        thumbnail: 'https://img.youtube.com/vi/mHThVfGmd6I/maxresdefault.jpg',
        duration: 1308,
        topic: 'No-Code',
        tags: ['No-Code', 'AI', 'Automation', 'News Summary'],
        courseId: 'ai-no-code',
        order: 1,
        published: true,
      },
    });
    console.log(`   ✅ ${video1.title.substring(0, 50)}...\n`);

    // Video 2: zhkbBhrNn3s
    console.log('📹 Video 2: zhkbBhrNn3s');
    const video2 = await prisma.video.upsert({
      where: { youtubeId: 'zhkbBhrNn3s' },
      update: {
        title: 'סרטון 2 - עדכן כותרת מיוטיוב',
        description: 'סרטון 2 - עדכן תיאור מיוטיוב',
        thumbnail: 'https://img.youtube.com/vi/zhkbBhrNn3s/maxresdefault.jpg',
        duration: 600,
        topic: 'No-Code',
        tags: ['No-Code', 'AI', 'Automation'],
        courseId: 'ai-no-code',
        order: 2,
        published: true,
      },
      create: {
        youtubeId: 'zhkbBhrNn3s',
        title: 'סרטון 2 - עדכן כותרת מיוטיוב',
        description: 'סרטון 2 - עדכן תיאור מיוטיוב',
        thumbnail: 'https://img.youtube.com/vi/zhkbBhrNn3s/maxresdefault.jpg',
        duration: 600,
        topic: 'No-Code',
        tags: ['No-Code', 'AI', 'Automation'],
        courseId: 'ai-no-code',
        order: 2,
        published: true,
      },
    });
    console.log(`   ✅ ${video2.title}\n`);

    // Video 3: 7oF2m3zivRY
    console.log('📹 Video 3: 7oF2m3zivRY');
    const video3 = await prisma.video.upsert({
      where: { youtubeId: '7oF2m3zivRY' },
      update: {
        title: 'סרטון 3 - עדכן כותרת מיוטיוב',
        description: 'סרטון 3 - עדכן תיאור מיוטיוב',
        thumbnail: 'https://img.youtube.com/vi/7oF2m3zivRY/maxresdefault.jpg',
        duration: 600,
        topic: 'No-Code',
        tags: ['No-Code', 'AI', 'Automation'],
        courseId: 'ai-no-code',
        order: 3,
        published: true,
      },
      create: {
        youtubeId: '7oF2m3zivRY',
        title: 'סרטון 3 - עדכן כותרת מיוטיוב',
        description: 'סרטון 3 - עדכן תיאור מיוטיוב',
        thumbnail: 'https://img.youtube.com/vi/7oF2m3zivRY/maxresdefault.jpg',
        duration: 600,
        topic: 'No-Code',
        tags: ['No-Code', 'AI', 'Automation'],
        courseId: 'ai-no-code',
        order: 3,
        published: true,
      },
    });
    console.log(`   ✅ ${video3.title}\n`);

    console.log('🎉 All three videos are now set up!\n');
    console.log('Summary:');
    console.log('========');
    console.log(`✅ Video 1 (mHThVfGmd6I) - Order ${video1.order}`);
    console.log(`✅ Video 2 (zhkbBhrNn3s) - Order ${video2.order}`);
    console.log(`✅ Video 3 (7oF2m3zivRY) - Order ${video3.order}`);
    console.log('\nAll videos:');
    console.log('- Use the same thumbnail format');
    console.log('- Belong to the "ai-no-code" course');
    console.log('- Are published and will appear on the platform');
    console.log('\n💡 Next: Visit the YouTube URLs to get actual titles and descriptions!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
