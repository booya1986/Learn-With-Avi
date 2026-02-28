import React, { useState } from 'react'

import type { Meta, StoryObj } from '@storybook/react'
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'

const meta: Meta = {
  title: 'Components/Toast',
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1b1b1b' },
      ],
    },
  },
}

export default meta
type Story = StoryObj

const G = '#22c55e'
const G_SOFT = '#4ade80'

/* ── Standalone toast card (for visual display) ── */
const ToastCard = ({
  variant,
  title,
  description,
}: {
  variant: 'success' | 'error' | 'info' | 'default'
  title: string
  description?: string
}) => {
  const [visible, setVisible] = useState(true)
  if (!visible) return null

  const styles: Record<string, React.CSSProperties> = {
    success: {
      background: 'rgba(34,197,94,0.06)',
      border: '1px solid rgba(34,197,94,0.25)',
      boxShadow: '0 0 12px rgba(34,197,94,0.12)',
    },
    error: {
      background: 'rgba(239,68,68,0.06)',
      border: '1px solid rgba(239,68,68,0.25)',
    },
    info: {
      background: 'rgba(59,130,246,0.06)',
      border: '1px solid rgba(59,130,246,0.25)',
    },
    default: {
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.1)',
    },
  }

  const icons = {
    success: <CheckCircle style={{ width: 18, height: 18, color: G_SOFT, flexShrink: 0 }} />,
    error:   <AlertCircle style={{ width: 18, height: 18, color: '#f87171', flexShrink: 0 }} />,
    info:    <Info style={{ width: 18, height: 18, color: '#60a5fa', flexShrink: 0 }} />,
    default: null,
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '12px 16px',
        borderRadius: 10,
        width: 360,
        position: 'relative',
        ...styles[variant],
      }}
    >
      {icons[variant]}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#e5e5e5', margin: 0 }}>{title}</p>
        {description ? (
          <p style={{ fontSize: 12, color: '#888', margin: '3px 0 0' }}>{description}</p>
        ) : null}
      </div>
      <button
        onClick={() => setVisible(false)}
        style={{ color: '#555', background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}
      >
        <X style={{ width: 14, height: 14 }} />
      </button>
    </div>
  )
}

export const AllVariants: Story = {
  name: 'All Toast Variants',
  render: () => (
    <div
      style={{
        background: '#1b1b1b',
        minHeight: '100vh',
        padding: 40,
        fontFamily: 'Rubik, system-ui, sans-serif',
      }}
    >
      <p style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, fontFamily: 'monospace' }}>
        Toast Notifications
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ToastCard
          variant="success"
          title="Video published successfully"
          description="React Hooks Deep Dive is now live for students."
        />
        <ToastCard
          variant="error"
          title="Failed to save changes"
          description="Please check your connection and try again."
        />
        <ToastCard
          variant="info"
          title="Course updated"
          description="3 new videos have been added to Node.js Advanced."
        />
        <ToastCard
          variant="default"
          title="Settings saved"
        />
      </div>

      <div style={{ marginTop: 40 }}>
        <p style={{ fontSize: 11, color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, fontFamily: 'monospace' }}>
          Stack (bottom-right position)
        </p>
        <div
          style={{
            position: 'relative',
            width: 420,
            height: 220,
            background: '#161616',
            borderRadius: 12,
            border: '1px solid rgba(34,197,94,0.1)',
            overflow: 'hidden',
          }}
        >
          {/* Simulated bottom-right toast stack */}
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(34,197,94,0.06)',
                border: '1px solid rgba(34,197,94,0.25)',
                width: 300,
              }}
            >
              <CheckCircle style={{ width: 16, height: 16, color: G_SOFT, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#e5e5e5' }}>Video saved</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.25)',
                width: 300,
              }}
            >
              <AlertCircle style={{ width: 16, height: 16, color: '#f87171', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#e5e5e5' }}>Upload failed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const SuccessToast: Story = {
  render: () => (
    <div style={{ padding: 40, background: '#1b1b1b', minHeight: '100vh' }}>
      <ToastCard
        variant="success"
        title="Changes saved"
        description="Your course has been updated successfully."
      />
    </div>
  ),
}

export const ErrorToast: Story = {
  render: () => (
    <div style={{ padding: 40, background: '#1b1b1b', minHeight: '100vh' }}>
      <ToastCard
        variant="error"
        title="Something went wrong"
        description="Unable to connect to the server. Please try again."
      />
    </div>
  ),
}

export const InfoToast: Story = {
  render: () => (
    <div style={{ padding: 40, background: '#1b1b1b', minHeight: '100vh' }}>
      <ToastCard
        variant="info"
        title="New update available"
        description="Refresh the page to get the latest changes."
      />
    </div>
  ),
}
