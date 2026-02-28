/* eslint-disable max-lines */
import React from 'react'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Design System/Design Tokens',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 52 }}>
    <h2
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: '#22c55e',
        marginBottom: 20,
        borderBottom: '1px solid rgba(34,197,94,0.15)',
        paddingBottom: 10,
        fontFamily: 'monospace',
      }}
    >
      {title}
    </h2>
    {children}
  </div>
)

const Swatch = ({
  label,
  hex,
  role,
  glow,
}: {
  label: string
  hex: string
  role: string
  glow?: string
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 150 }}>
    <div
      style={{
        width: '100%',
        height: 72,
        borderRadius: 10,
        background: hex,
        boxShadow: glow ?? 'none',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    />
    <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e5e5' }}>{label}</div>
    <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>{hex}</div>
    <div style={{ fontSize: 10, color: '#444' }}>{role}</div>
  </div>
)

const GlowCard = ({
  label,
  borderColor,
  glowShadow,
  bg,
}: {
  label: string
  borderColor: string
  glowShadow: string
  bg: string
}) => (
  <div
    style={{
      padding: '20px 24px',
      borderRadius: 10,
      background: bg,
      border: `1.5px solid ${borderColor}`,
      transition: 'box-shadow 300ms cubic-bezier(0.4,0,0.2,1), border-color 300ms cubic-bezier(0.4,0,0.2,1)',
      minWidth: 180,
      cursor: 'pointer',
    }}
    onMouseEnter={(e) => {
      ;(e.currentTarget as HTMLDivElement).style.boxShadow = glowShadow
      ;(e.currentTarget as HTMLDivElement).style.borderColor = borderColor.replace('0.2)', '0.65)')
    }}
    onMouseLeave={(e) => {
      ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
      ;(e.currentTarget as HTMLDivElement).style.borderColor = borderColor
    }}
  >
    <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e5e5', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 11, color: '#555' }}>Hover to preview</div>
    <div style={{ fontSize: 10, color: '#444', fontFamily: 'monospace', marginTop: 8 }}>
      {glowShadow.slice(0, 36)}…
    </div>
  </div>
)

const DesignTokensPage = () => {
  return (
    <div
      style={{
        background: '#1b1b1b',
        minHeight: '100vh',
        padding: '48px 56px',
        fontFamily:
          'Rubik, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: '#e5e5e5',
      }}
    >
      <div style={{ marginBottom: 52 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 14px',
            background: 'rgba(34,197,94,0.07)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 99,
            fontSize: 10,
            color: '#4ade80',
            marginBottom: 20,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontFamily: 'monospace',
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#22c55e',
              display: 'inline-block',
              boxShadow: '0 0 8px rgba(34,197,94,0.6)',
            }}
          />
          Design System v1.0
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e5e5e5', marginBottom: 8 }}>
          LearnWithAvi — Design Tokens
        </h1>
        <p style={{ fontSize: 14, color: '#555', maxWidth: 560, lineHeight: 1.7 }}>
          Single green accent on dark background. Blue for brand/interactive. Amber for warnings.
          Red for errors. No purple.
        </p>
      </div>

      {/* Color Palette */}
      <Section title="Semantic Color Palette">
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Swatch
            label="Progress Green"
            hex="#22c55e"
            role="Primary accent · Progress · Completion"
            glow="0 0 20px rgba(34,197,94,0.45)"
          />
          <Swatch
            label="Green Neon"
            hex="#4ade80"
            role="Text on dark · Active states"
            glow="0 0 20px rgba(74,222,128,0.4)"
          />
          <Swatch
            label="Brand Blue"
            hex="#2563eb"
            role="Brand identity · Secondary interactive"
            glow="0 0 16px rgba(37,99,235,0.4)"
          />
          <Swatch
            label="Warning Amber"
            hex="#f59e0b"
            role="Warnings · Ratings · Attention"
          />
          <Swatch label="Error Red" hex="#ef4444" role="Errors · Destructive actions" />
          <Swatch label="Dark BG" hex="#1b1b1b" role="Page background" />
          <Swatch label="Surface" hex="#161616" role="Cards · Sidebars" />
          <Swatch label="Border" hex="#1e1e1e" role="Subtle dividers" />
        </div>
      </Section>

      {/* Glow Effects */}
      <Section title="Glow Effects (hover each card)">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <GlowCard
            label="Green Glow (sm)"
            borderColor="rgba(34,197,94,0.2)"
            glowShadow="0 0 10px rgba(34,197,94,0.45)"
            bg="#0a2812"
          />
          <GlowCard
            label="Green Glow (md)"
            borderColor="rgba(34,197,94,0.2)"
            glowShadow="0 0 20px rgba(34,197,94,0.35), 0 0 40px rgba(34,197,94,0.12)"
            bg="#0a2812"
          />
          <GlowCard
            label="Brand Blue (sm)"
            borderColor="rgba(37,99,235,0.2)"
            glowShadow="0 0 10px rgba(37,99,235,0.45)"
            bg="#0d1e36"
          />
          <GlowCard
            label="Brand Blue (md)"
            borderColor="rgba(37,99,235,0.2)"
            glowShadow="0 0 20px rgba(37,99,235,0.35), 0 0 40px rgba(37,99,235,0.12)"
            bg="#0d1e36"
          />
          <GlowCard
            label="Amber (sm)"
            borderColor="rgba(245,158,11,0.2)"
            glowShadow="0 0 10px rgba(245,158,11,0.4)"
            bg="#1e1400"
          />
        </div>
      </Section>

      {/* Typography Scale */}
      <Section title="Fluid Typography Scale">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div
              style={{
                fontSize: 'var(--text-display)',
                lineHeight: 1.05,
                color: '#e5e5e5',
                fontWeight: 800,
                letterSpacing: '-0.03em',
              }}
            >
              Learn Smarter with{' '}
              <span style={{ color: '#4ade80', textShadow: '0 0 40px rgba(74,222,128,0.3)' }}>
                AI Tutoring
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#444', fontFamily: 'monospace', marginTop: 6 }}>
              --text-display: clamp(2rem, 5vw + 0.5rem, 3.75rem)
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 'var(--text-section-title)',
                lineHeight: 1.2,
                color: '#e5e5e5',
                fontWeight: 700,
              }}
            >
              Our Courses
            </div>
            <div style={{ fontSize: 11, color: '#444', fontFamily: 'monospace', marginTop: 6 }}>
              --text-section-title: clamp(1.5rem, 3vw + 0.375rem, 2.25rem)
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 'var(--text-hero-sub)',
                lineHeight: 1.7,
                color: '#707070',
              }}
            >
              Personalized courses with voice AI tutor, RAG-based Q&A, and adaptive learning paths.
            </div>
            <div style={{ fontSize: 11, color: '#444', fontFamily: 'monospace', marginTop: 6 }}>
              --text-hero-sub: clamp(1.125rem, 2vw + 0.375rem, 1.375rem)
            </div>
          </div>
        </div>
      </Section>

      {/* Progress Bar States */}
      <Section title="Progress Bar — Green Accent">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
          {[20, 45, 70, 100].map((pct) => (
            <div key={pct}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#777' }}>Chapter progress</span>
                <span
                  style={{
                    fontSize: 12,
                    color: '#4ade80',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                  }}
                >
                  {pct}%
                </span>
              </div>
              <div
                style={{
                  height: 8,
                  background: '#1e1e1e',
                  borderRadius: 99,
                  overflow: 'hidden',
                  border: '1px solid #252525',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: 'linear-gradient(to right, #22c55e, #4ade80)',
                    borderRadius: 99,
                    boxShadow:
                      pct === 100 ? '0 0 10px rgba(34,197,94,0.5)' : 'none',
                  }}
                />
              </div>
            </div>
          ))}
          <div>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 8, fontFamily: 'monospace' }}>
              Fixed top bar — 3px (course page)
            </div>
            <div
              style={{
                height: 3,
                background: '#1e1e1e',
                overflow: 'hidden',
                width: '100%',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: '43%',
                  background: 'linear-gradient(to right, #22c55e, #4ade80)',
                  boxShadow: '0 0 8px rgba(34,197,94,0.65)',
                }}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Easing Reference */}
      <Section title="Motion & Easing Tokens">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { name: '--ease-standard', value: 'cubic-bezier(0.4, 0, 0.2, 1)', use: 'Most UI transitions' },
            {
              name: '--ease-decelerate',
              value: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
              use: 'Elements entering',
            },
            {
              name: '--ease-accelerate',
              value: 'cubic-bezier(0.4, 0.0, 1.0, 1)',
              use: 'Elements leaving',
            },
            { name: '--duration-fast', value: '150ms', use: 'Hover, icon states' },
            { name: '--duration-standard', value: '300ms', use: 'Panel transitions' },
            { name: '--duration-slow', value: '500ms', use: 'Page-level animations' },
          ].map((t) => (
            <div
              key={t.name}
              style={{
                background: '#161616',
                border: '1px solid rgba(34,197,94,0.1)',
                borderRadius: 8,
                padding: '12px 16px',
                minWidth: 200,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: '#e5e5e5',
                  fontFamily: 'monospace',
                  marginBottom: 4,
                }}
              >
                {t.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: '#4ade80',
                  fontFamily: 'monospace',
                  marginBottom: 4,
                }}
              >
                {t.value}
              </div>
              <div style={{ fontSize: 10, color: '#555' }}>{t.use}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

export const Tokens: Story = {
  render: () => <DesignTokensPage />,
}
