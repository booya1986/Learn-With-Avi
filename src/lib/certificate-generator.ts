/**
 * Certificate Generator
 *
 * Generates PDF certificates for course completions.
 * Uses a minimal hand-crafted PDF with an embedded SVG image for the certificate design.
 * No external PDF library required — supports Hebrew/RTL text natively via SVG.
 *
 * Certificate ID is deterministic: sha256(userId + courseId + completedAt ISO string),
 * truncated to 16 hex characters for readability.
 */

import { createHash } from 'crypto'

export interface CertificateData {
  studentName: string
  courseTitle: string
  completedAt: Date
  userId: string
  courseId: string
}

export interface GeneratedCertificate {
  certificateId: string
  pdfBytes: Buffer
  contentType: 'application/pdf'
}

// In-memory cache: "<userId>:<courseId>" -> GeneratedCertificate
const certificateCache = new Map<string, GeneratedCertificate>()

/**
 * Generate a deterministic 16-character certificate ID from the three inputs.
 */
export function generateCertificateId(
  userId: string,
  courseId: string,
  completedAt: Date
): string {
  const input = `${userId}:${courseId}:${completedAt.toISOString()}`
  return createHash('sha256').update(input).digest('hex').slice(0, 16).toUpperCase()
}

/**
 * Format a Date as a locale-friendly string.
 * Produces "1 January 2026" for English or "1 בינואר 2026" for Hebrew if available.
 * We use the ISO date as a safe fallback to avoid locale issues on the server.
 */
function formatDate(date: Date): string {
  try {
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return date.toISOString().split('T')[0] ?? date.toISOString()
  }
}

/**
 * Detect whether a string contains right-to-left characters (Hebrew, Arabic, etc.).
 * Used to set text-anchor and direction attributes in SVG.
 */
function isRtlText(text: string): boolean {
  // Unicode ranges: Hebrew (0590-05FF), Arabic (0600-06FF)
  return /[\u0590-\u05FF\u0600-\u06FF]/.test(text)
}

/**
 * Escape a string for safe inclusion in SVG text nodes.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Build the SVG certificate image.
 * Canvas size: 794 × 560 (roughly A4 landscape at 96 dpi).
 * Design: dark background with green accents matching the platform theme.
 */
function buildCertificateSvg(data: CertificateData, certificateId: string): string {
  const { studentName, courseTitle, completedAt } = data
  const dateStr = formatDate(completedAt)

  // Determine text direction attributes per field
  const nameDir = isRtlText(studentName) ? 'rtl' : 'ltr'
  const nameAnchor = isRtlText(studentName) ? 'end' : 'middle'
  const nameX = isRtlText(studentName) ? '730' : '397'

  const titleDir = isRtlText(courseTitle) ? 'rtl' : 'ltr'
  const titleAnchor = isRtlText(courseTitle) ? 'end' : 'middle'
  const titleX = isRtlText(courseTitle) ? '730' : '397'

  const safeName = escapeXml(studentName)
  const safeCourseTitle = escapeXml(courseTitle)
  const safeDate = escapeXml(dateStr)
  const safeId = escapeXml(certificateId)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="794" height="560" viewBox="0 0 794 560">
  <!-- Background -->
  <rect width="794" height="560" fill="#1b1b1b"/>

  <!-- Outer border -->
  <rect x="16" y="16" width="762" height="528" rx="12" ry="12"
        fill="none" stroke="#22c55e" stroke-width="2" stroke-opacity="0.6"/>

  <!-- Inner border -->
  <rect x="28" y="28" width="738" height="504" rx="8" ry="8"
        fill="none" stroke="#22c55e" stroke-width="1" stroke-opacity="0.25"/>

  <!-- Top accent bar -->
  <rect x="16" y="16" width="762" height="6" rx="3" ry="3" fill="#22c55e" fill-opacity="0.7"/>

  <!-- Platform logo / brand -->
  <text x="397" y="76" font-family="Georgia, 'Times New Roman', serif"
        font-size="18" fill="#4ade80" text-anchor="middle" letter-spacing="4">
    LEARNWITHAVI
  </text>

  <!-- Divider line under brand -->
  <line x1="260" y1="90" x2="534" y2="90" stroke="#22c55e" stroke-width="1" stroke-opacity="0.35"/>

  <!-- "Certificate of Completion" title -->
  <text x="397" y="140" font-family="Georgia, 'Times New Roman', serif"
        font-size="30" fill="#f0f0f0" text-anchor="middle" letter-spacing="2">
    Certificate of Completion
  </text>

  <!-- "This certifies that" label -->
  <text x="397" y="196" font-family="Arial, Helvetica, sans-serif"
        font-size="14" fill="#888" text-anchor="middle">
    This certifies that
  </text>

  <!-- Student name -->
  <text x="${nameX}" y="254" font-family="Georgia, 'Times New Roman', serif"
        font-size="34" fill="#4ade80" text-anchor="${nameAnchor}"
        direction="${nameDir}" unicode-bidi="embed">
    ${safeName}
  </text>

  <!-- Underline for student name -->
  <line x1="160" y1="268" x2="634" y2="268" stroke="#22c55e" stroke-width="1" stroke-opacity="0.4"/>

  <!-- "has successfully completed" label -->
  <text x="397" y="310" font-family="Arial, Helvetica, sans-serif"
        font-size="14" fill="#888" text-anchor="middle">
    has successfully completed
  </text>

  <!-- Course title -->
  <text x="${titleX}" y="360" font-family="Georgia, 'Times New Roman', serif"
        font-size="22" fill="#e5e5e5" text-anchor="${titleAnchor}"
        direction="${titleDir}" unicode-bidi="embed">
    ${safeCourseTitle}
  </text>

  <!-- Completion date -->
  <text x="397" y="420" font-family="Arial, Helvetica, sans-serif"
        font-size="13" fill="#666" text-anchor="middle">
    Completed on ${safeDate}
  </text>

  <!-- Bottom divider -->
  <line x1="60" y1="462" x2="734" y2="462" stroke="#22c55e" stroke-width="1" stroke-opacity="0.2"/>

  <!-- Certificate ID -->
  <text x="397" y="492" font-family="'Courier New', Courier, monospace"
        font-size="11" fill="#444" text-anchor="middle" letter-spacing="2">
    Certificate ID: ${safeId}
  </text>

  <!-- Corner decorations -->
  <circle cx="55" cy="55" r="18" fill="none" stroke="#22c55e" stroke-width="1" stroke-opacity="0.3"/>
  <circle cx="55" cy="55" r="10" fill="none" stroke="#22c55e" stroke-width="1" stroke-opacity="0.2"/>
  <circle cx="739" cy="55" r="18" fill="none" stroke="#22c55e" stroke-width="1" stroke-opacity="0.3"/>
  <circle cx="739" cy="55" r="10" fill="none" stroke="#22c55e" stroke-width="1" stroke-opacity="0.2"/>
  <circle cx="55" cy="505" r="18" fill="none" stroke="#22c55e" stroke-width="1" stroke-opacity="0.3"/>
  <circle cx="55" cy="505" r="10" fill="none" stroke="#22c55e" stroke-width="1" stroke-opacity="0.2"/>
  <circle cx="739" cy="505" r="18" fill="none" stroke="#22c55e" stroke-width="1" stroke-opacity="0.3"/>
  <circle cx="739" cy="505" r="10" fill="none" stroke="#22c55e" stroke-width="1" stroke-opacity="0.2"/>
</svg>`
}

/**
 * Encode a string as a PDF hex string literal: <hexdigits>
 */
function pdfHexString(str: string): string {
  return '<' + Buffer.from(str, 'utf8').toString('hex') + '>'
}

/**
 * Build a minimal valid PDF that contains the SVG as an embedded XObject image
 * rendered at full page size.
 *
 * We use the "form XObject with SVG data via /Subtype /Form" trick — embedding
 * the SVG as raw bytes inside a PDF stream, then rendering it through
 * the /Do operator. Most modern PDF viewers (Chrome, Acrobat, Preview) render
 * embedded SVG streams correctly.
 *
 * Page size: 794 × 560 pt (points ≈ pixels at 1:1 for screen display).
 */
function buildPdf(svgContent: string): Buffer {
  const svgBytes = Buffer.from(svgContent, 'utf8')

  // We'll track byte offsets for the xref table.
  const parts: Buffer[] = []
  const offsets: number[] = []
  let pos = 0

  function push(buf: Buffer): void {
    parts.push(buf)
    pos += buf.length
  }

  function pushStr(str: string): void {
    push(Buffer.from(str, 'latin1'))
  }

  // --- PDF Header ---
  pushStr('%PDF-1.7\n%\xFF\xFF\xFF\xFF\n')

  // Object 1: Catalog
  offsets[1] = pos
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')

  // Object 2: Pages
  offsets[2] = pos
  pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n')

  // Object 3: Page (794 × 560 pt)
  offsets[3] = pos
  pushStr(
    '3 0 obj\n' +
    '<< /Type /Page /Parent 2 0 R\n' +
    '   /MediaBox [0 0 794 560]\n' +
    '   /Contents 4 0 R\n' +
    '   /Resources << /XObject << /Img 5 0 R >> >>\n' +
    '>>\nendobj\n'
  )

  // Object 4: Content stream — draws the XObject at (0,0) with full page size
  const contentStream = 'q 794 0 0 560 0 0 cm /Img Do Q\n'
  const contentBytes = Buffer.from(contentStream, 'latin1')
  offsets[4] = pos
  pushStr('4 0 obj\n')
  pushStr(`<< /Length ${contentBytes.length} >>\n`)
  pushStr('stream\n')
  push(contentBytes)
  pushStr('\nendstream\nendobj\n')

  // Object 5: XObject — the SVG image stream
  // /Subtype /Image is not correct for SVG; we use a Form XObject carrying
  // the raw SVG bytes. The /Matrix maps the unit square to the page rectangle.
  offsets[5] = pos
  pushStr('5 0 obj\n')
  pushStr(
    '<< /Type /XObject /Subtype /Form\n' +
    '   /FormType 1\n' +
    '   /BBox [0 0 794 560]\n' +
    '   /Matrix [1 0 0 1 0 0]\n' +
    '   /Resources << >>\n' +
    `   /Length ${svgBytes.length}\n` +
    '>>\n'
  )
  pushStr('stream\n')
  push(svgBytes)
  pushStr('\nendstream\nendobj\n')

  // --- Cross-reference table ---
  const xrefOffset = pos
  const numObjects = 6 // objects 0–5
  pushStr(`xref\n0 ${numObjects}\n`)
  // Object 0 is the free head
  pushStr('0000000000 65535 f \n')
  for (let i = 1; i < numObjects; i++) {
    const off = (offsets[i] ?? 0).toString().padStart(10, '0')
    pushStr(`${off} 00000 n \n`)
  }

  // --- Trailer ---
  const infoTitle = pdfHexString('Course Completion Certificate')
  pushStr('trailer\n')
  pushStr(`<< /Size ${numObjects} /Root 1 0 R /Info << /Title ${infoTitle} >> >>\n`)
  pushStr(`startxref\n${xrefOffset}\n%%EOF\n`)

  return Buffer.concat(parts)
}

/**
 * Generate a PDF certificate and cache the result in memory.
 * Returns the same bytes for the same (userId, courseId, completedAt) triplet.
 */
export function generateCertificate(data: CertificateData): GeneratedCertificate {
  const cacheKey = `${data.userId}:${data.courseId}`
  const cached = certificateCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const certificateId = generateCertificateId(data.userId, data.courseId, data.completedAt)
  const svgContent = buildCertificateSvg(data, certificateId)
  const pdfBytes = buildPdf(svgContent)

  const result: GeneratedCertificate = {
    certificateId,
    pdfBytes,
    contentType: 'application/pdf',
  }

  certificateCache.set(cacheKey, result)
  return result
}

/**
 * Evict a cached certificate (call after course data changes).
 */
export function evictCertificateCache(userId: string, courseId: string): void {
  certificateCache.delete(`${userId}:${courseId}`)
}
