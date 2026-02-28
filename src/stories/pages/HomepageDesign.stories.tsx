/* eslint-disable max-lines */
import React from 'react'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Design System/Pages/Homepage',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

const G = '#22c55e'      // reference-site green
const G_SOFT = '#4ade80' // lighter neon green
const G_BG = '#0a2812'   // dark green tint background
const G_GLOW_SM = '0 0 12px rgba(34,197,94,0.45)'
const G_GLOW_MD = '0 0 24px rgba(34,197,94,0.35), 0 0 48px rgba(34,197,94,0.12)'

const mockCourses = [
  {
    id: 1,
    title: 'React Fundamentals',
    level: 'Beginner',
    videos: 12,
    hours: '4h',
    tag: 'Frontend',
  },
  {
    id: 2,
    title: 'Node.js Advanced',
    level: 'Intermediate',
    videos: 8,
    hours: '3h',
    tag: 'Backend',
  },
  {
    id: 3,
    title: 'AI Integration',
    level: 'Advanced',
    videos: 10,
    hours: '5h',
    tag: 'AI',
  },
]

const HomepageMockup = () => {
  return (
    <div
      style={{
        background: '#1b1b1b',
        minHeight: '100vh',
        fontFamily:
          'Rubik, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: '#e5e5e5',
      }}
    >
      {/* NAV */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          height: 56,
          background: 'rgba(27,27,27,0.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: `1px solid rgba(34,197,94,0.12)`,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            background: 'rgba(34,197,94,0.07)',
            borderRadius: 8,
            border: `1px solid rgba(34,197,94,0.3)`,
            fontSize: 15,
            fontWeight: 700,
            color: G_SOFT,
            transition: 'box-shadow 150ms cubic-bezier(0.4,0,0.2,1)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLDivElement).style.boxShadow = G_GLOW_SM
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: G,
              display: 'inline-block',
              boxShadow: G_GLOW_SM,
            }}
          />
          LearnWithAvi
        </div>

        {/* Nav Links */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {['Home', 'Courses', 'About'].map((link) => (
            <span
              key={link}
              role="link"
              tabIndex={0}
              style={{
                fontSize: 14,
                color: link === 'Home' ? G_SOFT : '#555',
                textDecoration: 'none',
                fontWeight: link === 'Home' ? 500 : 400,
                cursor: 'pointer',
                transition: 'color 150ms cubic-bezier(0.4,0,0.2,1)',
              }}
              onMouseEnter={(e) => {
                if (link !== 'Home') (e.currentTarget as HTMLSpanElement).style.color = '#a0a0a0'
              }}
              onMouseLeave={(e) => {
                if (link !== 'Home') (e.currentTarget as HTMLSpanElement).style.color = '#555'
              }}
            >
              {link}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div
            style={{
              padding: '5px 12px',
              background: 'rgba(34,197,94,0.06)',
              border: `1px solid rgba(34,197,94,0.2)`,
              borderRadius: 6,
              fontSize: 12,
              color: '#555',
              cursor: 'pointer',
              fontFamily: 'monospace',
              letterSpacing: '0.05em',
            }}
          >
            HE
          </div>
          <button
            style={{
              padding: '6px 18px',
              background: 'transparent',
              border: `1px solid rgba(34,197,94,0.35)`,
              borderRadius: 6,
              color: G_SOFT,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 150ms cubic-bezier(0.4,0,0.2,1)',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.1)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = G_GLOW_SM
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
            }}
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '100px 40px 80px',
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.03) 45%, transparent 70%)',
        }}
      >
        {/* Live badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 16px',
            background: 'rgba(34,197,94,0.07)',
            border: `1px solid rgba(34,197,94,0.35)`,
            borderRadius: 99,
            fontSize: 12,
            color: G_SOFT,
            marginBottom: 36,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
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
          AI-Powered Learning
        </div>

        <h1
          className="text-display"
          style={{
            fontWeight: 800,
            color: '#f0f0f0',
            marginBottom: 24,
            maxWidth: 680,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            textShadow: '0 0 80px rgba(34,197,94,0.15)',
          }}
        >
          Learn Smarter with{' '}
          <span style={{ color: G_SOFT, textShadow: G_GLOW_MD }}>AI Tutoring</span>
        </h1>

        <p
          className="text-hero-sub"
          style={{
            color: '#707070',
            maxWidth: 500,
            marginBottom: 48,
            lineHeight: 1.75,
          }}
        >
          Personalized courses with voice AI tutor, RAG-based Q&A, and adaptive learning
          paths — in Hebrew and English.
        </p>

        <div style={{ display: 'flex', gap: 14 }}>
          <button
            style={{
              padding: '14px 32px',
              background: G,
              color: '#0a2812',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 150ms cubic-bezier(0.4,0,0.2,1)',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = G_GLOW_MD
              ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
              ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
            }}
          >
            Browse Courses
          </button>
          <button
            style={{
              padding: '14px 32px',
              background: 'rgba(34,197,94,0.07)',
              color: G_SOFT,
              border: `1.5px solid rgba(34,197,94,0.35)`,
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 150ms cubic-bezier(0.4,0,0.2,1)',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = G_GLOW_SM
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(34,197,94,0.65)'
              ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.12)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(34,197,94,0.35)'
              ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.07)'
            }}
          >
            Start Learning →
          </button>
        </div>
      </section>

      {/* COURSES */}
      <section style={{ padding: '8px 40px 96px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 16,
            marginBottom: 36,
          }}
        >
          <h2
            className="text-section-title"
            style={{ fontWeight: 700, color: '#e5e5e5', margin: 0 }}
          >
            Our Courses
          </h2>
          <span
            style={{
              fontSize: 12,
              color: G_SOFT,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              opacity: 0.7,
            }}
          >
            — 3 available
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
          }}
        >
          {mockCourses.map((course) => (
            <div
              key={course.id}
              style={{
                borderRadius: 14,
                overflow: 'hidden',
                border: `1px solid rgba(34,197,94,0.12)`,
                background: '#161616',
                transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = 'rgba(34,197,94,0.45)'
                el.style.boxShadow = G_GLOW_SM
                el.style.transform = 'translateY(-3px)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = 'rgba(34,197,94,0.12)'
                el.style.boxShadow = 'none'
                el.style.transform = 'translateY(0)'
              }}
            >
              {/* Thumbnail */}
              <div
                style={{
                  height: 160,
                  background: `linear-gradient(135deg, rgba(34,197,94,0.08) 0%, #161616 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: `1px solid rgba(34,197,94,0.1)`,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'rgba(34,197,94,0.08)',
                    border: `1.5px solid rgba(34,197,94,0.4)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    color: G_SOFT,
                  }}
                >
                  ▶
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    padding: '3px 10px',
                    background: 'rgba(34,197,94,0.1)',
                    border: `1px solid rgba(34,197,94,0.3)`,
                    borderRadius: 99,
                    fontSize: 10,
                    fontWeight: 700,
                    color: G_SOFT,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {course.tag}
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '20px 22px' }}>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#e5e5e5',
                    marginBottom: 10,
                    lineHeight: 1.3,
                  }}
                >
                  {course.title}
                </h3>
                <div
                  style={{
                    display: 'flex',
                    gap: 16,
                    fontSize: 12,
                    color: '#555',
                    marginBottom: 18,
                  }}
                >
                  <span style={{ color: G_SOFT, fontWeight: 600 }}>{course.level}</span>
                  <span>{course.videos} videos</span>
                  <span>{course.hours}</span>
                </div>
                {/* Mini progress bar */}
                <div
                  style={{
                    height: 3,
                    background: '#2a2a2a',
                    borderRadius: 99,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${[0, 33, 0][course.id - 1]}%`,
                      background: `linear-gradient(to right, ${G}, ${G_SOFT})`,
                      borderRadius: 99,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: `1px solid rgba(34,197,94,0.1)`,
          padding: '28px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 13, color: '#3a3a3a' }}>
          LearnWithAvi &copy; 2025 — AI-Powered Learning
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            color: '#333',
            fontFamily: 'monospace',
          }}
        >
          <span style={{ color: G, opacity: 0.6 }}>●</span>
          All systems operational
        </div>
      </footer>
    </div>
  )
}

export const Homepage: Story = {
  render: () => <HomepageMockup />,
}
