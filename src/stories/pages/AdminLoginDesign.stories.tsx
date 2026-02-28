import React, { useState } from 'react'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Design System/Pages/Admin — Login',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

const G = '#22c55e'
const G_SOFT = '#4ade80'
const G_GLOW_SM = '0 0 10px rgba(34,197,94,0.45)'
const G_GLOW_MD = '0 0 20px rgba(34,197,94,0.35), 0 0 40px rgba(34,197,94,0.12)'

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '10px 14px',
  background: '#1a1a1a',
  border: '1.5px solid rgba(34,197,94,0.2)',
  borderRadius: 8,
  color: '#e5e5e5',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
}

const AdminLoginMockup = ({ showError = false }: { showError?: boolean }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: `radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.03) 50%, transparent 70%), #1b1b1b`,
        fontFamily: 'Rubik, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: G,
                display: 'inline-block',
                boxShadow: G_GLOW_SM,
              }}
            />
            <h1
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: G_SOFT,
                textShadow: '0 0 24px rgba(74,222,128,0.3)',
                margin: 0,
              }}
            >
              LearnWithAvi
            </h1>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 12px',
              background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 99,
              fontSize: 11,
              color: G_SOFT,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Admin Panel
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: '#161616',
            border: `1px solid rgba(34,197,94,0.12)`,
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid rgba(34,197,94,0.1)` }}>
            {(['login', 'signup'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '14px 0',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab ? `2px solid ${G}` : '2px solid transparent',
                  color: activeTab === tab ? G_SOFT : '#444',
                  fontSize: 13,
                  fontWeight: activeTab === tab ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 200ms',
                  fontFamily: 'inherit',
                }}
              >
                {tab === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <div style={{ padding: '28px 32px' }}>
            {/* Error state */}
            {showError ? (
              <div
                style={{
                  marginBottom: 20,
                  padding: '10px 14px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#f87171',
                }}
              >
                Invalid email or password. Please try again.
              </div>
            ) : null}

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {activeTab === 'signup' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 500 }}>
                    Name
                  </label>
                  <input style={inputStyle} placeholder="Admin name" type="text" />
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 500 }}>
                  Email
                </label>
                <input style={inputStyle} placeholder="admin@example.com" type="email" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 500 }}>
                  Password
                </label>
                <input style={inputStyle} placeholder="••••••••" type="password" />
              </div>
              {activeTab === 'signup' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 500 }}>
                    Confirm Password
                  </label>
                  <input style={inputStyle} placeholder="••••••••" type="password" />
                </div>
              )}

              <button
                style={{
                  width: '100%',
                  padding: '12px 0',
                  background: G,
                  color: '#0a2812',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  marginTop: 4,
                  letterSpacing: '0.02em',
                  transition: 'all 150ms',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow = G_GLOW_MD
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
                }}
              >
                {activeTab === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const AdminLogin: Story = {
  name: 'Admin Login',
  render: () => <AdminLoginMockup />,
}

export const AdminLoginError: Story = {
  name: 'Admin Login — Error State',
  render: () => <AdminLoginMockup showError />,
}
