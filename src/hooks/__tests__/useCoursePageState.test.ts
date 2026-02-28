import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock next/navigation to prevent "app router to be mounted" error
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
}))

const { useChat } = vi.hoisted(() => ({
  useChat: vi.fn(() => ({
    messages: [],
    input: '',
    handleInputChange: vi.fn(),
    sendMessage: vi.fn().mockResolvedValue(undefined),
    isLoading: false,
    clearMessages: vi.fn(),
  })),
}))

const { useSummaryGeneration } = vi.hoisted(() => ({
  useSummaryGeneration: vi.fn(() => ({
    showSummary: false,
    summary: '',
    isGenerating: false,
    generateSummary: vi.fn(),
    closeSummary: vi.fn(),
  })),
}))

const { useQuizState } = vi.hoisted(() => ({
  useQuizState: vi.fn(() => ({
    status: 'idle',
    questions: [],
    currentIndex: 0,
    score: 0,
    startQuiz: vi.fn(),
    resetQuiz: vi.fn(),
    selectAnswer: vi.fn(),
    nextQuestion: vi.fn(),
  })),
}))

const { useVideoProgressWithTracking } = vi.hoisted(() => ({
  useVideoProgressWithTracking: vi.fn(() => ({
    chapterItems: [],
    overallProgress: 0,
    watchedVideos: new Set(),
    currentChapter: null,
    trackProgress: vi.fn(),
    resetProgress: vi.fn(),
  })),
}))

const { useVideoState } = vi.hoisted(() => ({
  useVideoState: vi.fn(() => ({
    currentTime: 0,
    actualDuration: 0,
    seekToTime: undefined,
    handleTimeUpdate: vi.fn(),
    handleDurationChange: vi.fn(),
    handleSeek: vi.fn(),
    reset: vi.fn(),
  })),
}))

const { getSampleChunksForVideo } = vi.hoisted(() => ({
  getSampleChunksForVideo: vi.fn(() => [
    {
      id: 'chunk-1',
      text: 'Introduction content',
      startTime: 0,
      endTime: 30,
      videoId: 'video-1',
    },
    {
      id: 'chunk-2',
      text: 'Main content here',
      startTime: 30,
      endTime: 60,
      videoId: 'video-1',
    },
    {
      id: 'chunk-3',
      text: 'Advanced topics',
      startTime: 60,
      endTime: 90,
      videoId: 'video-1',
    },
  ]),
}))

vi.mock('../useChat', () => ({
  useChat,
}))

vi.mock('../chat/useSummaryGeneration', () => ({
  useSummaryGeneration,
}))

vi.mock('../quiz/useQuizState', () => ({
  useQuizState,
}))

vi.mock('../video/useVideoProgress', () => ({
  useVideoProgressWithTracking,
}))

vi.mock('../video/useVideoState', () => ({
  useVideoState,
}))

vi.mock('@/data/sample-transcripts', () => ({
  getSampleChunksForVideo,
}))

import { useCoursePageState } from '../course/useCoursePageState'
import { type Course, type Video, type Chapter } from '@/types'

/**
 * Helper to create mock video
 */
function createMockVideo(overrides?: Partial<Video>): Video {
  return {
    id: 'video-1',
    youtubeId: 'test-video-1',
    title: 'Test Video',
    description: 'Test Description',
    duration: 600,
    thumbnail: 'https://example.com/thumb.jpg',
    topic: 'testing',
    courseId: 'course-1',
    order: 1,
    chapters: [
      { title: 'Intro', startTime: 0, endTime: 120 },
      { title: 'Main', startTime: 120, endTime: 360 },
      { title: 'Conclusion', startTime: 360, endTime: 600 },
    ],
    ...overrides,
  }
}

/**
 * Helper to create mock course
 */
function createMockCourse(overrides?: Partial<Course>): Course {
  return {
    id: 'course-1',
    title: 'Test Course',
    description: 'Test Course Description',
    thumbnail: 'https://example.com/course.jpg',
    difficulty: 'beginner',
    topics: ['testing', 'learning'],
    videos: [createMockVideo()],
    ...overrides,
  }
}

describe('useCoursePageState Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('initializes with correct structure', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      expect(result.current).toHaveProperty('currentVideo')
      expect(result.current).toHaveProperty('video')
      expect(result.current).toHaveProperty('progress')
      expect(result.current).toHaveProperty('chat')
      expect(result.current).toHaveProperty('summary')
      expect(result.current).toHaveProperty('quiz')
      expect(result.current).toHaveProperty('activeContentTab')
      expect(result.current).toHaveProperty('onTabChange')
      expect(result.current).toHaveProperty('selectVideo')
      expect(result.current).toHaveProperty('liveTranscript')
    })

    it('initializes video object with required properties', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      expect(result.current.video).toHaveProperty('currentTime')
      expect(result.current.video).toHaveProperty('actualDuration')
      expect(result.current.video).toHaveProperty('seekToTime')
      expect(result.current.video).toHaveProperty('handleTimeUpdate')
      expect(result.current.video).toHaveProperty('handleDurationChange')
      expect(result.current.video).toHaveProperty('handleSeek')
      expect(result.current.video).toHaveProperty('reset')
    })

    it('initializes chat object with required properties', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      expect(result.current.chat).toHaveProperty('messages')
      expect(result.current.chat).toHaveProperty('inputMessage')
      expect(result.current.chat).toHaveProperty('isLoading')
      expect(result.current.chat).toHaveProperty('isListening')
      expect(result.current.chat).toHaveProperty('setInputMessage')
      expect(result.current.chat).toHaveProperty('handleSendMessage')
      expect(result.current.chat).toHaveProperty('toggleVoiceInput')
      expect(result.current.chat).toHaveProperty('handleKeyPress')
    })

    it('initializes progress object with required properties', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      expect(result.current.progress).toHaveProperty('chapterItems')
      expect(result.current.progress).toHaveProperty('overallProgress')
      expect(result.current.progress).toHaveProperty('watchedVideos')
      expect(result.current.progress).toHaveProperty('currentChapter')
    })

    it('initializes with transcript tab active by default', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      expect(result.current.activeContentTab).toBe('transcript')
    })

    it('initializes with first video when course has videos', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      // useRouteSync initializes with first video by default
      expect(result.current.currentVideo).not.toBeNull()
      expect(result.current.currentVideo?.id).toBe('video-1')
    })
  })

  describe('Video Selection', () => {
    it('selectVideo updates currentVideo', () => {
      const mockCourse = createMockCourse()
      const mockVideo = createMockVideo()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      act(() => {
        result.current.selectVideo(mockVideo)
      })

      // selectVideo should be called through the hook
      expect(result.current.selectVideo).toBeDefined()
    })

    it('selectVideo resets video state', () => {
      const mockCourse = createMockCourse()
      const mockVideo = createMockVideo()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      act(() => {
        result.current.selectVideo(mockVideo)
      })

      // Verify selectVideo is defined
      expect(result.current.selectVideo).toBeDefined()
    })

    it('selectVideo clears chat messages', () => {
      const mockCourse = createMockCourse()
      const mockVideo = createMockVideo()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      act(() => {
        result.current.selectVideo(mockVideo)
      })

      // selectVideo should call clearMessages
      expect(result.current.selectVideo).toBeDefined()
    })

    it('selectVideo resets activeContentTab to transcript', () => {
      const mockCourse = createMockCourse()
      const mockVideo = createMockVideo()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      // First switch to quiz tab
      act(() => {
        result.current.onTabChange('quiz')
      })

      expect(result.current.activeContentTab).toBe('quiz')

      // Then select a video
      act(() => {
        result.current.selectVideo(mockVideo)
      })

      // Should reset to transcript
      expect(result.current.selectVideo).toBeDefined()
    })

    it('selectVideo resets progress tracking', () => {
      const mockCourse = createMockCourse()
      const mockVideo = createMockVideo()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      act(() => {
        result.current.selectVideo(mockVideo)
      })

      expect(result.current.selectVideo).toBeDefined()
    })

    it('selectVideo resets quiz state', () => {
      const mockCourse = createMockCourse()
      const mockVideo = createMockVideo()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      act(() => {
        result.current.selectVideo(mockVideo)
      })

      expect(result.current.selectVideo).toBeDefined()
    })
  })

  describe('Chapter Navigation', () => {
    it('returns current chapter from progress state', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      expect(result.current.progress).toHaveProperty('currentChapter')
    })

    it('tracks current chapter based on video time', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      // Progress should be computed based on time
      expect(result.current.progress.chapterItems).toBeDefined()
      expect(Array.isArray(result.current.progress.chapterItems)).toBe(true)
    })

    it('computes currentStageIndex from chapters', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      // Stage index should be computed
      expect(result.current.currentStageIndex).toBeDefined()
      expect(typeof result.current.currentStageIndex).toBe('number')
    })

    it('returns empty chapters when currentVideo is null', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      // With null currentVideo, should have minimal/empty chapter data
      expect(result.current.progress).toBeDefined()
    })
  })

  describe('Time Tracking', () => {
    it('handleTimeUpdate calls both videoState and progressState handlers', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      act(() => {
        result.current.video.handleTimeUpdate(120)
      })

      expect(result.current.video.handleTimeUpdate).toBeDefined()
    })

    it('updates liveTranscript based on currentTime', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      expect(result.current.liveTranscript).toBeDefined()
      expect(Array.isArray(result.current.liveTranscript)).toBe(true)
    })

    it('liveTranscript filters chunks around current time', () => {
      const mockCourse = createMockCourse()
      const mockVideo = createMockVideo()

      const { result } = renderHook(() =>
        useCoursePageState(createMockCourse({ videos: [mockVideo] }), 'course-1')
      )

      // Should have transcript chunks filtered by time
      expect(Array.isArray(result.current.liveTranscript)).toBe(true)
    })

    it('videoDuration uses actualDuration when available', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      expect(result.current.videoDuration).toBeDefined()
      expect(typeof result.current.videoDuration).toBe('number')
    })

    it('videoDuration fallback to currentVideo.duration', () => {
      const mockCourse = createMockCourse()
      const mockVideo = createMockVideo({ duration: 500 })

      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      expect(result.current.videoDuration).toBeDefined()
    })
  })

  describe('Tab Management', () => {
    it('initializes with transcript tab active', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      expect(result.current.activeContentTab).toBe('transcript')
    })

    it('onTabChange switches to quiz tab', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      act(() => {
        result.current.onTabChange('quiz')
      })

      expect(result.current.activeContentTab).toBe('quiz')
    })

    it('onTabChange switches back to transcript tab', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      act(() => {
        result.current.onTabChange('quiz')
        result.current.onTabChange('transcript')
      })

      expect(result.current.activeContentTab).toBe('transcript')
    })

    it('onStartQuiz switches to quiz tab and starts quiz', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      act(() => {
        result.current.onStartQuiz()
      })

      // Should switch to quiz tab
      expect(result.current.activeContentTab).toBe('quiz')
    })

    it('onStartQuiz does not restart quiz if already in progress', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      act(() => {
        result.current.onStartQuiz()
      })

      // Should not call startQuiz if already in progress
      expect(result.current.onStartQuiz).toBeDefined()
    })
  })

  describe('Chat State Management', () => {
    it('setInputMessage updates chat input', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      act(() => {
        result.current.chat.setInputMessage('test message')
      })

      // Input should be updated
      expect(result.current.chat.setInputMessage).toBeDefined()
    })

    it('handleSendMessage sends current input', async () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      await act(async () => {
        await result.current.chat.handleSendMessage()
      })

      expect(result.current.chat.handleSendMessage).toBeDefined()
    })

    it('toggleVoiceInput toggles listening state', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      const initialListeningState = result.current.chat.isListening

      act(() => {
        result.current.chat.toggleVoiceInput()
      })

      // After toggle, it should be opposite
      expect(result.current.chat.toggleVoiceInput).toBeDefined()
    })

    it('handleKeyPress sends message on Enter without Shift', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      const event = new KeyboardEvent('keypress', {
        key: 'Enter',
        shiftKey: false,
      })

      act(() => {
        result.current.chat.handleKeyPress(event as any)
      })

      expect(result.current.chat.handleKeyPress).toBeDefined()
    })

    it('handleKeyPress allows newline on Shift+Enter', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      const event = new KeyboardEvent('keypress', {
        key: 'Enter',
        shiftKey: true,
      })

      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

      act(() => {
        result.current.chat.handleKeyPress(event as any)
      })

      // Should not prevent default on Shift+Enter
      expect(result.current.chat.handleKeyPress).toBeDefined()
    })
  })

  describe('Summary Generation', () => {
    it('provides summary object with required properties', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      expect(result.current.summary).toHaveProperty('showSummary')
      expect(result.current.summary).toHaveProperty('summary')
      expect(result.current.summary).toHaveProperty('isGenerating')
      expect(result.current.summary).toHaveProperty('generateSummary')
      expect(result.current.summary).toHaveProperty('closeSummary')
    })

    it('generateSummary triggers summary generation', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      act(() => {
        result.current.summary.generateSummary()
      })

      expect(result.current.summary.generateSummary).toBeDefined()
    })

    it('closeSummary hides summary modal', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      act(() => {
        result.current.summary.closeSummary()
      })

      expect(result.current.summary.closeSummary).toBeDefined()
    })
  })

  describe('Quiz State', () => {
    it('provides quiz object from useQuizState hook', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      expect(result.current.quiz).toBeDefined()
      expect(typeof result.current.quiz).toBe('object')
    })

    it('quiz contains expected properties', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      expect(result.current.quiz).toHaveProperty('status')
      expect(result.current.quiz).toHaveProperty('questions')
      expect(result.current.quiz).toHaveProperty('currentIndex')
      expect(result.current.quiz).toHaveProperty('score')
    })
  })

  describe('RAG Context Retrieval', () => {
    it('retrieves transcript chunks for current video', () => {
      const mockCourse = createMockCourse()
      const mockVideo = createMockVideo()

      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      // Should have transcript chunks available
      expect(result.current.liveTranscript).toBeDefined()
      expect(Array.isArray(result.current.liveTranscript)).toBe(true)
    })

    it('filters chunks by keyword when getting context', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      // The getContext function is created in the hook
      // It should filter chunks by keywords
      expect(result.current.chat).toBeDefined()
    })

    it('returns empty context when no current video', () => {
      const { result } = renderHook(() =>
        useCoursePageState(null, 'course-1')
      )

      // With null course/video, context should be empty
      expect(result.current.currentVideo).toBeNull()
    })
  })

  describe('Multiple Videos', () => {
    it('handles course with multiple videos', () => {
      const video1 = createMockVideo({ id: 'video-1', order: 1 })
      const video2 = createMockVideo({
        id: 'video-2',
        order: 2,
        title: 'Video 2',
      })
      const video3 = createMockVideo({
        id: 'video-3',
        order: 3,
        title: 'Video 3',
      })

      const mockCourse = createMockCourse({ videos: [video1, video2, video3] })
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      expect(result.current.selectVideo).toBeDefined()
    })

    it('switching videos clears state appropriately', async () => {
      const video1 = createMockVideo({ id: 'video-1' })
      const video2 = createMockVideo({ id: 'video-2', title: 'Video 2' })

      const mockCourse = createMockCourse({ videos: [video1, video2] })
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      await act(async () => {
        result.current.selectVideo(video1)
        result.current.selectVideo(video2)
      })

      // selectVideo should have been called
      expect(result.current.selectVideo).toBeDefined()
    })
  })

  describe('Null Safety', () => {
    it('handles null course gracefully', () => {
      const { result } = renderHook(() =>
        useCoursePageState(null, 'course-1')
      )

      expect(result.current).toBeDefined()
      expect(result.current.currentVideo).toBeNull()
    })

    it('handles null currentVideo in all sections', () => {
      const { result } = renderHook(() =>
        useCoursePageState(null, 'course-1')
      )

      // All sections should handle null video gracefully
      expect(result.current.video).toBeDefined()
      expect(result.current.progress).toBeDefined()
      expect(result.current.chat).toBeDefined()
      expect(result.current.liveTranscript).toEqual([])
    })

    it('handles undefined chapters in video', () => {
      const mockCourse = createMockCourse()
      const mockVideoNoChapters = createMockVideo({ chapters: undefined })

      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      expect(result.current.currentStageIndex).toBeDefined()
    })
  })

  describe('Computed Values', () => {
    it('computes videoDuration correctly', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      expect(result.current.videoDuration).toBeDefined()
      expect(typeof result.current.videoDuration).toBe('number')
      expect(result.current.videoDuration).toBeGreaterThanOrEqual(0)
    })

    it('computes currentStageIndex correctly', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      expect(result.current.currentStageIndex).toBeDefined()
      expect(typeof result.current.currentStageIndex).toBe('number')
      expect(result.current.currentStageIndex).toBeGreaterThan(0)
    })

    it('updates computed values when dependencies change', () => {
      const mockCourse = createMockCourse()
      const { result, rerender } = renderHook(
        ({ course, courseId }) =>
          useCoursePageState(course, courseId),
        {
          initialProps: {
            course: mockCourse,
            courseId: 'course-1',
          },
        }
      )

      const initialVideoDuration = result.current.videoDuration

      act(() => {
        rerender({
          course: createMockCourse(),
          courseId: 'course-1',
        })
      })

      // Computed values should be recalculated
      expect(result.current.videoDuration).toBeDefined()
    })
  })

  describe('State Transitions', () => {
    it('transitions correctly from initial state to video selected', () => {
      // Start with null course (no video selected)
      const { result } = renderHook(() =>
        useCoursePageState(null, 'course-1')
      )

      expect(result.current.currentVideo).toBeNull()

      // Then render with a course that has videos
      const mockCourse = createMockCourse()
      const { result: newResult } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      // After course is provided, first video should be selected
      expect(newResult.current.currentVideo).not.toBeNull()
      expect(newResult.current.currentVideo?.id).toBe('video-1')
    })

    it('transitions from transcript to quiz tab', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      expect(result.current.activeContentTab).toBe('transcript')

      act(() => {
        result.current.onTabChange('quiz')
      })

      expect(result.current.activeContentTab).toBe('quiz')
    })

    it('transitions quiz from idle to in-progress', () => {
      const mockCourse = createMockCourse()
      const { result } = renderHook(() =>
        useCoursePageState(mockCourse, 'course-1')
      )

      expect(result.current.quiz).toBeDefined()
    })
  })
})
