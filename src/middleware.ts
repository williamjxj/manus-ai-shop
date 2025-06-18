import { type NextRequest, NextResponse } from 'next/server'

import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Bypass auth/session middleware for Stripe webhooks
  if (request.nextUrl.pathname.startsWith('/api/webhooks/stripe')) {
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
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth-test|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
