'use client'

import { Archive, Edit3, Eye, MoreHorizontal, Star, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import { ContentWarningBadges } from '@/components/ContentWarnings'
import { getCategoryLabel } from '@/constants/categories'
import { getProductImageUrl, IMAGE_SIZES } from '@/lib/image-utils'
import { Product } from '@/lib/product-management'
import { formatPrice } from '@/lib/utils'

type SelectionMode = 'none' | 'single' | 'multiple'

interface ProductGridItemProps {
  product: Product
  selectionMode: SelectionMode
  isSelected: boolean
  onToggleSelection: (productId: string) => void
  onDelete: (productId: string) => void
  deleting: boolean
}

export default function ProductGridItem({
  product,
  selectionMode,
  isSelected,
  onToggleSelection,
  onDelete,
  deleting,
}: ProductGridItemProps) {
  const [showActions, setShowActions] = useState(false)

  const primaryMedia =
    product.media?.find((m) => m.is_primary) || product.media?.[0]
  const imageUrl = getProductImageUrl(product)
  const isVideo = primaryMedia?.media_type === 'video'

  return (
    <div
      className={`group relative overflow-hidden rounded-lg bg-white shadow-sm transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      {/* Selection Checkbox */}
      {selectionMode !== 'none' && (
        <div className='absolute left-3 top-3 z-10'>
          <input
            type='checkbox'
            checked={isSelected}
            onChange={() => onToggleSelection(product.id)}
            className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
          />
        </div>
      )}

      {/* Status Badges */}
      <div className='absolute right-3 top-3 z-10 flex flex-col gap-1'>
        {product.featured && (
          <span className='inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800'>
            <Star className='mr-1 h-3 w-3' />
            Featured
          </span>
        )}
        {product.is_archived && (
          <span className='inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800'>
            <Archive className='mr-1 h-3 w-3' />
            Archived
          </span>
        )}
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            product.moderation_status === 'approved'
              ? 'bg-green-100 text-green-800'
              : product.moderation_status === 'rejected'
                ? 'bg-red-100 text-red-800'
                : product.moderation_status === 'flagged'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {product.moderation_status}
        </span>
      </div>

      {/* Product Image */}
      <div className='relative aspect-square overflow-hidden'>
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className='object-cover transition-transform duration-200 group-hover:scale-105'
          sizes={IMAGE_SIZES.CARD}
        />

        {/* Video Indicator */}
        {isVideo && (
          <div className='absolute bottom-2 left-2 rounded bg-black bg-opacity-75 px-2 py-1 text-xs text-white'>
            Video
          </div>
        )}

        {/* Quick Actions Overlay */}
        <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 transition-all duration-200 group-hover:bg-opacity-50'>
          <div className='flex gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
            <Link
              href={`/products/${product.id}`}
              className='rounded-full bg-white p-2 text-gray-900 shadow-lg transition-transform hover:scale-110'
              title='View Product'
            >
              <Eye className='h-4 w-4' />
            </Link>
            <Link
              href={`/products/${product.id}/edit`}
              className='rounded-full bg-white p-2 text-gray-900 shadow-lg transition-transform hover:scale-110'
              title='Edit Product'
            >
              <Edit3 className='h-4 w-4' />
            </Link>
            <button
              onClick={() => onDelete(product.id)}
              disabled={deleting}
              className='rounded-full bg-red-500 p-2 text-white shadow-lg transition-transform hover:scale-110 disabled:opacity-50'
              title='Delete Product'
            >
              <Trash2 className='h-4 w-4' />
            </button>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className='p-4'>
        {/* Category */}
        <div className='mb-2 flex items-center justify-between'>
          <span className='text-xs font-medium uppercase tracking-wide text-gray-500'>
            {getCategoryLabel(product.category)}
          </span>
          <div className='relative'>
            <button
              onClick={() => setShowActions(!showActions)}
              className='rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            >
              <MoreHorizontal className='h-4 w-4' />
            </button>

            {/* Actions Dropdown */}
            {showActions && (
              <div className='absolute right-0 top-full z-20 mt-1 w-48 rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5'>
                <Link
                  href={`/products/${product.id}/edit`}
                  className='flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                >
                  <Edit3 className='h-4 w-4' />
                  Edit Product
                </Link>
                <button
                  onClick={() => onDelete(product.id)}
                  className='flex w-full items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50'
                >
                  <Trash2 className='h-4 w-4' />
                  Delete Product
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Product Name */}
        <h3 className='mb-2 line-clamp-2 font-semibold text-gray-900'>
          {product.name}
        </h3>

        {/* Content Warnings */}
        {product.content_warnings && product.content_warnings.length > 0 && (
          <div className='mb-3'>
            <ContentWarningBadges
              warnings={product.content_warnings}
              className='justify-start'
            />
          </div>
        )}

        {/* Pricing */}
        <div className='mb-3 flex items-center justify-between'>
          <div className='flex flex-col'>
            <span className='text-lg font-bold text-green-600'>
              {formatPrice(product.price_cents)}
            </span>
            <span className='text-sm text-gray-500'>
              {product.points_price} points
            </span>
          </div>
          {product.stock_quantity !== undefined && (
            <div className='text-right'>
              <span className='text-sm text-gray-500'>Stock:</span>
              <span
                className={`ml-1 text-sm font-medium ${
                  product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {product.stock_quantity}
              </span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className='flex items-center justify-between text-xs text-gray-500'>
          <div className='flex items-center gap-3'>
            <span>{product.view_count || 0} views</span>
            <span>{product.purchase_count || 0} sales</span>
          </div>
          {product.average_rating > 0 && (
            <div className='flex items-center gap-1'>
              <Star className='h-3 w-3 fill-yellow-400 text-yellow-400' />
              <span>{product.average_rating.toFixed(1)}</span>
              <span>({product.total_reviews})</span>
            </div>
          )}
        </div>

        {/* Media Count */}
        {product.media && product.media.length > 1 && (
          <div className='mt-2 text-xs text-gray-500'>
            {product.media.length} media files
          </div>
        )}
      </div>
    </div>
  )
}
