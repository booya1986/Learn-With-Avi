'use client'

import { usePathname } from 'next/navigation'

/** Site-wide footer. Hidden on admin and auth pages which have their own layouts. */
export const ConditionalFooter = () => {
  const pathname = usePathname()

  // Don't show footer on admin pages (they have their own layout)
  if (pathname?.includes('/admin') || pathname?.includes('/auth/')) {
    return null
  }

  return (
    <footer
      style={{
        borderTop: '1px solid rgba(34,197,94,0.1)',
        padding: '28px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#1b1b1b',
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
        <span style={{ color: '#22c55e', opacity: 0.6 }}>●</span>
        All systems operational
      </div>
    </footer>
  )
}
