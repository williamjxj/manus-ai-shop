import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/products'

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || origin

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/auth/auth-code-error?error=${error}&description=${encodeURIComponent(
        error_description || ''
      )}`
    )
  }

  // Exchange code for session
  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      return NextResponse.redirect(`${baseUrl}${next}`)
    } else {
      return NextResponse.redirect(
        `${baseUrl}/auth/auth-code-error?error=exchange_error&description=${encodeURIComponent(
          exchangeError.message
        )}`
      )
    }
  }

  // No code provided
  return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`)
}
