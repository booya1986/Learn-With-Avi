'use client'

import React, { useState, useCallback, useEffect, useMemo, JSX } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Send,
  Mic,
  MicOff,
  Loader2,
  FileText,
  X,
  Download,
  Share2,
  Settings,
  BookOpen,
  Clock,
  BarChart3,
  CheckCircle2,
  Circle,
  Sparkles,
  Brain,
} from 'lucide-react'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn, formatTime } from '@/lib/utils'
import { Video, ChatMessage, Chapter, Course } from '@/types'
import { getSampleChunksForVideo, getVideoSummary } from '@/data/sample-transcripts'
import { QuizPanel } from '@/components/course/QuizPanel'
import { useQuizState } from '@/hooks/quiz/useQuizState'

// Chapter item for the materials sidebar - directly from video chapters
interface ChapterItem {
  id: string
  title: string
  startTime: number
  endTime: number
  duration: string
  isActive: boolean
  isCompleted: boolean
  progress: number // 0-100 progress within this chapter
}

interface CoursePageClientProps {
  course: Course
  courseId: string
}

export default function CoursePageClient({ course, courseId }: CoursePageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Video state
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [actualDuration, setActualDuration] = useState<number>(0) // Actual duration from YouTube
  const [seekToTime, setSeekToTime] = useState<number | undefined>(undefined)
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set())

  // Track actual watched time per chapter (key: chapter index, value: seconds watched in that chapter)
  // This ensures chapters are only marked complete when user actually watches them
  const [chapterWatchedTime, setChapterWatchedTime] = useState<Record<number, number>>({})
  const [lastRecordedTime, setLastRecordedTime] = useState<number>(0)

  // UI state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Chat state - use lazy initialization to avoid hydration mismatch with Date
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: `שלום! אני עוזר הלמידה שלך. שאל אותי כל שאלה על תוכן הסרטון ואני אעזור לך להבין את הנושאים בצורה טובה יותר.`,
      timestamp: new Date(0), // Use epoch time for initial state to avoid hydration mismatch
    },
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)

  // Summary state
  const [showSummary, setShowSummary] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [generatedSummaryData, setGeneratedSummaryData] = useState<{
    about: string
    tools: { name: string; desc: string; color: string }[]
    process: { step: number; title: string; desc: string }[]
    benefits: string[]
  } | null>(null)

  // Quiz state
  const quizState = useQuizState(currentVideo?.youtubeId)
  const [activeContentTab, setActiveContentTab] = useState<'transcript' | 'quiz'>('transcript')

  const handleStartQuiz = useCallback(() => {
    setActiveContentTab('quiz')
    if (quizState.status === 'idle') {
      quizState.startQuiz()
    }
  }, [quizState])

  // Generate chapter items directly from video chapters - matching the timeline exactly
  // If no chapters are defined, auto-generate them based on video duration
  // IMPORTANT: Chapters are only marked complete when user actually watches them (tracked via chapterWatchedTime)
  const chapterItems: ChapterItem[] = useMemo(() => {
    // Use actual YouTube duration if available, or fall back to config duration
    const duration = actualDuration > 0 ? actualDuration : currentVideo?.duration || 0

    // Helper function to calculate chapter progress based on actual watched time
    const calculateChapterProgress = (
      chapterIndex: number,
      chapterDuration: number,
      startTime: number,
      endTime: number
    ): { isCompleted: boolean; progress: number } => {
      const watchedSeconds = chapterWatchedTime[chapterIndex] || 0
      const isActive = currentTime >= startTime && currentTime < endTime

      // A chapter is complete only if user watched at least 90% of it
      const completionThreshold = 0.9
      const isCompleted = watchedSeconds >= chapterDuration * completionThreshold

      // Calculate progress as percentage of chapter actually watched
      let progress = 0
      if (isCompleted) {
        progress = 100
      } else if (chapterDuration > 0) {
        progress = Math.min(100, Math.round((watchedSeconds / chapterDuration) * 100))
      }

      return { isCompleted, progress }
    }

    // If video has chapters defined, use them
    if (currentVideo?.chapters && currentVideo.chapters.length > 0) {
      return currentVideo.chapters.map((chapter, index) => {
        const chapterDuration = chapter.endTime - chapter.startTime
        const isActive = currentTime >= chapter.startTime && currentTime < chapter.endTime
        const { isCompleted, progress } = calculateChapterProgress(
          index,
          chapterDuration,
          chapter.startTime,
          chapter.endTime
        )

        return {
          id: `chapter-${index}`,
          title: chapter.title,
          startTime: chapter.startTime,
          endTime: chapter.endTime,
          duration: formatTime(chapterDuration),
          isActive,
          isCompleted,
          progress,
        }
      })
    }

    // Auto-generate chapters if none defined and we have a valid duration
    if (duration > 0) {
      const numChapters = Math.max(3, Math.min(10, Math.ceil(duration / 120))) // 1 chapter per ~2 min, min 3, max 10
      const chapterLength = duration / numChapters

      return Array.from({ length: numChapters }, (_, index) => {
        const startTime = Math.round(index * chapterLength)
        const endTime = Math.round((index + 1) * chapterLength)
        const chapterDuration = endTime - startTime
        const isActive = currentTime >= startTime && currentTime < endTime
        const { isCompleted, progress } = calculateChapterProgress(
          index,
          chapterDuration,
          startTime,
          endTime
        )

        return {
          id: `auto-chapter-${index}`,
          title: `חלק ${index + 1}`,
          startTime,
          endTime,
          duration: formatTime(chapterDuration),
          isActive,
          isCompleted,
          progress,
        }
      })
    }

    return []
  }, [
    currentVideo?.chapters,
    currentVideo?.duration,
    actualDuration,
    currentTime,
    chapterWatchedTime,
  ])

  // Calculate overall video progress - use actual YouTube duration if available, fallback to config duration
  const videoDuration = actualDuration > 0 ? actualDuration : currentVideo?.duration || 0

  const overallProgress = useMemo(() => {
    if (videoDuration === 0) return 0
    return Math.round((currentTime / videoDuration) * 100)
  }, [currentTime, videoDuration])

  // Live transcript entries based on current time
  const liveTranscript = useMemo(() => {
    if (!currentVideo) return []

    const chunks = getSampleChunksForVideo(currentVideo.youtubeId)
    // Show chunks near current time
    return chunks
      .filter((chunk) => chunk.startTime <= currentTime + 30 && chunk.endTime >= currentTime - 60)
      .slice(0, 5)
  }, [currentVideo, currentTime])

  // Initialize current video
  useEffect(() => {
    if (course && course.videos.length > 0) {
      const videoIdParam = searchParams.get('video')
      if (videoIdParam) {
        const video = course.videos.find((v) => v.id === videoIdParam)
        if (video) {
          setCurrentVideo(video)
          return
        }
      }
      setCurrentVideo(course.videos[0])
    }
  }, [course, searchParams])

  // Handle video selection
  const handleVideoSelect = useCallback(
    (video: Video) => {
      setCurrentVideo(video)
      setCurrentTime(0) // Reset time when switching videos
      setActualDuration(0) // Reset duration - will be updated when new video loads
      setChapterWatchedTime({}) // Reset chapter progress when switching videos
      setLastRecordedTime(0)
      router.push(`/course/${courseId}?video=${video.id}`, { scroll: false })
      setIsMobileMenuOpen(false)
    },
    [courseId, router]
  )

  // Handle time update from video player
  // Track actual watched time per chapter - only counts sequential watching, not skipping
  const handleTimeUpdate = useCallback(
    (time: number) => {
      setCurrentTime(time)

      // Get chapters (from config or auto-generated)
      const duration = actualDuration > 0 ? actualDuration : currentVideo?.duration || 0
      let chapters: { startTime: number; endTime: number }[] = []

      if (currentVideo?.chapters && currentVideo.chapters.length > 0) {
        chapters = currentVideo.chapters
      } else if (duration > 0) {
        const numChapters = Math.max(3, Math.min(10, Math.ceil(duration / 120)))
        const chapterLength = duration / numChapters
        chapters = Array.from({ length: numChapters }, (_, i) => ({
          startTime: Math.round(i * chapterLength),
          endTime: Math.round((i + 1) * chapterLength),
        }))
      }

      // Find current chapter index
      const currentChapterIndex = chapters.findIndex(
        (ch) => time >= ch.startTime && time < ch.endTime
      )

      // Only count time if user is watching sequentially (not skipping)
      // Time delta should be reasonable (< 3 seconds) to count as continuous watching
      const timeDelta = time - lastRecordedTime
      if (currentChapterIndex >= 0 && timeDelta > 0 && timeDelta < 3) {
        setChapterWatchedTime((prev) => ({
          ...prev,
          [currentChapterIndex]: (prev[currentChapterIndex] || 0) + timeDelta,
        }))
      }

      setLastRecordedTime(time)

      // Mark video as watched if user watched 80% of total duration
      if (currentVideo && duration > 0 && time / duration > 0.8) {
        setWatchedVideos((prev) => new Set([...prev, currentVideo.id]))
      }
    },
    [currentVideo, actualDuration, lastRecordedTime]
  )

  // Handle duration change from YouTube player - gets the actual video duration
  const handleDurationChange = useCallback((duration: number) => {
    setActualDuration(duration)
    console.log(
      `[VideoPlayer] Actual YouTube duration: ${duration}s (${Math.floor(duration / 60)}:${Math.round(
        duration % 60
      )
        .toString()
        .padStart(2, '0')})`
    )
  }, [])

  // Handle timestamp click in chat
  const handleTimestampClick = useCallback((time: number) => {
    setSeekToTime(time)
    setTimeout(() => setSeekToTime(undefined), 100)
  }, [])

  // Video metadata
  const videoMetadata: Record<
    string,
    {
      title: string
      description: string
      toolsUsed: string[]
      mainTopic: string
    }
  > = {
    mHThVfGmd6I: {
      title: 'איך בניתי אפליקציה שמייצרת סיכום קולי יומי של חדשות AI – לגמרי בלי קוד',
      description: 'בניית אפליקציה לסיכום חדשות AI בלי קוד',
      toolsUsed: ['make', 'newsapi', 'chatgpt', 'elevenlabs', 'telegram', 'nocode'],
      mainTopic: 'No-Code AI Application Development',
    },
  }

  // Topic knowledge base
  const topicKnowledge: Record<
    string,
    {
      keywords: string[]
      explanation: string
      inVideo: boolean
      usedInVideo?: boolean
      videoContext?: string
    }
  > = {
    make: {
      keywords: ['make', 'integromat', 'מייק', 'אינטגרומט', 'אוטומציה'],
      explanation: `Make (לשעבר Integromat) היא פלטפורמת אוטומציה ויזואלית שמאפשרת לחבר בין אפליקציות ושירותים שונים בלי לכתוב קוד.`,
      inVideo: true,
      videoContext: `בסרטון, אבי משתמש ב-Make כדי לחבר את כל חלקי האפליקציה.`,
    },
    newsapi: {
      keywords: ['news api', 'newsapi', 'news', 'חדשות', 'api חדשות'],
      explanation: `News API הוא שירות שמספק גישה לכתבות חדשות מאלפי מקורות ברחבי העולם.`,
      inVideo: true,
      videoContext: `בסרטון, אבי משתמש ב-News API כדי לאסוף חדשות על AI.`,
    },
    chatgpt: {
      keywords: ['chatgpt', 'chat gpt', 'gpt', 'openai', 'צאט גיפיטי', 'סיכום'],
      explanation: `ChatGPT הוא מודל שפה של OpenAI שיכול להבין ולייצר טקסט.`,
      inVideo: true,
      videoContext: `בסרטון, אבי שולח את החדשות ל-API של OpenAI עם prompt לסיכום.`,
    },
    elevenlabs: {
      keywords: ['elevenlabs', 'eleven labs', 'אלבן לאבס', 'tts', 'text to speech', 'קול', 'שמע'],
      explanation: `ElevenLabs הוא שירות Text-to-Speech מתקדם שמייצר קולות טבעיים.`,
      inVideo: true,
      videoContext: `בסרטון, אבי משתמש ב-ElevenLabs כדי להמיר את סיכום החדשות לקובץ MP3.`,
    },
    nocode: {
      keywords: ['no code', 'nocode', 'no-code', 'בלי קוד', 'ללא קוד'],
      explanation: `No-Code היא גישה לפיתוח תוכנה שמאפשרת לבנות אפליקציות בלי לכתוב קוד.`,
      inVideo: true,
      videoContext: `כל הסרטון מדגים את הכוח של גישת No-Code.`,
    },
    telegram: {
      keywords: ['telegram', 'טלגרם', 'הודעה', 'בוט'],
      explanation: `Telegram היא אפליקציית מסרים שתומכת בבוטים ואוטומציות.`,
      inVideo: true,
      videoContext: `בסרטון, אבי מגדיר שליחה אוטומטית של קובץ השמע לטלגרם.`,
    },
    supabase: {
      keywords: ['supabase', 'סופאבייס'],
      explanation: `Supabase היא פלטפורמת Backend-as-a-Service בקוד פתוח.`,
      inVideo: false,
    },
    lovable: {
      keywords: ['lavable', 'lovable', 'לאבבל', 'לובבל'],
      explanation: `Lovable היא פלטפורמת AI לבניית אפליקציות בשפה טבעית.`,
      inVideo: false,
      usedInVideo: false,
    },
  }

  // Search transcript function
  const searchTranscript = useCallback(
    (query: string, chunks: ReturnType<typeof getSampleChunksForVideo>) => {
      const queryLower = query.toLowerCase()
      const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 2)

      const detectedTopicKey = Object.entries(topicKnowledge).find(([, topic]) =>
        topic.keywords.some((kw) => queryLower.includes(kw.toLowerCase()))
      )?.[0]

      const scoredChunks = chunks.map((chunk) => {
        const textLower = chunk.text.toLowerCase()
        let score = 0

        if (detectedTopicKey) {
          const topicKeywords = topicKnowledge[detectedTopicKey].keywords
          const chunkMentionsTopic = topicKeywords.some((kw) =>
            textLower.includes(kw.toLowerCase())
          )

          if (chunkMentionsTopic) {
            score += 50
            const keywordMentions = topicKeywords.filter((kw) =>
              textLower.includes(kw.toLowerCase())
            ).length
            score += keywordMentions * 15
          } else {
            return { chunk, score: 0 }
          }
        } else {
          if (textLower.includes(queryLower)) {
            score += 100
          }
          queryWords.forEach((word) => {
            if (textLower.includes(word)) {
              score += 10
              if (word.length > 4) score += 5
            }
          })
        }

        return { chunk, score }
      })

      const MINIMUM_RELEVANCE_SCORE = 20

      return scoredChunks
        .filter((item) => item.score >= MINIMUM_RELEVANCE_SCORE)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((item) => item.chunk)
    },
    [topicKnowledge]
  )

  // Detect topic
  const detectTopic = useCallback(
    (
      query: string
    ): {
      key: string
      topic: (typeof topicKnowledge)[string]
      isToolUsedInVideo: boolean
    } | null => {
      const queryLower = query.toLowerCase()

      for (const [key, topic] of Object.entries(topicKnowledge)) {
        if (topic.keywords.some((kw) => queryLower.includes(kw))) {
          const currentVideoMeta = currentVideo ? videoMetadata[currentVideo.youtubeId] : null
          const isToolUsedInVideo = currentVideoMeta
            ? currentVideoMeta.toolsUsed.includes(key)
            : false

          return { key, topic, isToolUsedInVideo }
        }
      }
      return null
    },
    [topicKnowledge, currentVideo, videoMetadata]
  )

  // Generate natural language response
  const generateNaturalResponse = useCallback(
    (
      query: string,
      relevantChunks: ReturnType<typeof getSampleChunksForVideo>,
      detectedTopic: {
        key: string
        topic: (typeof topicKnowledge)[string]
        isToolUsedInVideo: boolean
      } | null
    ): { content: string; sources: ChatMessage['sources'] } => {
      const formatTimestampStr = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
      }

      const currentVideoMeta = currentVideo ? videoMetadata[currentVideo.youtubeId] : null

      let content = ''
      let sources: ChatMessage['sources'] = []

      if (detectedTopic && detectedTopic.topic.inVideo) {
        content = `${detectedTopic.topic.explanation}\n\n`

        if (detectedTopic.topic.videoContext) {
          content += `📹 **בסרטון הזה:** ${detectedTopic.topic.videoContext}\n\n`
        }

        if (relevantChunks.length > 0) {
          content += `🎯 **המקומות בסרטון שמדברים על זה:**\n`
          relevantChunks.forEach((chunk, idx) => {
            const ts = formatTimestampStr(chunk.startTime)
            content += `${idx + 1}. [timestamp:${ts}] - ${chunk.text.slice(0, 80)}...\n`
          })

          sources = relevantChunks.map((chunk) => ({
            videoId: currentVideo?.id || '',
            videoTitle: currentVideo?.title || '',
            timestamp: chunk.startTime,
            text: chunk.text.slice(0, 100) + '...',
            relevance: 0.9,
          }))
        }
      } else if (detectedTopic && detectedTopic.isToolUsedInVideo) {
        content = `${detectedTopic.topic.explanation}\n\n`
        content += `📹 **חשוב לדעת:** בסרטון הזה אבי *משתמש* ב-${detectedTopic.key.charAt(0).toUpperCase() + detectedTopic.key.slice(1)} כדי לבנות את הפרויקט!\n\n`

        if (relevantChunks.length > 0) {
          content += `🎯 **המקומות בסרטון שמזכירים את זה:**\n`
          relevantChunks.forEach((chunk, idx) => {
            const ts = formatTimestampStr(chunk.startTime)
            content += `${idx + 1}. [timestamp:${ts}] - ${chunk.text.slice(0, 80)}...\n`
          })

          sources = relevantChunks.map((chunk) => ({
            videoId: currentVideo?.id || '',
            videoTitle: currentVideo?.title || '',
            timestamp: chunk.startTime,
            text: chunk.text.slice(0, 100) + '...',
            relevance: 0.85,
          }))
        } else {
          content += `הסרטון מדגים שימוש מעשי בכלי הזה כחלק מבניית הפרויקט.`
        }
      } else if (
        detectedTopic &&
        !detectedTopic.topic.inVideo &&
        !detectedTopic.isToolUsedInVideo
      ) {
        content = `${detectedTopic.topic.explanation}\n\n`
        content += `⚠️ **שים לב:** הנושא הזה לא מכוסה בסרטון הנוכחי. התשובה מבוססת על הידע הכללי שלי.\n\n`

        if (currentVideoMeta) {
          const toolsList = currentVideoMeta.toolsUsed
            .filter((t) => topicKnowledge[t]?.inVideo)
            .map((t) => topicKnowledge[t]?.keywords[0] || t)
            .join(', ')
          content += `📹 **הסרטון הנוכחי עוסק ב:** ${currentVideoMeta.description}, עם הכלים: ${toolsList}.`
        }
      } else if (relevantChunks.length > 0) {
        const mainChunk = relevantChunks[0]
        content = `על פי הסרטון:\n\n"${mainChunk.text}"\n\n`
        content += `📍 ניתן לצפות בהסבר המלא ב: [timestamp:${formatTimestampStr(mainChunk.startTime)}]`

        if (relevantChunks.length > 1) {
          content += `\n\n**מקטעים נוספים רלוונטיים:**\n`
          relevantChunks.slice(1).forEach((chunk) => {
            content += `• [timestamp:${formatTimestampStr(chunk.startTime)}]\n`
          })
        }

        sources = relevantChunks.map((chunk) => ({
          videoId: currentVideo?.id || '',
          videoTitle: currentVideo?.title || '',
          timestamp: chunk.startTime,
          text: chunk.text.slice(0, 100) + '...',
          relevance: 0.85,
        }))
      } else {
        content = `לא מצאתי מידע ספציפי על "${query}" בסרטון.\n\n`
        content += `אם זה נושא טכנולוגי, אשמח לנסות להסביר אותו מהידע הכללי שלי.\n\n`

        if (currentVideoMeta) {
          content += `**נושאים שכן מוסברים בסרטון:**\n`
          currentVideoMeta.toolsUsed.forEach((toolKey) => {
            const topic = topicKnowledge[toolKey]
            if (topic && topic.inVideo) {
              content += `• ${topic.keywords[0]}\n`
            }
          })
        }
      }

      return { content, sources }
    },
    [currentVideo, videoMetadata, topicKnowledge]
  )

  // Handle chat message send - calls Claude API
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    // Get transcript chunks for context
    const chunks = currentVideo ? getSampleChunksForVideo(currentVideo.youtubeId) : []

    // Build conversation history (exclude welcome message)
    const conversationHistory = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    try {
      // Call the Claude API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          context: {
            chunks,
            videoContext: currentVideo
              ? `${currentVideo.title} - ${currentVideo.description || ''}`
              : undefined,
          },
          conversationHistory,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response from AI')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }

      // Add empty assistant message that we'll update
      setMessages((prev) => [...prev, assistantMessage])

      if (reader) {
        let fullContent = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          fullContent += chunk

          // Update the message content as it streams
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: fullContent } : m))
          )
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'מצטער, אירעה שגיאה בעיבוד השאלה שלך. אנא נסה שוב.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [inputMessage, isLoading, currentVideo, messages])

  // Handle voice input toggle
  const toggleVoiceInput = useCallback(() => {
    setIsListening((prev) => !prev)
  }, [])

  // Handle key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage()
      }
    },
    [handleSendMessage]
  )

  // Generate AI Summary from Transcript
  const generateAISummary = useCallback(() => {
    if (!currentVideo) return

    setIsGeneratingSummary(true)
    setShowSummary(true)

    // Get all transcript chunks
    const chunks = getSampleChunksForVideo(currentVideo.youtubeId)
    const fullTranscript = chunks.map((c) => c.text).join(' ')

    // Simulate AI processing - analyze transcript to extract key information
    setTimeout(() => {
      // Extract tools mentioned in the transcript
      const toolsFound: { name: string; desc: string; color: string }[] = []
      const toolPatterns = [
        {
          pattern: /make|integromat/i,
          name: 'Make (Integromat)',
          desc: 'פלטפורמה לאוטומציה ויזואלית',
          color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
        },
        {
          pattern: /news\s*api/i,
          name: 'News API',
          desc: 'איסוף כתבות חדשות מהעולם',
          color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
        },
        {
          pattern: /chatgpt|openai|gpt/i,
          name: 'ChatGPT (OpenAI)',
          desc: 'סיכום טקסט חכם בעברית',
          color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
        },
        {
          pattern: /elevenlabs|eleven\s*labs/i,
          name: 'ElevenLabs',
          desc: 'המרת טקסט לשמע טבעי',
          color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
        },
        {
          pattern: /telegram|טלגרם/i,
          name: 'Telegram',
          desc: 'שליחת הודעות אוטומטית',
          color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
        },
      ]

      toolPatterns.forEach((tp) => {
        if (tp.pattern.test(fullTranscript)) {
          toolsFound.push({ name: tp.name, desc: tp.desc, color: tp.color })
        }
      })

      // Extract process steps from transcript content
      const processSteps: { step: number; title: string; desc: string }[] = []

      // Analyze chunks to find process descriptions
      chunks.forEach((chunk, idx) => {
        const text = chunk.text.toLowerCase()
        if (text.includes('הצעד הראשון') || text.includes('news api')) {
          processSteps.push({
            step: 1,
            title: 'איסוף חדשות',
            desc: 'News API מביא את החדשות האחרונות על AI',
          })
        }
        if (text.includes('סיכום') && text.includes('chatgpt')) {
          processSteps.push({
            step: 2,
            title: 'סיכום עם AI',
            desc: 'ChatGPT מסכם את הכתבות בעברית בסגנון רדיו',
          })
        }
        if (text.includes('elevenlabs') || text.includes('שמע') || text.includes('mp3')) {
          processSteps.push({
            step: 3,
            title: 'המרה לשמע',
            desc: 'ElevenLabs ממיר את הסיכום לקובץ MP3',
          })
        }
        if (text.includes('טלגרם') || text.includes('שליחה')) {
          processSteps.push({ step: 4, title: 'שליחה אוטומטית', desc: 'הקובץ נשלח לטלגרם כל בוקר' })
        }
      })

      // Remove duplicates and sort
      const uniqueProcess = processSteps
        .filter((item, idx, arr) => arr.findIndex((i) => i.step === item.step) === idx)
        .sort((a, b) => a.step - b.step)

      // Extract benefits
      const benefits: string[] = []
      if (fullTranscript.includes('בלי קוד') || fullTranscript.includes('no code')) {
        benefits.push('לא צריך לכתוב קוד')
      }
      if (fullTranscript.includes('גמיש') || fullTranscript.includes('התאמה')) {
        benefits.push('קל להתאמה אישית')
      }
      if (fullTranscript.includes('חינמית') || fullTranscript.includes('עלות')) {
        benefits.push('עלות נמוכה')
      }
      if (fullTranscript.includes('אוטומטי') || fullTranscript.includes('לבד')) {
        benefits.push('הכל אוטומטי')
      }

      // Generate about text from first few chunks
      const introChunks = chunks.slice(0, 3)
      const aboutText =
        introChunks.length > 0
          ? `בסרטון הזה אבי מראה ${currentVideo.description || 'איך לבנות פרויקט מעניין'}. הסרטון מכסה את כל השלבים מההתחלה ועד הסוף, כולל הסבר על הכלים והטכניקות השונות.`
          : currentVideo.description || ''

      setGeneratedSummaryData({
        about: aboutText,
        tools:
          toolsFound.length > 0
            ? toolsFound
            : [
                {
                  name: 'לא זוהו כלים',
                  desc: 'צפה בסרטון לפרטים',
                  color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
                },
              ],
        process:
          uniqueProcess.length > 0
            ? uniqueProcess
            : [{ step: 1, title: 'צפייה בסרטון', desc: 'צפה בסרטון המלא להבנת התהליך' }],
        benefits: benefits.length > 0 ? benefits : ['למידה מעשית', 'דוגמאות חיות'],
      })

      setSummary('generated')
      setIsGeneratingSummary(false)
    }, 1500) // Simulate AI processing time
  }, [currentVideo])

  // Handle summarize
  const handleSummarize = useCallback(() => {
    generateAISummary()
  }, [generateAISummary])

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Course Not Found
          </h1>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Courses
          </Link>
        </div>
      </div>
    )
  }

  // Current chapter based on time
  const currentChapter = currentVideo?.chapters?.find(
    (ch) => currentTime >= ch.startTime && currentTime < ch.endTime
  )
  const currentStageIndex = currentChapter
    ? Math.floor(currentVideo!.chapters!.indexOf(currentChapter) / 3) + 1
    : 1

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {course.title}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-5">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="icon" className="rounded-full">
              <FileText className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Three Column Layout */}
      <div className="flex max-w-[1800px] mx-auto">
        {/* LEFT SIDEBAR - AI Assistant */}
        <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hidden lg:flex flex-col h-[calc(100vh-57px)] overflow-hidden">
          {/* AI Assistant Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    Connected
                  </p>
                </div>
              </div>
              {/* Audio Waveform Animation - using deterministic heights to avoid hydration mismatch */}
              <div className="flex items-center gap-0.5 h-6">
                {[12, 18, 10, 22, 14, 20, 16, 11].map((height, i) => (
                  <div
                    key={i}
                    className="w-1 bg-orange-500 rounded-full animate-pulse"
                    style={{
                      height: `${height}px`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 space-y-3">
              {messages.map((message) => {
                // Parse message content to make timestamps clickable
                const renderMessageContent = (content: string) => {
                  // Match [timestamp:X:XX] pattern
                  const timestampRegex = /\[timestamp:(\d+):(\d+)\]/g
                  const parts: (string | JSX.Element)[] = []
                  let lastIndex = 0
                  let match

                  while ((match = timestampRegex.exec(content)) !== null) {
                    // Add text before the timestamp
                    if (match.index > lastIndex) {
                      parts.push(content.slice(lastIndex, match.index))
                    }

                    // Parse the timestamp
                    const minutes = parseInt(match[1], 10)
                    const seconds = parseInt(match[2], 10)
                    const totalSeconds = minutes * 60 + seconds
                    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`

                    // Add clickable timestamp
                    parts.push(
                      <button
                        key={`ts-${match.index}`}
                        onClick={() => handleTimestampClick(totalSeconds)}
                        className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline font-medium mx-0.5"
                      >
                        {timeStr}
                      </button>
                    )

                    lastIndex = match.index + match[0].length
                  }

                  // Add remaining text
                  if (lastIndex < content.length) {
                    parts.push(content.slice(lastIndex))
                  }

                  return parts.length > 0 ? parts : content
                }

                return (
                  <div
                    key={message.id}
                    className={cn(
                      'max-w-[95%] rounded-2xl px-4 py-2.5 text-sm',
                      message.role === 'user'
                        ? 'bg-blue-600 text-white ml-auto'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    )}
                    dir="rtl"
                  >
                    <div className="whitespace-pre-wrap">
                      {renderMessageContent(message.content)}
                    </div>
                  </div>
                )
              })}

              {isLoading && (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 w-fit">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Chat Input - Always visible at bottom */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="שאל שאלה על הסרטון..."
                  className="w-full px-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="rtl"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleVoiceInput}
                className={cn(
                  'rounded-full',
                  isListening && 'bg-red-100 dark:bg-red-900/30 text-red-600'
                )}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="icon"
                className="rounded-full bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* CENTER - Video Player + Live Transcript below */}
        <div className="flex-1 min-w-0">
          <ScrollArea className="h-[calc(100vh-57px)]">
            <div className="p-4 lg:p-6">
              {/* Video Container */}
              {currentVideo && (
                <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
                  {/* Video Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50">
                    <div className="text-sm text-gray-300">
                      <span className="text-gray-500">Stage {currentStageIndex}</span>
                      <span className="mx-2">•</span>
                      <span>{currentChapter?.title || 'מבוא'}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-300 hover:text-white hover:bg-gray-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>

                  {/* Video Player */}
                  <VideoPlayer
                    video={currentVideo}
                    onTimeUpdate={handleTimeUpdate}
                    onDurationChange={handleDurationChange}
                    seekToTime={seekToTime}
                    className="w-full"
                  />
                </div>
              )}

              {/* Action Buttons below video */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <Button onClick={handleSummarize} variant="outline" className="rounded-full">
                    <Sparkles className="w-4 h-4 mr-2" />
                    סיכום AI
                  </Button>
                  <Button onClick={handleStartQuiz} variant="outline" className="rounded-full">
                    <Brain className="w-4 h-4 mr-2" />
                    בחן את עצמך
                  </Button>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Video {currentVideo?.order || 1} of {course.videos.length}
                </div>
              </div>

              {/* Tabs: Transcript / Quiz */}
              <div className="mt-6">
                <div className="flex gap-6 border-b border-gray-200 dark:border-gray-800" dir="rtl">
                  <button
                    onClick={() => setActiveContentTab('transcript')}
                    className={`flex items-center gap-2 pb-3 px-2 border-b-2 transition-colors ${
                      activeContentTab === 'transcript'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span className="font-medium">תמלול</span>
                  </button>
                  <button
                    onClick={() => setActiveContentTab('quiz')}
                    className={`flex items-center gap-2 pb-3 px-2 border-b-2 transition-colors ${
                      activeContentTab === 'quiz'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Brain className="w-4 h-4" />
                    <span className="font-medium">בוחן</span>
                  </button>
                </div>

                {/* Tab Content */}
                {activeContentTab === 'transcript' && (
                  <div className="mt-0 bg-white dark:bg-gray-900 rounded-b-2xl border border-t-0 border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-500" />
                        Live Transcript
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                        {formatTime(currentTime)} / {formatTime(videoDuration)}
                      </span>
                    </div>

                    {/* All Transcript Chunks with Live Highlighting */}
                    <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                      {currentVideo &&
                        getSampleChunksForVideo(currentVideo.youtubeId).map((chunk) => {
                          const isActive =
                            currentTime >= chunk.startTime && currentTime < chunk.endTime
                          const isPast = currentTime >= chunk.endTime

                          return (
                            <button
                              key={chunk.id}
                              onClick={() => handleTimestampClick(chunk.startTime)}
                              className={cn(
                                'w-full text-right p-3 rounded-xl transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800 border',
                                isActive
                                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 shadow-md scale-[1.01]'
                                  : isPast
                                    ? 'bg-gray-50/50 dark:bg-gray-800/30 border-transparent opacity-60'
                                    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                              )}
                              dir="rtl"
                            >
                              <div className="flex items-start gap-3">
                                <span
                                  className={cn(
                                    'text-xs font-mono flex-shrink-0 pt-0.5 px-2 py-0.5 rounded-md',
                                    isActive
                                      ? 'bg-blue-500 text-white'
                                      : 'text-gray-400 bg-gray-100 dark:bg-gray-800'
                                  )}
                                >
                                  {formatTime(chunk.startTime)}
                                </span>
                                <p
                                  className={cn(
                                    'text-sm leading-relaxed flex-1',
                                    isActive
                                      ? 'text-blue-900 dark:text-blue-100 font-medium'
                                      : 'text-gray-700 dark:text-gray-300'
                                  )}
                                >
                                  {chunk.text}
                                </p>
                                {isActive && (
                                  <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full animate-pulse mt-2" />
                                )}
                              </div>
                            </button>
                          )
                        })}
                    </div>
                  </div>
                )}

                {activeContentTab === 'quiz' && (
                  <QuizPanel quizState={quizState} onTimestampClick={handleTimestampClick} />
                )}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* RIGHT SIDEBAR - Course Info & Materials */}
        <div className="w-80 flex-shrink-0 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hidden xl:block overflow-hidden">
          <ScrollArea className="h-[calc(100vh-57px)]">
            <div className="p-4">
              {/* Course Title Card */}
              <div className="mb-5">
                <h1
                  className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight"
                  dir="rtl"
                >
                  {currentVideo?.title || course.title}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Course by{' '}
                  <span className="text-blue-600 dark:text-blue-400 underline">Avi Levi</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 line-clamp-3" dir="rtl">
                  {currentVideo?.description || course.description}
                </p>

                {/* Tags - Dynamic from course.topics */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {course.topics.map((topic, idx) => {
                    const colorMap: Record<string, string> = {
                      AI: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
                      'No-Code':
                        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
                      Automation:
                        'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
                      'News Summary':
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
                      'Machine Learning':
                        'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
                      Python:
                        'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
                    }
                    const defaultColor =
                      'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800'
                    const colorClass = colorMap[topic] || defaultColor

                    return (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${colorClass}`}
                      >
                        {topic}
                      </span>
                    )
                  })}
                </div>
              </div>

              {/* Course Meta - Dynamic from course data */}
              <div className="space-y-2 mb-5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Type</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white text-right">
                    Pre-recorded
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <BarChart3 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Level</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white capitalize text-right">
                    {course.difficulty === 'beginner'
                      ? 'Beginner'
                      : course.difficulty === 'intermediate'
                        ? 'Intermediate'
                        : course.difficulty === 'advanced'
                          ? 'Advanced'
                          : course.difficulty}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Duration</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white text-right">
                    {currentVideo?.chapters?.length || 0} Ch, {formatTime(videoDuration)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Videos</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white text-right">
                    {course.videos.length} {course.videos.length === 1 ? 'Video' : 'Videos'}
                  </span>
                </div>
              </div>

              {/* Video Chapters - Matching Timeline */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-white">
                    פרקים בסרטון
                  </h3>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
                    {overallProgress}% הושלם
                  </span>
                </div>

                {/* Overall Progress Bar */}
                <div className="mb-3">
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(videoDuration)}</span>
                  </div>
                </div>

                {/* Chapter List - Directly from video chapters */}
                <div className="space-y-1">
                  {chapterItems.map((chapter, idx) => (
                    <button
                      key={chapter.id}
                      onClick={() => {
                        setSeekToTime(chapter.startTime)
                        setTimeout(() => setSeekToTime(undefined), 100)
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 p-2 rounded-lg transition-all duration-200',
                        chapter.isActive
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-400 dark:border-blue-600'
                          : chapter.isCompleted
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                    >
                      {/* Chapter Number / Status */}
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
                          chapter.isActive
                            ? 'bg-blue-500 text-white'
                            : chapter.isCompleted
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        )}
                      >
                        {chapter.isCompleted ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
                      </div>

                      {/* Chapter Info */}
                      <div className="flex-1 min-w-0 text-right" dir="rtl">
                        <div
                          className={cn(
                            'text-xs font-medium truncate',
                            chapter.isActive
                              ? 'text-blue-700 dark:text-blue-300'
                              : chapter.isCompleted
                                ? 'text-green-700 dark:text-green-400'
                                : 'text-gray-900 dark:text-white'
                          )}
                        >
                          {chapter.title}
                        </div>

                        {/* Progress bar - show for active chapter or any chapter with progress */}
                        {(chapter.isActive || (chapter.progress > 0 && !chapter.isCompleted)) && (
                          <div className="mt-1">
                            <div
                              className={cn(
                                'h-0.5 rounded-full overflow-hidden',
                                chapter.isActive
                                  ? 'bg-blue-200 dark:bg-blue-800'
                                  : 'bg-gray-200 dark:bg-gray-700'
                              )}
                            >
                              <div
                                className={cn(
                                  'h-full transition-all duration-300',
                                  chapter.isActive ? 'bg-blue-500' : 'bg-gray-400 dark:bg-gray-500'
                                )}
                                style={{ width: `${chapter.progress}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-gray-400 mt-0.5 block">
                              {chapter.progress}% נצפה
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span
                          className={cn(
                            'text-[10px] font-mono',
                            chapter.isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                          )}
                        >
                          {formatTime(chapter.startTime)}
                        </span>
                        <span className="text-[10px] text-gray-400">{chapter.duration}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Summary Modal - AI Generated */}
      {showSummary && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowSummary(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
              <button
                onClick={() => setShowSummary(false)}
                className="absolute top-4 left-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <div className="text-center" dir="rtl">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 mb-3">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">סיכום AI מהתמליל</h3>
                <p className="text-blue-100 text-sm mt-1">{currentVideo?.title}</p>
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="max-h-[50vh]">
              {isGeneratingSummary ? (
                <div className="p-12 flex flex-col items-center justify-center" dir="rtl">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                    <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    מנתח את התמליל...
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                    ה-AI קורא את התמליל ומייצר סיכום מותאם אישית
                  </p>
                  <div className="flex gap-1 mt-4">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              ) : generatedSummaryData ? (
                <div className="p-6" dir="rtl">
                  {/* AI Badge */}
                  <div className="flex items-center gap-2 mb-4 text-xs text-blue-600 dark:text-blue-400">
                    <Sparkles className="w-4 h-4" />
                    <span>סיכום זה נוצר אוטומטית מתוך התמליל של הסרטון</span>
                  </div>

                  {/* About Section */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">על מה הסרטון?</h4>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed pr-10">
                      {generatedSummaryData.about}
                    </p>
                  </div>

                  {/* Tools Section */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Settings className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        כלים שזוהו בתמליל
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-10">
                      {generatedSummaryData.tools.map((tool, idx) => (
                        <div key={idx} className={`${tool.color} rounded-xl p-3`}>
                          <div className="font-medium text-sm">{tool.name}</div>
                          <div className="text-xs opacity-80">{tool.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Process Section */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">התהליך</h4>
                    </div>
                    <div className="space-y-3 pr-10">
                      {generatedSummaryData.process.map((item) => (
                        <div key={item.step} className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {item.step}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {item.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {item.desc}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Benefits Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">יתרונות</h4>
                    </div>
                    <div className="flex flex-wrap gap-2 pr-10">
                      {generatedSummaryData.benefits.map((benefit, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowSummary(false)}
                  className="flex-1 rounded-xl"
                >
                  סגור
                </Button>
                <Button
                  onClick={() => {
                    if (generatedSummaryData) {
                      const summaryText = `
סיכום הסרטון: ${currentVideo?.title}

על מה הסרטון?
${generatedSummaryData.about}

כלים:
${generatedSummaryData.tools.map((t) => `• ${t.name}: ${t.desc}`).join('\n')}

התהליך:
${generatedSummaryData.process.map((p) => `${p.step}. ${p.title}: ${p.desc}`).join('\n')}

יתרונות:
${generatedSummaryData.benefits.map((b) => `✓ ${b}`).join('\n')}
                      `.trim()
                      navigator.clipboard.writeText(summaryText)
                    }
                  }}
                  disabled={isGeneratingSummary || !generatedSummaryData}
                  className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Share2 className="w-4 h-4 ml-2" />
                  העתק סיכום
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
