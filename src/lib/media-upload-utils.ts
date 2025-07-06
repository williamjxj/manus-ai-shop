import { createClient } from '@/lib/supabase/client'

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
  fileSize?: number
  duration?: number // For videos
  dimensions?: { width: number; height: number }
  thumbnailUrl?: string
}

export interface MediaFileMetadata {
  fileName: string
  fileSize: number
  mimeType: string
  mediaType: 'image' | 'video'
  bucketName: string
  publicUrl: string
  thumbnailUrl?: string
  duration?: number
  width?: number
  height?: number
}

/**
 * Validates an image file before upload
 */
export function validateImageFile(file: File): ValidationResult {
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
    'image/svg+xml',
  ]
  if (!supportedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Supported formats: JPEG, PNG, GIF, WebP, SVG',
    }
  }

  return { isValid: true }
}

/**
 * Validates a video file before upload
 */
export function validateVideoFile(file: File): ValidationResult {
  // Check file type
  if (!file.type.startsWith('video/')) {
    return {
      isValid: false,
      error: 'Please select a valid video file',
    }
  }

  // Check file size (100MB limit)
  const maxSize = 100 * 1024 * 1024 // 100MB in bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Video size must be less than 100MB',
    }
  }

  // Check supported formats
  const supportedTypes = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/webm',
    'video/x-msvideo', // .avi
  ]
  if (!supportedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Supported formats: MP4, MPEG, QuickTime, WebM, AVI',
    }
  }

  return { isValid: true }
}

/**
 * Validates multiple files (images and videos)
 */
export function validateFiles(files: File[]): ValidationResult {
  if (files.length === 0) {
    return {
      isValid: false,
      error: 'Please select at least one file',
    }
  }

  if (files.length > 10) {
    return {
      isValid: false,
      error: 'Maximum 10 files allowed per upload',
    }
  }

  for (const file of files) {
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      return {
        isValid: false,
        error: `Invalid file type: ${file.name}. Only images and videos are allowed.`,
      }
    }

    if (isImage) {
      const imageValidation = validateImageFile(file)
      if (!imageValidation.isValid) {
        return {
          isValid: false,
          error: `${file.name}: ${imageValidation.error}`,
        }
      }
    }

    if (isVideo) {
      const videoValidation = validateVideoFile(file)
      if (!videoValidation.isValid) {
        return {
          isValid: false,
          error: `${file.name}: ${videoValidation.error}`,
        }
      }
    }
  }

  return { isValid: true }
}

/**
 * Generates a unique filename with timestamp and random string
 */
export function generateUniqueFilename(file: File): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 8)
  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  return `${timestamp}-${randomString}.${extension}`
}

/**
 * Creates a preview for an image file
 */
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      } else {
        reject(new Error('Failed to create preview'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Creates a video preview and extracts metadata
 */
export function createVideoPreview(file: File): Promise<{
  preview: string
  duration: number
  dimensions: { width: number; height: number }
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    video.onloadedmetadata = () => {
      // Set canvas dimensions to video dimensions
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Seek to 1 second or 10% of duration for thumbnail
      const seekTime = Math.min(1, video.duration * 0.1)
      video.currentTime = seekTime
    }

    video.onseeked = () => {
      if (ctx) {
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Convert to data URL
        const preview = canvas.toDataURL('image/jpeg', 0.8)

        resolve({
          preview,
          duration: video.duration,
          dimensions: {
            width: video.videoWidth,
            height: video.videoHeight,
          },
        })
      } else {
        reject(new Error('Failed to create video preview'))
      }
    }

    video.onerror = () => reject(new Error('Failed to load video'))
    video.src = URL.createObjectURL(file)
  })
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
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
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
    } = supabase.storage.from('images').getPublicUrl(filePath)

    return {
      success: true,
      url: publicUrl,
      fileSize: file.size,
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
 * Uploads a video file to Supabase storage
 */
export async function uploadVideoToStorage(file: File): Promise<UploadResult> {
  try {
    // Validate file first
    const validation = validateVideoFile(file)
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
      .from('videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
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
    } = supabase.storage.from('videos').getPublicUrl(filePath)

    // Get video metadata
    let duration: number | undefined
    let dimensions: { width: number; height: number } | undefined

    try {
      const videoMetadata = await createVideoPreview(file)
      duration = videoMetadata.duration
      dimensions = videoMetadata.dimensions
    } catch (error) {
      console.warn('Failed to extract video metadata:', error)
    }

    return {
      success: true,
      url: publicUrl,
      fileSize: file.size,
      duration,
      dimensions,
    }
  } catch (error: any) {
    console.error('Unexpected upload error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during upload',
    }
  }
}
