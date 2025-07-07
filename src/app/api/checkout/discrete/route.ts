import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import { DiscreteCheckoutOptions } from '@/lib/adult-ecommerce-utils'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

interface DiscreteCheckoutRequest {
  items: Array<{
    product_id: string
    quantity: number
    price_cents: number
    name: string
    image_url: string
  }>
  userId: string
  userEmail: string
  discreteOptions: DiscreteCheckoutOptions
  billingDescriptor: string
}

export async function POST(request: NextRequest) {
  try {
    const {
      items,
      userId,
      userEmail,
      discreteOptions,
      billingDescriptor,
    }: DiscreteCheckoutRequest = await request.json()

    const supabase = await createClient()

    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify age verification for adult content
    const { data: profile } = await supabase
      .from('profiles')
      .select('age_verified')
      .eq('id', userId)
      .single()

    if (!profile?.age_verified) {
      return NextResponse.json(
        { error: 'Age verification required for adult content purchases' },
        { status: 403 }
      )
    }

    // Create line items for Stripe
    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: discreteOptions.discreteBilling
            ? 'Digital Media Content'
            : item.name,
          description: discreteOptions.discreteBilling
            ? 'Premium digital content access'
            : `Adult content: ${item.name}`,
          images: discreteOptions.discreteBilling ? [] : [item.image_url],
          metadata: {
            product_id: item.product_id,
            is_adult_content: 'true',
            discrete_billing: discreteOptions.discreteBilling.toString(),
          },
        },
        unit_amount: item.price_cents,
      },
      quantity: item.quantity,
    }))

    // Calculate total for validation
    const totalAmount = items.reduce(
      (sum, item) => sum + item.price_cents * item.quantity,
      0
    )

    // Create discrete checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      customer_email: userEmail,

      // Discrete billing configuration
      payment_intent_data: {
        statement_descriptor: billingDescriptor,
        statement_descriptor_suffix: discreteOptions.discreteBilling
          ? 'MEDIA'
          : 'ADULT',
        metadata: {
          user_id: userId,
          is_adult_content: 'true',
          discrete_billing: discreteOptions.discreteBilling.toString(),
          anonymous_order: discreteOptions.anonymousOrder.toString(),
          hide_from_history: discreteOptions.hideFromHistory.toString(),
        },
      },

      metadata: {
        user_id: userId,
        cart_items: JSON.stringify(
          items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price_cents: item.price_cents,
          }))
        ),
        total_amount: totalAmount.toString(),
        is_adult_content: 'true',
        discrete_options: JSON.stringify(discreteOptions),
      },

      // Privacy settings
      billing_address_collection: discreteOptions.discreteBilling
        ? 'auto'
        : 'required',
      shipping_address_collection: undefined, // Digital products only

      // Session configuration
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes

      // Discrete mode settings
      ...(discreteOptions.discreteBilling && {
        custom_text: {
          submit: {
            message:
              'Your purchase will appear as "' +
              billingDescriptor +
              '" on your statement.',
          },
        },
      }),
    })

    // Log the discrete checkout attempt (without sensitive details)
    if (process.env.NODE_ENV === 'development') {
      console.warn('Discrete checkout session created:', {
        sessionId: session.id,
        userId,
        itemCount: items.length,
        totalAmount: totalAmount / 100,
        discreteBilling: discreteOptions.discreteBilling,
        anonymousOrder: discreteOptions.anonymousOrder,
      })
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: any) {
    console.error('Discrete checkout error:', error)

    return NextResponse.json(
      {
        error: 'Failed to create discrete checkout session',
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
