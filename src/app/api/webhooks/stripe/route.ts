import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import { logError, logSuccess, logWarning } from '@/lib/error-handling'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

// Enhanced logging utility using centralized error handling
const logWebhookEvent = (
  level: 'info' | 'error' | 'warn',
  message: string,
  data?: any
) => {
  switch (level) {
    case 'error':
      logError('WEBHOOK', new Error(message), data)
      break
    case 'warn':
      logWarning('WEBHOOK', message, data)
      break
    case 'info':
      logSuccess('WEBHOOK', message, data)
      break
  }
}

// Idempotency check to prevent duplicate processing
const checkIdempotency = async (
  supabase: any,
  eventId: string,
  eventType: string
) => {
  const { data: existingEvent } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('stripe_event_id', eventId)
    .eq('event_type', eventType)
    .maybeSingle()

  return !!existingEvent
}

// Record webhook event for idempotency
const recordWebhookEvent = async (
  supabase: any,
  eventId: string,
  eventType: string,
  status: string
) => {
  await supabase.from('webhook_events').insert({
    stripe_event_id: eventId,
    event_type: eventType,
    status,
    processed_at: new Date().toISOString(),
  })
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  // Debug webhook configuration
  console.warn('🔍 Webhook Debug Info:', {
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    webhookSecretLength: process.env.STRIPE_WEBHOOK_SECRET?.length || 0,
    webhookSecretPrefix:
      process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 15) || 'MISSING',
    hasSignature: !!sig,
    signaturePrefix: sig?.substring(0, 20) || 'MISSING',
    bodyLength: body.length,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercelUrl: process.env.VERCEL_URL,
  })

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    console.warn('✅ Webhook signature verified successfully:', {
      eventType: event.type,
      eventId: event.id,
    })
  } catch (err: unknown) {
    console.error('❌ Webhook signature verification failed:', {
      error: err,
      hasSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      secretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10),
    })
    logWebhookEvent('error', 'Webhook signature verification failed', {
      error: err,
    })
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  try {
    // Check for duplicate processing
    const isDuplicate = await checkIdempotency(supabase, event.id, event.type)
    if (isDuplicate) {
      logWebhookEvent('info', 'Duplicate webhook event ignored', {
        eventId: event.id,
      })
      return NextResponse.json({ received: true, duplicate: true })
    }

    logWebhookEvent('info', 'Processing webhook event', {
      eventId: event.id,
      eventType: event.type,
    })

    console.warn('🎯 PROCESSING EVENT:', {
      eventType: event.type,
      eventId: event.id,
    })

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session

        console.warn('💳 CHECKOUT SESSION COMPLETED:', {
          sessionId: session.id,
          paymentStatus: session.payment_status,
          customerId: session.customer,
          metadata: session.metadata,
          hasPointsMetadata: !!session.metadata?.points,
          hasCartItemsMetadata: !!session.metadata?.cart_items,
          cartItemsValue: session.metadata?.cart_items,
        })

        if (session.metadata?.points) {
          console.warn('🎯 HANDLING POINTS PURCHASE')
          // Handle points purchase with enhanced error handling and validation
          await handlePointsPurchase(supabase, session, event.id)
        } else if (session.metadata?.cart_items) {
          console.warn('🛒 HANDLING PRODUCT PURCHASE')
          // Handle product purchase with enhanced error handling and validation
          await handleProductPurchase(supabase, session, event.id)
        } else {
          console.warn('⚠️ UNKNOWN SESSION TYPE - NO METADATA')
          logWebhookEvent('warn', 'Unknown session type', {
            sessionId: session.id,
          })
        }
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent
        await handlePaymentFailure(supabase, failedPayment, event.id)
        break

      default:
        logWebhookEvent('info', `Unhandled event type: ${event.type}`, {
          eventId: event.id,
        })
    }

    // Record successful processing
    await recordWebhookEvent(supabase, event.id, event.type, 'success')

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    logWebhookEvent('error', 'Error processing webhook', {
      error: error,
      eventId: event.id,
      eventType: event.type,
    })

    // Record failed processing
    try {
      await recordWebhookEvent(supabase, event.id, event.type, 'failed')
    } catch (recordError) {
      logWebhookEvent('error', 'Failed to record webhook event', {
        error: recordError,
      })
    }

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Enhanced points purchase handler with database transactions
async function handlePointsPurchase(
  supabase: any,
  session: Stripe.Checkout.Session,
  eventId: string
) {
  const userId = session.metadata!.user_id
  const points = parseInt(session.metadata!.points)
  const packageId = session.metadata!.package_id
  const paymentIntentId = session.payment_intent as string

  logWebhookEvent('info', 'Processing points purchase', {
    userId,
    points,
    packageId,
    sessionId: session.id,
  })

  // Validate input data
  if (!userId || !points || points <= 0) {
    throw new Error(
      `Invalid points purchase data: userId=${userId}, points=${points}`
    )
  }

  // Use database transaction for atomicity
  const { error: transactionError } = await supabase.rpc(
    'process_points_purchase',
    {
      p_user_id: userId,
      p_points: points,
      p_package_id: packageId,
      p_payment_intent_id: paymentIntentId,
      p_session_id: session.id,
      p_webhook_event_id: eventId,
    }
  )

  if (transactionError) {
    logWebhookEvent('error', 'Points purchase transaction failed', {
      error: transactionError,
      userId,
      points,
    })
    throw transactionError
  }

  logWebhookEvent('info', 'Points purchase completed successfully', {
    userId,
    points,
    sessionId: session.id,
  })
}

// Enhanced product purchase handler with database transactions
async function handleProductPurchase(
  supabase: any,
  session: Stripe.Checkout.Session,
  eventId: string
) {
  console.warn('🛒 STARTING PRODUCT PURCHASE HANDLER')

  const userId = session.metadata!.user_id
  let cartItems = session.metadata!.cart_items

  console.warn('📋 PRODUCT PURCHASE DATA:', {
    userId,
    cartItemsRaw: cartItems,
    cartItemsType: typeof cartItems,
    paymentIntent: session.payment_intent,
    sessionId: session.id,
    eventId,
  })

  // Defensive: parse if string, else use as is
  if (typeof cartItems === 'string') {
    try {
      cartItems = JSON.parse(cartItems)
      console.warn('✅ PARSED CART ITEMS:', cartItems)
    } catch (parseError) {
      console.error('❌ FAILED TO PARSE CART ITEMS:', parseError)
      throw new Error('Invalid cart_items JSON in metadata')
    }
  }

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    console.error('❌ INVALID CART ITEMS:', {
      cartItems,
      isArray: Array.isArray(cartItems),
      length: cartItems?.length,
    })
    throw new Error('Invalid cart items data')
  }

  const paymentIntentId = session.payment_intent as string

  logWebhookEvent('info', 'Processing product purchase', {
    userId,
    itemCount: cartItems.length,
    sessionId: session.id,
  })

  const totalCents = cartItems.reduce(
    (total: number, item: any) => total + item.price_cents * item.quantity,
    0
  )

  console.warn('💰 CALCULATED TOTAL:', {
    totalCents,
    cartItems: cartItems.map((item: any) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price_cents: item.price_cents,
    })),
  })

  console.warn('🔄 CALLING PROCESS_PRODUCT_PURCHASE FUNCTION')

  const { data: functionResult, error: transactionError } = await supabase.rpc(
    'process_product_purchase',
    {
      p_user_id: userId,
      p_cart_items: cartItems,
      p_total_cents: totalCents,
      p_payment_intent_id: paymentIntentId,
      p_session_id: session.id,
      p_webhook_event_id: eventId,
    }
  )

  console.warn('📊 FUNCTION RESULT:', {
    functionResult,
    hasError: !!transactionError,
    error: transactionError,
  })

  if (transactionError) {
    logWebhookEvent('error', 'Product purchase transaction failed', {
      error: transactionError,
      userId,
      totalCents,
    })
    throw transactionError
  }

  logWebhookEvent('info', 'Product purchase completed successfully', {
    userId,
    totalCents,
    sessionId: session.id,
  })
}

// Handle payment failures
async function handlePaymentFailure(
  supabase: any,
  paymentIntent: Stripe.PaymentIntent,
  eventId: string
) {
  logWebhookEvent('warn', 'Payment failed', {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
  })

  // Update any pending orders to failed status
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .eq('status', 'pending')

  if (error) {
    logWebhookEvent('error', 'Failed to update order status', { error })
  }

  // Record the webhook event
  await recordWebhookEvent(
    supabase,
    eventId,
    'payment_intent.payment_failed',
    'success'
  )
}
