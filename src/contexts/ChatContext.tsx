/**
 * ChatContext - Provides chat state and message handling
 *
 * Manages chat messages, streaming responses from Claude API,
 * voice input state, and AI summary generation.
 *
 * @example
 * ```tsx
 * const { messages, sendMessage, inputMessage, setInputMessage } = useChatContext();
 *
 * <input value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} />
 * <button onClick={sendMessage}>Send</button>
 * ```
 */

'use client'

import { createContext, useContext, type ReactNode, useState, useCallback, useMemo } from 'react'

import { getSampleChunksForVideo } from '@/data/sample-transcripts'
import { type SummaryData , type ChatMessage } from '@/types'

export interface ChatContextValue {
  // Chat state
  messages: ChatMessage[]
  inputMessage: string
  isLoading: boolean
  isListening: boolean

  // Summary state
  showSummary: boolean
  isGeneratingSummary: boolean
  generatedSummaryData: SummaryData | null

  // Actions
  setInputMessage: (message: string) => void
  sendMessage: (videoId?: string, videoTitle?: string, videoDescription?: string) => Promise<void>
  toggleVoiceInput: () => void
  handleKeyPress: (e: React.KeyboardEvent) => void
  generateSummary: (videoId: string, videoTitle: string, videoDescription: string) => void
  setShowSummary: (show: boolean) => void
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined)

interface ChatProviderProps {
  children: ReactNode
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
  // Chat state - use lazy initialization to avoid hydration mismatch
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: `שלום! אני עוזר הלמידה שלך. שאל אותי כל שאלה על תוכן הסרטון ואני אעזור לך להבין את הנושאים בצורה טובה יותר.`,
      timestamp: new Date(0),
    },
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)

  // Summary state
  const [showSummary, setShowSummary] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [generatedSummaryData, setGeneratedSummaryData] = useState<SummaryData | null>(null)

  // Send chat message to API
  const sendMessage = useCallback(
    async (videoId?: string, videoTitle?: string, videoDescription?: string) => {
      if (!inputMessage.trim() || isLoading) {return}

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: inputMessage,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInputMessage('')
      setIsLoading(true)

      const chunks = videoId ? getSampleChunksForVideo(videoId) : []

      const conversationHistory = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: inputMessage,
            context: {
              chunks,
              videoContext: videoTitle
                ? `${videoTitle} - ${videoDescription || ''}`
                : undefined,
            },
            conversationHistory,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to get response from AI')
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])

        if (reader) {
          let fullContent = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) {break}

            const chunk = decoder.decode(value, { stream: true })
            fullContent += chunk

            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: fullContent } : m))
            )
          }
        }
      } catch (error) {
        console.error('Chat error:', error)
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
    },
    [inputMessage, isLoading, messages]
  )

  // Toggle voice input
  const toggleVoiceInput = useCallback(() => {
    setIsListening((prev) => !prev)
  }, [])

  // Handle key press (Enter to send)
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        // Note: Parent component should call sendMessage with video context
      }
    },
    []
  )

  // Generate AI summary from transcript
  const generateSummary = useCallback((videoId: string, _videoTitle: string, videoDescription: string) => {
    setShowSummary(true)
    setIsGeneratingSummary(true)

    setTimeout(() => {
      const chunks = getSampleChunksForVideo(videoId)
      const fullTranscript = chunks.map((c) => c.text).join(' ')

      const toolsMap: Record<string, { color: string; desc: string }> = {
        make: {
          color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
          desc: 'אוטומציה ללא קוד',
        },
        newsapi: {
          color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
          desc: 'איסוף חדשות',
        },
        chatgpt: {
          color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
          desc: 'סיכום בינה מלאכותית',
        },
        elevenlabs: {
          color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
          desc: 'המרה לקול',
        },
        telegram: {
          color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
          desc: 'שליחת הודעות',
        },
      }

      const toolsFound: Array<{ name: string; desc: string; color: string }> = []
      Object.entries(toolsMap).forEach(([key, value]) => {
        if (fullTranscript.toLowerCase().includes(key)) {
          toolsFound.push({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            desc: value.desc,
            color: value.color,
          })
        }
      })

      const processSteps: Array<{ step: number; title: string; desc: string }> = []
      if (fullTranscript.includes('צעד') || fullTranscript.includes('שלב')) {
        processSteps.push(
          { step: 1, title: 'איסוף מידע', desc: 'שליפת חדשות דרך API' },
          { step: 2, title: 'עיבוד', desc: 'סיכום התוכן באמצעות AI' },
          { step: 3, title: 'המרה לקול', desc: 'יצירת קובץ אודיו' },
          { step: 4, title: 'שליחה', desc: 'העברה אוטומטית למשתמשים' }
        )
      }

      const benefits: string[] = []
      if (fullTranscript.includes('אוטומטי') || fullTranscript.includes('לבד')) {
        benefits.push('הכל אוטומטי')
      }
      if (fullTranscript.includes('חינמית') || fullTranscript.includes('עלות')) {
        benefits.push('עלות נמוכה')
      }
      if (fullTranscript.includes('גמיש') || fullTranscript.includes('התאמה')) {
        benefits.push('קל להתאמה אישית')
      }

      const aboutText =
        chunks.length > 0
          ? `בסרטון הזה אבי מראה ${videoDescription || 'איך לבנות פרויקט מעניין'}. הסרטון מכסה את כל השלבים מההתחלה ועד הסוף, כולל הסבר על הכלים והטכניקות השונות.`
          : videoDescription || ''

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
          processSteps.length > 0
            ? processSteps
            : [{ step: 1, title: 'צפייה בסרטון', desc: 'צפה בסרטון המלא להבנת התהליך' }],
        benefits: benefits.length > 0 ? benefits : ['למידה מעשית', 'דוגמאות חיות'],
      })

      setIsGeneratingSummary(false)
    }, 1500)
  }, [])

  const value = useMemo(
    () => ({
      messages,
      inputMessage,
      isLoading,
      isListening,
      showSummary,
      isGeneratingSummary,
      generatedSummaryData,
      setInputMessage,
      sendMessage,
      toggleVoiceInput,
      handleKeyPress,
      generateSummary,
      setShowSummary,
    }),
    [
      messages,
      inputMessage,
      isLoading,
      isListening,
      showSummary,
      isGeneratingSummary,
      generatedSummaryData,
      sendMessage,
      toggleVoiceInput,
      handleKeyPress,
      generateSummary,
    ]
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

/**
 * Hook to access chat context
 * @throws Error if used outside ChatProvider
 */
export function useChatContext() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider')
  }
  return context
}
