/**
 * Quiz Prompt Templates for Claude
 *
 * Generates adaptive quiz questions from video transcript content using
 * Bloom's Taxonomy cognitive levels.
 */

import { TranscriptChunk } from '@/types'
import { formatTime } from '@/lib/utils'

/**
 * System prompt for quiz generation
 *
 * Instructs Claude to generate multiple choice questions from transcript
 * content following Bloom's Taxonomy levels and educational best practices.
 */
export const QUIZ_GENERATION_SYSTEM_PROMPT = `You are an expert educational assessment designer for LearnWithAvi, an Israeli online learning platform.

Your role is to generate high-quality multiple-choice quiz questions from video transcript content to help students test their understanding.

CRITICAL RULES:
1. Generate questions ONLY from the provided transcript content - never use external knowledge
2. All questions and answers MUST be in Hebrew (except if language parameter specifies 'en')
3. Each question must have EXACTLY 4 options (labeled a, b, c, d)
4. Only ONE option should be correct
5. All 4 options must be plausible - avoid obviously wrong answers
6. Reference specific timestamps from the transcript in the explanation
7. Follow the specified Bloom's Taxonomy level strictly
8. Identify the main topic/concept being tested

BLOOM'S TAXONOMY LEVELS:
1. Remember (זכירה) - Recall facts, terms, basic concepts
2. Understand (הבנה) - Explain ideas, summarize, compare
3. Apply (יישום) - Use information in new situations, solve problems
4. Analyze (ניתוח) - Break down information, identify patterns, draw connections

OUTPUT FORMAT:
Return a JSON array of question objects. Each question must have:
{
  "questionText": "השאלה בעברית",
  "options": [
    { "id": "a", "text": "תשובה א", "isCorrect": false },
    { "id": "b", "text": "תשובה ב", "isCorrect": true },
    { "id": "c", "text": "תשובה ג", "isCorrect": false },
    { "id": "d", "text": "תשובה ד", "isCorrect": false }
  ],
  "correctAnswer": "b",
  "explanation": "הסבר מדוע התשובה נכונה, עם התייחסות לזמן [timestamp:2:34] בסרטון",
  "bloomLevel": 2,
  "topic": "הנושא המרכזי",
  "sourceTimeRange": { "start": 154, "end": 180 }
}

QUALITY GUIDELINES:
- Questions should be clear, unambiguous, and test meaningful understanding
- Distractors (wrong answers) should be plausible but clearly incorrect
- Explanations should reference specific content and timestamps
- Vary the topics across different parts of the video
- sourceTimeRange should indicate where in the video the answer can be found

Remember: You are helping students learn effectively. Make questions challenging but fair, and provide educational value through good explanations.`

/**
 * Bloom's Taxonomy level-specific instructions with Hebrew examples
 */
const BLOOM_LEVEL_INSTRUCTIONS: Record<number, string> = {
  1: `LEVEL 1 - REMEMBER (זכירה):
Generate questions that test basic recall of facts, terms, and concepts from the video.

Examples:
- "מהו השם של הכלי ש[המרצה] השתמש בו לאוטומציה?"
- "איזה API נזכר בסרטון לאיסוף חדשות?"
- "מה המטרה של האפליקציה שהוצגה?"

Focus on: Who, What, When, Where questions
Answer location: Directly stated in the transcript`,

  2: `LEVEL 2 - UNDERSTAND (הבנה):
Generate questions that test comprehension - students must explain, summarize, or compare concepts.

Examples:
- "מדוע [המרצה] בחר להשתמש ב-Make במקום לכתוב קוד?"
- "מה ההבדל בין ElevenLabs ל-Google Cloud TTS לפי הסרטון?"
- "כיצד עובד התהליך של יצירת הסיכום הקולי?"

Focus on: Why, How, Compare, Explain questions
Answer location: Requires understanding relationships between ideas`,

  3: `LEVEL 3 - APPLY (יישום):
Generate questions where students must apply concepts to new situations or solve problems.

Examples:
- "אם רוצים לבנות אפליקציה דומה לחדשות ספורט, איזה שינויים צריך לבצע?"
- "איך אפשר להשתמש באותם עקרונות כדי ליצור סיכום שבועי במקום יומי?"
- "מה צריך לשנות כדי לשלוח את הסיכום במייל במקום בטלגרם?"

Focus on: Apply, Use, Implement, Solve questions
Answer location: Requires using information from video in new context`,

  4: `LEVEL 4 - ANALYZE (ניתוח):
Generate questions that require breaking down information, identifying patterns, or drawing connections.

Examples:
- "מה היתרונות והחסרונות של הגישה no-code שהוצגה?"
- "איזה קשר יש בין בחירת ה-API לבין העלות הכוללת של הפתרון?"
- "למה התהליך מחולק לארבעה שלבים נפרדים ולא שלב אחד?"

Focus on: Analyze, Compare, Contrast, Categorize questions
Answer location: Requires synthesis of multiple parts of the video`,
}

/**
 * Build quiz generation prompt for Claude
 *
 * @param chunks - Transcript chunks from the video
 * @param bloomLevel - Bloom's Taxonomy level (1-4)
 * @param count - Number of questions to generate
 * @param language - Question language ('he' or 'en')
 * @param videoTitle - Title of the video
 * @param chapterTitle - Optional chapter title for focused questions
 * @returns Formatted prompt string for Claude
 */
export function buildQuizPrompt(
  chunks: TranscriptChunk[],
  bloomLevel: number,
  count: number,
  language: 'he' | 'en' = 'he',
  videoTitle?: string,
  chapterTitle?: string
): string {
  // Validate bloom level
  if (bloomLevel < 1 || bloomLevel > 4) {
    throw new Error('Bloom level must be between 1 and 4')
  }

  // Build transcript context with timestamps
  const transcriptContext = chunks
    .sort((a, b) => a.startTime - b.startTime)
    .map((chunk) => {
      const timestamp = formatTime(chunk.startTime)
      return `[${timestamp}] ${chunk.text}`
    })
    .join('\n\n')

  const languageInstruction =
    language === 'en' ? 'Generate questions in ENGLISH.' : 'Generate questions in HEBREW.'

  const contextInfo = chapterTitle
    ? `\nChapter: ${chapterTitle}`
    : videoTitle
      ? `\nVideo: ${videoTitle}`
      : ''

  const prompt = `${QUIZ_GENERATION_SYSTEM_PROMPT}

${BLOOM_LEVEL_INSTRUCTIONS[bloomLevel]}

TASK:
Generate ${count} multiple-choice questions at Bloom Level ${bloomLevel} from the following transcript.
${languageInstruction}${contextInfo}

TRANSCRIPT:
---
${transcriptContext}
---

Generate exactly ${count} questions. Return ONLY valid JSON array, no other text.
Each question must strictly follow Bloom Level ${bloomLevel} cognitive requirements.

Output format:
[
  {
    "questionText": "...",
    "options": [
      { "id": "a", "text": "...", "isCorrect": false },
      { "id": "b", "text": "...", "isCorrect": true },
      { "id": "c", "text": "...", "isCorrect": false },
      { "id": "d", "text": "...", "isCorrect": false }
    ],
    "correctAnswer": "b",
    "explanation": "...",
    "bloomLevel": ${bloomLevel},
    "topic": "...",
    "sourceTimeRange": { "start": 0, "end": 0 }
  }
]`

  return prompt
}
