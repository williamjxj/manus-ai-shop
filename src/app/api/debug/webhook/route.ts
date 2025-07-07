import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Test database connection
    const { error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    // Check if functions exist by trying to call them with test data
    const { data: functions, error: funcError } = await supabase.rpc(
      'process_product_purchase',
      {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_cart_items: [],
        p_total_cents: 0,
        p_payment_intent_id: 'test',
        p_session_id: 'test',
        p_webhook_event_id: 'test',
      }
    )

    return NextResponse.json({
      environment: process.env.NODE_ENV,
      vercelUrl: process.env.VERCEL_URL,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      webhookSecretLength: process.env.STRIPE_WEBHOOK_SECRET?.length || 0,
      webhookSecretPrefix:
        process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 15) || 'MISSING',
      database: {
        connected: !dbError,
        error: dbError?.message,
      },
      functions: {
        processProductPurchaseExists: !funcError,
        functionTestResult: functions,
        error: funcError?.message,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Debug check failed',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
