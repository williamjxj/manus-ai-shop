'use client'

import { AlertTriangle, Check, Eye, Flag, X } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { ContentWarningBadges } from '@/components/ContentWarnings'
import {
  ContentWarning,
  getModerationStatusClasses,
  getModerationStatusText,
  ModerationStatus,
} from '@/lib/content-moderation'
import { createClient } from '@/lib/supabase/client'

interface Product {
  id: string
  name: string
  description: string
  image_url: string
  media_url: string
  media_type: 'image' | 'video'
  category: string
  user_id: string
  moderation_status: ModerationStatus
  content_warnings: ContentWarning[]
  is_explicit: boolean
  age_restriction: number
  created_at: string
  moderated_at?: string
  moderated_by?: string
  moderation_notes?: string
  profiles?: {
    email: string
  }
}

export default function ModerationDashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ModerationStatus | 'all'>('pending')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [moderating, setModerating] = useState(false)
  const [moderationNotes, setModerationNotes] = useState('')

  const supabase = createClient()

  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select(
          `
          *,
          profiles (
            email
          )
        `
        )
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('moderation_status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setProducts(data || [])
    } catch (error: any) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleModeration = async (
    productId: string,
    status: ModerationStatus
  ) => {
    setModerating(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('products')
        .update({
          moderation_status: status,
          moderated_at: new Date().toISOString(),
          moderated_by: user.id,
          moderation_notes: moderationNotes.trim() || null,
        })
        .eq('id', productId)

      if (error) throw error

      toast.success(`Product ${status}`)
      setSelectedProduct(null)
      setModerationNotes('')
      fetchProducts()
    } catch (error: any) {
      toast.error('Failed to update moderation status: ' + error.message)
    } finally {
      setModerating(false)
    }
  }

  const getStatusIcon = (status: ModerationStatus) => {
    switch (status) {
      case 'approved':
        return <Check className='h-4 w-4 text-green-600' />
      case 'rejected':
        return <X className='h-4 w-4 text-red-600' />
      case 'flagged':
        return <Flag className='h-4 w-4 text-orange-600' />
      default:
        return <AlertTriangle className='h-4 w-4 text-yellow-600' />
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 py-12'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='animate-pulse'>
            <div className='mb-6 h-8 rounded bg-gray-200'></div>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className='rounded-lg bg-white p-6'>
                  <div className='mb-4 h-48 rounded bg-gray-200'></div>
                  <div className='mb-2 h-4 rounded bg-gray-200'></div>
                  <div className='h-4 w-2/3 rounded bg-gray-200'></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>
            Content Moderation
          </h1>
          <p className='mt-2 text-gray-600'>
            Review and moderate adult content uploads
          </p>
        </div>

        {/* Filters */}
        <div className='mb-6'>
          <div className='flex space-x-4'>
            {[
              { value: 'all', label: 'All Products' },
              { value: 'pending', label: 'Pending Review' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'flagged', label: 'Flagged' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value as any)}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  filter === value
                    ? 'bg-indigo-600 text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {products.map((product) => (
            <div
              key={product.id}
              className='overflow-hidden rounded-lg bg-white shadow-sm'
            >
              {/* Product Image */}
              <div className='relative h-48'>
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className='object-cover'
                />
                {product.media_type === 'video' && (
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <div className='rounded-full bg-black bg-opacity-50 p-2'>
                      <svg
                        className='h-6 w-6 text-white'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                <div className='absolute right-2 top-2'>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${getModerationStatusClasses(product.moderation_status)}`}
                  >
                    {getStatusIcon(product.moderation_status)}
                    {getModerationStatusText(product.moderation_status)}
                  </span>
                </div>
              </div>

              {/* Product Details */}
              <div className='p-4'>
                <h3 className='mb-2 font-semibold text-gray-900'>
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
                        warnings={product.content_warnings}
                      />
                    </div>
                  )}

                {/* Metadata */}
                <div className='mb-4 space-y-1 text-xs text-gray-500'>
                  <div>Uploaded by: {product.profiles?.email}</div>
                  <div>Category: {product.category}</div>
                  <div>
                    Created: {new Date(product.created_at).toLocaleDateString()}
                  </div>
                  {product.is_explicit && (
                    <div className='font-medium text-red-600'>
                      🔞 Explicit Content
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className='flex space-x-2'>
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className='flex flex-1 items-center justify-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700'
                  >
                    <Eye className='h-4 w-4' />
                    Review
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className='py-12 text-center'>
            <p className='text-gray-500'>
              No products found for the selected filter.
            </p>
          </div>
        )}

        {/* Moderation Modal */}
        {selectedProduct && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
            <div className='max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white'>
              <div className='p-6'>
                <div className='mb-4 flex items-start justify-between'>
                  <h2 className='text-xl font-bold text-gray-900'>
                    Review Product
                  </h2>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className='text-gray-400 hover:text-gray-600'
                  >
                    <X className='h-6 w-6' />
                  </button>
                </div>

                {/* Product Preview */}
                <div className='mb-6'>
                  <div className='relative mb-4 h-64'>
                    <Image
                      src={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      fill
                      className='rounded-lg object-cover'
                    />
                  </div>

                  <h3 className='mb-2 text-lg font-semibold'>
                    {selectedProduct.name}
                  </h3>
                  <p className='mb-4 text-gray-600'>
                    {selectedProduct.description}
                  </p>

                  {selectedProduct.content_warnings &&
                    selectedProduct.content_warnings.length > 0 && (
                      <div className='mb-4'>
                        <h4 className='mb-2 text-sm font-medium text-gray-900'>
                          Content Warnings:
                        </h4>
                        <ContentWarningBadges
                          warnings={selectedProduct.content_warnings}
                        />
                      </div>
                    )}
                </div>

                {/* Moderation Notes */}
                <div className='mb-6'>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>
                    Moderation Notes (Optional)
                  </label>
                  <textarea
                    value={moderationNotes}
                    onChange={(e) => setModerationNotes(e.target.value)}
                    rows={3}
                    className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500'
                    placeholder='Add notes about your moderation decision...'
                  />
                </div>

                {/* Action Buttons */}
                <div className='flex space-x-3'>
                  <button
                    onClick={() =>
                      handleModeration(selectedProduct.id, 'approved')
                    }
                    disabled={moderating}
                    className='flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50'
                  >
                    <Check className='h-4 w-4' />
                    Approve
                  </button>

                  <button
                    onClick={() =>
                      handleModeration(selectedProduct.id, 'flagged')
                    }
                    disabled={moderating}
                    className='flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 disabled:opacity-50'
                  >
                    <Flag className='h-4 w-4' />
                    Flag
                  </button>

                  <button
                    onClick={() =>
                      handleModeration(selectedProduct.id, 'rejected')
                    }
                    disabled={moderating}
                    className='flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50'
                  >
                    <X className='h-4 w-4' />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
