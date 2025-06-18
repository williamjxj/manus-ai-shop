import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

// Test endpoint to check webhook functionality
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headers = Object.fromEntries(request.headers.entries())

    console.warn('=== WEBHOOK TEST ===')
    console.warn('Headers:', headers)
    console.warn('Body length:', body.length)
    console.warn('Body preview:', body.substring(0, 200))

    // Log to database for debugging
    const supabase = await createClient()

    const { error } = await supabase.from('webhook_events').insert({
      stripe_event_id: `test-${Date.now()}`,
      event_type: 'test.webhook.received',
      status: 'success',
      processed_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Failed to log webhook test:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook test received',
      timestamp: new Date().toISOString(),
      bodyLength: body.length,
      hasStripeSignature: !!headers['stripe-signature'],
    })
  } catch (error) {
    console.error('Webhook test error:', error)
    return NextResponse.json(
      {
        error: 'Webhook test failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check webhook events
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: webhookEvents, error } = await supabase
      .from('webhook_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Failed to fetch webhook events:', error)
      return NextResponse.json(
        { error: 'Failed to fetch webhook events', details: error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      webhookEvents,
      count: webhookEvents?.length || 0,
      message: 'Recent webhook events',
    })
  } catch (error) {
    console.error('GET webhook test error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get webhook events',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
