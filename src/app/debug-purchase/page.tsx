'use client'

import { useEffect, useState } from 'react'

interface DebugData {
  testUser?: {
    id: string
    email: string
    points: number
  }
  cartItems?: {
    count: number
    items: any[]
    error?: string
  }
  orders?: {
    count: number
    recent: any[]
    error?: string
  }
  webhookEvents?: {
    count: number
    recent: any[]
    error?: string
  }
  environment?: {
    nodeEnv: string
    vercelUrl: string
    hasStripeSecret: boolean
    hasWebhookSecret: boolean
    webhookSecretLength: number
  }
  timestamp?: string
  error?: string
}

export default function DebugPurchasePage() {
  const [data, setData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchData = async () => {
    try {
      const response = await fetch('/api/debug/purchase-flow')
      const result = await response.json()
      setData(result)
    } catch (error) {
      setData({ error: 'Failed to fetch debug data' })
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchData, 2000) // Refresh every 2 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 p-8'>
        <div className='mx-auto max-w-4xl'>
          <h1 className='mb-8 text-3xl font-bold'>Purchase Flow Debug</h1>
          <div className='text-center'>Loading...</div>
        </div>
      </div>
    )
  }

  if (data?.error) {
    return (
      <div className='min-h-screen bg-gray-50 p-8'>
        <div className='mx-auto max-w-4xl'>
          <h1 className='mb-8 text-3xl font-bold text-red-600'>Debug Error</h1>
          <div className='rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>
            {data.error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='mx-auto max-w-4xl'>
        <div className='mb-8 flex items-center justify-between'>
          <h1 className='text-3xl font-bold'>Purchase Flow Debug</h1>
          <div className='flex gap-4'>
            <button
              onClick={fetchData}
              className='rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600'
            >
              Refresh
            </button>
            <label className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh
            </label>
          </div>
        </div>

        <div className='grid gap-6'>
          {/* Environment Status */}
          <div className='rounded-lg bg-white p-6 shadow'>
            <h2 className='mb-4 text-xl font-semibold'>Environment Status</h2>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                Environment:{' '}
                <span className='font-mono'>{data?.environment?.nodeEnv}</span>
              </div>
              <div>
                Vercel URL:{' '}
                <span className='font-mono text-sm'>
                  {data?.environment?.vercelUrl}
                </span>
              </div>
              <div>
                Stripe Secret:{' '}
                <span
                  className={
                    data?.environment?.hasStripeSecret
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {data?.environment?.hasStripeSecret ? '✅' : '❌'}
                </span>
              </div>
              <div>
                Webhook Secret:{' '}
                <span
                  className={
                    data?.environment?.hasWebhookSecret
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {data?.environment?.hasWebhookSecret ? '✅' : '❌'} (
                  {data?.environment?.webhookSecretLength} chars)
                </span>
              </div>
            </div>
          </div>

          {/* Test User */}
          <div className='rounded-lg bg-white p-6 shadow'>
            <h2 className='mb-4 text-xl font-semibold'>Test User</h2>
            {data?.testUser ? (
              <div className='grid grid-cols-3 gap-4'>
                <div>
                  Email:{' '}
                  <span className='font-mono'>{data.testUser.email}</span>
                </div>
                <div>
                  ID:{' '}
                  <span className='font-mono text-sm'>{data.testUser.id}</span>
                </div>
                <div>
                  Points:{' '}
                  <span className='font-semibold'>{data.testUser.points}</span>
                </div>
              </div>
            ) : (
              <div className='text-red-600'>❌ Test user not found</div>
            )}
          </div>

          {/* Cart Items */}
          <div className='rounded-lg bg-white p-6 shadow'>
            <h2 className='mb-4 text-xl font-semibold'>
              Cart Items ({data?.cartItems?.count || 0})
            </h2>
            {data?.cartItems?.error ? (
              <div className='text-red-600'>Error: {data.cartItems.error}</div>
            ) : data?.cartItems?.count === 0 ? (
              <div className='text-gray-500'>Cart is empty</div>
            ) : (
              <div className='space-y-2'>
                {data?.cartItems?.items.map((item, index) => (
                  <div key={index} className='rounded border p-3'>
                    <div className='font-semibold'>{item.product?.title}</div>
                    <div className='text-sm text-gray-600'>
                      Quantity: {item.quantity} | Price: $
                      {(item.product?.price_cents / 100).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Orders */}
          <div className='rounded-lg bg-white p-6 shadow'>
            <h2 className='mb-4 text-xl font-semibold'>
              Recent Orders ({data?.orders?.count || 0})
            </h2>
            {data?.orders?.error ? (
              <div className='text-red-600'>Error: {data.orders.error}</div>
            ) : data?.orders?.count === 0 ? (
              <div className='text-gray-500'>No orders found</div>
            ) : (
              <div className='space-y-2'>
                {data?.orders?.recent.map((order, index) => (
                  <div key={index} className='rounded border p-3'>
                    <div className='font-semibold'>Order #{order.id}</div>
                    <div className='text-sm text-gray-600'>
                      Total: ${(order.total_cents / 100).toFixed(2)} | Status:{' '}
                      {order.status} | Created:{' '}
                      {new Date(order.created_at).toLocaleString()}
                    </div>
                    <div className='text-xs text-gray-500'>
                      Items: {order.order_items?.length || 0}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Webhook Events */}
          <div className='rounded-lg bg-white p-6 shadow'>
            <h2 className='mb-4 text-xl font-semibold'>
              Recent Webhook Events ({data?.webhookEvents?.count || 0})
            </h2>
            {data?.webhookEvents?.error ? (
              <div className='text-red-600'>
                Error: {data.webhookEvents.error}
              </div>
            ) : data?.webhookEvents?.count === 0 ? (
              <div className='text-red-600'>
                ❌ No webhook events found - This is the problem!
              </div>
            ) : (
              <div className='space-y-2'>
                {data?.webhookEvents?.recent.map((event, index) => (
                  <div key={index} className='rounded border p-3'>
                    <div className='font-semibold'>{event.event_type}</div>
                    <div className='text-sm text-gray-600'>
                      Status: {event.status} | Created:{' '}
                      {new Date(event.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className='mt-8 text-sm text-gray-500'>
          Last updated:{' '}
          {data?.timestamp
            ? new Date(data.timestamp).toLocaleString()
            : 'Unknown'}
        </div>
      </div>
    </div>
  )
}
