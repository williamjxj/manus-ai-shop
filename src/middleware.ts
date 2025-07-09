import { type NextRequest, NextResponse } from 'next/server'

import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Bypass middleware for specific endpoints and pages
  if (
    request.nextUrl.pathname.startsWith('/api/webhooks/stripe') ||
    request.nextUrl.pathname.startsWith('/api/debug/') ||
    request.nextUrl.pathname === '/geo-blocked'
  ) {
    return NextResponse.next()
  }
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/test-local-db (test endpoint)
     * - media files (images and videos)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth-test|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|mov|avi|mkv|webm)$).*)',
  ],
}
