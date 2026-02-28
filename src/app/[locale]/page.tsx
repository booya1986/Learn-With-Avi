import Link from "next/link";

import { getTranslations } from 'next-intl/server';

import { CourseCard } from "@/components/CourseCard";
import { getCourses } from "@/data/courses";

const G = '#22c55e'
const G_SOFT = '#4ade80'
const G_GLOW_MD = '0 0 24px rgba(34,197,94,0.35), 0 0 48px rgba(34,197,94,0.12)'

export default async function Home({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const courses = await getCourses();
  const t = await getTranslations({ locale, namespace: 'homepage' });

  return (
    <div style={{ background: '#1b1b1b', minHeight: '100vh', color: '#e5e5e5' }}>
      {/* Hero Section */}
      <section
        className="relative flex flex-col items-center justify-center text-center overflow-hidden"
        style={{
          minHeight: '75vh',
          padding: '100px 40px 80px',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.03) 45%, transparent 70%)',
        }}
      >
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 mb-9"
          style={{
            padding: '5px 16px',
            background: 'rgba(34,197,94,0.07)',
            border: `1px solid rgba(34,197,94,0.35)`,
            borderRadius: 99,
            fontSize: 12,
            color: G_SOFT,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          <span
            className="animate-pulse"
            style={{ width: 6, height: 6, borderRadius: '50%', background: G, display: 'inline-block', boxShadow: '0 0 8px rgba(34,197,94,0.6)' }}
          />
          {t('hero.badge')}
        </div>

        {/* Headline */}
        <h1
          style={{
            fontWeight: 800,
            color: '#f0f0f0',
            marginBottom: 24,
            maxWidth: 680,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            textShadow: '0 0 80px rgba(34,197,94,0.15)',
            fontSize: 'var(--text-display)',
          }}
        >
          {t('hero.titlePart1')}{' '}
          <span style={{ color: G_SOFT, textShadow: G_GLOW_MD }}>
            {t('hero.titleAccent')}
          </span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            color: '#707070',
            maxWidth: 500,
            marginBottom: 48,
            lineHeight: 1.75,
            fontSize: 'var(--text-hero-sub)',
          }}
        >
          {t('hero.subtitle')}
        </p>

        {/* CTA Buttons */}
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
            {t('hero.browseCourses')}
          </Link>
          <Link
            href={`/${locale}/course/intro-to-embeddings`}
            className="transition-all duration-150"
            style={{
              padding: '14px 32px',
              background: 'rgba(34,197,94,0.07)',
              color: G_SOFT,
              border: `1.5px solid rgba(34,197,94,0.35)`,
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
            {t('hero.startLearning')}
          </Link>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" style={{ padding: '8px 40px 96px' }}>
        {/* Left-aligned heading matching Storybook */}
        <div
          className="flex items-baseline gap-4 mb-9"
          style={{ maxWidth: 1200, margin: '0 auto 36px' }}
        >
          <h2
            style={{
              fontWeight: 700,
              color: '#e5e5e5',
              margin: 0,
              fontSize: 'var(--text-section-title)',
            }}
          >
            {t('courses.title')}
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
            — {courses.length} {t('courses.available')}
          </span>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          style={{ maxWidth: 1200, margin: '0 auto' }}
        >
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>
    </div>
  );
}
