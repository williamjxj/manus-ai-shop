'use client'

import {
  DollarSign,
  FileText,
  Image as ImageIcon,
  Star,
  Tag,
  Upload,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'

import { createClient } from '@/lib/supabase/client'
import {
  createImagePreview,
  uploadImageToStorage,
  validateImageFile,
} from '@/lib/upload-utils'

interface ProductFormData {
  name: string
  description: string
  price_cents: number
  points_price: number
  category: string
  image_file: File | null
}

const CATEGORIES = [
  { value: 'ai-art', label: 'AI Art' },
  { value: 'space', label: 'Space' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'sci-fi', label: 'Sci-Fi' },
  { value: 'nature', label: 'Nature' },
  { value: 'abstract', label: 'Abstract' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' },
]

export default function UploadPage() {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price_cents: 999,
    points_price: 50,
    category: 'ai-art',
    image_file: null,
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [nameExists, setNameExists] = useState(false)
  const [checkingName, setCheckingName] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const checkNameExists = useCallback(
    async (name: string) => {
      if (!name.trim()) {
        setNameExists(false)
        return
      }

      setCheckingName(true)
      try {
        const { data } = await supabase
          .from('products')
          .select('name')
          .eq('name', name.trim())
          .single()

        setNameExists(!!data)
      } catch {
        // If no data found, name doesn't exist (which is good)
        setNameExists(false)
      } finally {
        setCheckingName(false)
      }
    },
    [supabase]
  )

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes('price') ? parseInt(value) || 0 : value,
    }))

    // Check name availability when name field changes
    if (name === 'name') {
      // Debounce the name check
      const timeoutId = setTimeout(() => {
        checkNameExists(value)
      }, 500)

      return () => clearTimeout(timeoutId)
    }
  }

  const handleImageSelect = useCallback(async (file: File) => {
    // Validate file using utility function
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid image file')
      return
    }

    setFormData((prev) => ({ ...prev, image_file: file }))

    // Create preview using utility function
    try {
      const preview = await createImagePreview(file)
      setImagePreview(preview)
    } catch (error) {
      console.error('Preview error:', error)
      toast.error('Failed to create image preview')
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageSelect(file)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const file = e.dataTransfer.files?.[0]
      if (file) {
        handleImageSelect(file)
      }
    },
    [handleImageSelect]
  )

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image_file: null }))
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.image_file) {
      toast.error('Please select an image')
      return
    }

    if (!formData.name.trim()) {
      toast.error('Please enter a product name')
      return
    }

    if (nameExists) {
      toast.error(
        'A product with this name already exists. Please choose a different name.'
      )
      return
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a product description')
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

      // Upload image to storage using utility function
      const uploadResult = await uploadImageToStorage(formData.image_file)

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload image')
      }

      const imageUrl = uploadResult.url!

      // Save product to database
      const { error: dbError } = await supabase.from('products').insert({
        name: formData.name.trim(),
        description: formData.description.trim(),
        image_url: imageUrl,
        price_cents: formData.price_cents,
        points_price: formData.points_price,
        category: formData.category,
      })

      if (dbError) {
        // Handle specific database errors
        if (
          dbError.code === '23505' &&
          dbError.message.includes('products_name_key')
        ) {
          throw new Error(
            `A product with the name "${formData.name.trim()}" already exists. Please choose a different name.`
          )
        }
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

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8 text-center'>
          <h1 className='text-3xl font-bold text-gray-900'>
            Upload New Product
          </h1>
          <p className='mt-2 text-gray-600'>
            Add a new AI-generated image to your collection
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-8'>
          <div className='rounded-lg bg-white p-6 shadow-sm'>
            {/* Image Upload Section */}
            <div className='mb-8'>
              <label className='mb-4 block text-sm font-medium text-gray-700'>
                <ImageIcon className='mr-2 inline h-4 w-4' />
                Product Image
              </label>

              {!imagePreview ? (
                <div
                  className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className='mx-auto h-12 w-12 text-gray-400' />
                  <div className='mt-4'>
                    <label
                      htmlFor='image-upload'
                      className='cursor-pointer rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700'
                    >
                      Choose Image
                    </label>
                    <input
                      id='image-upload'
                      type='file'
                      accept='image/*'
                      onChange={handleFileInput}
                      className='hidden'
                    />
                  </div>
                  <p className='mt-2 text-sm text-gray-500'>
                    or drag and drop an image here
                  </p>
                  <p className='mt-1 text-xs text-gray-400'>
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              ) : (
                <div className='relative'>
                  <div className='relative h-64 w-full overflow-hidden rounded-lg'>
                    <Image
                      src={imagePreview}
                      alt='Preview'
                      fill
                      className='object-cover'
                    />
                  </div>
                  <button
                    type='button'
                    onClick={removeImage}
                    className='absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600'
                  >
                    <X className='h-4 w-4' />
                  </button>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              {/* Product Name */}
              <div className='md:col-span-2'>
                <label className='mb-2 block text-sm font-medium text-gray-700'>
                  <Tag className='mr-2 inline h-4 w-4' />
                  Product Name
                </label>
                <div className='relative'>
                  <input
                    type='text'
                    name='name'
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder='e.g., Cosmic Nebula'
                    className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-1 ${
                      nameExists
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : formData.name && !checkingName && !nameExists
                          ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                    required
                  />
                  {checkingName && (
                    <div className='absolute right-3 top-3'>
                      <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-gray-400'></div>
                    </div>
                  )}
                </div>
                {nameExists && (
                  <p className='mt-1 text-sm text-red-600'>
                    This name is already taken. Please choose a different name.
                  </p>
                )}
                {formData.name && !checkingName && !nameExists && (
                  <p className='mt-1 text-sm text-green-600'>
                    ✓ This name is available
                  </p>
                )}
              </div>

              {/* Description */}
              <div className='md:col-span-2'>
                <label className='mb-2 block text-sm font-medium text-gray-700'>
                  <FileText className='mr-2 inline h-4 w-4' />
                  Description
                </label>
                <textarea
                  name='description'
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder='Describe your AI-generated image...'
                  rows={3}
                  className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
                  required
                />
              </div>

              {/* Price in Cents */}
              <div>
                <label className='mb-2 block text-sm font-medium text-gray-700'>
                  <DollarSign className='mr-2 inline h-4 w-4' />
                  Price ({formatPrice(formData.price_cents)})
                </label>
                <input
                  type='number'
                  name='price_cents'
                  value={formData.price_cents}
                  onChange={handleInputChange}
                  min='1'
                  step='1'
                  className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
                  required
                />
                <p className='mt-1 text-xs text-gray-500'>
                  Price in cents (e.g., 999 = $9.99)
                </p>
              </div>

              {/* Points Price */}
              <div>
                <label className='mb-2 block text-sm font-medium text-gray-700'>
                  <Star className='mr-2 inline h-4 w-4' />
                  Points Price
                </label>
                <input
                  type='number'
                  name='points_price'
                  value={formData.points_price}
                  onChange={handleInputChange}
                  min='1'
                  step='1'
                  className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
                  required
                />
                <p className='mt-1 text-xs text-gray-500'>
                  Alternative price in points
                </p>
              </div>

              {/* Category */}
              <div className='md:col-span-2'>
                <label className='mb-2 block text-sm font-medium text-gray-700'>
                  Category
                </label>
                <select
                  name='category'
                  value={formData.category}
                  onChange={handleInputChange}
                  className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
                >
                  {CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className='mt-8 flex justify-end space-x-4'>
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
                  !formData.image_file ||
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
      </div>
    </div>
  )
}
