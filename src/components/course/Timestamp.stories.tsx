import type { Meta, StoryObj } from '@storybook/react'

import { Timestamp } from './Timestamp'

/**
 * Timestamp component for displaying and navigating to specific video times
 *
 * A clickable badge that displays a formatted timestamp (M:SS format).
 * Used in transcripts and chat messages to allow jumping to specific video moments.
 *
 * @component
 */
const meta: Meta<typeof Timestamp> = {
  title: 'Course/Timestamp',
  component: Timestamp,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A clickable timestamp badge component for video navigation.

**Features:**
- Formats seconds to M:SS format (e.g., 125 → "2:05")
- Clickable with onClick callback
- Active state styling
- Keyboard accessible (Enter/Space)
- ARIA labels for screen readers
- Disabled state when no onClick provided
        `,
      },
    },
  },
  argTypes: {
    seconds: {
      control: { type: 'number', min: 0, max: 3600, step: 1 },
      description: 'Time in seconds',
      table: {
        defaultValue: { summary: '0' },
      },
    },
    isActive: {
      control: 'boolean',
      description: 'Whether this timestamp represents the current video time',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    onClick: {
      action: 'clicked',
      description: 'Callback when timestamp is clicked',
    },
  },
}

export default meta
type Story = StoryObj<typeof Timestamp>

/**
 * Default timestamp (clickable)
 */
export const Default: Story = {
  args: {
    seconds: 125,
    onClick: () => console.log('Timestamp clicked'),
  },
}

/**
 * Active timestamp (current video position)
 */
export const Active: Story = {
  args: {
    seconds: 125,
    isActive: true,
    onClick: () => console.log('Active timestamp clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Active state indicates the current video position with blue background.',
      },
    },
  },
}

/**
 * Non-clickable timestamp (display only)
 */
export const NonClickable: Story = {
  args: {
    seconds: 125,
    onClick: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'When no onClick is provided, the timestamp is not clickable and appears dimmed.',
      },
    },
  },
}

/**
 * Start of video (0:00)
 */
export const VideoStart: Story = {
  args: {
    seconds: 0,
    onClick: () => console.log('Jump to start'),
  },
}

/**
 * Short duration (under 1 minute)
 */
export const ShortDuration: Story = {
  args: {
    seconds: 45,
    onClick: () => console.log('Jump to 0:45'),
  },
}

/**
 * Long duration (over 10 minutes)
 */
export const LongDuration: Story = {
  args: {
    seconds: 725,
    onClick: () => console.log('Jump to 12:05'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Timestamp for 12 minutes and 5 seconds (12:05).',
      },
    },
  },
}

/**
 * Timestamp list (as used in transcripts)
 */
export const TimestampList: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
      <Timestamp seconds={0} onClick={() => console.log('0:00')} />
      <Timestamp seconds={45} onClick={() => console.log('0:45')} />
      <Timestamp seconds={125} isActive onClick={() => console.log('2:05')} />
      <Timestamp seconds={245} onClick={() => console.log('4:05')} />
      <Timestamp seconds={360} onClick={() => console.log('6:00')} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of multiple timestamps as they appear in a transcript list.',
      },
    },
  },
}

/**
 * Inline with text (chat message example)
 */
export const InlineWithText: Story = {
  render: () => (
    <div className="text-gray-700 dark:text-gray-300" dir="rtl">
      <p>
        ניתן לראות את ההסבר המלא ב-{' '}
        <Timestamp seconds={125} onClick={() => console.log('2:05')} />{' '}
        בסרטון.
      </p>
      <p className="mt-2">
        לדוגמה נוספת, קפוץ ל-{' '}
        <Timestamp seconds={245} onClick={() => console.log('4:05')} />.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Timestamps used inline within text content (Hebrew RTL example).',
      },
    },
  },
}

/**
 * All states side by side
 */
export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <div>
        <div className="text-xs text-gray-500 mb-1">Default</div>
        <Timestamp seconds={125} onClick={() => console.log('Default')} />
      </div>
      <div>
        <div className="text-xs text-gray-500 mb-1">Active</div>
        <Timestamp seconds={125} isActive onClick={() => console.log('Active')} />
      </div>
      <div>
        <div className="text-xs text-gray-500 mb-1">Non-clickable</div>
        <Timestamp seconds={125} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visual comparison of all timestamp states.',
      },
    },
  },
}
