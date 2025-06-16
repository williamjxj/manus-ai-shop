import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(request: NextRequest) {
  try {
    const { cartItems, paymentMethod } = await request.json()
    
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (paymentMethod === 'points') {
      // Handle points payment
      const totalPoints = cartItems.reduce((total: number, item: any) => 
        total + (item.product.points_price * item.quantity), 0
      )

      // Check user's points balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', user.id)
        .single()

      if (!profile || profile.points < totalPoints) {
        return NextResponse.json({ error: 'Insufficient points' }, { status: 400 })
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_cents: 0,
          total_points: totalPoints,
          payment_method: 'points',
          status: 'completed'
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = cartItems.map((item: any) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price_cents: item.product.price_cents,
        points_price: item.product.points_price
      }))

      await supabase.from('order_items').insert(orderItems)

      // Deduct points
      await supabase
        .from('profiles')
        .update({ points: profile.points - totalPoints })
        .eq('id', user.id)

      // Record points transaction
      await supabase
        .from('points_transactions')
        .insert({
          user_id: user.id,
          amount: -totalPoints,
          type: 'spend',
          description: `Purchase order #${order.id}`,
          order_id: order.id
        })

      // Clear cart
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)

      return NextResponse.json({ success: true, orderId: order.id })
    } else {
      // Handle Stripe payment
      const totalCents = cartItems.reduce((total: number, item: any) => 
        total + (item.product.price_cents * item.quantity), 0
      )

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: cartItems.map((item: any) => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.product.name,
              description: item.product.description,
              images: [item.product.image_url],
            },
            unit_amount: item.product.price_cents,
          },
          quantity: item.quantity,
        })),
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
        metadata: {
          user_id: user.id,
          cart_items: JSON.stringify(cartItems.map((item: any) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            price_cents: item.product.price_cents,
            points_price: item.product.points_price
          })))
        },
      })

      return NextResponse.json({ url: session.url })
    }
  } catch (error: any) {
    console.error('Error processing checkout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

