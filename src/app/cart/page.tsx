'use client'

import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { useCart } from '@/contexts/CartContext'
import { getProductImageUrl, IMAGE_SIZES } from '@/lib/image-utils'

export default function CartPage() {
  const [updating, setUpdating] = useState<string | null>(null)
  const { cartItems, loading, updateQuantity, removeFromCart } = useCart()

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    setUpdating(itemId)
    try {
      await updateQuantity(itemId, newQuantity)
    } catch (err: any) {
      toast.error('Error updating quantity: ' + err.message)
    } finally {
      setUpdating(null)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    setUpdating(itemId)
    try {
      await removeFromCart(itemId)
    } catch (err: any) {
      toast.error('Error removing item: ' + err.message)
    } finally {
      setUpdating(null)
    }
  }

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
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

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 py-12'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='mx-auto h-32 w-32 animate-spin rounded-full border-b-2 border-rose-600'></div>
            <p className='mt-4 text-gray-600'>Loading cart...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-12 text-center'>
          <h1 className='bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl'>
            Shopping Cart
          </h1>
          <p className='mt-4 text-xl text-gray-600'>
            Review your selected items
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className='py-12 text-center'>
            <ShoppingBag className='mx-auto mb-4 h-24 w-24 text-gray-400' />
            <h3 className='mb-2 text-lg font-medium text-gray-700'>
              Your cart is empty
            </h3>
            <p className='mb-6 text-gray-500'>
              Start shopping to add items to your cart
            </p>
            <Link
              href='/products'
              className='inline-flex items-center rounded-md border border-transparent bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-3 text-base font-medium text-white hover:from-rose-700 hover:to-pink-700'
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className='lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16'>
            <div className='lg:col-span-7'>
              <div className='space-y-6'>
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className='rounded-lg bg-white p-6 shadow-sm'
                  >
                    <div className='flex items-center space-x-4'>
                      <div className='relative h-24 w-24 flex-shrink-0'>
                        <Image
                          src={getProductImageUrl(item.product)}
                          alt={item.product.name}
                          fill
                          className='rounded-md object-cover'
                          sizes={IMAGE_SIZES.THUMBNAIL}
                        />
                      </div>

                      <div className='min-w-0 flex-1'>
                        <h3 className='text-lg font-medium text-gray-800'>
                          {item.product.name}
                        </h3>
                        <p className='mt-1 text-sm text-gray-500'>
                          {item.product.description}
                        </p>
                        <div className='mt-2'>
                          <span className='text-lg font-semibold text-gray-800'>
                            {formatPrice(item.product.price_cents)}
                          </span>
                          <span className='ml-2 text-sm text-rose-600'>
                            or {item.product.points_price} points
                          </span>
                        </div>
                      </div>

                      <div className='flex items-center space-x-2'>
                        <button
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={updating === item.id || item.quantity <= 1}
                          className='rounded-md border border-gray-300 p-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
                        >
                          <Minus className='h-4 w-4' />
                        </button>

                        <span className='w-12 text-center font-medium'>
                          {item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity + 1)
                          }
                          disabled={updating === item.id}
                          className='rounded-md border border-gray-300 p-1 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
                        >
                          <Plus className='h-4 w-4' />
                        </button>

                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={updating === item.id}
                          className='p-2 text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50'
                        >
                          <Trash2 className='h-4 w-4' />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='mt-16 lg:col-span-5 lg:mt-0'>
              <div className='sticky top-6 rounded-lg bg-white p-6 shadow-sm'>
                <h2 className='mb-4 text-lg font-medium text-gray-800'>
                  Order Summary
                </h2>

                <div className='space-y-3'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>
                      Items ({cartItems.length})
                    </span>
                    <span className='font-medium'>
                      {formatPrice(getTotalPrice())}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Points equivalent</span>
                    <span className='font-medium text-rose-600'>
                      {getTotalPoints()} points
                    </span>
                  </div>
                  <div className='border-t pt-3'>
                    <div className='flex justify-between text-lg font-semibold'>
                      <span>Total</span>
                      <span>{formatPrice(getTotalPrice())}</span>
                    </div>
                  </div>
                </div>

                <div className='mt-6 space-y-3'>
                  <Link
                    href='/checkout'
                    className='flex w-full items-center justify-center rounded-md border border-transparent bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-3 text-base font-medium text-white hover:from-rose-700 hover:to-pink-700'
                  >
                    Proceed to Checkout
                  </Link>
                  <Link
                    href='/products'
                    className='flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50'
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
