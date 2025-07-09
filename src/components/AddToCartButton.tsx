'use client'

import { ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { useCart } from '@/contexts/CartContext'

interface AddToCartButtonProps {
  productId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary'
}

export default function AddToCartButton({
  productId,
  className = '',
  size = 'lg',
  variant = 'primary',
}: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { addToCart } = useCart()

  const handleAddToCart = async () => {
    setIsLoading(true)
    try {
      await addToCart(productId)
      toast.success('Added to cart!')
    } catch (error: any) {
      toast.error('Error adding to cart: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg',
  }

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white',
    secondary: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700',
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={isLoading}
      className={`group w-full rounded-xl font-semibold shadow-lg transition-all hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75 ${sizeClasses[size]} ${variantClasses[variant]} ${className} `}
    >
      <span className='flex items-center justify-center gap-2'>
        {isLoading ? (
          <>
            <div className='h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent' />
            Adding to Cart...
          </>
        ) : (
          <>
            Add to Cart
            <ShoppingCart className='h-5 w-5 transition-transform group-hover:translate-x-1' />
          </>
        )}
      </span>
    </button>
  )
}
