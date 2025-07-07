'use client'

import { DollarSign, FileText, Save, Star, Tag, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { ContentWarningBadges } from '@/components/ContentWarnings'
import { ADULT_CATEGORIES, getCategoryLabel } from '@/constants/categories'
import { ContentWarning, getAllContentWarnings } from '@/lib/content-moderation'
import { createClient } from '@/lib/supabase/client'

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
  user_id?: string
  content_warnings?: ContentWarning[]
  tags?: string[]
  is_explicit?: boolean
}

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
  params: { id: string }
}) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [checkingName, setCheckingName] = useState(false)
  const [nameExists, setNameExists] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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

  // Load product data
  useEffect(() => {
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
          .select('*')
          .eq('id', params.id)
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
      } catch (error: any) {
        console.error('Load error:', error)
        toast.error('Failed to load product: ' + error.message)
        router.push('/products')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [params.id, router, supabase])

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
        .neq('id', params.id)
        .limit(1)

      if (error) throw error
      setNameExists(data.length > 0)
    } catch (error) {
      console.error('Name check error:', error)
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
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', params.id)

      if (error) throw error

      toast.success('Product updated successfully!')
      router.push(`/products/${params.id}`)
    } catch (error: any) {
      console.error('Save error:', error)
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
          <div className='text-center'>Loading product...</div>
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
          {/* Media Preview */}
          <div className='rounded-lg bg-white p-6 shadow'>
            <h2 className='mb-4 text-xl font-semibold'>Current Media</h2>
            <div className='aspect-square overflow-hidden rounded-lg bg-gray-100'>
              {product.media_type === 'video' ? (
                <video
                  src={product.media_url || product.image_url}
                  poster={product.thumbnail_url}
                  controls
                  className='h-full w-full object-cover'
                />
              ) : (
                <Image
                  src={product.media_url || product.image_url}
                  alt={product.name}
                  width={400}
                  height={400}
                  className='h-full w-full object-cover'
                />
              )}
            </div>
            <p className='mt-2 text-sm text-gray-600'>
              Media files cannot be changed. To use different media, create a
              new product.
            </p>
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
                  <option key={cat.id} value={cat.id}>
                    {getCategoryLabel(cat.id)}
                  </option>
                ))}
              </select>
            </div>

            {/* Content Warnings */}
            <div className='rounded-lg bg-white p-6 shadow'>
              <h3 className='mb-4 text-lg font-semibold'>Content Warnings</h3>
              <div className='grid grid-cols-2 gap-2'>
                {contentWarnings.map((warning) => (
                  <label key={warning.code} className='flex items-center gap-2'>
                    <input
                      type='checkbox'
                      checked={formData.content_warnings.includes(warning.code)}
                      onChange={() => toggleContentWarning(warning.code)}
                      className='rounded border-gray-300'
                    />
                    <span className='text-sm'>{warning.label}</span>
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
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
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
