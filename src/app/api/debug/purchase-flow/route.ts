import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get the test user
    const { data: testUser, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'test-user@example.com')
      .single()

    if (userError || !testUser) {
      return NextResponse.json({
        error: 'Test user not found',
        userError: userError?.message,
      })
    }

    // Get cart items for test user
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select(
        `
        *,
        product:products(*)
      `
      )
      .eq('user_id', testUser.id)

    // Get recent orders for test user
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(
        `
        *,
        order_items(
          *,
          product:products(*)
        )
      `
      )
      .eq('user_id', testUser.id)
      .order('created_at', { ascending: false })
      .limit(5)

    // Get recent webhook events
    const { data: webhookEvents, error: webhookError } = await supabase
      .from('webhook_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      testUser: {
        id: testUser.id,
        email: testUser.email,
        points: testUser.points,
      },
      cartItems: {
        count: cartItems?.length || 0,
        items: cartItems || [],
        error: cartError?.message,
      },
      orders: {
        count: orders?.length || 0,
        recent: orders || [],
        error: ordersError?.message,
      },
      webhookEvents: {
        count: webhookEvents?.length || 0,
        recent: webhookEvents || [],
        error: webhookError?.message,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelUrl: process.env.VERCEL_URL,
        hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
        hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
        webhookSecretLength: process.env.STRIPE_WEBHOOK_SECRET?.length,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Debug check failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
