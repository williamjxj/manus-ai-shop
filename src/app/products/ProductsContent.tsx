'use client'

import { Plus, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import { FILTER_CATEGORIES, getCategoryLabel } from '@/constants/categories'
import { useCart } from '@/contexts/CartContext'
import { ContentWarning } from '@/lib/content-moderation'
import { createClient } from '@/lib/supabase/client'

type ViewMode = 'grid' | 'masonry' | 'list'
type SortOption =
  | 'newest'
  | 'oldest'
  | 'price-low'
  | 'price-high'
  | 'name-az'
  | 'name-za'

interface Product {
  id: string
  name: string
  description: string
  image_url: string
  media_url?: string
  media_type?: 'image' | 'video'
  thumbnail_url?: string
  duration_seconds?: number
  price_cents: number
  points_price: number
  category: string
  created_at?: string
  user_id?: string
  content_warnings?: ContentWarning[]
  view_count?: number
  purchase_count?: number
  moderation_status?: string
}

interface FilterState {
  search: string
  category: string
  mediaType: string
  priceRange: [number, number]
  sortBy: SortOption
}

const categories = FILTER_CATEGORIES

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name-az', label: 'Name: A to Z' },
  { value: 'name-za', label: 'Name: Z to A' },
]

export default function ProductsContent() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // New state for enhanced functionality
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'all',
    mediaType: 'all',
    priceRange: [0, 10000], // in cents
    sortBy: 'newest',
  })
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const supabase = createClient()
  const { addToCart: addToCartContext } = useCart()

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        if (
          !product.name.toLowerCase().includes(searchTerm) &&
          !product.description.toLowerCase().includes(searchTerm)
        ) {
          return false
        }
      }

      // Category filter
      if (filters.category !== 'all' && product.category !== filters.category) {
        return false
      }

      // Media type filter
      if (filters.mediaType !== 'all') {
        if (filters.mediaType === 'image' && product.media_type !== 'image') {
          return false
        }
        if (filters.mediaType === 'video' && product.media_type !== 'video') {
          return false
        }
      }

      // Price range filter
      if (
        product.price_cents < filters.priceRange[0] ||
        product.price_cents > filters.priceRange[1]
      ) {
        return false
      }

      return true
    })

    // Sort products
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return (
            new Date(b.created_at || '').getTime() -
            new Date(a.created_at || '').getTime()
          )
        case 'oldest':
          return (
            new Date(a.created_at || '').getTime() -
            new Date(b.created_at || '').getTime()
          )
        case 'price-low':
          return a.price_cents - b.price_cents
        case 'price-high':
          return b.price_cents - a.price_cents
        case 'name-az':
          return a.name.localeCompare(b.name)
        case 'name-za':
          return b.name.localeCompare(a.name)
        default:
          return 0
      }
    })

    return filtered
  }, [products, filters])

  useEffect(() => {
    fetchCurrentUser()
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUser(user)
    } catch (err: any) {
      console.error('Error fetching user:', err)
    }
  }

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

  const deleteProduct = async (productId: string, productName: string) => {
    // Confirm deletion
    if (
      !window.confirm(
        `Are you sure you want to delete "${productName}"? This action cannot be undone.`
      )
    ) {
      return
    }

    setDeletingProduct(productId)
    try {
      // Check if user is authenticated
      if (!currentUser) {
        toast.error('Please login to delete products')
        return
      }

      // Get product details to check ownership and get file paths
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (fetchError) throw fetchError

      // Check if user owns this product (if user_id exists in products table)
      if (product.user_id && product.user_id !== currentUser.id) {
        toast.error('You can only delete your own products')
        return
      }

      // Delete from database first
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (deleteError) throw deleteError

      // Try to delete files from storage (optional - don't fail if this doesn't work)
      try {
        if (product.media_url) {
          const mediaPath = extractStoragePath(product.media_url)
          if (mediaPath) {
            const bucket = product.media_type === 'video' ? 'videos' : 'images'
            await supabase.storage.from(bucket).remove([mediaPath])
          }
        }

        if (product.thumbnail_url) {
          const thumbnailPath = extractStoragePath(product.thumbnail_url)
          if (thumbnailPath) {
            await supabase.storage.from('thumbnails').remove([thumbnailPath])
          }
        }
      } catch (storageError) {
        console.warn('Failed to delete storage files:', storageError)
        // Don't throw error for storage cleanup failures
      }

      // Remove from local state
      setProducts((prev) => prev.filter((p) => p.id !== productId))
      toast.success('Product deleted successfully!')
    } catch (err: any) {
      console.error('Delete error:', err)
      toast.error('Failed to delete product: ' + err.message)
    } finally {
      setDeletingProduct(null)
    }
  }

  // Helper function to extract storage path from URL
  const extractStoragePath = (url: string): string | null => {
    try {
      const urlParts = url.split('/storage/v1/object/public/')
      if (urlParts.length > 1) {
        const pathParts = urlParts[1].split('/')
        if (pathParts.length > 1) {
          return pathParts.slice(1).join('/') // Remove bucket name, keep path
        }
      }
      return null
    } catch {
      return null
    }
  }

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const toggleFavorite = useCallback((productId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId)
      } else {
        newFavorites.add(productId)
      }
      return newFavorites
    })
  }, [])

  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      category: 'all',
      mediaType: 'all',
      priceRange: [0, 10000],
      sortBy: 'newest',
    })
  }, [])

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
        <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
          {/* Header Skeleton */}
          <div className='mb-8 text-center'>
            <div className='mx-auto mb-4 h-12 w-96 animate-pulse rounded-lg bg-gray-200'></div>
            <div className='mx-auto h-6 w-80 animate-pulse rounded-lg bg-gray-200'></div>
          </div>

          {/* Search Bar Skeleton */}
          <div className='mb-8'>
            <div className='mb-4 h-12 w-full animate-pulse rounded-lg bg-gray-200'></div>
            <div className='flex gap-4'>
              <div className='h-10 w-24 animate-pulse rounded-lg bg-gray-200'></div>
              <div className='h-10 w-32 animate-pulse rounded-lg bg-gray-200'></div>
              <div className='h-10 w-28 animate-pulse rounded-lg bg-gray-200'></div>
            </div>
          </div>

          {/* Products Grid Skeleton */}
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className='animate-pulse rounded-lg bg-white p-4 shadow-md'
              >
                <div className='mb-4 h-48 rounded-lg bg-gray-200'></div>
                <div className='mb-2 h-6 w-3/4 rounded bg-gray-200'></div>
                <div className='mb-4 h-4 w-full rounded bg-gray-200'></div>
                <div className='mb-4 h-4 w-1/2 rounded bg-gray-200'></div>
                <div className='h-10 w-full rounded-lg bg-gray-200'></div>
              </div>
            ))}
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
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        {/* Header Section */}
        <div className='mb-8'>
          <div className='mb-8 text-center'>
            <h1 className='bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl'>
              Adult AI Gallery
            </h1>
            <div className='mx-auto mt-3 max-w-6xl'>
              <p className='text-base text-gray-600'>
                Premium AI-generated adult content marketplace for mature
                audiences (+18 only) •
                <span className='inline-flex items-center gap-1 font-medium text-red-600'>
                  <svg
                    className='h-3 w-3'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z'
                    />
                  </svg>
                  18+ ADULT CONTENT - Must be 18 or older to view
                </span>
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className='mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row'>
            <div className='flex items-center gap-4'>
              <Link
                href='/upload'
                className='inline-flex items-center rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-3 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:from-rose-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2'
              >
                <Plus className='mr-2 h-4 w-4' />
                Upload Adult Content
              </Link>

              <div className='rounded-lg bg-white px-3 py-2 text-sm text-gray-600 shadow-sm'>
                {filteredProducts.length}{' '}
                {filteredProducts.length === 1 ? 'item' : 'items'}
              </div>

              {/* Help Button */}
              <button
                onClick={() => setShowHelp(!showHelp)}
                className='rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-600 transition-colors hover:bg-blue-100'
                title='How to delete your uploads'
              >
                <svg
                  className='mr-1 inline h-4 w-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                Help
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className='flex items-center gap-2 rounded-lg bg-white p-1 shadow-sm'>
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-md p-2 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-rose-100 text-rose-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title='Grid View'
              >
                <svg
                  className='h-5 w-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z'
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('masonry')}
                className={`rounded-md p-2 transition-colors ${
                  viewMode === 'masonry'
                    ? 'bg-rose-100 text-rose-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title='Masonry View'
              >
                <svg
                  className='h-5 w-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 11H5m14-7H5m14 14H5'
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-md p-2 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-rose-100 text-rose-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title='List View'
              >
                <svg
                  className='h-5 w-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 6h16M4 10h16M4 14h16M4 18h16'
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Help Panel */}
        {showHelp && (
          <div className='mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6'>
            <div className='mb-4 flex items-start justify-between'>
              <h3 className='text-lg font-semibold text-blue-900'>
                How to Delete Your Uploads
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className='text-blue-600 hover:text-blue-800'
              >
                <svg
                  className='h-5 w-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>
            <div className='space-y-3 text-sm text-blue-800'>
              <div className='flex items-start gap-3'>
                <div className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-semibold text-blue-900'>
                  1
                </div>
                <p>
                  <strong>Find Your Content:</strong> Only products you uploaded
                  will show a red delete button in the top-left corner of the
                  product card.
                </p>
              </div>
              <div className='flex items-start gap-3'>
                <div className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-semibold text-blue-900'>
                  2
                </div>
                <p>
                  <strong>Click Delete:</strong> Click the red trash icon button
                  on your product card.
                </p>
              </div>
              <div className='flex items-start gap-3'>
                <div className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-semibold text-blue-900'>
                  3
                </div>
                <p>
                  <strong>Confirm:</strong> A confirmation dialog will appear.
                  Click "OK" to permanently delete the product and its files.
                </p>
              </div>
              <div className='mt-4 rounded-lg bg-blue-100 p-3'>
                <p className='text-blue-900'>
                  <strong>Note:</strong> You can only delete content that you
                  uploaded. The delete button only appears on your own products
                  when you're logged in.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Section */}
        <div className='mb-8 space-y-4'>
          {/* Search Bar */}
          <div className='relative'>
            <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
              <svg
                className='h-5 w-5 text-gray-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
            </div>
            <input
              type='text'
              placeholder='Search products...'
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className='block w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-3 leading-5 placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500'
            />
          </div>

          {/* Filter Toggle and Quick Filters */}
          <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
            <div className='flex flex-wrap items-center gap-2'>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className='inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
              >
                <svg
                  className='mr-2 h-4 w-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z'
                  />
                </svg>
                Filters
                {(filters.category !== 'all' ||
                  filters.mediaType !== 'all' ||
                  filters.search) && (
                  <span className='ml-2 inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800'>
                    Active
                  </span>
                )}
              </button>

              {/* Quick Category Filters */}
              <div className='flex flex-wrap gap-2'>
                {['all', 'artistic-nude', 'boudoir', 'glamour', 'sensual'].map(
                  (category) => (
                    <button
                      key={category}
                      onClick={() => updateFilter('category', category)}
                      className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                        filters.category === category
                          ? 'border border-rose-200 bg-rose-100 text-rose-800'
                          : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {getCategoryLabel(category)}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Category Filter Dropdown */}
            <div className='relative'>
              <select
                value={filters.category}
                onChange={(e) => updateFilter('category', e.target.value)}
                className='block w-full min-w-[160px] appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-8 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 sm:w-auto'
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {getCategoryLabel(category)}
                  </option>
                ))}
              </select>
              {/* Category Icon */}
              <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                <svg
                  className='h-4 w-4 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
                  />
                </svg>
              </div>
              {/* Dropdown Arrow */}
              <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2'>
                <svg
                  className='h-4 w-4 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className='relative'>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  updateFilter('sortBy', e.target.value as SortOption)
                }
                className='block w-full min-w-[140px] appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-8 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 sm:w-auto'
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {/* Sort Icon */}
              <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                <svg
                  className='h-4 w-4 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12'
                  />
                </svg>
              </div>
              {/* Dropdown Arrow */}
              <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2'>
                <svg
                  className='h-4 w-4 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className='rounded-lg border border-gray-200 bg-white p-6 shadow-sm'>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                {/* Category Filter */}
                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => updateFilter('category', e.target.value)}
                    className='block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500'
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {getCategoryLabel(category)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Media Type Filter */}
                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>
                    Media Type
                  </label>
                  <select
                    value={filters.mediaType}
                    onChange={(e) => updateFilter('mediaType', e.target.value)}
                    className='block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500'
                  >
                    <option value='all'>All Types</option>
                    <option value='image'>Images</option>
                    <option value='video'>Videos</option>
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>
                    Price Range: {formatPrice(filters.priceRange[0])} -{' '}
                    {formatPrice(filters.priceRange[1])}
                  </label>
                  <div className='space-y-2'>
                    <input
                      type='range'
                      min='0'
                      max='10000'
                      step='100'
                      value={filters.priceRange[1]}
                      onChange={(e) =>
                        updateFilter('priceRange', [
                          filters.priceRange[0],
                          parseInt(e.target.value),
                        ])
                      }
                      className='slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200'
                    />
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <div className='mt-4 flex justify-end'>
                <button
                  onClick={clearFilters}
                  className='px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 focus:outline-none'
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Products Grid */}
        <div
          className={` ${viewMode === 'grid' ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : ''} ${viewMode === 'masonry' ? 'columns-1 gap-6 space-y-6 sm:columns-2 lg:columns-3 xl:columns-4' : ''} ${viewMode === 'list' ? 'space-y-4' : ''} `}
        >
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              viewMode={viewMode}
              currentUser={currentUser}
              addingToCart={addingToCart}
              deletingProduct={deletingProduct}
              isFavorite={favorites.has(product.id)}
              onAddToCart={() => addToCart(product.id)}
              onDelete={() => deleteProduct(product.id, product.name)}
              onToggleFavorite={() => toggleFavorite(product.id)}
              formatPrice={formatPrice}
              router={router}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && !loading && (
          <div className='py-16 text-center'>
            <div className='mx-auto mb-4 h-24 w-24 text-gray-400'>
              <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1}
                  d='M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.7-2.6'
                />
              </svg>
            </div>
            <h3 className='mb-2 text-lg font-medium text-gray-900'>
              No products found
            </h3>
            <p className='mb-6 text-gray-500'>
              {filters.search ||
              filters.category !== 'all' ||
              filters.mediaType !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'No products available at the moment.'}
            </p>
            {(filters.search ||
              filters.category !== 'all' ||
              filters.mediaType !== 'all') && (
              <button
                onClick={clearFilters}
                className='inline-flex items-center rounded-md border border-transparent bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Product Card Component
interface ProductCardProps {
  product: Product
  viewMode: ViewMode
  currentUser: any
  addingToCart: string | null
  deletingProduct: string | null
  isFavorite: boolean
  onAddToCart: () => void
  onDelete: () => void
  onToggleFavorite: () => void
  formatPrice: (_cents: number) => string
  router: any
}

function ProductCard({
  product,
  viewMode,
  currentUser,
  addingToCart,
  deletingProduct,
  isFavorite,
  onAddToCart,
  onDelete,
  onToggleFavorite,
  formatPrice,
  router,
}: ProductCardProps) {
  if (viewMode === 'list') {
    return (
      <div className='overflow-hidden rounded-lg bg-white shadow-md transition-all duration-200 hover:shadow-lg'>
        <div className='flex flex-col sm:flex-row'>
          {/* Image Section */}
          <div className='relative h-48 w-full flex-shrink-0 sm:h-32 sm:w-64'>
            {product.media_type === 'video' ? (
              <>
                <Image
                  src={
                    product.thumbnail_url ||
                    product.media_url ||
                    product.image_url ||
                    '/placeholder-video.svg'
                  }
                  alt={product.name}
                  fill
                  className='object-cover'
                />
                <div className='absolute inset-0 flex items-center justify-center'>
                  <div className='rounded-full bg-black bg-opacity-50 p-2'>
                    <svg
                      className='h-6 w-6 text-white'
                      fill='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path d='M8 5v14l11-7z' />
                    </svg>
                  </div>
                </div>
                {product.duration_seconds && (
                  <div className='absolute bottom-2 right-2 rounded bg-black bg-opacity-75 px-2 py-1 text-xs text-white'>
                    {Math.floor(product.duration_seconds / 60)}:
                    {String(Math.floor(product.duration_seconds % 60)).padStart(
                      2,
                      '0'
                    )}
                  </div>
                )}
              </>
            ) : (
              <Image
                src={
                  product.media_url ||
                  product.image_url ||
                  '/placeholder-image.svg'
                }
                alt={product.name}
                fill
                className='object-cover'
              />
            )}

            {/* Action Buttons */}
            <div className='absolute left-2 top-2 flex gap-2'>
              {currentUser && product.user_id === currentUser.id && (
                <>
                  <button
                    onClick={() => router.push(`/products/${product.id}/edit`)}
                    className='rounded-full bg-blue-500 p-1.5 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    title='Edit product'
                  >
                    <svg
                      className='h-3 w-3'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                      />
                    </svg>
                  </button>
                  <button
                    onClick={onDelete}
                    disabled={deletingProduct === product.id}
                    className='rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                    title='Delete product'
                  >
                    {deletingProduct === product.id ? (
                      <div className='h-3 w-3 animate-spin rounded-full border-b-2 border-white'></div>
                    ) : (
                      <svg
                        className='h-3 w-3'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                        />
                      </svg>
                    )}
                  </button>
                </>
              )}
            </div>

            <div className='absolute right-2 top-2 flex flex-col gap-1'>
              <span className='inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium capitalize text-indigo-800'>
                {product.category}
              </span>
              {product.media_type && (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    product.media_type === 'video'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {product.media_type}
                </span>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className='flex flex-1 flex-col justify-between p-4'>
            <div>
              <div className='mb-2 flex items-start justify-between'>
                <h3 className='line-clamp-1 text-lg font-semibold text-gray-900'>
                  {product.name}
                </h3>
                <button
                  onClick={onToggleFavorite}
                  className={`rounded-full p-1 transition-colors ${
                    isFavorite
                      ? 'text-red-500 hover:text-red-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <svg
                    className='h-5 w-5'
                    fill={isFavorite ? 'currentColor' : 'none'}
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
                    />
                  </svg>
                </button>
              </div>
              <p className='mb-3 line-clamp-2 text-sm text-gray-600'>
                {product.description}
              </p>
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex flex-col'>
                <span className='text-lg font-bold text-gray-900'>
                  {formatPrice(product.price_cents)}
                </span>
                <span className='text-sm text-indigo-600'>
                  or {product.points_price} points
                </span>
              </div>
              <button
                onClick={onAddToCart}
                disabled={addingToCart === product.id}
                className='flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
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
        </div>
      </div>
    )
  }

  // Grid and Masonry view (similar layout)
  return (
    <div
      className={`group overflow-hidden rounded-lg bg-white shadow-md transition-all duration-300 hover:shadow-xl ${
        viewMode === 'masonry' ? 'mb-6 break-inside-avoid' : ''
      }`}
    >
      <div className='relative'>
        {/* Image */}
        <div
          className={`relative ${viewMode === 'masonry' ? 'aspect-auto' : 'h-64'} overflow-hidden`}
        >
          {product.media_type === 'video' ? (
            <>
              <Image
                src={
                  product.thumbnail_url ||
                  product.media_url ||
                  product.image_url ||
                  '/placeholder-video.svg'
                }
                alt={product.name}
                fill
                className='object-cover transition-transform duration-300 group-hover:scale-105'
              />
              <div className='absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
                <div className='rounded-full bg-black bg-opacity-60 p-4'>
                  <svg
                    className='h-8 w-8 text-white'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M8 5v14l11-7z' />
                  </svg>
                </div>
              </div>
              {product.duration_seconds && (
                <div className='absolute bottom-2 right-2 rounded bg-black bg-opacity-75 px-2 py-1 text-xs text-white'>
                  {Math.floor(product.duration_seconds / 60)}:
                  {String(Math.floor(product.duration_seconds % 60)).padStart(
                    2,
                    '0'
                  )}
                </div>
              )}
            </>
          ) : (
            <Image
              src={
                product.media_url ||
                product.image_url ||
                '/placeholder-image.svg'
              }
              alt={product.name}
              fill
              className='object-cover transition-transform duration-300 group-hover:scale-105'
            />
          )}

          {/* Overlay Actions */}
          <div className='absolute inset-0 bg-black bg-opacity-0 transition-all duration-200 group-hover:bg-opacity-20'>
            {/* Top Actions */}
            <div className='absolute left-3 top-3 flex gap-2'>
              {currentUser && product.user_id === currentUser.id && (
                <>
                  <button
                    onClick={() => router.push(`/products/${product.id}/edit`)}
                    className='rounded-full bg-blue-500 p-2 text-white opacity-0 transition-opacity duration-200 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 group-hover:opacity-100'
                    title='Edit product'
                  >
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
                        d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                      />
                    </svg>
                  </button>
                  <button
                    onClick={onDelete}
                    disabled={deletingProduct === product.id}
                    className='rounded-full bg-red-500 p-2 text-white opacity-0 transition-opacity duration-200 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 group-hover:opacity-100'
                    title='Delete product'
                  >
                    {deletingProduct === product.id ? (
                      <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-white'></div>
                    ) : (
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
                          d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                        />
                      </svg>
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Top Right Badges */}
            <div className='absolute right-3 top-3 flex flex-col gap-1'>
              <button
                onClick={onToggleFavorite}
                className={`rounded-full p-2 transition-all duration-200 ${
                  isFavorite
                    ? 'bg-red-500 text-white'
                    : 'bg-white bg-opacity-90 text-gray-600 hover:bg-red-500 hover:text-white'
                } opacity-0 group-hover:opacity-100`}
              >
                <svg
                  className='h-4 w-4'
                  fill={isFavorite ? 'currentColor' : 'none'}
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
                  />
                </svg>
              </button>
            </div>

            {/* Bottom Badges */}
            <div className='absolute bottom-3 left-3 flex gap-2'>
              <span className='inline-flex items-center rounded-full bg-white bg-opacity-90 px-2.5 py-0.5 text-xs font-medium capitalize text-indigo-800 backdrop-blur-sm'>
                {product.category}
              </span>
              {product.media_type && (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize backdrop-blur-sm ${
                    product.media_type === 'video'
                      ? 'bg-purple-500 bg-opacity-90 text-white'
                      : 'bg-green-500 bg-opacity-90 text-white'
                  }`}
                >
                  {product.media_type}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='p-4'>
          <div className='mb-2 flex items-start justify-between'>
            <h3 className='mr-2 line-clamp-2 flex-1 text-lg font-semibold text-gray-900'>
              {product.name}
            </h3>
            <div className='flex items-center gap-1 text-yellow-400'>
              <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 24 24'>
                <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
              </svg>
              <span className='text-sm text-gray-600'>4.8</span>
            </div>
          </div>

          <p className='mb-4 line-clamp-2 text-sm text-gray-600'>
            {product.description}
          </p>

          <div className='mb-4 flex items-center justify-between'>
            <div className='flex flex-col'>
              <span className='text-xl font-bold text-gray-900'>
                {formatPrice(product.price_cents)}
              </span>
              <span className='text-sm text-indigo-600'>
                or {product.points_price} points
              </span>
            </div>
            <div className='flex items-center gap-2 text-sm text-gray-500'>
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
                  d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                />
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                />
              </svg>
              <span>1.2k</span>
            </div>
          </div>

          <button
            onClick={onAddToCart}
            disabled={addingToCart === product.id}
            className='flex w-full items-center justify-center rounded-lg border border-transparent bg-gradient-to-r from-rose-600 to-pink-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:from-rose-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
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
    </div>
  )
}
