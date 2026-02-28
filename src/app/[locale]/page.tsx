import { getTranslations } from 'next-intl/server';

import { CourseCard } from "@/components/CourseCard";
import { HeroCTAButtons } from "@/components/HeroCTAButtons";
import { getCourses } from "@/data/courses";

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

        {/* CTA Buttons — client component handles hover effects */}
        <HeroCTAButtons
          locale={locale}
          browseCourses={t('hero.browseCourses')}
          startLearning={t('hero.startLearning')}
        />
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
