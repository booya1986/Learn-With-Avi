/**
 * useSummaryGeneration - AI-powered video summary generation
 *
 * Analyzes video transcripts to extract:
 * - Tools and technologies mentioned
 * - Process steps described
 * - Key benefits highlighted
 * - Video overview summary
 *
 * @example
 * ```tsx
 * const {
 *   showSummary,
 *   summary,
 *   isGenerating,
 *   generateSummary,
 *   closeSummary
 * } = useSummaryGeneration(currentVideo);
 *
 * <Button onClick={generateSummary}>Generate Summary</Button>
 * ```
 */

import { useState, useCallback } from 'react';

import { getSampleChunksForVideo } from '@/data/sample-transcripts';
import { type Video, type SummaryData } from '@/types';

export interface UseSummaryGenerationReturn {
  /** Whether summary modal is visible */
  showSummary: boolean;

  /** Generated summary data */
  summary: SummaryData | null;

  /** Whether summary is being generated */
  isGenerating: boolean;

  /** Generate summary from transcript */
  generateSummary: () => void;

  /** Close summary modal */
  closeSummary: () => void;
}

/**
 * Custom hook for AI summary generation
 *
 * @param video - Current video object
 * @returns Summary state and control functions
 */
export function useSummaryGeneration(
  video: Video | null
): UseSummaryGenerationReturn {
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Generate AI Summary from Transcript
   * Analyzes transcript to extract key information
   */
  const generateSummary = useCallback(() => {
    if (!video) {return;}

    setIsGenerating(true);
    setShowSummary(true);

    // Get all transcript chunks
    const chunks = getSampleChunksForVideo(video.youtubeId);
    const fullTranscript = chunks.map(c => c.text).join(' ');

    // Simulate AI processing - analyze transcript to extract key information
    setTimeout(() => {
      // Extract tools mentioned in the transcript
      const toolsFound: { name: string; desc: string; color: string }[] = [];
      const toolPatterns = [
        {
          pattern: /make|integromat/i,
          name: 'Make (Integromat)',
          desc: 'פלטפורמה לאוטומציה ויזואלית',
          color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
        },
        {
          pattern: /news\s*api/i,
          name: 'News API',
          desc: 'איסוף כתבות חדשות מהעולם',
          color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
        },
        {
          pattern: /chatgpt|openai|gpt/i,
          name: 'ChatGPT (OpenAI)',
          desc: 'סיכום טקסט חכם בעברית',
          color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
        },
        {
          pattern: /elevenlabs|eleven\s*labs/i,
          name: 'ElevenLabs',
          desc: 'המרת טקסט לשמע טבעי',
          color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
        },
        {
          pattern: /telegram|טלגרם/i,
          name: 'Telegram',
          desc: 'שליחת הודעות אוטומטית',
          color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
        },
      ];

      toolPatterns.forEach(tp => {
        if (tp.pattern.test(fullTranscript)) {
          toolsFound.push({ name: tp.name, desc: tp.desc, color: tp.color });
        }
      });

      // Extract process steps from transcript content
      const processSteps: { step: number; title: string; desc: string }[] = [];

      // Analyze chunks to find process descriptions
      chunks.forEach((chunk) => {
        const text = chunk.text.toLowerCase();
        if (text.includes('הצעד הראשון') || text.includes('news api')) {
          processSteps.push({
            step: 1,
            title: 'איסוף חדשות',
            desc: 'News API מביא את החדשות האחרונות על AI'
          });
        }
        if (text.includes('סיכום') && text.includes('chatgpt')) {
          processSteps.push({
            step: 2,
            title: 'סיכום עם AI',
            desc: 'ChatGPT מסכם את הכתבות בעברית בסגנון רדיו'
          });
        }
        if (text.includes('elevenlabs') || text.includes('שמע') || text.includes('mp3')) {
          processSteps.push({
            step: 3,
            title: 'המרה לשמע',
            desc: 'ElevenLabs ממיר את הסיכום לקובץ MP3'
          });
        }
        if (text.includes('טלגרם') || text.includes('שליחה')) {
          processSteps.push({
            step: 4,
            title: 'שליחה אוטומטית',
            desc: 'הקובץ נשלח לטלגרם כל בוקר'
          });
        }
      });

      // Remove duplicates and sort
      const uniqueProcess = processSteps
        .filter((item, idx, arr) => arr.findIndex(i => i.step === item.step) === idx)
        .sort((a, b) => a.step - b.step);

      // Extract benefits
      const benefits: string[] = [];
      if (fullTranscript.includes('בלי קוד') || fullTranscript.includes('no code')) {
        benefits.push('לא צריך לכתוב קוד');
      }
      if (fullTranscript.includes('גמיש') || fullTranscript.includes('התאמה')) {
        benefits.push('קל להתאמה אישית');
      }
      if (fullTranscript.includes('חינמית') || fullTranscript.includes('עלות')) {
        benefits.push('עלות נמוכה');
      }
      if (fullTranscript.includes('אוטומטי') || fullTranscript.includes('לבד')) {
        benefits.push('הכל אוטומטי');
      }

      // Generate about text from first few chunks
      const introChunks = chunks.slice(0, 3);
      const aboutText = introChunks.length > 0
        ? `בסרטון הזה אבי מראה ${video.description || 'איך לבנות פרויקט מעניין'}. הסרטון מכסה את כל השלבים מההתחלה ועד הסוף, כולל הסבר על הכלים והטכניקות השונות.`
        : video.description || '';

      setSummary({
        about: aboutText,
        tools: toolsFound.length > 0 ? toolsFound : [
          {
            name: 'לא זוהו כלים',
            desc: 'צפה בסרטון לפרטים',
            color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }
        ],
        process: uniqueProcess.length > 0 ? uniqueProcess : [
          {
            step: 1,
            title: 'צפייה בסרטון',
            desc: 'צפה בסרטון המלא להבנת התהליך'
          }
        ],
        benefits: benefits.length > 0 ? benefits : ['למידה מעשית', 'דוגמאות חיות'],
      });

      setIsGenerating(false);
    }, 1500); // Simulate AI processing time
  }, [video]);

  /**
   * Close summary modal
   */
  const closeSummary = useCallback(() => {
    setShowSummary(false);
  }, []);

  return {
    showSummary,
    summary,
    isGenerating,
    generateSummary,
    closeSummary,
  };
}
