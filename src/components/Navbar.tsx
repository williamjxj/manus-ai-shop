'use client'

import { User } from '@supabase/supabase-js'
import { Package, ShoppingCart, Star } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useCart } from '@/contexts/CartContext'
import { createClient } from '@/lib/supabase/client'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { cartCount } = useCart()

  const getNavLinkClass = (href: string) => {
    const isActive = pathname === href
    const baseClass =
      'flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200'

    if (isActive) {
      return `${baseClass} bg-indigo-100 text-indigo-700 shadow-sm`
    }

    return `${baseClass} text-gray-700 hover:bg-gray-100 hover:text-gray-900`
  }

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <nav className='border-b bg-white shadow-sm'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='flex h-16 justify-between'>
            <div className='flex items-center'>
              <span className='text-xl font-bold text-gray-900'>
                🛒 AI Shop
              </span>
            </div>
            <div className='flex items-center space-x-4'>
              <div className='h-8 w-20 animate-pulse rounded bg-gray-200'></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className='border-b bg-white shadow-sm'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 justify-between'>
          <div className='flex items-center'>
            <Link href='/' className='text-xl font-bold text-gray-900'>
              🛒 AI Shop
            </Link>
          </div>
          <div className='flex items-center space-x-4'>
            {user ? (
              <>
                <Link href='/products' className={getNavLinkClass('/products')}>
                  <Package className='h-4 w-4' />
                  <span>Products</span>
                </Link>
                <Link href='/cart' className={getNavLinkClass('/cart')}>
                  <div className='relative'>
                    <ShoppingCart className='h-4 w-4' />
                    {cartCount > 0 && (
                      <span className='absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white'>
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </div>
                  <span>Cart</span>
                </Link>
                <Link href='/orders' className={getNavLinkClass('/orders')}>
                  <Package className='h-4 w-4' />
                  <span>Orders</span>
                </Link>
                <Link href='/points' className={getNavLinkClass('/points')}>
                  <Star className='h-4 w-4' />
                  <span>Points</span>
                </Link>
                <span className='text-sm text-gray-600'>{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className='rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700'
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href='/login'
                  className='rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900'
                >
                  Sign In
                </Link>
                <Link
                  href='/signup'
                  className='rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700'
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
