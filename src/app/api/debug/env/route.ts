import { NextResponse } from 'next/server'

export async function GET() {
  // Only allow in development or with specific header
  const isDev = process.env.NODE_ENV === 'development'

  if (!isDev) {
    return NextResponse.json(
      { error: 'Not allowed in production' },
      { status: 403 }
    )
  }

  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? 'Set'
      : 'Missing',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'Not set',
    nodeEnv: process.env.NODE_ENV,
  })
}
