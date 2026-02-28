import Link from "next/link";

import { ArrowRight, Play, Sparkles, BookOpen, MessageSquare, Mic } from "lucide-react";
import { getTranslations } from 'next-intl/server';

import { CourseCard } from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { getCourses, getAllVideos } from "@/data/courses";

export default async function Home({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const courses = await getCourses();
  const allVideos = await getAllVideos();
  const t = await getTranslations({ locale, namespace: 'homepage' });

  // Debug: Log what title we're getting
  console.log('📖 Homepage title for locale', locale, ':', t('hero.title'));

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden min-h-[90vh] flex items-center"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.03) 45%, transparent 70%), #1b1b1b`
        }}
      >
        {/* Background Slot Pattern - Dotted grid effect */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 100px,
                rgba(255, 255, 255, 0.06) 100px,
                rgba(255, 255, 255, 0.06) 102px,
                transparent 102px,
                transparent 105px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 100px,
                rgba(255, 255, 255, 0.06) 100px,
                rgba(255, 255, 255, 0.06) 102px,
                transparent 102px,
                transparent 105px
              )
            `,
          }}
        />

        <div className="container mx-auto px-4 relative z-10 py-16 md:py-24">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/8 border border-green-500/30 text-green-400 text-xs font-bold mb-8 tracking-widest uppercase animate-fade-in-up">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 [box-shadow:var(--glow-success-sm)]" />
              {t('hero.badge')}
            </div>

            {/* Headline */}
            <h1 className="font-bold text-white mb-6 leading-tight animate-fade-in-up delay-75" style={{ fontSize: 'var(--text-display)', letterSpacing: '-0.03em' }}>
              {t('hero.title')}
            </h1>

            {/* Subheadline */}
            <p className="text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-150" style={{ fontSize: 'var(--text-hero-sub)' }}>
              {t('hero.subtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-fade-in-up delay-300">
              <Button variant="orbyto-primary" size="orbyto" asChild>
                <Link href={`/${locale}#courses`} className="flex items-center">
                  {t('hero.browseCourses')}
                  <ArrowRight className="w-4 h-4 ms-2 rtl:rotate-180" />
                </Link>
              </Button>
              <Button variant="orbyto-secondary" size="orbyto" asChild>
                <Link href={`/${locale}/course/intro-to-embeddings`} className="flex items-center">
                  <Play className="w-4 h-4 me-2" />
                  {t('hero.startLearning')}
                </Link>
              </Button>
            </div>

            {/* Feature highlights - Glass Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left animate-fade-in-up delay-300">
              <GlassCard variant="dark" padding="lg">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center mb-4">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {t('features.voice.title')}
                </h3>
                <p className="text-sm text-white/70">
                  {t('features.voice.description')}
                </p>
              </GlassCard>

              <GlassCard variant="dark" padding="lg">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {t('features.context.title')}
                </h3>
                <p className="text-sm text-white/70">
                  {t('features.context.description')}
                </p>
              </GlassCard>

              <GlassCard variant="dark" padding="lg">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {t('features.timestamps.title')}
                </h3>
                <p className="text-sm text-white/70">
                  {t('features.timestamps.description')}
                </p>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-16 md:py-24 bg-[#1b1b1b]">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="font-bold text-white mb-4" style={{ fontSize: 'var(--text-section-title)' }}>
              {t('courses.title')}
            </h2>
            <p className="text-gray-500">
              {t('courses.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 md:py-24 bg-[#161616] border-t border-green-500/8">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-bold text-white mb-6" style={{ fontSize: 'var(--text-section-title)' }}>
              {t('about.title')}
            </h2>
            <p className="text-gray-500 mb-12 text-lg leading-relaxed">
              {t('about.description')}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {t('about.stats.completionRate.value')}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">{t('about.stats.completionRate.label')}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('about.stats.completionRate.comparison')}</div>
              </div>
              <div className="p-6 rounded-xl bg-green-500/5 dark:bg-green-500/5 border border-green-500/15 dark:border-green-500/20">
                <div className="text-3xl md:text-4xl font-bold text-green-500 dark:text-green-400 mb-1">
                  {t('about.stats.fasterLearning.value')}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">{t('about.stats.fasterLearning.label')}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('about.stats.fasterLearning.comparison')}</div>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800">
                <div className="text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {t('about.stats.avgSession.value')}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">{t('about.stats.avgSession.label')}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('about.stats.avgSession.comparison')}</div>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-800">
                <div className="text-3xl md:text-4xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                  {t('about.stats.nps.value')}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">{t('about.stats.nps.label')}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('about.stats.nps.comparison')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="relative py-16 md:py-24 overflow-hidden"
        style={{
          background: `radial-gradient(ellipse at 50% 100%, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.02) 50%, transparent 70%), #1b1b1b`
        }}
      >
        {/* Background pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 100px,
                rgba(255, 255, 255, 0.06) 100px,
                rgba(255, 255, 255, 0.06) 102px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 100px,
                rgba(255, 255, 255, 0.06) 100px,
                rgba(255, 255, 255, 0.06) 102px
              )
            `,
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <GlassCard variant="dark" padding="lg" className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {t('cta.title')}
              </h2>
              <p className="text-white/90 mb-8 max-w-xl mx-auto">
                {t('cta.description')}
              </p>
              <Button variant="orbyto-primary" size="orbyto" asChild>
                <Link href={`/${locale}/course/intro-to-embeddings`} className="flex items-center">
                  <Play className="w-5 h-5 me-2" />
                  {t('cta.button')}
                </Link>
              </Button>
            </GlassCard>
          </div>
        </div>
      </section>
    </div>
  );
}
