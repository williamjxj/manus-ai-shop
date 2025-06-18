import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import {
  checkoutRateLimiter,
  createErrorResponse,
  logError,
  logSuccess,
  validateCartItems,
} from '@/lib/error-handling'
import { getOrCreateProfile } from '@/lib/profile-utils'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

interface CartItem {
  product: {
    id: string
    name: string
    description: string
    image_url: string
    price_cents: number
    points_price: number
  }
  quantity: number
}

export async function POST(request: NextRequest) {
  try {
    const {
      cartItems,
      paymentMethod,
    }: {
      cartItems: CartItem[]
      paymentMethod: string
    } = await request.json()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const errorResponse = createErrorResponse('UNAUTHORIZED')
      return NextResponse.json(errorResponse.error, {
        status: errorResponse.statusCode,
      })
    }

    // Rate limiting check
    if (!checkoutRateLimiter.isAllowed(user.id)) {
      logError('CHECKOUT', new Error('Rate limit exceeded'), {
        userId: user.id,
      })
      return NextResponse.json(
        { error: 'Too many checkout attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Validate cart items
    const validation = validateCartItems(cartItems)
    if (!validation.valid) {
      logError('CHECKOUT', new Error('Invalid cart items'), {
        userId: user.id,
        errors: validation.errors,
      })
      const errorResponse = createErrorResponse('INVALID_CART', {
        errors: validation.errors,
      })
      return NextResponse.json(errorResponse.error, {
        status: errorResponse.statusCode,
      })
    }

    logSuccess('CHECKOUT', 'Processing checkout request', {
      userId: user.id,
      paymentMethod,
      itemCount: cartItems.length,
    })

    if (paymentMethod === 'points') {
      // Handle points payment with enhanced validation and transaction safety
      return await handlePointsPayment(supabase, user, cartItems)
    } else {
      // Handle Stripe payment with enhanced validation
      return await handleStripePayment(user, cartItems)
    }
  } catch (error: unknown) {
    logError(
      'CHECKOUT',
      error instanceof Error ? error : new Error(String(error))
    )
    const errorResponse = createErrorResponse('INTERNAL_ERROR')
    return NextResponse.json(errorResponse.error, {
      status: errorResponse.statusCode,
    })
  }
}

// Enhanced points payment handler with database transactions
async function handlePointsPayment(
  supabase: any,
  user: any,
  cartItems: CartItem[]
) {
  // Input validation
  if (!cartItems || cartItems.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  // Validate cart items structure
  for (const item of cartItems) {
    if (
      !item.product?.id ||
      !item.product?.points_price ||
      item.quantity <= 0
    ) {
      return NextResponse.json(
        { error: 'Invalid cart item data' },
        { status: 400 }
      )
    }
  }

  const totalPoints = cartItems.reduce(
    (total: number, item: CartItem) =>
      total + item.product.points_price * item.quantity,
    0
  )

  const totalCents = cartItems.reduce(
    (total: number, item: CartItem) =>
      total + item.product.price_cents * item.quantity,
    0
  )

  // Check user's points balance with fresh data
  const profile = await getOrCreateProfile(user.id, user.email || undefined)
  if (!profile) {
    return NextResponse.json(
      { error: 'Error accessing profile' },
      { status: 500 }
    )
  }

  if (profile.points < totalPoints) {
    return NextResponse.json(
      {
        error: 'Insufficient points',
        required: totalPoints,
        available: profile.points,
      },
      { status: 400 }
    )
  }

  // Use database transaction for atomicity
  const { data: result, error: transactionError } = await supabase.rpc(
    'process_points_checkout',
    {
      p_user_id: user.id,
      p_cart_items: cartItems.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price_cents: item.product.price_cents,
        points_price: item.product.points_price,
      })),
      p_total_points: totalPoints,
      p_total_cents: totalCents,
    }
  )

  if (transactionError) {
    console.error('Points checkout transaction failed:', transactionError)
    return NextResponse.json(
      { error: 'Transaction failed. Please try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    orderId: result?.order_id,
    pointsUsed: totalPoints,
    remainingPoints: profile.points - totalPoints,
  })
}

// Enhanced Stripe payment handler
async function handleStripePayment(user: any, cartItems: CartItem[]) {
  // Input validation
  if (!cartItems || cartItems.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  // Validate cart items and calculate total
  let totalAmount = 0
  const lineItems = []

  for (const item of cartItems) {
    if (!item.product?.id || !item.product?.price_cents || item.quantity <= 0) {
      return NextResponse.json(
        { error: 'Invalid cart item data' },
        { status: 400 }
      )
    }

    totalAmount += item.product.price_cents * item.quantity

    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.product.name,
          description:
            item.product.description ||
            `AI-generated image: ${item.product.name}`,
          images: item.product.image_url
            ? [
                item.product.image_url.startsWith('http')
                  ? item.product.image_url
                  : `${process.env.NEXT_PUBLIC_APP_URL}${item.product.image_url}`,
              ]
            : [],
        },
        unit_amount: item.product.price_cents,
      },
      quantity: item.quantity,
    })
  }

  // Minimum amount check (Stripe requires at least $0.50)
  if (totalAmount < 50) {
    return NextResponse.json(
      { error: 'Minimum order amount is $0.50' },
      { status: 400 }
    )
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        cart_items: JSON.stringify(
          cartItems.map((item: CartItem) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            price_cents: item.product.price_cents,
            points_price: item.product.points_price,
          }))
        ),
        total_amount: totalAmount.toString(),
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
    })

    return NextResponse.json({ url: session.url })
  } catch (stripeError: any) {
    console.error('Stripe session creation failed:', stripeError)
    return NextResponse.json(
      { error: 'Payment processing unavailable. Please try again later.' },
      { status: 500 }
    )
  }
}
