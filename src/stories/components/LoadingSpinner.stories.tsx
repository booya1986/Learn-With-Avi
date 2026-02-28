import React from 'react'

import type { Meta, StoryObj } from '@storybook/react'

import { LoadingSpinner } from '@/components/admin/common/LoadingSpinner'

const meta: Meta<typeof LoadingSpinner> = {
  title: 'Components/LoadingSpinner',
  component: LoadingSpinner,
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
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the spinner',
    },
  },
}

export default meta
type Story = StoryObj<typeof LoadingSpinner>

export const Default: Story = {
  args: { size: 'md' },
}

export const Small: Story = {
  args: { size: 'sm' },
}

export const Large: Story = {
  args: { size: 'lg' },
}

export const AllSizes: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 32,
        padding: 32,
        background: '#161616',
        borderRadius: 12,
        border: '1px solid rgba(34,197,94,0.1)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <LoadingSpinner size="sm" />
        <p style={{ fontSize: 11, color: '#555', marginTop: 8, fontFamily: 'monospace' }}>sm</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <LoadingSpinner size="md" />
        <p style={{ fontSize: 11, color: '#555', marginTop: 8, fontFamily: 'monospace' }}>md</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <LoadingSpinner size="lg" />
        <p style={{ fontSize: 11, color: '#555', marginTop: 8, fontFamily: 'monospace' }}>lg</p>
      </div>
    </div>
  ),
}

export const InlineWithText: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 32,
        background: '#161616',
        borderRadius: 12,
        border: '1px solid rgba(34,197,94,0.1)',
        minWidth: 300,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <LoadingSpinner size="sm" />
        <span style={{ color: '#e5e5e5', fontSize: 14 }}>Signing in...</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <LoadingSpinner size="sm" />
        <span style={{ color: '#e5e5e5', fontSize: 14 }}>Creating account...</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <LoadingSpinner size="sm" />
        <span style={{ color: '#e5e5e5', fontSize: 14 }}>Generating summary...</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <LoadingSpinner size="md" />
        <span style={{ color: '#e5e5e5', fontSize: 14 }}>Loading course...</span>
      </div>
    </div>
  ),
}

export const FullPageLoading: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 300,
        background: '#1b1b1b',
        borderRadius: 12,
        border: '1px solid rgba(34,197,94,0.1)',
        gap: 16,
      }}
    >
      <LoadingSpinner size="lg" />
      <p style={{ color: '#555', fontSize: 13 }}>Loading content...</p>
    </div>
  ),
  parameters: { layout: 'fullscreen' },
}
