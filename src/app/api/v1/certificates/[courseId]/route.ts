/**
 * Certificate Generation API
 *
 * GET /api/v1/certificates/[courseId]
 *
 * Returns a PDF certificate for the authenticated student who has completed
 * the specified course. The certificate is generated on first request and
 * cached in-memory for subsequent requests.
 *
 * Errors:
 *   401 — not authenticated
 *   403 — not enrolled, or course not yet completed
 *   404 — course not found
 *   500 — internal error
 */

import { type NextRequest, NextResponse } from 'next/server'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth-config'
import { generateCertificate } from '@/lib/certificate-generator'
import { logError } from '@/lib/errors'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/v1/certificates/[courseId]
 *
 * Download a PDF certificate for the authenticated student.
 *
 * @requires Authentication (student)
 * @returns PDF file (application/pdf) or JSON error
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id
    const studentName = session.user.name ?? 'Student'

    const { courseId } = await params

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
    }

    // Verify the course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Verify enrollment and completion
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { completedAt: true },
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You are not enrolled in this course' },
        { status: 403 }
      )
    }

    if (!enrollment.completedAt) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Course not yet completed' },
        { status: 403 }
      )
    }

    // Generate (or retrieve cached) certificate
    const certificate = generateCertificate({
      studentName,
      courseTitle: course.title,
      completedAt: enrollment.completedAt,
      userId,
      courseId,
    })

    // Build a safe filename from the course title
    const safeTitle = course.title
      .toLowerCase()
      .replace(/[^a-z0-9\u0590-\u05ff]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)
    const filename = `certificate-${safeTitle || courseId}.pdf`

    // NextResponse body must be a BodyInit-compatible type.
    // ArrayBuffer is always accepted across TypeScript lib versions.
    const body = certificate.pdfBytes.buffer.slice(
      certificate.pdfBytes.byteOffset,
      certificate.pdfBytes.byteOffset + certificate.pdfBytes.byteLength
    )

    return new NextResponse(body as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': certificate.contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(certificate.pdfBytes.length),
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    logError('Certificate GET API error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
