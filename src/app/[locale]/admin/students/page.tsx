import * as React from 'react'

import { Users, Mail, Calendar, Clock } from 'lucide-react'

import { GlassCard } from '@/components/ui/glass-card'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getStudents() {
  const students = await prisma.user.findMany({
    orderBy: { lastLogin: { sort: 'desc', nulls: 'last' } },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      lastLogin: true,
    },
  })
  return students
}

function formatDate(date: Date | null): string {
  if (!date) return 'Never'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default async function StudentsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireAuth(undefined, locale)
  const students = await getStudents()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Students</h1>
          <p className="mt-1 text-sm text-white/70">
            {students.length} registered student{students.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {students.length === 0 ? (
        <GlassCard variant="dark" padding="lg">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="mb-4 h-12 w-12 text-white/30" />
            <p className="text-lg font-medium text-white">No students yet</p>
            <p className="mt-1 text-sm text-white/70">
              Students will appear here once they sign up for the platform.
            </p>
          </div>
        </GlassCard>
      ) : (
        <GlassCard variant="dark" padding="none">
          <div className="border-b border-white/10 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">All Students</h2>
          </div>

          <div className="divide-y divide-white/10">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center gap-4 px-6 py-4"
              >
                {/* Avatar */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/30 text-sm font-semibold text-blue-200">
                  {getInitials(student.name)}
                </div>

                {/* Name + email */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{student.name}</p>
                  <div className="mt-0.5 flex items-center gap-1 text-sm text-white/70">
                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{student.email}</span>
                  </div>
                </div>

                {/* Sign-up date */}
                <div className="hidden flex-shrink-0 text-end sm:block">
                  <p className="text-xs font-medium text-white/60">Signed up</p>
                  <div className="mt-0.5 flex items-center gap-1 text-sm text-white/70">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(student.createdAt)}</span>
                  </div>
                </div>

                {/* Last login */}
                <div className="hidden flex-shrink-0 text-end lg:block">
                  <p className="text-xs font-medium text-white/60">Last login</p>
                  <div
                    className={`mt-0.5 flex items-center gap-1 text-sm ${
                      student.lastLogin ? 'text-green-400' : 'text-white/60'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDate(student.lastLogin)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  )
}
