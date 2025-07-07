'use client'

import { User } from '@supabase/supabase-js'
import {
  ChevronDown,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Star,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useCart } from '@/contexts/CartContext'
import { createClient } from '@/lib/supabase/client'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { cartCount } = useCart()

  const getNavLinkClass = (href: string) => {
    const isActive = pathname === href
    const baseClass =
      'flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200'

    if (isActive) {
      return `${baseClass} bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 border border-rose-200 shadow-sm`
    }

    return `${baseClass} text-gray-700 hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 hover:text-rose-600 hover:border hover:border-rose-100`
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (_event: MouseEvent) => {
      if (showUserDropdown) {
        setShowUserDropdown(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showUserDropdown])

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
    <nav className='sticky top-0 z-40 border-b bg-white shadow-sm'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between'>
          {/* Logo */}
          <div className='flex items-center'>
            <Link
              href='/'
              className='bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-lg font-bold text-transparent transition-all duration-200 hover:from-rose-700 hover:to-pink-700 sm:text-xl'
            >
              🔞 Adult Products Gallery
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className='hidden items-center space-x-4 md:flex'>
            {user ? (
              <>
                <Link href='/products' className={getNavLinkClass('/products')}>
                  <Package className='h-4 w-4' />
                  <span>Products</span>
                </Link>
                <Link href='/upload' className={getNavLinkClass('/upload')}>
                  <svg
                    className='h-4 w-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 4v16m8-8H4'
                    />
                  </svg>
                  <span>Create</span>
                </Link>
                <Link href='/media' className={getNavLinkClass('/media')}>
                  <svg
                    className='h-4 w-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z'
                    />
                  </svg>
                  <span>Media</span>
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

                {/* User Dropdown */}
                <div className='relative'>
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className='flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  >
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600'>
                      <span className='text-sm font-medium text-white'>
                        {user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className='hidden md:block'>{user.email}</span>
                    <ChevronDown className='h-4 w-4' />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserDropdown && (
                    <div className='absolute right-0 z-50 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg'>
                      <div className='py-1'>
                        <Link
                          href='/profile'
                          onClick={() => setShowUserDropdown(false)}
                          className='flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                        >
                          <Settings className='h-4 w-4' />
                          Account Settings
                        </Link>
                        <hr className='my-1' />
                        <button
                          onClick={() => {
                            setShowUserDropdown(false)
                            handleSignOut()
                          }}
                          className='flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50'
                        >
                          <LogOut className='h-4 w-4' />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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

          {/* Mobile Menu Button */}
          <div className='flex items-center space-x-2 md:hidden'>
            {user && (
              <Link href='/cart' className='relative p-2'>
                <ShoppingCart className='h-6 w-6 text-gray-700' />
                {cartCount > 0 && (
                  <span className='absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white'>
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className='rounded-md p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            >
              {showMobileMenu ? (
                <X className='h-6 w-6' />
              ) : (
                <svg
                  className='h-6 w-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 6h16M4 12h16M4 18h16'
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className='border-t border-gray-200 bg-white md:hidden'>
            <div className='space-y-1 px-2 pb-3 pt-2'>
              {user ? (
                <>
                  <Link
                    href='/products'
                    onClick={() => setShowMobileMenu(false)}
                    className={`${getNavLinkClass('/products')} block w-full text-left`}
                  >
                    <Package className='mr-2 inline h-4 w-4' />
                    Products
                  </Link>
                  <Link
                    href='/upload'
                    onClick={() => setShowMobileMenu(false)}
                    className={`${getNavLinkClass('/upload')} block w-full text-left`}
                  >
                    <svg
                      className='mr-2 inline h-4 w-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 4v16m8-8H4'
                      />
                    </svg>
                    Create
                  </Link>
                  <Link
                    href='/media'
                    onClick={() => setShowMobileMenu(false)}
                    className={`${getNavLinkClass('/media')} block w-full text-left`}
                  >
                    <svg
                      className='mr-2 inline h-4 w-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z'
                      />
                    </svg>
                    Media
                  </Link>
                  <Link
                    href='/orders'
                    onClick={() => setShowMobileMenu(false)}
                    className={`${getNavLinkClass('/orders')} block w-full text-left`}
                  >
                    <Package className='mr-2 inline h-4 w-4' />
                    Orders
                  </Link>
                  <Link
                    href='/points'
                    onClick={() => setShowMobileMenu(false)}
                    className={`${getNavLinkClass('/points')} block w-full text-left`}
                  >
                    <Star className='mr-2 inline h-4 w-4' />
                    Points
                  </Link>
                  <Link
                    href='/subscriptions'
                    onClick={() => setShowMobileMenu(false)}
                    className={`${getNavLinkClass('/subscriptions')} block w-full text-left`}
                  >
                    <svg
                      className='mr-2 inline h-4 w-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'
                      />
                    </svg>
                    Subscriptions
                  </Link>

                  <hr className='my-2' />

                  <Link
                    href='/profile'
                    onClick={() => setShowMobileMenu(false)}
                    className='flex items-center rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100'
                  >
                    <Settings className='mr-2 h-4 w-4' />
                    Account Settings
                  </Link>
                  <button
                    onClick={() => {
                      setShowMobileMenu(false)
                      handleSignOut()
                    }}
                    className='flex w-full items-center rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50'
                  >
                    <LogOut className='mr-2 h-4 w-4' />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href='/login'
                    onClick={() => setShowMobileMenu(false)}
                    className='block rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  >
                    Sign In
                  </Link>
                  <Link
                    href='/signup'
                    onClick={() => setShowMobileMenu(false)}
                    className='block rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700'
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
