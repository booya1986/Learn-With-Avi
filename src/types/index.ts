// Core types for LearnWithAvi

export interface Video {
  id: string
  youtubeId: string
  title: string
  description: string
  duration: number // in seconds
  thumbnail: string
  topic: string
  courseId: string
  order: number
  chapters?: Chapter[]
}

export interface Chapter {
  title: string
  startTime: number // in seconds
  endTime: number
}

export interface Course {
  id: string
  title: string
  description: string
  thumbnail: string
  videos: Video[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  topics: string[]
}

export interface TranscriptChunk {
  id: string
  videoId: string
  text: string
  startTime: number // in seconds
  endTime: number
  embedding?: number[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: VideoSource[]
  isVoice?: boolean
}

export interface VideoSource {
  videoId: string
  videoTitle: string
  timestamp: number
  text: string
  relevance: number
}

export interface RAGContext {
  chunks: TranscriptChunk[]
  query: string
  videoContext?: string // current video being watched
}

export interface VoiceState {
  isListening: boolean
  isSpeaking: boolean
  transcript: string
  error?: string
}

// ==========================================
// QUIZ & ASSESSMENT TYPES
// ==========================================

export interface QuizOption {
  id: string
  text: string
  isCorrect: boolean
}

export interface QuizQuestion {
  id: string
  questionText: string
  options: QuizOption[]
  correctAnswer: string
  explanation: string
  bloomLevel: number
  topic: string
  sourceTimeRange?: { start: number; end: number }
}

export interface QuizSessionState {
  videoId: string
  currentBloom: number
  questions: QuizQuestion[]
  currentIndex: number
  answers: QuizAttemptRecord[]
  topicMastery: Record<string, { correct: number; total: number; bloomLevel: number }>
  streak: number
  bestStreak: number
}

export interface QuizAttemptRecord {
  questionId: string
  answer: string
  isCorrect: boolean
  bloomLevel: number
  topic: string
  timestamp: number
}

export type BloomLevel = 1 | 2 | 3 | 4

export const BLOOM_LABELS: Record<number, string> = {
  1: 'זכירה',
  2: 'הבנה',
  3: 'יישום',
  4: 'ניתוח',
}

// ==========================================
// VIDEO / CHAPTER UI TYPES
// ==========================================

export interface ChapterItem {
  id: string
  title: string
  startTime: number
  endTime: number
  duration: string
  isActive: boolean
  isCompleted: boolean
  progress: number // 0-100
}

// ==========================================
// SUMMARY TYPES
// ==========================================

export interface SummaryData {
  about: string
  tools: Array<{
    name: string
    desc: string
    color: string
  }>
  process: Array<{
    step: number
    title: string
    desc: string
  }>
  benefits: string[]
}
