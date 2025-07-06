'use client'

import {
  DollarSign,
  FileText,
  Image as ImageIcon,
  Play,
  Star,
  Tag,
  Upload,
  Video,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'

import { ADULT_CATEGORIES, getCategoryLabel } from '@/constants/categories'
import {
  createImagePreview,
  createVideoPreview,
  uploadImageToStorage,
  uploadVideoToStorage,
  validateFiles,
  validateImageFile,
  validateVideoFile,
} from '@/lib/media-upload-utils'
import { createClient } from '@/lib/supabase/client'

type MediaType = 'image' | 'video'
type UploadTab = 'single' | 'bulk'

interface ProductFormData {
  name: string
  description: string
  price_cents: number
  points_price: number
  category: string
  media_type: MediaType
  media_file: File | null
}

interface BulkUploadFile {
  file: File
  preview?: string
  name: string
  category: string
  price_cents: number
  points_price: number
  mediaType: MediaType
}

const categories = ADULT_CATEGORIES

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState<UploadTab>('single')
  const [mediaType, setMediaType] = useState<MediaType>('image')
  const [uploading, setUploading] = useState(false)
  const [checkingName, setCheckingName] = useState(false)
  const [nameExists, setNameExists] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Single upload state
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price_cents: 999,
    points_price: 50,
    category: 'ai-art',
    media_type: 'image',
    media_file: null,
  })
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [videoDuration, setVideoDuration] = useState<number | null>(null)

  // Bulk upload state
  const [bulkFiles, setBulkFiles] = useState<BulkUploadFile[]>([])
  const [bulkUploading, setBulkUploading] = useState(false)

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  const checkNameExists = useCallback(
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
          .maybeSingle()

        if (error) throw error
        setNameExists(!!data)
      } catch (error) {
        console.error('Error checking name:', error)
      } finally {
        setCheckingName(false)
      }
    },
    [supabase]
  )

  const handleMediaSelect = useCallback(async (file: File) => {
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      toast.error('Please select an image or video file')
      return
    }

    // Validate file
    const validation = isImage
      ? validateImageFile(file)
      : validateVideoFile(file)

    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid file')
      return
    }

    setFormData((prev) => ({
      ...prev,
      media_file: file,
      media_type: isImage ? 'image' : 'video',
    }))
    setMediaType(isImage ? 'image' : 'video')

    // Create preview
    try {
      if (isImage) {
        const preview = await createImagePreview(file)
        setMediaPreview(preview)
        setVideoDuration(null)
      } else {
        const videoData = await createVideoPreview(file)
        setMediaPreview(videoData.preview)
        setVideoDuration(videoData.duration)
      }
    } catch (error) {
      console.error('Preview error:', error)
      toast.error('Failed to create preview')
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleMediaSelect(file)
    }
  }

  const handleBulkFileInput = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const validation = validateFiles(files)
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid files')
      return
    }

    const newBulkFiles: BulkUploadFile[] = []

    for (const file of files) {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      const mediaType: MediaType = isImage ? 'image' : 'video'

      let preview: string | undefined

      try {
        if (isImage) {
          preview = await createImagePreview(file)
        } else {
          const videoData = await createVideoPreview(file)
          preview = videoData.preview
        }
      } catch (error) {
        console.warn(`Failed to create preview for ${file.name}:`, error)
      }

      newBulkFiles.push({
        file,
        preview,
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        category: 'ai-art',
        price_cents: 999,
        points_price: 50,
        mediaType,
      })
    }

    setBulkFiles(newBulkFiles)
  }

  const updateBulkFile = (index: number, updates: Partial<BulkUploadFile>) => {
    setBulkFiles((prev) =>
      prev.map((file, i) => (i === index ? { ...file, ...updates } : file))
    )
  }

  const removeBulkFile = (index: number) => {
    setBulkFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.media_file) {
      toast.error('Please select a media file')
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
        toast.error('Please login to upload products')
        router.push('/login')
        return
      }

      // Upload media file
      const uploadResult =
        formData.media_type === 'image'
          ? await uploadImageToStorage(formData.media_file)
          : await uploadVideoToStorage(formData.media_file)

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload media')
      }

      const mediaUrl = uploadResult.url!

      // Save product to database
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        media_url: mediaUrl,
        media_type: formData.media_type,
        price_cents: formData.price_cents,
        points_price: formData.points_price,
        category: formData.category,
        user_id: user.id, // Add user_id for ownership tracking
        // Keep image_url for backward compatibility
        image_url: formData.media_type === 'image' ? mediaUrl : null,
        thumbnail_url: formData.media_type === 'video' ? mediaPreview : null,
        duration_seconds: videoDuration,
        file_size: uploadResult.fileSize,
      }

      const { error: dbError } = await supabase
        .from('products')
        .insert(productData)

      if (dbError) {
        console.error('Database error:', dbError)
        throw new Error(`Database error: ${dbError.message}`)
      }

      toast.success('Product uploaded successfully!')
      router.push('/products')
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload product')
    } finally {
      setUploading(false)
    }
  }

  const handleBulkUpload = async () => {
    if (bulkFiles.length === 0) {
      toast.error('No files selected')
      return
    }

    setBulkUploading(true)

    try {
      // Check authentication
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Please login to upload products')
        router.push('/login')
        return
      }

      let successCount = 0
      let errorCount = 0

      for (const [index, bulkFile] of bulkFiles.entries()) {
        try {
          // Upload media file
          const uploadResult =
            bulkFile.mediaType === 'image'
              ? await uploadImageToStorage(bulkFile.file)
              : await uploadVideoToStorage(bulkFile.file)

          if (!uploadResult.success) {
            throw new Error(uploadResult.error || 'Failed to upload media')
          }

          const mediaUrl = uploadResult.url!

          // Save product to database
          const productData = {
            name: bulkFile.name.trim() || `Untitled ${index + 1}`,
            description: `Uploaded ${bulkFile.mediaType}`,
            media_url: mediaUrl,
            media_type: bulkFile.mediaType,
            price_cents: bulkFile.price_cents,
            points_price: bulkFile.points_price,
            category: bulkFile.category,
            user_id: user.id, // Add user_id for ownership tracking
            // Keep image_url for backward compatibility
            image_url: bulkFile.mediaType === 'image' ? mediaUrl : null,
            thumbnail_url:
              bulkFile.mediaType === 'video' ? bulkFile.preview : null,
            file_size: uploadResult.fileSize,
            duration_seconds: uploadResult.duration,
          }

          const { error: dbError } = await supabase
            .from('products')
            .insert(productData)

          if (dbError) {
            console.error('Database error for file:', bulkFile.name, dbError)
            errorCount++
          } else {
            successCount++
          }
        } catch (error: any) {
          console.error('Upload error for file:', bulkFile.name, error)
          errorCount++
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} products!`)
      }
      if (errorCount > 0) {
        toast.error(`Failed to upload ${errorCount} products`)
      }

      if (successCount === bulkFiles.length) {
        setBulkFiles([])
        router.push('/products')
      }
    } catch (error: any) {
      console.error('Bulk upload error:', error)
      toast.error(error.message || 'Failed to upload products')
    } finally {
      setBulkUploading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8 text-center'>
          <h1 className='bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent'>
            Upload Adult Content
          </h1>
          <p className='mt-2 text-gray-600'>
            Add premium adult images and videos to the marketplace
          </p>
          <div className='mt-3 flex items-center justify-center gap-2 text-sm font-medium text-red-600'>
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
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
            <span>
              18+ CONTENT ONLY - Ensure all uploads comply with adult content
              guidelines
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className='mb-8 flex justify-center'>
          <div className='flex rounded-lg bg-gray-100 p-1'>
            <button
              onClick={() => setActiveTab('single')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'single'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Single Upload
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'bulk'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Bulk Upload
            </button>
          </div>
        </div>

        {/* Single Upload Form */}
        {activeTab === 'single' && (
          <form onSubmit={handleSingleSubmit} className='space-y-8'>
            <div className='rounded-lg bg-white p-6 shadow-sm'>
              {/* Media Upload Section */}
              <div className='mb-8'>
                <label className='mb-4 block text-sm font-medium text-gray-700'>
                  <div className='flex items-center'>
                    {mediaType === 'image' ? (
                      <ImageIcon className='mr-2 h-4 w-4' />
                    ) : (
                      <Video className='mr-2 h-4 w-4' />
                    )}
                    Media File (Images or Videos)
                  </div>
                </label>

                {!formData.media_file ? (
                  <div className='flex justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-10'>
                    <div className='text-center'>
                      <div className='mb-4 flex justify-center space-x-4'>
                        <ImageIcon className='h-12 w-12 text-gray-400' />
                        <Video className='h-12 w-12 text-gray-400' />
                      </div>
                      <div className='flex text-sm leading-6 text-gray-600'>
                        <label
                          htmlFor='media-upload'
                          className='relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500'
                        >
                          <span>Upload a file</span>
                          <input
                            id='media-upload'
                            name='media-upload'
                            type='file'
                            className='sr-only'
                            accept='image/*,video/*'
                            onChange={handleFileInput}
                          />
                        </label>
                        <p className='pl-1'>or drag and drop</p>
                      </div>
                      <p className='text-xs leading-5 text-gray-600'>
                        Images: PNG, JPG, GIF, WebP up to 10MB
                        <br />
                        Videos: MP4, WebM, QuickTime up to 100MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className='relative'>
                    {mediaPreview && (
                      <div className='relative overflow-hidden rounded-lg'>
                        {formData.media_type === 'image' ? (
                          <Image
                            src={mediaPreview}
                            alt='Preview'
                            width={400}
                            height={300}
                            className='h-64 w-full object-cover'
                          />
                        ) : (
                          <div className='relative'>
                            <Image
                              src={mediaPreview}
                              alt='Video thumbnail'
                              width={400}
                              height={300}
                              className='h-64 w-full object-cover'
                            />
                            <div className='absolute inset-0 flex items-center justify-center'>
                              <div className='rounded-full bg-black bg-opacity-50 p-3'>
                                <Play className='h-8 w-8 text-white' />
                              </div>
                            </div>
                            {videoDuration && (
                              <div className='absolute bottom-2 right-2 rounded bg-black bg-opacity-75 px-2 py-1 text-xs text-white'>
                                {Math.floor(videoDuration / 60)}:
                                {String(
                                  Math.floor(videoDuration % 60)
                                ).padStart(2, '0')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      type='button'
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, media_file: null }))
                        setMediaPreview(null)
                        setVideoDuration(null)
                      }}
                      className='absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600'
                    >
                      <X className='h-4 w-4' />
                    </button>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                {/* Product Name */}
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    <FileText className='mr-2 inline h-4 w-4' />
                    Product Name
                  </label>
                  <input
                    type='text'
                    value={formData.name}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                      checkNameExists(e.target.value)
                    }}
                    className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 ${
                      nameExists
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
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

                {/* Category */}
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    <Tag className='mr-2 inline h-4 w-4' />
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {getCategoryLabel(cat)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    <DollarSign className='mr-2 inline h-4 w-4' />
                    Price ({formatPrice(formData.price_cents)})
                  </label>
                  <input
                    type='number'
                    value={formData.price_cents}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price_cents: parseInt(e.target.value) || 0,
                      }))
                    }
                    min='0'
                    step='1'
                    className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
                    placeholder='Price in cents'
                    required
                  />
                </div>

                {/* Points Price */}
                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    <Star className='mr-2 inline h-4 w-4' />
                    Points Price
                  </label>
                  <input
                    type='number'
                    value={formData.points_price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        points_price: parseInt(e.target.value) || 0,
                      }))
                    }
                    min='0'
                    step='1'
                    className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
                    placeholder='Points required'
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className='block text-sm font-medium text-gray-700'>
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
                  className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
                  placeholder='Describe your product...'
                  required
                />
              </div>

              {/* Submit Button */}
              <div className='flex justify-end space-x-4'>
                <button
                  type='button'
                  onClick={() => router.back()}
                  className='rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={
                    uploading ||
                    !formData.media_file ||
                    nameExists ||
                    checkingName
                  }
                  className='flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  {uploading ? (
                    <>
                      <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white'></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className='mr-2 h-4 w-4' />
                      Upload Product
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Bulk Upload Form */}
        {activeTab === 'bulk' && (
          <div className='rounded-lg bg-white p-6 shadow-sm'>
            <div className='mb-6'>
              <label className='mb-4 block text-sm font-medium text-gray-700'>
                Select Multiple Files
              </label>
              <div className='flex justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-10'>
                <div className='text-center'>
                  <Upload className='mx-auto h-12 w-12 text-gray-400' />
                  <div className='mt-4 flex text-sm leading-6 text-gray-600'>
                    <label
                      htmlFor='bulk-upload'
                      className='relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500'
                    >
                      <span>Upload multiple files</span>
                      <input
                        id='bulk-upload'
                        name='bulk-upload'
                        type='file'
                        className='sr-only'
                        accept='image/*,video/*'
                        multiple
                        onChange={handleBulkFileInput}
                      />
                    </label>
                  </div>
                  <p className='text-xs leading-5 text-gray-600'>
                    Select up to 10 images and videos
                  </p>
                </div>
              </div>
            </div>

            {/* Bulk Files List */}
            {bulkFiles.length > 0 && (
              <div className='space-y-4'>
                <h3 className='text-lg font-medium text-gray-900'>
                  Selected Files ({bulkFiles.length})
                </h3>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                  {bulkFiles.map((file, index) => (
                    <div
                      key={index}
                      className='relative rounded-lg border border-gray-200 p-4'
                    >
                      {/* File Preview */}
                      {file.preview && (
                        <div className='relative mb-3 h-32 overflow-hidden rounded'>
                          <Image
                            src={file.preview}
                            alt={file.name}
                            width={200}
                            height={128}
                            className='h-full w-full object-cover'
                          />
                          {file.mediaType === 'video' && (
                            <div className='absolute inset-0 flex items-center justify-center'>
                              <div className='rounded-full bg-black bg-opacity-50 p-2'>
                                <Play className='h-4 w-4 text-white' />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* File Details Form */}
                      <div className='space-y-3'>
                        <input
                          type='text'
                          value={file.name}
                          onChange={(e) =>
                            updateBulkFile(index, { name: e.target.value })
                          }
                          className='w-full rounded border border-gray-300 px-2 py-1 text-sm'
                          placeholder='Product name'
                        />

                        <select
                          value={file.category}
                          onChange={(e) =>
                            updateBulkFile(index, { category: e.target.value })
                          }
                          className='w-full rounded border border-gray-300 px-2 py-1 text-sm'
                        >
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {getCategoryLabel(cat)}
                            </option>
                          ))}
                        </select>

                        <div className='grid grid-cols-2 gap-2'>
                          <input
                            type='number'
                            value={file.price_cents}
                            onChange={(e) =>
                              updateBulkFile(index, {
                                price_cents: parseInt(e.target.value) || 0,
                              })
                            }
                            className='w-full rounded border border-gray-300 px-2 py-1 text-sm'
                            placeholder='Price (cents)'
                            min='0'
                          />
                          <input
                            type='number'
                            value={file.points_price}
                            onChange={(e) =>
                              updateBulkFile(index, {
                                points_price: parseInt(e.target.value) || 0,
                              })
                            }
                            className='w-full rounded border border-gray-300 px-2 py-1 text-sm'
                            placeholder='Points'
                            min='0'
                          />
                        </div>

                        <div className='flex items-center justify-between text-xs text-gray-500'>
                          <span>
                            {file.mediaType === 'image' ? 'Image' : 'Video'} •{' '}
                            {(file.file.size / 1024 / 1024).toFixed(1)}MB
                          </span>
                          <span>{formatPrice(file.price_cents)}</span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        type='button'
                        onClick={() => removeBulkFile(index)}
                        className='absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600'
                      >
                        <X className='h-3 w-3' />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Bulk Upload Button */}
                <div className='flex justify-end'>
                  <button
                    type='button'
                    onClick={handleBulkUpload}
                    disabled={bulkUploading || bulkFiles.length === 0}
                    className='flex items-center rounded-md bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50'
                  >
                    {bulkUploading ? (
                      <>
                        <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white'></div>
                        Uploading {bulkFiles.length} files...
                      </>
                    ) : (
                      <>
                        <Upload className='mr-2 h-4 w-4' />
                        Upload {bulkFiles.length} Products
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
