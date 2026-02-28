import React, { useState } from 'react'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Design System/Pages/Auth — Login & Signup',
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

const LoginMockup = ({ mode = 'login' }: { mode?: 'login' | 'signup' }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(mode)

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
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
            }}
          >
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
          <p style={{ fontSize: 14, color: '#555', margin: 0 }}>
            {activeTab === 'login' ? 'Sign in to continue learning' : 'Create your free account'}
          </p>
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
          <div
            style={{
              display: 'flex',
              borderBottom: `1px solid rgba(34,197,94,0.1)`,
            }}
          >
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
                  textTransform: 'capitalize',
                }}
              >
                {tab === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <div style={{ padding: '28px 32px' }}>
            {/* Google Button */}
            <button
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '11px 0',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#e5e5e5',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                marginBottom: 20,
                fontFamily: 'inherit',
                transition: 'background 150ms',
              }}
            >
              <svg style={{ width: 18, height: 18, flexShrink: 0 }} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: '#161616',
                  padding: '0 10px',
                  fontSize: 11,
                  color: '#3a3a3a',
                }}
              >
                or with email
              </div>
            </div>

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {activeTab === 'signup' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 500 }}>
                    Full Name
                  </label>
                  <input style={inputStyle} placeholder="Your name" type="text" />
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 500 }}>
                  Email
                </label>
                <input style={inputStyle} placeholder="you@example.com" type="email" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6, fontWeight: 500 }}>
                  Password
                </label>
                <input style={inputStyle} placeholder="••••••••" type="password" />
              </div>

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
                  transition: 'all 150ms',
                  letterSpacing: '0.02em',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow = G_GLOW_MD
                  ;(e.currentTarget as HTMLButtonElement).style.background = G_SOFT
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
                  ;(e.currentTarget as HTMLButtonElement).style.background = G
                }}
              >
                {activeTab === 'login' ? 'Sign In' : 'Create Free Account'}
              </button>
            </div>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#444', marginTop: 20 }}>
              {activeTab === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <span
                style={{ color: G_SOFT, fontWeight: 600, cursor: 'pointer' }}
                onClick={() => setActiveTab(activeTab === 'login' ? 'signup' : 'login')}
              >
                {activeTab === 'login' ? 'Sign up free' : 'Sign in'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export const StudentLogin: Story = {
  name: 'Student Login',
  render: () => <LoginMockup mode="login" />,
}

export const StudentSignup: Story = {
  name: 'Student Signup',
  render: () => <LoginMockup mode="signup" />,
}
