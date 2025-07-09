'use client'

import {
  ChevronDown,
  DollarSign,
  Plus,
  Star,
  Tag,
  Upload,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'
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
  isPrimary: boolean
  sortOrder: number
  altText?: string
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

      // Create single product with media gallery
      await createProductWithMediaGallery(user.id)

      toast.success(
        `Product created successfully with ${mediaFiles.length} media file${mediaFiles.length > 1 ? 's' : ''}!`
      )
      router.push('/products')
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to create product(s)')
    } finally {
      setUploading(false)
    }
  }

  const createProductWithMediaGallery = async (userId: string) => {
    // First, create the product
    const primaryMedia = mediaFiles.find((f) => f.isPrimary) || mediaFiles[0]

    const productData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price_cents: formData.price_cents,
      points_price: formData.points_price,
      category: formData.category,
      content_warnings: formData.content_warnings,
      tags: formData.tags,
      is_explicit: formData.is_explicit,
      user_id: userId,
      // Legacy fields for backward compatibility - use primary media
      media_url: '', // Will be updated after upload
      media_type: primaryMedia.mediaType,
      image_url: null, // Will be updated if primary is image
      thumbnail_url: null, // Will be updated if primary is video
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single()

    if (productError) throw productError

    // Upload all media files and create product_media records
    const mediaRecords = []

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

      // Create media record
      mediaRecords.push({
        product_id: product.id,
        media_url: uploadResult.url!,
        media_type: mediaFile.mediaType,
        thumbnail_url: uploadResult.thumbnailUrl || mediaFile.preview || null,
        is_primary: mediaFile.isPrimary,
        sort_order: mediaFile.sortOrder,
        alt_text: mediaFile.altText || '',
        file_size: uploadResult.fileSize,
        duration_seconds: uploadResult.duration
          ? Math.round(uploadResult.duration)
          : null,
        width: uploadResult.dimensions?.width || null,
        height: uploadResult.dimensions?.height || null,
      })
    }

    // Insert all media records
    const { error: mediaError } = await supabase
      .from('product_media')
      .insert(mediaRecords)

    if (mediaError) throw mediaError

    // Update product with primary media info for backward compatibility
    const primaryMediaRecord = mediaRecords.find((m) => m.is_primary)
    if (primaryMediaRecord) {
      const { error: updateError } = await supabase
        .from('products')
        .update({
          media_url: primaryMediaRecord.media_url,
          image_url:
            primaryMediaRecord.media_type === 'image'
              ? primaryMediaRecord.media_url
              : null,
          thumbnail_url:
            primaryMediaRecord.media_type === 'video'
              ? primaryMediaRecord.thumbnail_url
              : null,
        })
        .eq('id', product.id)

      if (updateError) throw updateError
    }
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8 text-center'>
          <h1 className='text-3xl font-bold text-gray-900'>Create Product</h1>
          <p className='mt-2 text-gray-600'>
            Upload multiple images and videos to create a product with media
            gallery
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
              <div className='mt-4 rounded-lg bg-green-50 p-4'>
                <div className='flex items-start'>
                  <Star className='mr-2 h-5 w-5 text-green-600' />
                  <div>
                    <p className='text-sm font-medium text-green-800'>
                      Product Media Gallery
                    </p>
                    <p className='text-sm text-green-700'>
                      One product will be created with {mediaFiles.length} media
                      files in a gallery.
                      {mediaFiles.find((f) => f.isPrimary) && (
                        <span className='ml-1'>
                          Primary image:{' '}
                          {mediaFiles.find((f) => f.isPrimary)?.file.name}
                        </span>
                      )}
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
                  Creating Product
                  {mediaFiles.length > 1 &&
                    ` with ${mediaFiles.length} Media Files`}
                  ...
                </>
              ) : (
                <>
                  <Upload className='mr-2 h-4 w-4' />
                  Create Product
                  {mediaFiles.length > 1 &&
                    ` (${mediaFiles.length} Media Files)`}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
