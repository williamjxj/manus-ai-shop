'use client'

import { DollarSign, FileText, Save, Star, Tag, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { ContentWarningBadges } from '@/components/ContentWarnings'
import ProductMediaManager from '@/components/ProductMediaManager'
import { ADULT_CATEGORIES, getCategoryLabel } from '@/constants/categories'
import { useProductMedia } from '@/hooks/useProductMedia'
import { ContentWarning, getAllContentWarnings } from '@/lib/content-moderation'
import { Product } from '@/lib/product-management'
import { createClient } from '@/lib/supabase/client'

interface EditFormData {
  name: string
  description: string
  price_cents: number
  points_price: number
  category: string
  content_warnings: ContentWarning[]
  tags: string[]
  is_explicit: boolean
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [checkingName, setCheckingName] = useState(false)
  const [nameExists, setNameExists] = useState(false)
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(
    null
  )
  const router = useRouter()
  const supabase = createClient()

  // Media management
  const {
    media,
    isLoading: isLoadingMedia,
    isUploading,
    uploadMedia,
    deleteMedia,
    reorderMedia,
    setPrimaryMedia,
    refreshMedia,
  } = useProductMedia({
    productId: resolvedParams?.id || '',
    initialMedia: product?.media || [],
  })

  const [formData, setFormData] = useState<EditFormData>({
    name: '',
    description: '',
    price_cents: 999,
    points_price: 50,
    category: 'adult-toys',
    content_warnings: ['sexual-content'],
    tags: [],
    is_explicit: true,
  })

  const [newTag, setNewTag] = useState('')
  const categories = ADULT_CATEGORIES
  const contentWarnings = getAllContentWarnings()

  // Resolve params
  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params
      setResolvedParams(resolved)
    }
    resolveParams()
  }, [params])

  // Load product data
  useEffect(() => {
    if (!resolvedParams) return
    const loadProduct = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          toast.error('Please login to edit products')
          router.push('/login')
          return
        }

        const { data: productData, error } = await supabase
          .from('products')
          .select(
            `
            *,
            media:product_media(*)
          `
          )
          .eq('id', resolvedParams.id)
          .single()

        if (error) throw error

        // Check if user owns this product
        if (productData.user_id && productData.user_id !== user.id) {
          toast.error('You can only edit your own products')
          router.push('/products')
          return
        }

        setProduct(productData)
        setFormData({
          name: productData.name || '',
          description: productData.description || '',
          price_cents: productData.price_cents || 999,
          points_price: productData.points_price || 50,
          category: productData.category || 'adult-toys',
          content_warnings: productData.content_warnings || ['sexual-content'],
          tags: productData.tags || [],
          is_explicit: productData.is_explicit ?? true,
        })

        // Load media after product is loaded
        refreshMedia()
      } catch (error: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Load error:', error)
        }
        toast.error('Failed to load product: ' + error.message)
        router.push('/products')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [resolvedParams, router, supabase])

  // Check if name exists (excluding current product)
  const checkNameExists = async (name: string) => {
    if (!name.trim() || name === product?.name) {
      setNameExists(false)
      return
    }

    setCheckingName(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .eq('name', name.trim())
        .neq('id', resolvedParams?.id)
        .limit(1)

      if (error) throw error
      setNameExists(data.length > 0)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Name check error:', error)
      }
    } finally {
      setCheckingName(false)
    }
  }

  const handleSave = async () => {
    if (!product) return

    // Validation
    if (!formData.name.trim()) {
      toast.error('Product name is required')
      return
    }

    if (nameExists) {
      toast.error('A product with this name already exists')
      return
    }

    if (formData.price_cents < 99) {
      toast.error('Minimum price is $0.99')
      return
    }

    if (formData.points_price < 1) {
      toast.error('Minimum points price is 1')
      return
    }

    setSaving(true)
    try {
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price_cents: formData.price_cents,
        points_price: formData.points_price,
        category: formData.category,
        content_warnings: formData.content_warnings,
        tags: formData.tags,
        is_explicit: formData.is_explicit,
        // Note: updated_at will be handled by database trigger once column is added
      }

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', resolvedParams?.id)

      if (error) throw error

      toast.success('Product updated successfully!')
      router.push(`/products/${resolvedParams?.id}`)
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Save error:', error)
      }
      toast.error('Failed to update product: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const toggleContentWarning = (warning: ContentWarning) => {
    setFormData((prev) => ({
      ...prev,
      content_warnings: prev.content_warnings.includes(warning)
        ? prev.content_warnings.filter((w) => w !== warning)
        : [...prev.content_warnings, warning],
    }))
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 p-8'>
        <div className='mx-auto max-w-4xl'>
          {/* Header Skeleton */}
          <div className='mb-8 flex items-center justify-between'>
            <div className='h-9 w-48 animate-pulse rounded bg-gray-200'></div>
            <div className='flex gap-4'>
              <div className='h-10 w-20 animate-pulse rounded bg-gray-200'></div>
              <div className='h-10 w-32 animate-pulse rounded bg-gray-200'></div>
            </div>
          </div>

          {/* Loading Content */}
          <div className='space-y-6'>
            {/* Media Section Skeleton */}
            <div className='rounded-lg bg-white p-6 shadow'>
              <div className='mb-4 h-6 w-32 animate-pulse rounded bg-gray-200'></div>
              <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className='aspect-square animate-pulse rounded-lg bg-gray-200'
                  ></div>
                ))}
              </div>
            </div>

            {/* Form Fields Skeleton */}
            {[...Array(6)].map((_, i) => (
              <div key={i} className='rounded-lg bg-white p-6 shadow'>
                <div className='mb-2 h-5 w-24 animate-pulse rounded bg-gray-200'></div>
                <div className='h-10 w-full animate-pulse rounded bg-gray-200'></div>
              </div>
            ))}
          </div>

          {/* Loading Overlay */}
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm'>
            <div className='rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-md'>
              <div className='flex flex-col items-center space-y-4'>
                {/* Animated Loading Icon */}
                <div className='relative'>
                  <div className='h-16 w-16 animate-spin rounded-full border-4 border-gray-200'></div>
                  <div className='absolute left-0 top-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-r-blue-500 border-t-blue-600'></div>
                  <div className='absolute left-2 top-2 h-12 w-12 animate-pulse rounded-full bg-gradient-to-br from-blue-100 to-blue-200'></div>

                  {/* Center icon */}
                  <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'>
                    <FileText className='h-5 w-5 animate-pulse text-blue-600' />
                  </div>
                </div>

                {/* Loading Text */}
                <div className='text-center'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    Loading Product
                  </h3>
                  <p className='text-sm text-gray-600'>
                    Preparing edit interface...
                  </p>
                </div>

                {/* Progress Dots */}
                <div className='flex space-x-2'>
                  {[0, 150, 300].map((delay, i) => (
                    <div
                      key={i}
                      className='h-2 w-2 animate-bounce rounded-full bg-blue-500'
                      style={{ animationDelay: `${delay}ms` }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className='min-h-screen bg-gray-50 p-8'>
        <div className='mx-auto max-w-4xl'>
          <div className='text-center text-red-600'>Product not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='mx-auto max-w-4xl'>
        <div className='mb-8 flex items-center justify-between'>
          <h1 className='text-3xl font-bold'>Edit Product</h1>
          <div className='flex gap-4'>
            <button
              onClick={() => router.back()}
              className='rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600'
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || nameExists}
              className='flex items-center gap-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50'
            >
              <Save className='h-4 w-4' />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
          {/* Media Management */}
          <div className='rounded-lg bg-white p-6 shadow'>
            <h2 className='mb-4 text-xl font-semibold'>Product Media</h2>
            <ProductMediaManager
              productId={product.id}
              media={media}
              onMediaUpdate={() => refreshMedia()}
              onMediaUpload={uploadMedia}
              onMediaDelete={deleteMedia}
              onMediaReorder={reorderMedia}
              onSetPrimary={setPrimaryMedia}
              isUploading={isUploading}
              isLoading={isLoadingMedia}
              maxFiles={10}
              allowedTypes={['image/*', 'video/*']}
            />
          </div>

          {/* Edit Form */}
          <div className='space-y-6'>
            {/* Product Name */}
            <div className='rounded-lg bg-white p-6 shadow'>
              <label className='mb-2 flex items-center gap-2 text-sm font-medium text-gray-700'>
                <FileText className='h-4 w-4' />
                Product Name
              </label>
              <input
                type='text'
                value={formData.name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                  checkNameExists(e.target.value)
                }}
                className='w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
                placeholder='Enter product name'
                required
              />
              {checkingName && (
                <p className='mt-1 text-sm text-gray-500'>
                  Checking availability...
                </p>
              )}
              {nameExists && (
                <p className='mt-1 text-sm text-red-600'>
                  This name is already taken
                </p>
              )}
            </div>

            {/* Description */}
            <div className='rounded-lg bg-white p-6 shadow'>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={4}
                className='w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
                placeholder='Describe your product...'
              />
            </div>

            {/* Pricing */}
            <div className='rounded-lg bg-white p-6 shadow'>
              <h3 className='mb-4 text-lg font-semibold'>Pricing</h3>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='mb-2 flex items-center gap-2 text-sm font-medium text-gray-700'>
                    <DollarSign className='h-4 w-4' />
                    USD Price
                  </label>
                  <input
                    type='number'
                    min='0.99'
                    step='0.01'
                    value={(formData.price_cents / 100).toFixed(2)}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price_cents: Math.round(
                          parseFloat(e.target.value) * 100
                        ),
                      }))
                    }
                    className='w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
                  />
                </div>
                <div>
                  <label className='mb-2 flex items-center gap-2 text-sm font-medium text-gray-700'>
                    <Star className='h-4 w-4' />
                    Points Price
                  </label>
                  <input
                    type='number'
                    min='1'
                    value={formData.points_price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        points_price: parseInt(e.target.value) || 1,
                      }))
                    }
                    className='w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
                  />
                </div>
              </div>
            </div>

            {/* Category */}
            <div className='rounded-lg bg-white p-6 shadow'>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, category: e.target.value }))
                }
                className='w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {getCategoryLabel(cat)}
                  </option>
                ))}
              </select>
            </div>

            {/* Content Warnings */}
            <div className='rounded-lg bg-white p-6 shadow'>
              <h3 className='mb-4 text-lg font-semibold'>Content Warnings</h3>
              <div className='grid grid-cols-2 gap-2'>
                {contentWarnings.map((warning) => (
                  <label
                    key={warning.warning_code}
                    className='flex items-center gap-2'
                  >
                    <input
                      type='checkbox'
                      checked={formData.content_warnings.includes(
                        warning.warning_code
                      )}
                      onChange={() =>
                        toggleContentWarning(warning.warning_code)
                      }
                      className='rounded border-gray-300'
                    />
                    <span className='text-sm'>{warning.warning_label}</span>
                  </label>
                ))}
              </div>
              <div className='mt-4'>
                <ContentWarningBadges warnings={formData.content_warnings} />
              </div>
            </div>

            {/* Tags */}
            <div className='rounded-lg bg-white p-6 shadow'>
              <label className='mb-2 flex items-center gap-2 text-sm font-medium text-gray-700'>
                <Tag className='h-4 w-4' />
                Tags
              </label>
              <div className='flex gap-2'>
                <input
                  type='text'
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  className='flex-1 rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
                  placeholder='Add a tag...'
                />
                <button
                  type='button'
                  onClick={addTag}
                  className='rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600'
                >
                  Add
                </button>
              </div>
              <div className='mt-3 flex flex-wrap gap-2'>
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className='flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800'
                  >
                    {tag}
                    <button
                      type='button'
                      onClick={() => removeTag(tag)}
                      className='text-blue-600 hover:text-blue-800'
                    >
                      <X className='h-3 w-3' />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Explicit Content Toggle */}
            <div className='rounded-lg bg-white p-6 shadow'>
              <label className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  checked={formData.is_explicit}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_explicit: e.target.checked,
                    }))
                  }
                  className='rounded border-gray-300'
                />
                <span className='text-sm font-medium text-gray-700'>
                  This content is explicit (18+ only)
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
