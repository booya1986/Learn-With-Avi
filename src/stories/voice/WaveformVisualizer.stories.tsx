import React from 'react'

import type { Meta, StoryObj } from '@storybook/react'

import { WaveformVisualizer } from '@/components/voice/WaveformVisualizer'

const meta: Meta<typeof WaveformVisualizer> = {
  title: 'Voice/WaveformVisualizer',
  component: WaveformVisualizer,
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
    isActive: {
      control: 'boolean',
      description: 'Whether the waveform should animate',
    },
    barCount: {
      control: { type: 'range', min: 5, max: 60, step: 5 },
      description: 'Number of bars to display',
    },
    animationSpeed: {
      control: { type: 'range', min: 50, max: 500, step: 50 },
      description: 'Animation speed in milliseconds (fallback random mode)',
    },
  },
}

export default meta
type Story = StoryObj<typeof WaveformVisualizer>

export const Active: Story = {
  args: {
    isActive: true,
    barCount: 30,
    animationSpeed: 100,
  },
  decorators: [
    (StoryFn) => (
      <div style={{ width: 360, padding: '24px 16px', background: '#1b1b1b', borderRadius: 12 }}>
        <StoryFn />
      </div>
    ),
  ],
}

export const Idle: Story = {
  args: {
    isActive: false,
    barCount: 30,
    animationSpeed: 100,
  },
  decorators: [
    (StoryFn) => (
      <div style={{ width: 360, padding: '24px 16px', background: '#1b1b1b', borderRadius: 12 }}>
        <StoryFn />
      </div>
    ),
  ],
}

export const FewBars: Story = {
  name: 'Few Bars (10)',
  args: {
    isActive: true,
    barCount: 10,
    animationSpeed: 100,
  },
  decorators: [
    (StoryFn) => (
      <div style={{ width: 200, padding: '24px 16px', background: '#1b1b1b', borderRadius: 12 }}>
        <StoryFn />
      </div>
    ),
  ],
}

export const ManyBars: Story = {
  name: 'Many Bars (60)',
  args: {
    isActive: true,
    barCount: 60,
    animationSpeed: 80,
  },
  decorators: [
    (StoryFn) => (
      <div style={{ width: 480, padding: '24px 16px', background: '#1b1b1b', borderRadius: 12 }}>
        <StoryFn />
      </div>
    ),
  ],
}

export const ActiveVsIdle: Story = {
  name: 'Active vs Idle Comparison',
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        padding: 40,
        background: '#1b1b1b',
        borderRadius: 16,
        border: '1px solid rgba(34,197,94,0.1)',
        minWidth: 400,
      }}
    >
      <div>
        <p
          style={{
            fontSize: 10,
            color: '#4ade80',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 10,
          }}
        >
          Active — recording
        </p>
        <div
          style={{
            background: '#141414',
            borderRadius: 8,
            padding: '12px 16px',
            border: '1px solid rgba(34,197,94,0.15)',
          }}
        >
          <WaveformVisualizer isActive barCount={30} />
        </div>
      </div>

      <div>
        <p
          style={{
            fontSize: 10,
            color: '#555',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 10,
          }}
        >
          Idle — not recording
        </p>
        <div
          style={{
            background: '#141414',
            borderRadius: 8,
            padding: '12px 16px',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <WaveformVisualizer isActive={false} barCount={30} />
        </div>
      </div>
    </div>
  ),
}
