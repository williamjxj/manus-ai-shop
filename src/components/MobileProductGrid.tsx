'use client'

import { Eye, EyeOff, Heart, Play, ShoppingCart, Star } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { ContentWarningBadges } from '@/components/ContentWarnings'

interface Product {
  id: string
  name: string
  description: string
  image_url: string
  media_url: string
  media_type: 'image' | 'video'
  price_cents: number
  points_price: number
  category: string
  content_warnings?: string[]
  is_explicit?: boolean
  average_rating?: number
  review_count?: number
}

interface MobileProductGridProps {
  products: Product[]
  onAddToCart: (_productId: string) => void
  onToggleFavorite: (_productId: string) => void
  favorites: Set<string>
  addingToCart: string | null
  formatPrice: (_cents: number) => string
}

export default function MobileProductGrid({
  products,
  onAddToCart,
  onToggleFavorite,
  favorites,
  addingToCart,
  formatPrice,
}: MobileProductGridProps) {
  const [revealedContent, setRevealedContent] = useState<Set<string>>(new Set())

  const handleRevealContent = (productId: string) => {
    setRevealedContent((prev) => new Set([...prev, productId]))
  }

  const isContentRevealed = (productId: string) => {
    return revealedContent.has(productId)
  }

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden'>
      {products.map((product) => (
        <div
          key={product.id}
          className='group relative overflow-hidden rounded-xl bg-white shadow-lg transition-all duration-300 hover:shadow-xl'
        >
          {/* Product Image */}
          <div className='relative aspect-[4/5] overflow-hidden'>
            {/* Content Warning Overlay */}
            {product.is_explicit && !isContentRevealed(product.id) && (
              <div className='absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-75'>
                <div className='p-4 text-center text-white'>
                  <EyeOff className='mx-auto mb-2 h-8 w-8 opacity-75' />
                  <p className='mb-1 font-semibold'>Adult Content</p>
                  <p className='mb-3 text-xs opacity-75'>18+ Only</p>

                  {product.content_warnings &&
                    product.content_warnings.length > 0 && (
                      <div className='mb-3'>
                        <ContentWarningBadges
                          warnings={product.content_warnings as any}
                          className='justify-center text-xs'
                        />
                      </div>
                    )}

                  <button
                    onClick={() => handleRevealContent(product.id)}
                    className='inline-flex items-center gap-1 rounded-lg bg-white bg-opacity-20 px-3 py-1.5 text-sm font-medium transition-all hover:bg-opacity-30'
                  >
                    <Eye className='h-3 w-3' />
                    Reveal
                  </button>
                </div>
              </div>
            )}

            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className='object-cover transition-transform duration-300 group-hover:scale-105'
              sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
            />

            {/* Video Play Button */}
            {product.media_type === 'video' && (
              <div className='absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
                <div className='rounded-full bg-black bg-opacity-60 p-3'>
                  <Play className='h-6 w-6 text-white' />
                </div>
              </div>
            )}

            {/* Favorite Button */}
            <button
              onClick={() => onToggleFavorite(product.id)}
              className='absolute right-3 top-3 rounded-full bg-white bg-opacity-90 p-2 shadow-md transition-all hover:scale-110 hover:bg-opacity-100'
            >
              <Heart
                className={`h-4 w-4 ${
                  favorites.has(product.id)
                    ? 'fill-red-500 text-red-500'
                    : 'text-gray-600'
                }`}
              />
            </button>

            {/* Category Badge */}
            <div className='absolute left-3 top-3'>
              <span className='inline-block rounded-full bg-black bg-opacity-60 px-2 py-1 text-xs font-medium text-white'>
                {product.category.replace('-', ' ')}
              </span>
            </div>

            {/* Rating */}
            {product.average_rating && (
              <div className='absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black bg-opacity-60 px-2 py-1'>
                <Star className='h-3 w-3 fill-yellow-400 text-yellow-400' />
                <span className='text-xs font-medium text-white'>
                  {product.average_rating.toFixed(1)}
                </span>
                {product.review_count && (
                  <span className='text-xs text-gray-300'>
                    ({product.review_count})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className='p-4'>
            <h3 className='mb-1 line-clamp-1 font-semibold text-gray-900'>
              {product.name}
            </h3>
            <p className='mb-3 line-clamp-2 text-sm text-gray-600'>
              {product.description}
            </p>

            {/* Content Warnings */}
            {product.content_warnings &&
              product.content_warnings.length > 0 && (
                <div className='mb-3'>
                  <ContentWarningBadges
                    warnings={product.content_warnings as any}
                    className='text-xs'
                  />
                </div>
              )}

            {/* Price and Actions */}
            <div className='flex items-center justify-between'>
              <div className='flex flex-col'>
                <span className='text-lg font-bold text-gray-900'>
                  {formatPrice(product.price_cents)}
                </span>
                <span className='text-sm text-gray-500'>
                  {product.points_price} points
                </span>
              </div>

              <button
                onClick={() => onAddToCart(product.id)}
                disabled={addingToCart === product.id}
                className='flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50'
              >
                {addingToCart === product.id ? (
                  <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                ) : (
                  <ShoppingCart className='h-4 w-4' />
                )}
                <span className='hidden sm:inline'>Add</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Mobile-optimized filter component
export function MobileFilters({
  filters,
  onFilterChange,
  categories,
  getCategoryLabel,
}: {
  filters: any
  onFilterChange: (_key: string, _value: any) => void
  categories: string[]
  getCategoryLabel: (_category: string) => string
}) {
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className='mb-6 lg:hidden'>
      {/* Filter Toggle Button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className='flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50'
      >
        <span>Filters & Sort</span>
        <svg
          className={`h-5 w-5 transition-transform ${showFilters ? 'rotate-180' : ''}`}
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
      </button>

      {/* Collapsible Filters */}
      {showFilters && (
        <div className='mt-4 space-y-4 rounded-lg border border-gray-200 bg-white p-4'>
          {/* Search */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Search
            </label>
            <input
              type='text'
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              placeholder='Search products...'
              className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
            />
          </div>

          {/* Category */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => onFilterChange('category', e.target.value)}
              className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {getCategoryLabel(category)}
                </option>
              ))}
            </select>
          </div>

          {/* Media Type */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Media Type
            </label>
            <div className='flex gap-2'>
              {['all', 'image', 'video'].map((type) => (
                <button
                  key={type}
                  onClick={() => onFilterChange('mediaType', type)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    filters.mediaType === type
                      ? 'bg-rose-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type === 'all'
                    ? 'All'
                    : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange('sortBy', e.target.value)}
              className='w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
            >
              <option value='newest'>Newest First</option>
              <option value='oldest'>Oldest First</option>
              <option value='price-low'>Price: Low to High</option>
              <option value='price-high'>Price: High to Low</option>
              <option value='name-az'>Name: A to Z</option>
              <option value='name-za'>Name: Z to A</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
