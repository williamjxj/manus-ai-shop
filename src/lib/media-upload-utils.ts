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
  originalSize?: number
  compressionRatio?: number
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

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'webp' | 'png'
}

/**
 * Compresses an image file while maintaining quality
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<{
  file: File
  dimensions: { width: number; height: number }
  compressionRatio: number
}> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.85,
    format = 'jpeg',
  } = options

  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Image compression requires browser environment')
  }

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      canvas.width = width
      canvas.height = height

      // Apply image smoothing for better quality
      if (ctx) {
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'))
            return
          }

          const compressedFile = new File([blob], file.name, {
            type: `image/${format}`,
            lastModified: Date.now(),
          })

          const compressionRatio = file.size / compressedFile.size

          resolve({
            file: compressedFile,
            dimensions: { width, height },
            compressionRatio,
          })
        },
        `image/${format}`,
        quality
      )
    }

    img.onerror = () =>
      reject(new Error('Failed to load image for compression'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Generates an optimized thumbnail for any image
 */
export async function generateOptimizedThumbnail(
  file: File,
  size: number = 300
): Promise<File> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Thumbnail generation requires browser environment')
  }

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate thumbnail dimensions (square crop from center)
      const { width, height } = img
      const cropSize = Math.min(width, height)
      const startX = (width - cropSize) / 2
      const startY = (height - cropSize) / 2

      canvas.width = size
      canvas.height = size

      // Apply high-quality rendering
      if (ctx) {
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, startX, startY, cropSize, cropSize, 0, 0, size, size)
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to generate thumbnail'))
            return
          }

          const thumbnailFile = new File([blob], `thumb_${file.name}`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })

          resolve(thumbnailFile)
        },
        'image/jpeg',
        0.85
      )
    }

    img.onerror = () => reject(new Error('Failed to load image for thumbnail'))
    img.src = URL.createObjectURL(file)
  })
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
 * Uploads an image file to Supabase storage with compression and thumbnail
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

    // Use service role client for storage operations to bypass RLS
    const { createClient: createServiceClient } = await import(
      '@supabase/supabase-js'
    )
    const supabase =
      typeof window !== 'undefined'
        ? createClient()
        : createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
    const originalSize = file.size

    // Use original file if compression is not available (server-side)
    let compressedFile = file
    let dimensions: { width: number; height: number } | undefined
    let compressionRatio = 1

    // Only compress if we're in a browser environment
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        const compressionResult = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.85,
          format: 'jpeg',
        })
        compressedFile = compressionResult.file
        dimensions = compressionResult.dimensions
        compressionRatio = compressionResult.compressionRatio
      } catch (error) {
        console.warn('Image compression failed, using original file:', error)
        // Continue with original file
      }
    }

    // Generate thumbnail (also only in browser environment)
    let thumbnailFile: File | undefined
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        thumbnailFile = await generateOptimizedThumbnail(compressedFile, 300)
      } catch (error) {
        console.warn('Thumbnail generation failed:', error)
        // Continue without thumbnail
      }
    }

    // Generate unique filenames
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2)
    const fileName = `${timestamp}_${randomId}.jpg`
    const thumbnailName = `thumb_${timestamp}_${randomId}.jpg`
    const filePath = `products/${fileName}`
    const thumbnailPath = `thumbnails/${thumbnailName}`

    // Upload compressed image to storage
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, compressedFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg',
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return {
        success: false,
        error: `Upload failed: ${uploadError.message}`,
      }
    }

    // Upload thumbnail (only if available)
    let thumbnailUrl: string | undefined
    if (thumbnailFile) {
      try {
        const { error: thumbnailError } = await supabase.storage
          .from('thumbnails')
          .upload(thumbnailPath, thumbnailFile, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/jpeg',
          })

        if (!thumbnailError) {
          const {
            data: { publicUrl: thumbPublicUrl },
          } = supabase.storage.from('thumbnails').getPublicUrl(thumbnailPath)
          thumbnailUrl = thumbPublicUrl
        } else {
          console.warn('Failed to upload thumbnail:', thumbnailError)
        }
      } catch (thumbnailError) {
        console.warn('Thumbnail upload failed:', thumbnailError)
      }
    }

    // Get public URL for main image
    const {
      data: { publicUrl },
    } = supabase.storage.from('images').getPublicUrl(filePath)

    return {
      success: true,
      url: publicUrl,
      thumbnailUrl,
      fileSize: compressedFile.size,
      originalSize,
      compressionRatio,
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

    // Use service role client for storage operations to bypass RLS
    const { createClient: createServiceClient } = await import(
      '@supabase/supabase-js'
    )
    const supabase =
      typeof window !== 'undefined'
        ? createClient()
        : createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )

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

    // Get video metadata and generate thumbnail
    let duration: number | undefined
    let dimensions: { width: number; height: number } | undefined
    let thumbnailUrl: string | undefined

    try {
      const videoMetadata = await createVideoPreview(file)
      duration = videoMetadata.duration
      dimensions = videoMetadata.dimensions

      // Convert data URL to blob and upload thumbnail
      const response = await fetch(videoMetadata.preview)
      const thumbnailBlob = await response.blob()

      // Generate thumbnail filename
      const thumbnailFileName = fileName.replace(/\.[^/.]+$/, '_thumb.jpg')
      const thumbnailPath = `thumbnails/${thumbnailFileName}`

      // Upload thumbnail to storage
      const { error: thumbnailError } = await supabase.storage
        .from('thumbnails')
        .upload(thumbnailPath, thumbnailBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg',
        })

      if (!thumbnailError) {
        const {
          data: { publicUrl: thumbPublicUrl },
        } = supabase.storage.from('thumbnails').getPublicUrl(thumbnailPath)
        thumbnailUrl = thumbPublicUrl
      } else {
        console.warn('Failed to upload thumbnail:', thumbnailError)
      }
    } catch (error) {
      console.warn(
        'Failed to extract video metadata or upload thumbnail:',
        error
      )
    }

    return {
      success: true,
      url: publicUrl,
      thumbnailUrl,
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

/**
 * Uploads multiple files with progress tracking and optimization
 */
export async function uploadMultipleFiles(
  files: File[],
  onProgress?: (
    progress: number,
    currentFile: string,
    completed: number,
    total: number
  ) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = []
  const total = files.length

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    if (onProgress) {
      onProgress((i / total) * 100, file.name, i, total)
    }

    let result: UploadResult
    try {
      if (file.type.startsWith('image/')) {
        result = await uploadImageToStorage(file)
      } else if (file.type.startsWith('video/')) {
        result = await uploadVideoToStorage(file)
      } else {
        result = {
          success: false,
          error: `Unsupported file type: ${file.type}`,
        }
      }
    } catch (error: any) {
      result = {
        success: false,
        error: `Upload failed for ${file.name}: ${error.message}`,
      }
    }

    results.push(result)
  }

  if (onProgress) {
    onProgress(100, 'Complete', total, total)
  }

  return results
}

/**
 * Estimates upload time based on file sizes and connection speed
 */
export function estimateUploadTime(
  files: File[],
  connectionSpeedMbps: number = 10
): number {
  // Add compression factor for images (typically 30-50% reduction)
  const imageFiles = files.filter((f) => f.type.startsWith('image/'))
  const videoFiles = files.filter((f) => f.type.startsWith('video/'))

  const estimatedImageSize =
    imageFiles.reduce((sum, file) => sum + file.size * 0.6, 0) / (1024 * 1024)
  const estimatedVideoSize =
    videoFiles.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)

  const adjustedSizeMb = estimatedImageSize + estimatedVideoSize

  // Estimate time in seconds (with 20% overhead for processing)
  return Math.ceil((adjustedSizeMb / connectionSpeedMbps) * 8 * 1.2)
}

/**
 * Optimizes file order for upload (smaller files first for faster initial feedback)
 */
export function optimizeUploadOrder(files: File[]): File[] {
  return [...files].sort((a, b) => {
    // Prioritize images over videos
    if (a.type.startsWith('image/') && b.type.startsWith('video/')) return -1
    if (a.type.startsWith('video/') && b.type.startsWith('image/')) return 1

    // Then sort by size (smaller first)
    return a.size - b.size
  })
}
