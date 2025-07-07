'use client'

import { ArrowLeft, Coins, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { useCart } from '@/contexts/CartContext'
import { createClient } from '@/lib/supabase/client'

interface CartItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    description: string
    image_url: string
    price_cents: number
    points_price: number
    category: string
  }
}

interface UserProfile {
  points: number
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'points'>(
    'stripe'
  )
  const [error, setError] = useState('')
  const { refreshCart } = useCart()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Fetch cart items
      const { data: cartData, error: cartError } = await supabase
        .from('cart_items')
        .select(
          `
          id,
          quantity,
          products (
            id,
            name,
            description,
            image_url,
            price_cents,
            points_price,
            category
          )
        `
        )
        .eq('user_id', user.id)

      if (cartError) throw cartError

      // Transform the data to match our CartItem interface
      const transformedCartData =
        cartData?.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          product: Array.isArray(item.products)
            ? item.products[0]
            : item.products,
        })) || []

      setCartItems(transformedCartData)

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        throw profileError
      }

      // If profile doesn't exist, it will be created by the trigger
      setProfile({ points: profileData?.points || 0 })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getTotalPrice = () => {
    return cartItems.reduce(
      (total, item) => total + item.product.price_cents * item.quantity,
      0
    )
  }

  const getTotalPoints = () => {
    return cartItems.reduce(
      (total, item) => total + item.product.points_price * item.quantity,
      0
    )
  }

  const handleCheckout = async () => {
    setProcessing(true)
    setError('')

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems,
          paymentMethod,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed')
      }

      if (paymentMethod === 'stripe' && data.url) {
        window.location.href = data.url
      } else if (paymentMethod === 'points' && data.success) {
        toast.success('Purchase completed successfully!')
        // Refresh cart to clear items
        await refreshCart()
        window.location.href = '/orders'
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const canUsePoints = profile && profile.points >= getTotalPoints()

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 py-12'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='mx-auto h-32 w-32 animate-spin rounded-full border-b-2 border-indigo-600'></div>
            <p className='mt-4 text-gray-600'>Loading checkout...</p>
          </div>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className='min-h-screen bg-gray-50 py-12'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <h1 className='mb-4 text-2xl font-bold text-gray-900'>
              Your cart is empty
            </h1>
            <Link
              href='/products'
              className='inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-700'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='mx-auto max-w-3xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-8 text-center'>
          <h1 className='text-3xl font-bold text-gray-900'>Checkout</h1>
          <p className='mt-2 text-gray-600'>Complete your purchase</p>
        </div>

        <div className='mb-6 rounded-lg bg-white p-6 shadow-sm'>
          <h2 className='mb-4 text-lg font-semibold text-gray-900'>
            Order Summary
          </h2>

          <div className='mb-6 space-y-4'>
            {cartItems.map((item) => (
              <div key={item.id} className='flex items-center space-x-4'>
                <div className='flex-1'>
                  <h3 className='text-sm font-medium text-gray-900'>
                    {item.product.name}
                  </h3>
                  <p className='text-sm text-gray-500'>
                    Quantity: {item.quantity}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='text-sm font-medium text-gray-900'>
                    {formatPrice(item.product.price_cents * item.quantity)}
                  </p>
                  <p className='text-sm text-indigo-600'>
                    {item.product.points_price * item.quantity} points
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className='border-t pt-4'>
            <div className='flex justify-between text-lg font-semibold'>
              <span>Total</span>
              <div className='text-right'>
                <div>{formatPrice(getTotalPrice())}</div>
                <div className='text-sm text-indigo-600'>
                  or {getTotalPoints()} points
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='mb-6 rounded-lg bg-white p-6 shadow-sm'>
          <h2 className='mb-4 text-lg font-semibold text-gray-900'>
            Payment Method
          </h2>

          <div className='space-y-4'>
            <label className='flex items-center'>
              <input
                type='radio'
                name='paymentMethod'
                value='stripe'
                checked={paymentMethod === 'stripe'}
                onChange={(e) => setPaymentMethod(e.target.value as 'stripe')}
                className='h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500'
              />
              <div className='ml-3 flex items-center'>
                <CreditCard className='mr-2 h-5 w-5 text-gray-400' />
                <span className='text-sm font-medium text-gray-900'>
                  Credit Card (Stripe)
                </span>
              </div>
            </label>

            <label className='flex items-center'>
              <input
                type='radio'
                name='paymentMethod'
                value='points'
                checked={paymentMethod === 'points'}
                onChange={(e) => setPaymentMethod(e.target.value as 'points')}
                disabled={!canUsePoints}
                className='h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50'
              />
              <div className='ml-3 flex items-center'>
                <Coins className='mr-2 h-5 w-5 text-gray-400' />
                <span
                  className={`text-sm font-medium ${
                    canUsePoints ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  Points ({profile?.points || 0} available)
                </span>
              </div>
            </label>

            {!canUsePoints && paymentMethod === 'points' && (
              <p className='ml-7 text-sm text-red-600'>
                Insufficient points. You need {getTotalPoints()} points but only
                have {profile?.points || 0}.
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className='mb-6 rounded-md border border-red-200 bg-red-50 p-4'>
            <p className='text-sm text-red-600'>{error}</p>
          </div>
        )}

        <div className='flex space-x-4'>
          <Link
            href='/cart'
            className='flex flex-1 items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Cart
          </Link>

          <button
            onClick={handleCheckout}
            disabled={
              processing || (paymentMethod === 'points' && !canUsePoints)
            }
            className='flex flex-1 items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {processing ? (
              <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-white'></div>
            ) : (
              <>
                {paymentMethod === 'stripe' ? (
                  <CreditCard className='mr-2 h-4 w-4' />
                ) : (
                  <Coins className='mr-2 h-4 w-4' />
                )}
                Complete Purchase
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
