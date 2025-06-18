'use client'

import { ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { useCart } from '@/contexts/CartContext'
import { createClient } from '@/lib/supabase/client'

interface Product {
  id: string
  name: string
  description: string
  image_url: string
  price_cents: number
  points_price: number
  category: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const supabase = createClient()
  const { addToCart: addToCartContext } = useCart()

  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (productId: string) => {
    setAddingToCart(productId)
    try {
      await addToCartContext(productId)
      toast.success('Added to cart!')
    } catch (err: any) {
      toast.error('Error adding to cart: ' + err.message)
    } finally {
      setAddingToCart(null)
    }
  }

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 py-12'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='mx-auto h-32 w-32 animate-spin rounded-full border-b-2 border-indigo-600'></div>
            <p className='mt-4 text-gray-600'>Loading products...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 py-12'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <p className='text-red-600'>Error loading products: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-12 text-center'>
          <h1 className='text-4xl font-bold text-gray-900 sm:text-5xl'>
            AI Generated Art Collection
          </h1>
          <p className='mt-4 text-xl text-gray-600'>
            Discover unique AI-generated images for your projects
          </p>
        </div>

        <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3'>
          {products.map((product) => (
            <div
              key={product.id}
              className='overflow-hidden rounded-lg bg-white shadow-md transition-shadow hover:shadow-lg'
            >
              <div className='relative h-64'>
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className='object-cover'
                />
                <div className='absolute right-2 top-2'>
                  <span className='inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium capitalize text-indigo-800'>
                    {product.category}
                  </span>
                </div>
              </div>

              <div className='p-6'>
                <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                  {product.name}
                </h3>
                <p className='mb-4 text-sm text-gray-600'>
                  {product.description}
                </p>

                <div className='mb-4 flex items-center justify-between'>
                  <div className='flex flex-col'>
                    <span className='text-lg font-bold text-gray-900'>
                      {formatPrice(product.price_cents)}
                    </span>
                    <span className='text-sm text-indigo-600'>
                      or {product.points_price} points
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => addToCart(product.id)}
                  disabled={addingToCart === product.id}
                  className='flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  {addingToCart === product.id ? (
                    <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-white'></div>
                  ) : (
                    <>
                      <ShoppingCart className='mr-2 h-4 w-4' />
                      Add to Cart
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className='py-12 text-center'>
            <p className='text-lg text-gray-500'>
              No products available at the moment.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
