import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Test database connection
    const { data: testQuery, error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    // Check if functions exist
    const { data: functions, error: funcError } = await supabase
      .rpc('pg_get_functiondef', { funcoid: 'process_product_purchase'::regproc })
      .single()
    
    return NextResponse.json({
      environment: process.env.NODE_ENV,
      vercelUrl: process.env.VERCEL_URL,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      webhookSecretLength: process.env.STRIPE_WEBHOOK_SECRET?.length || 0,
      webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 15) || 'MISSING',
      database: {
        connected: !dbError,
        error: dbError?.message,
      },
      functions: {
        processProductPurchaseExists: !funcError,
        error: funcError?.message,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Debug check failed',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
