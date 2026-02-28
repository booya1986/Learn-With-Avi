/* eslint-disable max-lines */
import React, { useState } from 'react'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Design System/Pages/Course Page',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

const G = '#22c55e'
const G_SOFT = '#4ade80'
const G_BG = '#0a2812'
const G_GLOW_SM = '0 0 10px rgba(34,197,94,0.45)'
const G_GLOW_MD = '0 0 20px rgba(34,197,94,0.35), 0 0 40px rgba(34,197,94,0.12)'

const mockChapters = [
  { id: 1, title: 'Introduction', done: true },
  { id: 2, title: 'Environment Setup', done: true },
  { id: 3, title: 'Components', done: false, active: true },
  { id: 4, title: 'Hooks & State', done: false },
  { id: 5, title: 'Data Fetching', done: false },
  { id: 6, title: 'Testing', done: false },
]

const mockTranscript = [
  { time: '00:00', text: 'Welcome to React Fundamentals — Chapter 3: Components.' },
  { time: '00:18', text: 'In this chapter we will learn about functional components.' },
  { time: '00:45', text: 'A React component is a JavaScript function that returns JSX.' },
  { time: '01:12', text: "Let's look at our first example:", active: true },
  { time: '01:38', text: 'function HelloWorld() { return <h1>Hello World</h1> }' },
  { time: '02:05', text: 'Components can receive props to display dynamic data.' },
  { time: '02:44', text: 'Props are read-only — you cannot modify them inside the component.' },
]

const mockMessages = [
  { role: 'user', text: 'What is the difference between props and state?' },
  {
    role: 'ai',
    text: 'Props are passed from parent to child and are read-only. State is internal to a component and can change over time, triggering re-renders.',
  },
  { role: 'user', text: 'Can you show me a code example?' },
]

const CoursePageMockup = () => {
  const [activeTab, setActiveTab] = useState<'transcript' | 'quiz'>('transcript')
  const [videoProgress] = useState(43)

  return (
    <div
      style={{
        background: '#1b1b1b',
        minHeight: '100vh',
        fontFamily:
          'Rubik, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: '#e5e5e5',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* FIXED TOP PROGRESS BAR */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          height: 3,
          background: '#1e1e1e',
        }}
        role="progressbar"
        aria-valuenow={videoProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Video progress: ${videoProgress}%`}
      >
        <div
          style={{
            height: '100%',
            width: `${videoProgress}%`,
            background: `linear-gradient(to right, ${G}, ${G_SOFT})`,
            boxShadow: `0 0 8px rgba(34,197,94,0.65), 0 0 16px rgba(34,197,94,0.2)`,
            transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>

      {/* NAV */}
      <nav
        style={{
          marginTop: 3,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          height: 50,
          background: 'rgba(22,22,22,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: `1px solid rgba(34,197,94,0.1)`,
          flexShrink: 0,
          gap: 16,
        }}
      >
        <div
          style={{
            padding: '5px 14px',
            background: 'rgba(34,197,94,0.07)',
            border: `1px solid rgba(34,197,94,0.25)`,
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 700,
            color: G_SOFT,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: G,
              display: 'inline-block',
              boxShadow: G_GLOW_SM,
            }}
          />
          LearnWithAvi
        </div>
        <span style={{ color: '#333', fontSize: 14 }}>/</span>
        <span style={{ fontSize: 13, color: '#555' }}>Courses</span>
        <span style={{ color: '#333', fontSize: 14 }}>/</span>
        <span style={{ fontSize: 13, color: '#e5e5e5', fontWeight: 500 }}>
          React Fundamentals
        </span>
        <div
          style={{
            marginInlineStart: 'auto',
            fontSize: 12,
            color: G_SOFT,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: G,
              display: 'inline-block',
              boxShadow: G_GLOW_SM,
            }}
          />
          {videoProgress}% complete
        </div>
      </nav>

      {/* 3-COLUMN LAYOUT */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr 320px',
          flex: 1,
          height: 'calc(100vh - 53px)',
          overflow: 'hidden',
        }}
      >
        {/* LEFT SIDEBAR — Chapters */}
        <aside
          style={{
            background: '#141414',
            borderRight: `1px solid rgba(34,197,94,0.08)`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 16px 10px',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: '#444',
              textTransform: 'uppercase',
              fontFamily: 'monospace',
            }}
          >
            Chapters
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
            {mockChapters.map((ch) => (
              <div
                key={ch.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 10px',
                  borderRadius: 7,
                  marginBottom: 2,
                  background: ch.active
                    ? 'rgba(34,197,94,0.08)'
                    : 'transparent',
                  border: ch.active
                    ? `1px solid rgba(34,197,94,0.25)`
                    : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 150ms cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    flexShrink: 0,
                    background: ch.done ? G_BG : ch.active ? 'rgba(34,197,94,0.06)' : 'transparent',
                    border: ch.done
                      ? `1px solid ${G}`
                      : ch.active
                        ? `1px solid rgba(34,197,94,0.5)`
                        : '1px solid #333',
                    color: ch.done ? G_SOFT : ch.active ? G_SOFT : '#444',
                    boxShadow: ch.done ? G_GLOW_SM : 'none',
                  }}
                >
                  {ch.done ? '✓' : ch.id}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: ch.active ? '#e5e5e5' : ch.done ? '#888' : '#444',
                    fontWeight: ch.active ? 600 : 400,
                    lineHeight: 1.3,
                  }}
                >
                  {ch.title}
                </span>
              </div>
            ))}
          </div>

          {/* Overall progress */}
          <div
            style={{
              padding: '14px 16px',
              borderTop: `1px solid rgba(34,197,94,0.08)`,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 8,
                fontSize: 12,
              }}
            >
              <span style={{ color: '#555' }}>Overall</span>
              <span style={{ color: G_SOFT, fontWeight: 700 }}>33%</span>
            </div>
            <div
              style={{
                height: 4,
                background: '#252525',
                borderRadius: 99,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: '33%',
                  background: `linear-gradient(to right, ${G}, ${G_SOFT})`,
                  borderRadius: 99,
                  boxShadow: G_GLOW_SM,
                }}
              />
            </div>
          </div>
        </aside>

        {/* CENTER — Video + Content */}
        <main
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRight: `1px solid rgba(34,197,94,0.08)`,
          }}
        >
          {/* Video Player */}
          <div
            style={{
              background: '#000',
              aspectRatio: '16/9',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              borderBottom: `1px solid #1e1e1e`,
            }}
          >
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                background: 'rgba(34,197,94,0.1)',
                border: `1.5px solid rgba(34,197,94,0.4)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: G_SOFT,
                cursor: 'pointer',
                boxShadow: G_GLOW_SM,
              }}
            >
              ▶
            </div>
            {/* Scrubber */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
              }}
            >
              <span style={{ fontSize: 11, color: '#666', flexShrink: 0, fontFamily: 'monospace' }}>
                01:12
              </span>
              <div style={{ flex: 1, height: 3, background: '#222', borderRadius: 99 }}>
                <div
                  style={{
                    height: '100%',
                    width: `${videoProgress}%`,
                    background: `linear-gradient(to right, ${G}, ${G_SOFT})`,
                    borderRadius: 99,
                    boxShadow: G_GLOW_SM,
                  }}
                />
              </div>
              <span style={{ fontSize: 11, color: '#666', flexShrink: 0, fontFamily: 'monospace' }}>
                08:30
              </span>
              <span style={{ fontSize: 11, color: G_SOFT, flexShrink: 0, fontWeight: 600 }}>
                {videoProgress}%
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: `1px solid #1e1e1e`,
              flexShrink: 0,
            }}
          >
            {(['transcript', 'quiz'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab ? `2px solid ${G}` : '2px solid transparent',
                  color: activeTab === tab ? G_SOFT : '#555',
                  fontSize: 13,
                  fontWeight: activeTab === tab ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
                  textTransform: 'capitalize',
                  letterSpacing: '0.03em',
                  boxShadow:
                    activeTab === tab ? `0 2px 0 rgba(34,197,94,0.35)` : 'none',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Transcript */}
          {activeTab === 'transcript' && (
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {mockTranscript.map((line) => (
                <div
                  key={line.time}
                  style={{
                    display: 'flex',
                    gap: 14,
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: line.active ? 'rgba(34,197,94,0.06)' : 'transparent',
                    border: line.active
                      ? `1px solid rgba(34,197,94,0.2)`
                      : '1px solid transparent',
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: line.active ? G_SOFT : '#444',
                      flexShrink: 0,
                      fontFamily: 'monospace',
                      fontWeight: line.active ? 700 : 400,
                      marginTop: 2,
                    }}
                  >
                    {line.time}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      color: line.active ? '#e5e5e5' : '#888',
                      lineHeight: 1.6,
                    }}
                  >
                    {line.text}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'quiz' && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 12,
                color: '#444',
                fontSize: 13,
              }}
            >
              <span style={{ fontSize: 28, opacity: 0.3 }}>◇</span>
              Quiz loads after chapter completion
            </div>
          )}
        </main>

        {/* RIGHT — AI Chat (green theme, no purple) */}
        <aside
          style={{
            background: '#121812',
            border: `1px solid rgba(34,197,94,0.12)`,
            borderTop: 'none',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Chat Header */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: `1px solid rgba(34,197,94,0.1)`,
              background: 'rgba(34,197,94,0.04)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'rgba(34,197,94,0.1)',
                  border: `1px solid rgba(34,197,94,0.4)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  color: G_SOFT,
                  boxShadow: G_GLOW_SM,
                }}
              >
                ✦
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e5e5e5' }}>AI Tutor</div>
                <div style={{ fontSize: 10, color: G_SOFT, opacity: 0.8, letterSpacing: '0.04em' }}>
                  Powered by Claude
                </div>
              </div>
              <div
                style={{
                  marginInlineStart: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10,
                  color: G_SOFT,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: G,
                    display: 'inline-block',
                    boxShadow: G_GLOW_SM,
                  }}
                />
                online
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {mockMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '86%',
                    padding: '10px 14px',
                    borderRadius:
                      msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    background:
                      msg.role === 'user'
                        ? 'rgba(34,197,94,0.09)'
                        : 'rgba(34,197,94,0.04)',
                    border:
                      msg.role === 'user'
                        ? `1px solid rgba(34,197,94,0.3)`
                        : `1px solid rgba(34,197,94,0.15)`,
                    fontSize: 13,
                    color: msg.role === 'user' ? '#d0f0d0' : '#a0a0a0',
                    lineHeight: 1.6,
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px 12px 12px 4px',
                  background: 'rgba(34,197,94,0.04)',
                  border: `1px solid rgba(34,197,94,0.15)`,
                  display: 'flex',
                  gap: 4,
                  alignItems: 'center',
                }}
              >
                {[0, 1, 2].map((dot) => (
                  <div
                    key={dot}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: G_SOFT,
                      opacity: 0.8 - dot * 0.25,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Input */}
          <div
            style={{
              padding: '12px 14px',
              borderTop: `1px solid rgba(34,197,94,0.1)`,
              display: 'flex',
              gap: 8,
              flexShrink: 0,
            }}
          >
            <input
              placeholder="Ask about this chapter..."
              style={{
                flex: 1,
                padding: '10px 14px',
                background: '#1a1a1a',
                border: `1.5px solid rgba(34,197,94,0.2)`,
                borderRadius: 8,
                color: '#e5e5e5',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 150ms cubic-bezier(0.4,0,0.2,1)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = `rgba(34,197,94,0.6)`
                e.currentTarget.style.boxShadow = G_GLOW_SM
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = `rgba(34,197,94,0.2)`
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
            <button
              style={{
                padding: '10px 12px',
                background: 'rgba(34,197,94,0.1)',
                border: `1.5px solid rgba(34,197,94,0.3)`,
                borderRadius: 8,
                color: G_SOFT,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 150ms cubic-bezier(0.4,0,0.2,1)',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = G_GLOW_SM
                ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.18)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
                ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.1)'
              }}
              title="Voice input"
            >
              ♪
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}

export const CoursePage: Story = {
  render: () => <CoursePageMockup />,
}
