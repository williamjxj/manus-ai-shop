'use client'

import { ArrowRight, Star, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { ContentWarningBadges } from '@/components/ContentWarnings'
import {
  ADULT_CATEGORIES,
  AdultCategory,
  getCategoryDescription,
  getCategoryLabel,
} from '@/constants/categories'
import { Product } from '@/lib/product-management'
import { formatPrice } from '@/lib/utils'

interface CategoryShowcaseProps {
  category: AdultCategory
  products: Product[]
  maxProducts?: number
  showViewAll?: boolean
  compact?: boolean
}

interface CategorySection {
  category: AdultCategory
  products: Product[]
  featured: Product[]
  trending: Product[]
  newArrivals: Product[]
}

export default function CategoryShowcase({
  category,
  products,
  maxProducts = 8,
  showViewAll = true,
  compact = false,
}: CategoryShowcaseProps) {
  const [categoryData, setCategoryData] = useState<CategorySection | null>(null)

  useEffect(() => {
    if (products.length > 0) {
      const categoryProducts = products.filter((p) => p.category === category)

      // Sort and categorize products
      const featured = categoryProducts
        .filter((p) => p.featured)
        .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
        .slice(0, 4)

      const trending = categoryProducts
        .filter((p) => (p.view_count || 0) > 50)
        .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        .slice(0, 4)

      const newArrivals = categoryProducts
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 4)

      setCategoryData({
        category,
        products: categoryProducts.slice(0, maxProducts),
        featured,
        trending,
        newArrivals,
      })
    }
  }, [category, products, maxProducts])

  if (!categoryData || categoryData.products.length === 0) {
    return null
  }

  if (compact) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h3 className='text-lg font-semibold text-gray-900'>
            {getCategoryLabel(category)}
          </h3>
          {showViewAll && (
            <Link
              href={`/products?category=${category}`}
              className='flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700'
            >
              View all
              <ArrowRight className='h-3 w-3' />
            </Link>
          )}
        </div>

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {categoryData.products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} compact />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      {/* Category Header */}
      <div className='text-center'>
        <div className='mb-4 text-4xl'>
          {getCategoryLabel(category).split(' ')[0]}
        </div>
        <h2 className='mb-4 text-3xl font-bold text-gray-900'>
          {getCategoryLabel(category).replace(/^[^\s]+ /, '')}
        </h2>
        <p className='mx-auto max-w-2xl text-lg text-gray-600'>
          {getCategoryDescription(category)}
        </p>
      </div>

      {/* Featured Products */}
      {categoryData.featured.length > 0 && (
        <div className='space-y-6'>
          <div className='flex items-center gap-2'>
            <Star className='h-5 w-5 fill-current text-yellow-500' />
            <h3 className='text-xl font-semibold text-gray-900'>
              Featured Products
            </h3>
          </div>
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            {categoryData.featured.map((product) => (
              <ProductCard key={product.id} product={product} featured />
            ))}
          </div>
        </div>
      )}

      {/* Trending Products */}
      {categoryData.trending.length > 0 && (
        <div className='space-y-6'>
          <div className='flex items-center gap-2'>
            <TrendingUp className='h-5 w-5 text-orange-500' />
            <h3 className='text-xl font-semibold text-gray-900'>
              Trending Now
            </h3>
          </div>
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            {categoryData.trending.map((product) => (
              <ProductCard key={product.id} product={product} trending />
            ))}
          </div>
        </div>
      )}

      {/* New Arrivals */}
      {categoryData.newArrivals.length > 0 && (
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <h3 className='text-xl font-semibold text-gray-900'>
              New Arrivals
            </h3>
            {showViewAll && (
              <Link
                href={`/products?category=${category}&sort=created_at&order=desc`}
                className='flex items-center gap-1 text-blue-600 hover:text-blue-700'
              >
                View all new
                <ArrowRight className='h-4 w-4' />
              </Link>
            )}
          </div>
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            {categoryData.newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* View All Button */}
      {showViewAll && (
        <div className='text-center'>
          <Link
            href={`/products?category=${category}`}
            className='inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700'
          >
            Explore All {getCategoryLabel(category).replace(/^[^\s]+ /, '')}{' '}
            Products
            <ArrowRight className='h-4 w-4' />
          </Link>
        </div>
      )}
    </div>
  )
}

interface ProductCardProps {
  product: Product
  featured?: boolean
  trending?: boolean
  compact?: boolean
}

function ProductCard({
  product,
  featured,
  trending,
  compact,
}: ProductCardProps) {
  const primaryMedia =
    product.media?.find((m) => m.is_primary) || product.media?.[0]
  const imageUrl = getProductImageUrl(product)

  return (
    <Link href={`/products/${product.id}`} className='group block'>
      <div className='overflow-hidden rounded-lg bg-white shadow-sm transition-all duration-200 hover:shadow-md'>
        {/* Product Image */}
        <div className='relative aspect-square overflow-hidden'>
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className='object-cover transition-transform duration-200 group-hover:scale-105'
          />

          {/* Badges */}
          <div className='absolute left-3 top-3 flex flex-col gap-1'>
            {featured && (
              <span className='inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800'>
                <Star className='mr-1 h-3 w-3 fill-current' />
                Featured
              </span>
            )}
            {trending && (
              <span className='inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800'>
                <TrendingUp className='mr-1 h-3 w-3' />
                Trending
              </span>
            )}
          </div>

          {/* Quick Stats */}
          <div className='absolute bottom-3 right-3 rounded bg-black bg-opacity-75 px-2 py-1 text-xs text-white'>
            {product.view_count || 0} views
          </div>
        </div>

        {/* Product Info */}
        <div className={`p-4 ${compact ? 'space-y-2' : 'space-y-3'}`}>
          <h3
            className={`line-clamp-2 font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}
          >
            {product.name}
          </h3>

          {!compact && product.description && (
            <p className='line-clamp-2 text-sm text-gray-600'>
              {product.description}
            </p>
          )}

          {/* Content Warnings */}
          {product.content_warnings && product.content_warnings.length > 0 && (
            <ContentWarningBadges
              warnings={product.content_warnings}
              className='justify-start'
              compact
            />
          )}

          {/* Pricing */}
          <div className='flex items-center justify-between'>
            <div className='flex flex-col'>
              <span
                className={`font-bold text-green-600 ${compact ? 'text-sm' : 'text-lg'}`}
              >
                {formatPrice(product.price_cents)}
              </span>
              {!compact && (
                <span className='text-xs text-gray-500'>
                  {product.points_price} points
                </span>
              )}
            </div>

            {product.average_rating > 0 && (
              <div className='flex items-center gap-1'>
                <Star className='h-3 w-3 fill-yellow-400 text-yellow-400' />
                <span className='text-xs text-gray-600'>
                  {product.average_rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// Component for displaying all categories
export function AllCategoriesShowcase({ products }: { products: Product[] }) {
  return (
    <div className='space-y-16'>
      {ADULT_CATEGORIES.map((category) => {
        const categoryProducts = products.filter((p) => p.category === category)

        if (categoryProducts.length === 0) return null

        return (
          <CategoryShowcase
            key={category}
            category={category}
            products={products}
            maxProducts={8}
            showViewAll
          />
        )
      })}
    </div>
  )
}
