import { useState } from 'react'

import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '@/components/ui/button'

import { SummaryModal, type SummaryData } from './SummaryModal'


/**
 * AI-generated video summary modal
 *
 * Displays a comprehensive summary of a video extracted from its transcript.
 * Shows overview, tools used, process steps, and benefits in structured sections.
 *
 * @component
 */
const meta: Meta<typeof SummaryModal> = {
  title: 'Course/SummaryModal',
  component: SummaryModal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A full-screen modal displaying AI-generated summaries of video content.

**Features:**
- Full-screen modal with backdrop
- Loading state during AI processing
- Copy to clipboard functionality
- Keyboard navigation (ESC to close)
- Focus trap when open
- RTL support for Hebrew content
- Structured sections (About, Tools, Process, Benefits)
        `,
      },
    },
    layout: 'fullscreen',
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is open',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    isGenerating: {
      control: 'boolean',
      description: 'Whether the summary is currently being generated',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    videoTitle: {
      control: 'text',
      description: 'Title of the video being summarized',
    },
  },
}

export default meta
type Story = StoryObj<typeof SummaryModal>

// Sample summary data for stories
const sampleSummaryData: SummaryData = {
  about: 'בסרטון הזה אבי מראה איך לבנות אפליקציה לסיכום חדשות AI בצורה אוטומטית, בלי לכתוב שורת קוד אחת. הסרטון מכסה את כל השלבים מההתחלה ועד הסוף, כולל הסבר על הכלים והטכניקות השונות.',
  tools: [
    {
      name: 'Make (Integromat)',
      desc: 'פלטפורמה לאוטומציה ויזואלית',
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    },
    {
      name: 'News API',
      desc: 'איסוף כתבות חדשות מהעולם',
      color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    },
    {
      name: 'ChatGPT (OpenAI)',
      desc: 'סיכום טקסט חכם בעברית',
      color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    },
    {
      name: 'ElevenLabs',
      desc: 'המרת טקסט לשמע טבעי',
      color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
    },
  ],
  process: [
    {
      step: 1,
      title: 'איסוף חדשות',
      desc: 'News API מביא את החדשות האחרונות על AI',
    },
    {
      step: 2,
      title: 'סיכום עם AI',
      desc: 'ChatGPT מסכם את הכתבות בעברית בסגנון רדיו',
    },
    {
      step: 3,
      title: 'המרה לשמע',
      desc: 'ElevenLabs ממיר את הסיכום לקובץ MP3',
    },
    {
      step: 4,
      title: 'שליחה אוטומטית',
      desc: 'הקובץ נשלח לטלגרם כל בוקר',
    },
  ],
  benefits: [
    'לא צריך לכתוב קוד',
    'קל להתאמה אישית',
    'עלות נמוכה',
    'הכל אוטומטי',
  ],
}

// Interactive wrapper component
const SummaryModalWrapper = ({ initialOpen = false, isGenerating = false, summaryData = sampleSummaryData }: { initialOpen?: boolean; isGenerating?: boolean; summaryData?: SummaryData | null }) => {
  const [isOpen, setIsOpen] = useState(initialOpen)

  return (
    <>
      <div className="p-8">
        <Button onClick={() => setIsOpen(true)}>Open Summary Modal</Button>
      </div>
      <SummaryModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        videoTitle="איך בניתי אפליקציה שמייצרת סיכום קולי יומי של חדשות AI"
        isGenerating={isGenerating}
        summaryData={summaryData}
      />
    </>
  )
}

/**
 * Default closed state (click button to open)
 */
export const Default: Story = {
  render: () => <SummaryModalWrapper />,
  parameters: {
    docs: {
      description: {
        story: 'Click the button to open the summary modal with generated content.',
      },
    },
  },
}

/**
 * Loading state (generating summary)
 */
export const Loading: Story = {
  render: () => <SummaryModalWrapper initialOpen isGenerating />,
  parameters: {
    docs: {
      description: {
        story: 'Modal displays a loading spinner while AI generates the summary from the transcript.',
      },
    },
  },
}

/**
 * Generated summary (filled state)
 */
export const GeneratedSummary: Story = {
  render: () => <SummaryModalWrapper initialOpen />,
  parameters: {
    docs: {
      description: {
        story: 'Modal showing the fully generated summary with all sections populated.',
      },
    },
  },
}

/**
 * Empty summary state
 */
export const EmptySummary: Story = {
  render: () => <SummaryModalWrapper initialOpen summaryData={null} />,
  parameters: {
    docs: {
      description: {
        story: 'Modal with no summary data (rare edge case).',
      },
    },
  },
}

/**
 * Minimal summary (few tools and benefits)
 */
export const MinimalSummary: Story = {
  render: () => (
    <SummaryModalWrapper
      initialOpen
      summaryData={{
        about: 'סרטון קצר המציג את היסודות של פיתוח תוכנה עם AI.',
        tools: [
          {
            name: 'ChatGPT',
            desc: 'מודל שפה לעזרה בקוד',
            color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
          },
        ],
        process: [
          {
            step: 1,
            title: 'שאל את ה-AI',
            desc: 'שאל שאלה ברורה על הבעיה שלך',
          },
          {
            step: 2,
            title: 'קבל פתרון',
            desc: 'ה-AI מספק קוד מוכן לשימוש',
          },
        ],
        benefits: ['מהיר', 'פשוט'],
      }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Minimal summary with fewer items in each section.',
      },
    },
  },
}

/**
 * Complex summary (many tools and steps)
 */
export const ComplexSummary: Story = {
  render: () => (
    <SummaryModalWrapper
      initialOpen
      summaryData={{
        about: 'מדריך מקיף לבניית מערכת מורכבת עם עשרות כלים וטכנולוגיות שונות. הסרטון מציג את כל השלבים מתכנון ראשוני ועד לדפלוימנט לפרודקשן.',
        tools: [
          { name: 'React', desc: 'ממשק משתמש', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
          { name: 'Next.js', desc: 'פריימוורק', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
          { name: 'TypeScript', desc: 'שפת תכנות', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' },
          { name: 'Tailwind CSS', desc: 'עיצוב', color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300' },
          { name: 'Prisma', desc: 'מסד נתונים', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
          { name: 'tRPC', desc: 'API', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
        ],
        process: [
          { step: 1, title: 'תכנון ארכיטקטורה', desc: 'עיצוב המבנה הכללי של המערכת' },
          { step: 2, title: 'הקמת פרויקט', desc: 'התקנת כלים והגדרת סביבת פיתוח' },
          { step: 3, title: 'בניית UI', desc: 'פיתוח ממשק המשתמש עם React' },
          { step: 4, title: 'בניית Backend', desc: 'יצירת API ומסד נתונים' },
          { step: 5, title: 'אינטגרציה', desc: 'חיבור בין כל החלקים' },
          { step: 6, title: 'בדיקות', desc: 'כתיבת טסטים אוטומטיים' },
          { step: 7, title: 'דפלוימנט', desc: 'העלאה לפרודקשן' },
        ],
        benefits: [
          'קוד נקי וסדור',
          'מהיר וביצועי',
          'קל לתחזוקה',
          'בטוח',
          'סקלביליות גבוהה',
          'תיעוד מקיף',
        ],
      }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complex summary with many tools, process steps, and benefits.',
      },
    },
  },
}

/**
 * Dark mode preview
 */
export const DarkMode: Story = {
  render: () => <SummaryModalWrapper initialOpen />,
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'Summary modal in dark mode theme.',
      },
    },
  },
}
