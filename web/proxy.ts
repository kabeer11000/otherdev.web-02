import { type NextRequest, NextResponse } from 'next/server'

/**
 * Proxy (Next.js 16 replacement for middleware)
 * Detects tenant from domain and adds it to request headers
 *
 * Domain mapping:
 * - otherdev.com → otherdev
 * - clientname.com → clientname (custom domains)
 * - localhost:3000 → localhost (development)
 */
export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || ''

  // Extract domain (remove port for localhost)
  const domain = hostname.split(':')[0]

  // Create response and add tenant domain header
  const response = NextResponse.next()
  response.headers.set('x-tenant-domain', domain)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
}
