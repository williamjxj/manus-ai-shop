/**
 * Media Compression Utilities for Adult Content
 * Optimizes images and videos for better performance while maintaining quality
 */

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'webp' | 'png'
  maintainAspectRatio?: boolean
}

export interface CompressionResult {
  success: boolean
  compressedFile?: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
  error?: string
}

export interface VideoCompressionOptions {
  maxWidth?: number
  maxHeight?: number
  maxDuration?: number
  quality?: 'low' | 'medium' | 'high'
  format?: 'mp4' | 'webm'
}

/**
 * Compress image file for adult content while maintaining quality
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.85,
    format = 'jpeg',
    maintainAspectRatio = true,
  } = options

  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return {
        success: false,
        originalSize: file.size,
        compressedSize: 0,
        compressionRatio: 0,
        error: 'Not in browser environment',
      }
    }

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      if (!ctx) {
        resolve({
          success: false,
          originalSize: file.size,
          compressedSize: 0,
          compressionRatio: 0,
          error: 'Canvas context not available',
        })
        return
      }

      img.onload = () => {
        // Calculate new dimensions
        const { width, height } = calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight,
          maintainAspectRatio
        )

        // Set canvas dimensions
        canvas.width = width
        canvas.height = height

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to blob with specified quality
        const mimeType = `image/${format}`
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: mimeType,
                lastModified: Date.now(),
              })

              const compressionRatio =
                ((file.size - blob.size) / file.size) * 100

              resolve({
                success: true,
                compressedFile,
                originalSize: file.size,
                compressedSize: blob.size,
                compressionRatio,
              })
            } else {
              resolve({
                success: false,
                originalSize: file.size,
                compressedSize: 0,
                compressionRatio: 0,
                error: 'Failed to compress image',
              })
            }
          },
          mimeType,
          quality
        )
      }

      img.onerror = () => {
        resolve({
          success: false,
          originalSize: file.size,
          compressedSize: 0,
          compressionRatio: 0,
          error: 'Failed to load image',
        })
      }

      img.src = URL.createObjectURL(file)
    })
  } catch (error: any) {
    return {
      success: false,
      originalSize: file.size,
      compressedSize: 0,
      compressionRatio: 0,
      error: error.message,
    }
  }
}

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
  maintainAspectRatio: boolean = true
): { width: number; height: number } {
  if (!maintainAspectRatio) {
    return { width: maxWidth, height: maxHeight }
  }

  const aspectRatio = originalWidth / originalHeight

  let width = originalWidth
  let height = originalHeight

  // Scale down if larger than max dimensions
  if (width > maxWidth) {
    width = maxWidth
    height = width / aspectRatio
  }

  if (height > maxHeight) {
    height = maxHeight
    width = height * aspectRatio
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  }
}

/**
 * Generate multiple image sizes for responsive display
 */
export async function generateImageSizes(file: File): Promise<{
  thumbnail: File
  medium: File
  large: File
  original: File
}> {
  const [thumbnail, medium, large] = await Promise.all([
    compressImage(file, { maxWidth: 300, maxHeight: 300, quality: 0.8 }),
    compressImage(file, { maxWidth: 800, maxHeight: 600, quality: 0.85 }),
    compressImage(file, { maxWidth: 1920, maxHeight: 1080, quality: 0.9 }),
  ])

  return {
    thumbnail: thumbnail.compressedFile || file,
    medium: medium.compressedFile || file,
    large: large.compressedFile || file,
    original: file,
  }
}

/**
 * Create optimized video thumbnail
 */
export async function createOptimizedVideoThumbnail(
  file: File,
  options: CompressionOptions = {}
): Promise<{
  thumbnail: File
  duration: number
  dimensions: { width: number; height: number }
}> {
  const { maxWidth = 800, maxHeight = 600, quality = 0.85 } = options

  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    video.onloadedmetadata = () => {
      const { width, height } = calculateDimensions(
        video.videoWidth,
        video.videoHeight,
        maxWidth,
        maxHeight,
        true
      )

      canvas.width = width
      canvas.height = height

      // Seek to 10% of duration for better thumbnail
      const seekTime = Math.min(2, video.duration * 0.1)
      video.currentTime = seekTime
    }

    video.onseeked = () => {
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to optimized blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const thumbnailFile = new File(
              [blob],
              `${file.name}_thumbnail.jpg`,
              {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }
            )

            resolve({
              thumbnail: thumbnailFile,
              duration: video.duration,
              dimensions: { width: canvas.width, height: canvas.height },
            })
          } else {
            reject(new Error('Failed to create thumbnail'))
          }
        },
        'image/jpeg',
        quality
      )
    }

    video.onerror = () => {
      reject(new Error('Failed to load video'))
    }

    video.src = URL.createObjectURL(file)
    video.load()
  })
}

/**
 * Validate and optimize media file for adult content platform
 */
export async function optimizeMediaForAdultContent(file: File): Promise<{
  optimizedFile: File
  thumbnail?: File
  metadata: {
    originalSize: number
    optimizedSize: number
    compressionRatio: number
    dimensions?: { width: number; height: number }
    duration?: number
  }
}> {
  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')

  if (isImage) {
    // Compress image for optimal quality/size balance
    const compressionResult = await compressImage(file, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.88,
      format: 'jpeg',
    })

    if (!compressionResult.success || !compressionResult.compressedFile) {
      throw new Error(compressionResult.error || 'Image compression failed')
    }

    // Generate thumbnail
    const thumbnailResult = await compressImage(file, {
      maxWidth: 400,
      maxHeight: 400,
      quality: 0.8,
      format: 'jpeg',
    })

    return {
      optimizedFile: compressionResult.compressedFile,
      thumbnail: thumbnailResult.compressedFile,
      metadata: {
        originalSize: compressionResult.originalSize,
        optimizedSize: compressionResult.compressedSize,
        compressionRatio: compressionResult.compressionRatio,
      },
    }
  } else if (isVideo) {
    // For videos, create optimized thumbnail
    const thumbnailData = await createOptimizedVideoThumbnail(file, {
      maxWidth: 800,
      maxHeight: 600,
      quality: 0.85,
    })

    return {
      optimizedFile: file, // Video compression would require server-side processing
      thumbnail: thumbnailData.thumbnail,
      metadata: {
        originalSize: file.size,
        optimizedSize: file.size,
        compressionRatio: 0,
        dimensions: thumbnailData.dimensions,
        duration: thumbnailData.duration,
      },
    }
  } else {
    throw new Error('Unsupported file type')
  }
}

/**
 * Check if file needs compression based on size and dimensions
 */
export async function shouldCompressFile(file: File): Promise<{
  shouldCompress: boolean
  reason?: string
  recommendedOptions?: CompressionOptions
}> {
  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')

  // Size thresholds
  const imageSizeThreshold = 2 * 1024 * 1024 // 2MB
  const videoSizeThreshold = 50 * 1024 * 1024 // 50MB

  if (isImage && file.size > imageSizeThreshold) {
    return {
      shouldCompress: true,
      reason: 'Image file size exceeds 2MB',
      recommendedOptions: {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        format: 'jpeg',
      },
    }
  }

  if (isVideo && file.size > videoSizeThreshold) {
    return {
      shouldCompress: true,
      reason: 'Video file size exceeds 50MB',
      recommendedOptions: {
        maxWidth: 1280,
        maxHeight: 720,
        quality: 0.8,
      },
    }
  }

  // Check image dimensions
  if (isImage) {
    try {
      const dimensions = await getImageDimensions(file)
      if (dimensions.width > 2560 || dimensions.height > 1440) {
        return {
          shouldCompress: true,
          reason: 'Image dimensions exceed recommended size (2560x1440)',
          recommendedOptions: {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.88,
          },
        }
      }
    } catch {
      // If we can't get dimensions, assume compression might be needed
      return {
        shouldCompress: true,
        reason: 'Unable to determine image dimensions',
        recommendedOptions: {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.85,
        },
      }
    }
  }

  return { shouldCompress: false }
}

/**
 * Get image dimensions without loading full image
 */
function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = URL.createObjectURL(file)
  })
}
