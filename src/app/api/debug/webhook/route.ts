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

    // Check if functions exist by querying system tables
    const { data: functions, error: funcError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'process_product_purchase')
      .single()

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
        processProductPurchaseExists: !funcError && !!functions,
        functionName: functions?.proname,
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
