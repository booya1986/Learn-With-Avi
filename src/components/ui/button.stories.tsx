import React from 'react'

import type { Meta, StoryObj } from '@storybook/react'
import { ArrowRight, Play, Plus } from 'lucide-react'

import { Button } from './button'

/**
 * Button component for user interactions
 *
 * A versatile button component built on Radix UI with multiple variants and sizes.
 * Supports all standard HTML button attributes and can render as a child component
 * using the `asChild` prop.
 *
 * @component
 */
const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A flexible button component with multiple variants (default, destructive, outline, secondary, ghost, link)
and sizes (default, small, large, icon). Built with Radix UI Slot for composability.

**Features:**
- 6 visual variants for different use cases
- 4 size options including icon-only
- Full accessibility support (keyboard navigation, focus rings)
- Disabled state handling
- Can render as child component with \`asChild\` prop
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Visual style variant of the button',
      table: {
        defaultValue: { summary: 'default' },
      },
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Size of the button',
      table: {
        defaultValue: { summary: 'default' },
      },
    },
    asChild: {
      control: 'boolean',
      description: 'Render button as child element (Radix Slot)',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button interaction',
    },
  },
}

export default meta
type Story = StoryObj<typeof Button>

/**
 * Default primary button style
 */
export const Default: Story = {
  args: {
    children: 'Button',
  },
}

/**
 * Destructive button for dangerous actions (delete, remove, etc.)
 */
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
  parameters: {
    docs: {
      description: {
        story: 'Use for destructive actions like deleting data. Red color signals danger to users.',
      },
    },
  },
}

/**
 * Outline button for secondary actions
 */
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Cancel',
  },
  parameters: {
    docs: {
      description: {
        story: 'Use for secondary actions or cancel buttons. Less visually prominent than primary.',
      },
    },
  },
}

/**
 * Secondary button with subtle styling
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
}

/**
 * Ghost button with minimal styling (appears on hover)
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost',
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal styling that appears on hover. Good for toolbar buttons or subtle actions.',
      },
    },
  },
}

/**
 * Link-styled button
 */
export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link Button',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Appears as a text link but functions as a button. Useful for navigation-like actions.',
      },
    },
  },
}

/**
 * Small button variant
 */
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small',
  },
}

/**
 * Large button variant
 */
export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
}

/**
 * Icon-only button (square)
 */
export const Icon: Story = {
  args: {
    size: 'icon',
    children: '🔍',
  },
  parameters: {
    docs: {
      description: {
        story: 'Square button for icon-only use. Typically used with Lucide React icons.',
      },
    },
  },
}

/**
 * Disabled button state
 */
export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Disabled state prevents interaction and reduces opacity. Pointer events are disabled.',
      },
    },
  },
}

/**
 * All button variants side by side
 */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visual comparison of all button variants.',
      },
    },
  },
}

/**
 * All button sizes side by side
 */
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">🔍</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visual comparison of all button sizes.',
      },
    },
  },
}

/**
 * Orbyto primary button — the main green CTA button for the platform
 */
export const OrbytoDesign: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        padding: 32,
        background: '#1b1b1b',
        borderRadius: 12,
        minWidth: 480,
      }}
    >
      <div>
        <p style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontFamily: 'monospace' }}>
          Primary — Main CTA
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button variant="orbyto-primary" size="orbyto">
            Browse Courses
          </Button>
          <Button variant="orbyto-primary" size="orbyto">
            <Play className="w-4 h-4 me-2" />
            Start Learning
          </Button>
          <Button variant="orbyto-primary" size="orbyto">
            <Plus className="w-4 h-4 me-2" />
            Add Video
          </Button>
        </div>
      </div>

      <div>
        <p style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontFamily: 'monospace' }}>
          Secondary — Ghost CTA
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button variant="orbyto-secondary" size="orbyto">
            Learn More
          </Button>
          <Button variant="orbyto-secondary" size="orbyto">
            <ArrowRight className="w-4 h-4 me-2" />
            View Details
          </Button>
          <Button variant="orbyto-secondary" size="orbyto">
            <Plus className="w-4 h-4 me-2" />
            Create Course
          </Button>
        </div>
      </div>

      <div>
        <p style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontFamily: 'monospace' }}>
          Pair — Primary + Secondary side by side
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="orbyto-primary" size="orbyto">
            <Play className="w-4 h-4 me-2" />
            Start Free
          </Button>
          <Button variant="orbyto-secondary" size="orbyto">
            View Courses
            <ArrowRight className="w-4 h-4 ms-2" />
          </Button>
        </div>
      </div>

      <div>
        <p style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontFamily: 'monospace' }}>
          Disabled states
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="orbyto-primary" size="orbyto" disabled>Primary Disabled</Button>
          <Button variant="orbyto-secondary" size="orbyto" disabled>Secondary Disabled</Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark', values: [{ name: 'dark', value: '#1b1b1b' }] },
    docs: {
      description: {
        story: 'The Orbyto design system buttons: primary (green solid) and secondary (green outline). These are the main CTAs used throughout LearnWithAvi.',
      },
    },
  },
}
