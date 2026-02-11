/**
 * Admin API Testing Script
 * =========================
 *
 * This script tests all admin API endpoints to ensure they work correctly.
 * Run with: tsx scripts/test-admin-api.ts
 *
 * Prerequisites:
 * - Development server running (npm run dev)
 * - Admin user exists in database
 * - YOUTUBE_API_KEY configured in .env.local
 *
 * Usage:
 * 1. Update the EMAIL and PASSWORD constants below
 * 2. Run: tsx scripts/test-admin-api.ts
 * 3. Check console output for test results
 */

const BASE_URL = 'http://localhost:3000';
const EMAIL = 'admin@learnwithavi.com';
const PASSWORD = 'admin123'; // Change to your admin password

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];
let authToken: string | null = null;
let createdCourseId: string | null = null;
let createdVideoId: string | null = null;
let createdTranscriptId: string | null = null;

/**
 * Log test result
 */
function logResult(result: TestResult) {
  results.push(result);
  const status = result.success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${result.name}`);
  if (!result.success && result.error) {
    console.log(`   Error: ${result.error}`);
  }
}

/**
 * Make API request
 */
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
}

/**
 * Test 1: Login
 */
async function testLogin() {
  try {
    const data = await apiRequest('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });

    if (data.token) {
      authToken = data.token;
    }

    logResult({
      name: 'Login',
      success: true,
      data: { email: data.email },
    });
  } catch (error: any) {
    logResult({
      name: 'Login',
      success: false,
      error: error.message,
    });
  }
}

/**
 * Test 2: YouTube URL Validation
 */
async function testYouTubeValidation() {
  try {
    const data = await apiRequest('/api/admin/youtube/validate', {
      method: 'POST',
      body: JSON.stringify({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      }),
    });

    logResult({
      name: 'YouTube Validation',
      success: data.valid === true,
      data: { title: data.metadata?.title },
    });
  } catch (error: any) {
    logResult({
      name: 'YouTube Validation',
      success: false,
      error: error.message,
    });
  }
}

/**
 * Test 3: Create Course
 */
async function testCreateCourse() {
  try {
    const data = await apiRequest('/api/admin/courses', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Course',
        description: 'This is a test course created by the testing script',
        difficulty: 'beginner',
        topics: ['testing', 'api'],
        thumbnail: 'https://via.placeholder.com/300',
        published: false,
      }),
    });

    createdCourseId = data.id;

    logResult({
      name: 'Create Course',
      success: !!data.id,
      data: { id: data.id, title: data.title },
    });
  } catch (error: any) {
    logResult({
      name: 'Create Course',
      success: false,
      error: error.message,
    });
  }
}

/**
 * Test 4: List Courses
 */
async function testListCourses() {
  try {
    const data = await apiRequest('/api/admin/courses', {
      method: 'GET',
    });

    logResult({
      name: 'List Courses',
      success: Array.isArray(data),
      data: { count: data.length },
    });
  } catch (error: any) {
    logResult({
      name: 'List Courses',
      success: false,
      error: error.message,
    });
  }
}

/**
 * Test 5: Get Single Course
 */
async function testGetCourse() {
  if (!createdCourseId) {
    logResult({
      name: 'Get Single Course',
      success: false,
      error: 'No course ID available (create course test may have failed)',
    });
    return;
  }

  try {
    const data = await apiRequest(`/api/admin/courses/${createdCourseId}`, {
      method: 'GET',
    });

    logResult({
      name: 'Get Single Course',
      success: data.id === createdCourseId,
      data: { id: data.id, title: data.title },
    });
  } catch (error: any) {
    logResult({
      name: 'Get Single Course',
      success: false,
      error: error.message,
    });
  }
}

/**
 * Test 6: Update Course
 */
async function testUpdateCourse() {
  if (!createdCourseId) {
    logResult({
      name: 'Update Course',
      success: false,
      error: 'No course ID available',
    });
    return;
  }

  try {
    const data = await apiRequest(`/api/admin/courses/${createdCourseId}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: 'Updated Test Course',
        difficulty: 'intermediate',
      }),
    });

    logResult({
      name: 'Update Course',
      success: data.title === 'Updated Test Course',
      data: { title: data.title },
    });
  } catch (error: any) {
    logResult({
      name: 'Update Course',
      success: false,
      error: error.message,
    });
  }
}

/**
 * Test 7: Create Video
 */
async function testCreateVideo() {
  if (!createdCourseId) {
    logResult({
      name: 'Create Video',
      success: false,
      error: 'No course ID available',
    });
    return;
  }

  try {
    const data = await apiRequest('/api/admin/videos', {
      method: 'POST',
      body: JSON.stringify({
        youtubeId: 'dQw4w9WgXcQ',
        title: 'Test Video',
        description: 'This is a test video',
        duration: 212,
        thumbnail: 'https://via.placeholder.com/300',
        topic: 'Testing',
        tags: ['test', 'api'],
        courseId: createdCourseId,
        published: false,
        chapters: [
          {
            title: 'Introduction',
            startTime: 0,
            endTime: 60,
            order: 0,
          },
          {
            title: 'Main Content',
            startTime: 60,
            endTime: 180,
            order: 1,
          },
        ],
      }),
    });

    createdVideoId = data.id;

    logResult({
      name: 'Create Video',
      success: !!data.id,
      data: { id: data.id, title: data.title, chapters: data.chapters?.length },
    });
  } catch (error: any) {
    logResult({
      name: 'Create Video',
      success: false,
      error: error.message,
    });
  }
}

/**
 * Test 8: List Videos
 */
async function testListVideos() {
  try {
    const data = await apiRequest('/api/admin/videos', {
      method: 'GET',
    });

    logResult({
      name: 'List Videos',
      success: Array.isArray(data),
      data: { count: data.length },
    });
  } catch (error: any) {
    logResult({
      name: 'List Videos',
      success: false,
      error: error.message,
    });
  }
}

/**
 * Test 9: Get Single Video
 */
async function testGetVideo() {
  if (!createdVideoId) {
    logResult({
      name: 'Get Single Video',
      success: false,
      error: 'No video ID available',
    });
    return;
  }

  try {
    const data = await apiRequest(`/api/admin/videos/${createdVideoId}`, {
      method: 'GET',
    });

    logResult({
      name: 'Get Single Video',
      success: data.id === createdVideoId,
      data: { id: data.id, title: data.title, chapters: data.chapters?.length },
    });
  } catch (error: any) {
    logResult({
      name: 'Get Single Video',
      success: false,
      error: error.message,
    });
  }
}

/**
 * Test 10: Update Video
 */
async function testUpdateVideo() {
  if (!createdVideoId) {
    logResult({
      name: 'Update Video',
      success: false,
      error: 'No video ID available',
    });
    return;
  }

  try {
    const data = await apiRequest(`/api/admin/videos/${createdVideoId}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: 'Updated Test Video',
        topic: 'Updated Testing',
      }),
    });

    logResult({
      name: 'Update Video',
      success: data.title === 'Updated Test Video',
      data: { title: data.title },
    });
  } catch (error: any) {
    logResult({
      name: 'Update Video',
      success: false,
      error: error.message,
    });
  }
}

/**
 * Test 11: Reorder Videos
 */
async function testReorderVideos() {
  if (!createdCourseId || !createdVideoId) {
    logResult({
      name: 'Reorder Videos',
      success: false,
      error: 'No course or video ID available',
    });
    return;
  }

  try {
    const data = await apiRequest(
      `/api/admin/courses/${createdCourseId}/reorder`,
      {
        method: 'POST',
        body: JSON.stringify({
          videoIds: [createdVideoId],
        }),
      }
    );

    logResult({
      name: 'Reorder Videos',
      success: data.success === true,
      data: { updatedCount: data.updatedCount },
    });
  } catch (error: any) {
    logResult({
      name: 'Reorder Videos',
      success: false,
      error: error.message,
    });
  }
}

/**
 * Test 12: Create Transcript
 */
async function testCreateTranscript() {
  if (!createdVideoId) {
    logResult({
      name: 'Create Transcript',
      success: false,
      error: 'No video ID available',
    });
    return;
  }

  try {
    const data = await apiRequest('/api/admin/transcripts', {
      method: 'POST',
      body: JSON.stringify({
        videoId: createdVideoId,
        source: 'manual',
        language: 'en',
        chunks: [
          {
            text: 'Hello, this is a test transcript.',
            startTime: 0,
            endTime: 3,
            order: 0,
          },
          {
            text: 'This is the second chunk.',
            startTime: 3,
            endTime: 6,
            order: 1,
          },
        ],
      }),
    });

    createdTranscriptId = data.id;

    logResult({
      name: 'Create Transcript',
      success: !!data.id,
      data: { id: data.id, chunks: data.chunks?.length },
    });
  } catch (error: any) {
    logResult({
      name: 'Create Transcript',
      success: false,
      error: error.message,
    });
  }
}

/**
 * Test 13: Update Transcript
 */
async function testUpdateTranscript() {
  if (!createdTranscriptId) {
    logResult({
      name: 'Update Transcript',
      success: false,
      error: 'No transcript ID available',
    });
    return;
  }

  try {
    const data = await apiRequest('/api/admin/transcripts', {
      method: 'PUT',
      body: JSON.stringify({
        transcriptId: createdTranscriptId,
        language: 'he',
      }),
    });

    logResult({
      name: 'Update Transcript',
      success: data.language === 'he',
      data: { language: data.language },
    });
  } catch (error: any) {
    logResult({
      name: 'Update Transcript',
      success: false,
      error: error.message,
    });
  }
}

/**
 * Test 14: Delete Video
 */
async function testDeleteVideo() {
  if (!createdVideoId) {
    logResult({
      name: 'Delete Video',
      success: false,
      error: 'No video ID available',
    });
    return;
  }

  try {
    const data = await apiRequest(`/api/admin/videos/${createdVideoId}`, {
      method: 'DELETE',
    });

    logResult({
      name: 'Delete Video',
      success: data.success === true,
      data: { message: data.message },
    });
  } catch (error: any) {
    logResult({
      name: 'Delete Video',
      success: false,
      error: error.message,
    });
  }
}

/**
 * Test 15: Delete Course
 */
async function testDeleteCourse() {
  if (!createdCourseId) {
    logResult({
      name: 'Delete Course',
      success: false,
      error: 'No course ID available',
    });
    return;
  }

  try {
    const data = await apiRequest(`/api/admin/courses/${createdCourseId}`, {
      method: 'DELETE',
    });

    logResult({
      name: 'Delete Course',
      success: data.success === true,
      data: { message: data.message },
    });
  } catch (error: any) {
    logResult({
      name: 'Delete Course',
      success: false,
      error: error.message,
    });
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting Admin API Tests...\n');

  // Note: NextAuth uses sessions, not token-based auth
  // So we'll skip the login test and rely on cookie-based auth
  console.log('⚠️  Note: Authentication tests require manual login via browser\n');

  await testYouTubeValidation();
  await testCreateCourse();
  await testListCourses();
  await testGetCourse();
  await testUpdateCourse();
  await testCreateVideo();
  await testListVideos();
  await testGetVideo();
  await testUpdateVideo();
  await testReorderVideos();
  await testCreateTranscript();
  await testUpdateTranscript();
  await testDeleteVideo();
  await testDeleteCourse();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50));

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const total = results.length;

  console.log(`Total: ${total}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
  }

  console.log('\n' + '='.repeat(50));
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
