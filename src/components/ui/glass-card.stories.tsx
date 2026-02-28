import React from 'react'

import type { Meta, StoryObj } from '@storybook/react'
import { BookOpen, CheckCircle, Play, Users } from 'lucide-react'

import { Badge } from './badge'
import { GlassCard } from './glass-card'

const meta = {
  title: 'Orbyto/GlassCard',
  component: GlassCard,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1b1b1b' },
        { name: 'surface', value: '#161616' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['light', 'dark', 'success', 'brand', 'subtle'],
      description: 'The visual style of the glass card',
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Padding size inside the card',
    },
    interactive: {
      control: 'boolean',
      description: 'Whether the card is clickable/interactive',
    },
  },
} satisfies Meta<typeof GlassCard>

export default meta
type Story = StoryObj<typeof meta>

export const LightVariant: Story = {
  args: {
    variant: 'light',
    padding: 'md',
    children: (
      <div>
        <h3 className="text-white text-lg font-semibold mb-2">Glass Card Light</h3>
        <p className="text-white/70 text-sm">
          Light glassmorphism card with subtle transparency and blur effects.
        </p>
      </div>
    ),
  },
}

export const DarkVariant: Story = {
  args: {
    variant: 'dark',
    padding: 'md',
    children: (
      <div>
        <h3 className="text-white text-lg font-semibold mb-2">Glass Card Dark</h3>
        <p className="text-white/70 text-sm">
          Dark glassmorphism card with more opacity for better contrast.
        </p>
      </div>
    ),
  },
}

export const SuccessVariant: Story = {
  args: {
    variant: 'success',
    padding: 'md',
    children: (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <Badge variant="success">Completed</Badge>
        </div>
        <h3 className="text-white text-lg font-semibold mb-2">Course Completed</h3>
        <p className="text-white/70 text-sm">
          You have completed all videos in this course. Great job!
        </p>
      </div>
    ),
  },
}

export const BrandVariant: Story = {
  args: {
    variant: 'brand',
    padding: 'md',
    children: (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Play className="w-5 h-5 text-blue-400" />
          <Badge variant="info">New Course</Badge>
        </div>
        <h3 className="text-white text-lg font-semibold mb-2">Start Learning</h3>
        <p className="text-white/70 text-sm">
          Dive into the course content with AI-powered study assistance.
        </p>
      </div>
    ),
  },
}

export const SubtleVariant: Story = {
  args: {
    variant: 'subtle',
    padding: 'md',
    children: (
      <div>
        <h3 className="text-white/80 text-lg font-semibold mb-2">Subtle Card</h3>
        <p className="text-white/50 text-sm">
          Minimal surface card for secondary content areas.
        </p>
      </div>
    ),
  },
}

export const WithBadge: Story = {
  args: {
    variant: 'dark',
    padding: 'md',
    children: (
      <div>
        <Badge variant="success" showDot className="mb-4">
          Published
        </Badge>
        <h3 className="text-white text-xl font-semibold mb-2">
          React Hooks Deep Dive
        </h3>
        <p className="text-white/70 text-sm">
          Master useEffect, useState, useCallback and custom hooks with practical examples.
        </p>
      </div>
    ),
  },
}

export const Interactive: Story = {
  args: {
    variant: 'success',
    padding: 'md',
    interactive: true,
    children: (
      <div>
        <h3 className="text-white text-lg font-semibold mb-2">Clickable Card</h3>
        <p className="text-white/70 text-sm">
          This card has a green hover glow. Hover over it to see the effect.
        </p>
      </div>
    ),
  },
}

export const AllVariants: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 280px)',
        gap: 16,
        padding: 24,
        background: '#1b1b1b',
        borderRadius: 12,
      }}
    >
      {(['light', 'dark', 'success', 'brand', 'subtle'] as const).map((v) => (
        <GlassCard key={v} variant={v} padding="md">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-green-400" />
            <span className="text-xs text-white/40 uppercase tracking-widest font-mono">{v}</span>
          </div>
          <p className="text-white/80 text-sm">Sample card content for the {v} variant.</p>
        </GlassCard>
      ))}
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
}

export const CourseStatCards: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 200px)',
        gap: 16,
        padding: 24,
        background: '#1b1b1b',
        borderRadius: 12,
      }}
    >
      {[
        { label: 'Total Courses', value: '8', Icon: BookOpen },
        { label: 'Total Videos', value: '47', Icon: Play },
        { label: 'Completed', value: '38', Icon: CheckCircle },
        { label: 'Students', value: '124', Icon: Users },
      ].map(({ label, value, Icon }) => (
        <GlassCard key={label} variant="subtle" padding="sm" interactive>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/40 uppercase tracking-widest font-mono">{label}</span>
            <div className="w-7 h-7 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <Icon className="w-3.5 h-3.5 text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{value}</p>
        </GlassCard>
      ))}
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
}
