/**
 * ChatHeader component - AI Tutor header with green theme
 *
 * Displays the AI tutor branding with a sparkle icon in a green-glowing circle,
 * "AI Tutor" title, "Powered by Claude" subtitle, and an online indicator.
 */

const G = '#22c55e'
const G_SOFT = '#4ade80'
const G_GLOW_SM = '0 0 10px rgba(34,197,94,0.45)'

export const ChatHeader = () => {
  return (
    <div
      style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(34,197,94,0.1)',
        background: 'rgba(34,197,94,0.04)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* ✦ icon in green circle */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            color: G_SOFT,
            boxShadow: G_GLOW_SM,
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          ✦
        </div>

        {/* Title + subtitle */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e5e5e5' }}>AI Tutor</div>
          <div
            style={{
              fontSize: 10,
              color: G_SOFT,
              opacity: 0.8,
              letterSpacing: '0.04em',
            }}
          >
            Powered by Claude
          </div>
        </div>

        {/* Online indicator */}
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
            aria-hidden="true"
          />
          online
        </div>
      </div>
    </div>
  )
}
