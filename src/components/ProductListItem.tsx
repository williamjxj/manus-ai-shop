'use client'

import { Archive, Edit3, Eye, MoreHorizontal, Star, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import { ContentWarningBadges } from '@/components/ContentWarnings'
import { getCategoryLabel } from '@/constants/categories'
import { Product } from '@/lib/product-management'
import { formatPrice } from '@/lib/utils'

type SelectionMode = 'none' | 'single' | 'multiple'

interface ProductListItemProps {
  product: Product
  selectionMode: SelectionMode
  isSelected: boolean
  onToggleSelection: (productId: string) => void
  onDelete: (productId: string) => void
  deleting: boolean
}

export default function ProductListItem({
  product,
  selectionMode,
  isSelected,
  onToggleSelection,
  onDelete,
  deleting,
}: ProductListItemProps) {
  const [showActions, setShowActions] = useState(false)

  const primaryMedia =
    product.media?.find((m) => m.is_primary) || product.media?.[0]
  const imageUrl = getProductImageUrl(product)
  const isVideo = primaryMedia?.media_type === 'video'

  return (
    <div
      className={`group flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      {/* Selection Checkbox */}
      {selectionMode !== 'none' && (
        <div className='flex-shrink-0'>
          <input
            type='checkbox'
            checked={isSelected}
            onChange={() => onToggleSelection(product.id)}
            className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
          />
        </div>
      )}

      {/* Product Image */}
      <div className='relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg'>
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className='object-cover'
        />
        {isVideo && (
          <div className='absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 px-1 py-0.5 text-center text-xs text-white'>
            Video
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className='min-w-0 flex-1'>
        <div className='flex items-start justify-between'>
          <div className='min-w-0 flex-1'>
            {/* Category and Status */}
            <div className='mb-1 flex items-center gap-2'>
              <span className='text-xs font-medium uppercase tracking-wide text-gray-500'>
                {getCategoryLabel(product.category)}
              </span>

              {/* Status Badges */}
              <div className='flex gap-1'>
                {product.featured && (
                  <span className='inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800'>
                    <Star className='mr-1 h-2.5 w-2.5' />
                    Featured
                  </span>
                )}
                {product.is_archived && (
                  <span className='inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800'>
                    <Archive className='mr-1 h-2.5 w-2.5' />
                    Archived
                  </span>
                )}
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
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
            </div>

            {/* Product Name */}
            <h3 className='mb-1 truncate font-semibold text-gray-900'>
              {product.name}
            </h3>

            {/* Description */}
            {product.description && (
              <p className='mb-2 line-clamp-2 text-sm text-gray-600'>
                {product.description}
              </p>
            )}

            {/* Content Warnings */}
            {product.content_warnings &&
              product.content_warnings.length > 0 && (
                <div className='mb-2'>
                  <ContentWarningBadges
                    warnings={product.content_warnings}
                    className='justify-start'
                    compact
                  />
                </div>
              )}
          </div>

          {/* Pricing */}
          <div className='ml-4 flex flex-col items-end text-right'>
            <span className='text-lg font-bold text-green-600'>
              {formatPrice(product.price_cents)}
            </span>
            <span className='text-sm text-gray-500'>
              {product.points_price} points
            </span>
          </div>
        </div>

        {/* Bottom Row - Stats and Actions */}
        <div className='mt-3 flex items-center justify-between'>
          <div className='flex items-center gap-4 text-xs text-gray-500'>
            <span>{product.view_count || 0} views</span>
            <span>{product.purchase_count || 0} sales</span>
            {product.stock_quantity !== undefined && (
              <span
                className={`${
                  product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                Stock: {product.stock_quantity}
              </span>
            )}
            {product.average_rating > 0 && (
              <div className='flex items-center gap-1'>
                <Star className='h-3 w-3 fill-yellow-400 text-yellow-400' />
                <span>{product.average_rating.toFixed(1)}</span>
                <span>({product.total_reviews})</span>
              </div>
            )}
            {product.media && product.media.length > 1 && (
              <span>{product.media.length} media files</span>
            )}
          </div>

          {/* Actions */}
          <div className='flex items-center gap-2'>
            <Link
              href={`/products/${product.id}`}
              className='rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              title='View Product'
            >
              <Eye className='h-4 w-4' />
            </Link>
            <Link
              href={`/products/${product.id}/edit`}
              className='rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              title='Edit Product'
            >
              <Edit3 className='h-4 w-4' />
            </Link>
            <button
              onClick={() => onDelete(product.id)}
              disabled={deleting}
              className='rounded-full p-2 text-gray-400 hover:bg-red-100 hover:text-red-600 disabled:opacity-50'
              title='Delete Product'
            >
              <Trash2 className='h-4 w-4' />
            </button>

            <div className='relative'>
              <button
                onClick={() => setShowActions(!showActions)}
                className='rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              >
                <MoreHorizontal className='h-4 w-4' />
              </button>

              {/* Actions Dropdown */}
              {showActions && (
                <div className='absolute right-0 top-full z-20 mt-1 w-48 rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5'>
                  <Link
                    href={`/products/${product.id}`}
                    className='flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                  >
                    <Eye className='h-4 w-4' />
                    View Product
                  </Link>
                  <Link
                    href={`/products/${product.id}/edit`}
                    className='flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                  >
                    <Edit3 className='h-4 w-4' />
                    Edit Product
                  </Link>
                  <hr className='my-1' />
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
        </div>
      </div>
    </div>
  )
}
