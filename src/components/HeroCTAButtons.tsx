'use client'

import Link from 'next/link'

interface HeroCTAButtonsProps {
  locale: string
  browseCourses: string
  startLearning: string
}

const G = '#22c55e'
const G_SOFT = '#4ade80'
const G_GLOW_MD = '0 0 24px rgba(34,197,94,0.35), 0 0 48px rgba(34,197,94,0.12)'

/** Hero section CTA buttons — Browse Courses and Start Learning links. */
export const HeroCTAButtons = ({ locale, browseCourses, startLearning }: HeroCTAButtonsProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <Link
        href={`/${locale}#courses`}
        className="transition-all duration-150"
        style={{
          padding: '14px 32px',
          background: G,
          color: '#0a2812',
          border: 'none',
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
          letterSpacing: '0.02em',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLAnchorElement
          el.style.boxShadow = G_GLOW_MD
          el.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLAnchorElement
          el.style.boxShadow = 'none'
          el.style.transform = 'translateY(0)'
        }}
      >
        {browseCourses}
      </Link>
      <Link
        href={`/${locale}/course/ai-no-code`}
        className="transition-all duration-150"
        style={{
          padding: '14px 32px',
          background: 'rgba(34,197,94,0.07)',
          color: G_SOFT,
          border: '1.5px solid rgba(34,197,94,0.35)',
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLAnchorElement
          el.style.boxShadow = '0 0 12px rgba(34,197,94,0.45)'
          el.style.borderColor = 'rgba(34,197,94,0.65)'
          el.style.background = 'rgba(34,197,94,0.12)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLAnchorElement
          el.style.boxShadow = 'none'
          el.style.borderColor = 'rgba(34,197,94,0.35)'
          el.style.background = 'rgba(34,197,94,0.07)'
        }}
      >
        {startLearning}
      </Link>
    </div>
  )
}
