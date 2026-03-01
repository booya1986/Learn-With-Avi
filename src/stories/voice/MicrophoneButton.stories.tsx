import React from 'react'

import type { Meta, StoryObj } from '@storybook/react'

import { MicrophoneButton } from '@/components/voice/MicrophoneButton'

const meta: Meta<typeof MicrophoneButton> = {
  title: 'Voice/MicrophoneButton',
  component: MicrophoneButton,
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
    state: {
      control: 'select',
      options: ['idle', 'recording', 'processing', 'playing'],
      description: 'Current button state',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
  },
}

export default meta
type Story = StoryObj<typeof MicrophoneButton>

export const Idle: Story = {
  args: {
    state: 'idle',
    disabled: false,
  },
}

export const Recording: Story = {
  args: {
    state: 'recording',
    disabled: false,
  },
}

export const Processing: Story = {
  args: {
    state: 'processing',
    disabled: true,
  },
}

export const Playing: Story = {
  args: {
    state: 'playing',
    disabled: true,
  },
}

export const AllStates: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 48,
        padding: 48,
        background: '#1b1b1b',
        borderRadius: 16,
        border: '1px solid rgba(34,197,94,0.1)',
        flexWrap: 'wrap',
      }}
    >
      {(
        [
          { state: 'idle', label: 'idle', disabled: false },
          { state: 'recording', label: 'recording', disabled: false },
          { state: 'processing', label: 'processing', disabled: true },
          { state: 'playing', label: 'playing', disabled: true },
        ] as const
      ).map(({ state, label, disabled }) => (
        <div
          key={state}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <MicrophoneButton state={state} disabled={disabled} />
          <p
            style={{
              fontSize: 11,
              color: '#555',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {label}
          </p>
        </div>
      ))}
    </div>
  ),
  parameters: { layout: 'centered' },
}
