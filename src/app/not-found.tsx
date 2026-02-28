// Root-level not-found — purely static, no next-intl or dynamic dependencies.
// Next.js prerenders /_not-found using the root layout; keeping this simple
// prevents build failures from locale context being unavailable here.
const RootNotFound = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'sans-serif',
      gap: '1rem',
      textAlign: 'center',
      padding: '2rem',
    }}
  >
    <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>404 — Page Not Found</h1>
    <p style={{ color: '#6b7280' }}>The page you&apos;re looking for doesn&apos;t exist.</p>
    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
    <a href="/en" style={{ color: '#4A6FDC', textDecoration: 'underline' }}>
      Go to LearnWithAvi
    </a>
  </div>
)

export default RootNotFound
