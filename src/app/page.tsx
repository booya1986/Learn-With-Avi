import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Play, Sparkles, BookOpen, MessageSquare, Mic } from 'lucide-react'
import { CourseCard } from '@/components/CourseCard'
import { getCourses, getAllVideos } from '@/data/courses'

export default async function Home() {
  const courses = await getCourses()
  const allVideos = await getAllVideos()
  const featuredVideos = allVideos.slice(0, 4)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950 py-16 md:py-24">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Learning Experience
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Master AI & Machine Learning
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {' '}
                with Interactive Courses
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Learn from curated video content with an AI assistant that answers your questions
              using the actual course material. Ask anything, get contextual answers.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="#courses"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                Browse Courses
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/course/intro-to-embeddings"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white font-medium transition-colors"
              >
                <Play className="w-4 h-4" />
                Start Learning
              </Link>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
              <div className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Curated Content
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Hand-picked video courses on Embeddings, RAG, LLMs, and more cutting-edge AI
                  topics.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  AI Chat Assistant
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ask questions and get answers grounded in the actual video content with
                  timestamps.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                  <Mic className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Voice Interaction
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Speak your questions naturally and hear responses read aloud while you learn.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Available Courses
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Start your AI learning journey with our expertly curated courses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Videos Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Featured Videos
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Jump into some of our most popular lessons
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {featuredVideos.map((video) => (
              <Link
                key={video.id}
                href={`/course/${video.courseId}?video=${video.id}`}
                className="group"
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 mb-3">
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-5 h-5 text-gray-900 ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 rtl:right-auto rtl:left-2 px-1.5 py-0.5 bg-black/80 rounded text-xs text-white font-medium">
                    {Math.floor(video.duration / 60)}:
                    {(video.duration % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {video.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{video.topic}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              About LearnWithAvi
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              LearnWithAvi is an AI-powered interactive learning platform designed to make complex
              AI and ML topics accessible to everyone. Our unique approach combines curated video
              content with an intelligent chat assistant that uses RAG (Retrieval Augmented
              Generation) to answer your questions based on the actual course material.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {courses.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Courses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {allVideos.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Videos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  24/7
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">AI Support</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  Free
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">To Learn</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center p-8 md:p-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-blue-100 mb-8 max-w-xl mx-auto">
              Dive into our courses and experience the future of AI-powered education. Ask
              questions, get instant answers, and master complex topics faster.
            </p>
            <Link
              href="/course/intro-to-embeddings"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-white hover:bg-gray-100 text-blue-600 font-semibold transition-colors"
            >
              <Play className="w-5 h-5" />
              Start Your First Course
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
