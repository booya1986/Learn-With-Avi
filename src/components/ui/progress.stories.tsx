import type { Meta, StoryObj } from '@storybook/react'

import { Progress } from './progress'

/**
 * Progress bar component for visualizing completion status
 *
 * A simple, accessible progress bar with gradient styling.
 * Displays progress as a filled bar with percentage calculation.
 *
 * @component
 */
const meta: Meta<typeof Progress> = {
  title: 'UI/Progress',
  component: Progress,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A reusable progress bar component with gradient styling and full accessibility support.

**Features:**
- ARIA progressbar attributes for accessibility
- Gradient fill (blue to indigo)
- Smooth transitions
- Percentage-based calculation
- Handles edge cases (0%, 100%)
        `,
      },
    },
  },
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Current progress value',
      table: {
        defaultValue: { summary: '0' },
      },
    },
    max: {
      control: { type: 'number', min: 1, max: 1000 },
      description: 'Maximum value (default: 100)',
      table: {
        defaultValue: { summary: '100' },
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof Progress>

/**
 * Default progress bar (0%)
 */
export const Default: Story = {
  args: {
    value: 0,
    max: 100,
  },
}

/**
 * Progress bar at 25%
 */
export const Quarter: Story = {
  args: {
    value: 25,
    max: 100,
  },
}

/**
 * Progress bar at 50%
 */
export const Half: Story = {
  args: {
    value: 50,
    max: 100,
  },
}

/**
 * Progress bar at 75%
 */
export const ThreeQuarters: Story = {
  args: {
    value: 75,
    max: 100,
  },
}

/**
 * Progress bar at 100% (complete)
 */
export const Complete: Story = {
  args: {
    value: 100,
    max: 100,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fully completed progress bar at 100%.',
      },
    },
  },
}

/**
 * Thin progress bar variant
 */
export const Thin: Story = {
  args: {
    value: 60,
    max: 100,
    className: 'h-1',
  },
  parameters: {
    docs: {
      description: {
        story: 'Thinner progress bar using custom height (h-1).',
      },
    },
  },
}

/**
 * Thick progress bar variant
 */
export const Thick: Story = {
  args: {
    value: 60,
    max: 100,
    className: 'h-4',
  },
  parameters: {
    docs: {
      description: {
        story: 'Thicker progress bar using custom height (h-4).',
      },
    },
  },
}

/**
 * Custom max value (video duration example)
 */
export const CustomMax: Story = {
  args: {
    value: 135,
    max: 300,
  },
  parameters: {
    docs: {
      description: {
        story: 'Progress bar with custom max value. Example: 135 seconds out of 300 seconds (45%).',
      },
    },
  },
}

/**
 * All progress levels side by side
 */
export const AllLevels: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      <div>
        <div className="text-sm mb-1">0%</div>
        <Progress value={0} max={100} />
      </div>
      <div>
        <div className="text-sm mb-1">25%</div>
        <Progress value={25} max={100} />
      </div>
      <div>
        <div className="text-sm mb-1">50%</div>
        <Progress value={50} max={100} />
      </div>
      <div>
        <div className="text-sm mb-1">75%</div>
        <Progress value={75} max={100} />
      </div>
      <div>
        <div className="text-sm mb-1">100%</div>
        <Progress value={100} max={100} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visual comparison of all progress levels from 0% to 100%.',
      },
    },
  },
}

/**
 * Different sizes comparison
 */
export const SizeComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      <div>
        <div className="text-sm mb-1">Thin (h-1)</div>
        <Progress value={60} max={100} className="h-1" />
      </div>
      <div>
        <div className="text-sm mb-1">Default (h-2)</div>
        <Progress value={60} max={100} />
      </div>
      <div>
        <div className="text-sm mb-1">Medium (h-3)</div>
        <Progress value={60} max={100} className="h-3" />
      </div>
      <div>
        <div className="text-sm mb-1">Thick (h-4)</div>
        <Progress value={60} max={100} className="h-4" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visual comparison of different progress bar heights.',
      },
    },
  },
}
