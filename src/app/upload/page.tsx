'use client'

import {
  AlertTriangle,
  ChevronDown,
  DollarSign,
  Plus,
  Star,
  Tag,
  Upload,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { ContentWarningBadges } from '@/components/ContentWarnings'
import MediaUploadSection from '@/components/MediaUploadSection'
import { ADULT_CATEGORIES, getCategoryLabel } from '@/constants/categories'
import { ContentWarning, getAllContentWarnings } from '@/lib/content-moderation'
import {
  uploadImageToStorage,
  uploadVideoToStorage,
} from '@/lib/media-upload-utils'
import { createClient } from '@/lib/supabase/client'

interface MediaFile {
  file: File
  preview?: string
  mediaType: 'image' | 'video'
  id: string
}

interface ProductFormData {
  name: string
  description: string
  price_cents: number
  points_price: number
  category: string
  content_warnings: ContentWarning[]
  tags: string[]
  is_explicit: boolean
}

const categories = ADULT_CATEGORIES

export default function CreateProductPage() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [checkingName, setCheckingName] = useState(false)
  const [nameExists, setNameExists] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [newTag, setNewTag] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price_cents: 999,
    points_price: 50,
    category: 'adult-toys',
    content_warnings: ['sexual-content'],
    tags: [],
    is_explicit: true,
  })

  const contentWarnings = getAllContentWarnings()

  // Check if product name exists
  const checkProductName = useCallback(
    async (name: string) => {
      if (!name.trim()) {
        setNameExists(false)
        return
      }

      setCheckingName(true)
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id')
          .eq('name', name.trim())
          .limit(1)

        if (error) throw error
        setNameExists(data.length > 0)
      } catch (error) {
        console.error('Error checking product name:', error)
      } finally {
        setCheckingName(false)
      }
    },
    [supabase]
  )

  // Debounced name checking
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.name) {
        checkProductName(formData.name)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.name, checkProductName])

  const updateFormData = (updates: Partial<ProductFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const toggleContentWarning = (warning: ContentWarning) => {
    const warnings = formData.content_warnings.includes(warning)
      ? formData.content_warnings.filter((w) => w !== warning)
      : [...formData.content_warnings, warning]
    updateFormData({ content_warnings: warnings })
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      updateFormData({ tags: [...formData.tags, newTag.trim()] })
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    updateFormData({ tags: formData.tags.filter((tag) => tag !== tagToRemove) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mediaFiles.length === 0) {
      toast.error('Please upload at least one media file')
      return
    }

    if (nameExists) {
      toast.error('Product name already exists')
      return
    }

    setUploading(true)

    try {
      // Check authentication
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Please login to create products')
        router.push('/login')
        return
      }

      // Determine if this is a single product or multiple products
      const isMultipleProducts = mediaFiles.length > 1

      if (isMultipleProducts) {
        // Create multiple products (one per media file)
        await createMultipleProducts(user.id)
      } else {
        // Create single product
        await createSingleProduct(user.id)
      }

      toast.success(
        isMultipleProducts
          ? `Successfully created ${mediaFiles.length} products!`
          : 'Product created successfully!'
      )
      router.push('/products')
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to create product(s)')
    } finally {
      setUploading(false)
    }
  }

  const createSingleProduct = async (userId: string) => {
    const mediaFile = mediaFiles[0]

    // Upload media file
    const uploadResult =
      mediaFile.mediaType === 'image'
        ? await uploadImageToStorage(mediaFile.file)
        : await uploadVideoToStorage(mediaFile.file)

    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Failed to upload media')
    }

    // Save product to database
    const productData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      media_url: uploadResult.url!,
      media_type: mediaFile.mediaType,
      price_cents: formData.price_cents,
      points_price: formData.points_price,
      category: formData.category,
      content_warnings: formData.content_warnings,
      tags: formData.tags,
      is_explicit: formData.is_explicit,
      user_id: userId,
      // Backward compatibility
      image_url: mediaFile.mediaType === 'image' ? uploadResult.url! : null,
      thumbnail_url: mediaFile.mediaType === 'video' ? mediaFile.preview : null,
      duration_seconds: uploadResult.duration
        ? Math.round(uploadResult.duration)
        : null,
      file_size: uploadResult.fileSize,
    }

    const { error: dbError } = await supabase
      .from('products')
      .insert(productData)

    if (dbError) throw dbError
  }

  const createMultipleProducts = async (userId: string) => {
    const products = []

    for (let i = 0; i < mediaFiles.length; i++) {
      const mediaFile = mediaFiles[i]

      // Upload media file
      const uploadResult =
        mediaFile.mediaType === 'image'
          ? await uploadImageToStorage(mediaFile.file)
          : await uploadVideoToStorage(mediaFile.file)

      if (!uploadResult.success) {
        throw new Error(
          `Failed to upload ${mediaFile.file.name}: ${uploadResult.error}`
        )
      }

      // Generate unique name for each product
      const productName =
        mediaFiles.length === 1
          ? formData.name.trim()
          : `${formData.name.trim()} ${i + 1}`

      products.push({
        name: productName,
        description: formData.description.trim(),
        media_url: uploadResult.url!,
        media_type: mediaFile.mediaType,
        price_cents: formData.price_cents,
        points_price: formData.points_price,
        category: formData.category,
        content_warnings: formData.content_warnings,
        tags: formData.tags,
        is_explicit: formData.is_explicit,
        user_id: userId,
        // Backward compatibility
        image_url: mediaFile.mediaType === 'image' ? uploadResult.url! : null,
        thumbnail_url:
          mediaFile.mediaType === 'video' ? mediaFile.preview : null,
        duration_seconds: uploadResult.duration
          ? Math.round(uploadResult.duration)
          : null,
        file_size: uploadResult.fileSize,
      })
    }

    const { error: dbError } = await supabase.from('products').insert(products)

    if (dbError) throw dbError
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8 text-center'>
          <h1 className='text-3xl font-bold text-gray-900'>Create Product</h1>
          <p className='mt-2 text-gray-600'>
            Upload media files and create your adult content products
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-8'>
          {/* Media Upload Section */}
          <div className='rounded-lg bg-white p-6 shadow-sm'>
            <h2 className='mb-4 text-lg font-semibold text-gray-900'>
              Media Files
            </h2>
            <MediaUploadSection
              files={mediaFiles}
              onFilesChange={setMediaFiles}
              maxFiles={10}
            />

            {mediaFiles.length > 1 && (
              <div className='mt-4 rounded-lg bg-blue-50 p-4'>
                <div className='flex items-start'>
                  <AlertTriangle className='mr-2 h-5 w-5 text-blue-600' />
                  <div>
                    <p className='text-sm font-medium text-blue-800'>
                      Multiple Products Mode
                    </p>
                    <p className='text-sm text-blue-700'>
                      {mediaFiles.length} separate products will be created,
                      each with the same details but different media files.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className='rounded-lg bg-white p-6 shadow-sm'>
            <h2 className='mb-4 text-lg font-semibold text-gray-900'>
              Product Details
            </h2>

            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
              {/* Product Name */}
              <div className='lg:col-span-2'>
                <label className='mb-2 block text-sm font-medium text-gray-700'>
                  Product Name *
                </label>
                <div className='relative'>
                  <input
                    type='text'
                    required
                    value={formData.name}
                    onChange={(e) => updateFormData({ name: e.target.value })}
                    className={`block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 ${
                      nameExists
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                    placeholder='Enter a unique product name'
                  />
                  {checkingName && (
                    <div className='absolute right-3 top-3'>
                      <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-indigo-600'></div>
                    </div>
                  )}
                </div>
                {nameExists && (
                  <p className='mt-1 text-sm text-red-600'>
                    This product name already exists. Please choose a different
                    name.
                  </p>
                )}
                {mediaFiles.length > 1 && (
                  <p className='mt-1 text-sm text-gray-500'>
                    Numbers will be added automatically for multiple products
                    (e.g., "{formData.name} 1", "{formData.name} 2")
                  </p>
                )}
              </div>

              {/* Description */}
              <div className='lg:col-span-2'>
                <label className='mb-2 block text-sm font-medium text-gray-700'>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    updateFormData({ description: e.target.value })
                  }
                  rows={4}
                  className='block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500'
                  placeholder='Describe your product...'
                />
              </div>

              {/* Pricing */}
              <div>
                <label className='mb-2 block text-sm font-medium text-gray-700'>
                  <div className='flex items-center'>
                    <DollarSign className='mr-1 h-4 w-4' />
                    USD Price (cents) *
                  </div>
                </label>
                <input
                  type='number'
                  required
                  min='1'
                  value={formData.price_cents}
                  onChange={(e) =>
                    updateFormData({
                      price_cents: parseInt(e.target.value) || 0,
                    })
                  }
                  className='block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500'
                />
                <p className='mt-1 text-sm text-gray-500'>
                  ${(formData.price_cents / 100).toFixed(2)} USD
                </p>
              </div>

              <div>
                <label className='mb-2 block text-sm font-medium text-gray-700'>
                  <div className='flex items-center'>
                    <Star className='mr-1 h-4 w-4' />
                    Points Price *
                  </div>
                </label>
                <input
                  type='number'
                  required
                  min='1'
                  value={formData.points_price}
                  onChange={(e) =>
                    updateFormData({
                      points_price: parseInt(e.target.value) || 0,
                    })
                  }
                  className='block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500'
                />
              </div>

              {/* Category */}
              <div>
                <label className='mb-2 block text-sm font-medium text-gray-700'>
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => updateFormData({ category: e.target.value })}
                  className='block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500'
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryLabel(cat)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Explicit Content Toggle */}
              <div>
                <label className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={formData.is_explicit}
                    onChange={(e) =>
                      updateFormData({ is_explicit: e.target.checked })
                    }
                    className='rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                  />
                  <span className='ml-2 text-sm font-medium text-gray-700'>
                    Explicit Content (18+)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div className='rounded-lg bg-white p-6 shadow-sm'>
            <button
              type='button'
              onClick={() => setShowAdvanced(!showAdvanced)}
              className='flex w-full items-center justify-between text-left'
            >
              <h2 className='text-lg font-semibold text-gray-900'>
                Advanced Options
              </h2>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              />
            </button>

            {showAdvanced && (
              <div className='mt-6 space-y-6'>
                {/* Content Warnings */}
                <div>
                  <label className='mb-3 block text-sm font-medium text-gray-700'>
                    Content Warnings
                  </label>
                  <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
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
                          className='rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                        />
                        <span className='text-sm text-gray-700'>
                          {warning.warning_label}
                        </span>
                      </label>
                    ))}
                  </div>
                  {formData.content_warnings.length > 0 && (
                    <div className='mt-3'>
                      <ContentWarningBadges
                        warnings={formData.content_warnings}
                      />
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className='mb-3 block text-sm font-medium text-gray-700'>
                    <div className='flex items-center'>
                      <Tag className='mr-1 h-4 w-4' />
                      Tags
                    </div>
                  </label>
                  <div className='flex gap-2'>
                    <input
                      type='text'
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && (e.preventDefault(), addTag())
                      }
                      className='flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500'
                      placeholder='Add a tag...'
                    />
                    <button
                      type='button'
                      onClick={addTag}
                      className='rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200'
                    >
                      <Plus className='h-4 w-4' />
                    </button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className='mt-3 flex flex-wrap gap-2'>
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className='inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800'
                        >
                          {tag}
                          <button
                            type='button'
                            onClick={() => removeTag(tag)}
                            className='text-indigo-600 hover:text-indigo-800'
                          >
                            <X className='h-3 w-3' />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className='flex justify-end space-x-4'>
            <button
              type='button'
              onClick={() => router.back()}
              className='rounded-md border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={
                uploading ||
                mediaFiles.length === 0 ||
                !formData.name.trim() ||
                nameExists ||
                checkingName
              }
              className='flex items-center rounded-md bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {uploading ? (
                <>
                  <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white'></div>
                  Creating{' '}
                  {mediaFiles.length > 1
                    ? `${mediaFiles.length} Products`
                    : 'Product'}
                  ...
                </>
              ) : (
                <>
                  <Upload className='mr-2 h-4 w-4' />
                  Create{' '}
                  {mediaFiles.length > 1
                    ? `${mediaFiles.length} Products`
                    : 'Product'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
