import { createClient } from '@/lib/supabase/client'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

export interface ImageValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validates an image file before upload
 */
export function validateImageFile(file: File): ImageValidationResult {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: 'Please select a valid image file',
    }
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024 // 10MB in bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Image size must be less than 10MB',
    }
  }

  // Check supported formats
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ]
  if (!supportedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Supported formats: JPEG, PNG, GIF, WebP',
    }
  }

  return { isValid: true }
}

/**
 * Generates a unique filename for uploaded images
 */
export function generateUniqueFilename(originalFile: File): string {
  const fileExt = originalFile.name.split('.').pop()?.toLowerCase()
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  return `${timestamp}-${randomString}.${fileExt}`
}

/**
 * Uploads an image file to Supabase storage
 */
export async function uploadImageToStorage(file: File): Promise<UploadResult> {
  try {
    // Validate file first
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      }
    }

    const supabase = createClient()

    // Generate unique filename
    const fileName = generateUniqueFilename(file)
    const filePath = `products/${fileName}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return {
        success: false,
        error: `Upload failed: ${uploadError.message}`,
      }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('product-images').getPublicUrl(filePath)

    return {
      success: true,
      url: publicUrl,
    }
  } catch (error: any) {
    console.error('Unexpected upload error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during upload',
    }
  }
}

/**
 * Deletes an image from Supabase storage
 */
export async function deleteImageFromStorage(
  imageUrl: string
): Promise<boolean> {
  try {
    const supabase = createClient()

    // Extract file path from URL
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split('/')
    const bucketIndex = pathParts.findIndex((part) => part === 'product-images')

    if (bucketIndex === -1) {
      console.error('Invalid image URL format')
      return false
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/')

    const { error } = await supabase.storage
      .from('product-images')
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Unexpected delete error:', error)
    return false
  }
}

/**
 * Compresses an image file before upload (optional utility)
 */
export function compressImage(
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      const newWidth = img.width * ratio
      const newHeight = img.height * ratio

      // Set canvas dimensions
      canvas.width = newWidth
      canvas.height = newHeight

      // Draw and compress
      ctx?.drawImage(img, 0, 0, newWidth, newHeight)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          } else {
            resolve(file) // Return original if compression fails
          }
        },
        file.type,
        quality
      )
    }

    img.onerror = () => {
      resolve(file) // Return original if loading fails
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Creates a preview URL for a file
 */
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      resolve(e.target?.result as string)
    }

    reader.onerror = () => {
      reject(new Error('Failed to create image preview'))
    }

    reader.readAsDataURL(file)
  })
}
