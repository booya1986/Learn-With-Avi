/**
 * Shared rate limit identifier extraction
 *
 * Extracted from rate-limit.ts and auth-rate-limit.ts to avoid duplication.
 */

/**
 * Extract identifier from request (IP address)
 * Checks common reverse-proxy headers: Vercel, CloudFlare, standard proxies.
 */
export function getRequestIdentifier(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() ?? 'anonymous'
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  return 'anonymous'
}
