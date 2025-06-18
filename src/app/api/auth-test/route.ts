import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Test authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        error: userError.message,
        testAccounts: [
          { email: 'test@example.com', password: 'password123' },
          { email: 'dev@example.com', password: 'devpassword' },
        ],
      })
    }

    if (!user) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        message: 'No user logged in',
        testAccounts: [
          { email: 'test@example.com', password: 'password123' },
          { email: 'dev@example.com', password: 'devpassword' },
        ],
      })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      profile: profile || null,
      profileError: profileError?.message || null,
    })
  } catch (error: any) {
    console.error('Auth test error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
