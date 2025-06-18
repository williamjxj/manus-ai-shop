'use client'

import { CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function CheckoutSuccessContent() {
  const [loading, setLoading] = useState(true)
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (sessionId) {
      // In a real app, you might want to verify the session with your backend
      setOrderDetails({ sessionId })
    }
    setLoading(false)
  }, [sessionId])

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 py-12'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='mx-auto h-32 w-32 animate-spin rounded-full border-b-2 border-indigo-600'></div>
            <p className='mt-4 text-gray-600'>Processing your order...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='mx-auto max-w-3xl px-4 sm:px-6 lg:px-8'>
        <div className='text-center'>
          <CheckCircle className='mx-auto mb-4 h-16 w-16 text-green-500' />
          <h1 className='mb-2 text-3xl font-bold text-gray-900'>
            Payment Successful!
          </h1>
          <p className='mb-8 text-lg text-gray-600'>
            Thank you for your purchase. Your order has been processed
            successfully.
          </p>

          {orderDetails && (
            <div className='mb-8 rounded-lg bg-white p-6 shadow-sm'>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>
                Order Details
              </h2>
              <p className='text-sm text-gray-600'>
                Session ID: {orderDetails.sessionId}
              </p>
            </div>
          )}

          <div className='space-y-4 sm:flex sm:justify-center sm:space-x-4 sm:space-y-0'>
            <Link
              href='/products'
              className='flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-700 sm:w-auto'
            >
              Continue Shopping
            </Link>
            <Link
              href='/orders'
              className='flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 sm:w-auto'
            >
              View Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-gray-50 py-12'>
          <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
            <div className='text-center'>
              <div className='mx-auto h-32 w-32 animate-spin rounded-full border-b-2 border-indigo-600'></div>
              <p className='mt-4 text-gray-600'>Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  )
}
