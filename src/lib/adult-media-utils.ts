import { ContentWarning } from '@/lib/content-moderation'
import { createClient } from '@/lib/supabase/client'

export interface AdultMediaValidationResult {
  isValid: boolean
  error?: string
  warnings?: string[]
  contentWarnings?: ContentWarning[]
}

export interface SecureUploadResult {
  success: boolean
  url?: string
  thumbnailUrl?: string
  error?: string
  fileSize?: number
  duration?: number
  dimensions?: { width: number; height: number }
  contentHash?: string
  metadata?: AdultMediaMetadata
}

export interface AdultMediaMetadata {
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
  contentHash: string
  uploadedBy: string
  isExplicit: boolean
  contentWarnings: ContentWarning[]
  ageRestriction: number
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'flagged'
}

/**
 * Enhanced validation for adult content media files
 */
export function validateAdultMediaFile(file: File): AdultMediaValidationResult {
  const warnings: string[] = []
  const contentWarnings: ContentWarning[] = []

  // Basic file validation
  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')

  if (!isImage && !isVideo) {
    return {
      isValid: false,
      error: 'Only image and video files are allowed for adult content',
    }
  }

  // File size validation (stricter for adult content)
  const maxImageSize = 15 * 1024 * 1024 // 15MB for images
  const maxVideoSize = 200 * 1024 * 1024 // 200MB for videos

  if (isImage && file.size > maxImageSize) {
    return {
      isValid: false,
      error: 'Image size must be less than 15MB for adult content',
    }
  }

  if (isVideo && file.size > maxVideoSize) {
    return {
      isValid: false,
      error: 'Video size must be less than 200MB for adult content',
    }
  }

  // Enhanced format validation for adult content
  const allowedImageTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ]

  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime']

  if (isImage && !allowedImageTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Supported image formats for adult content: JPEG, PNG, WebP',
    }
  }

  if (isVideo && !allowedVideoTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Supported video formats for adult content: MP4, WebM, QuickTime',
    }
  }

  // File name validation (no explicit terms in filename for security)
  const explicitTerms = ['sex', 'porn', 'xxx', 'nude', 'naked']
  const fileName = file.name.toLowerCase()

  if (explicitTerms.some((term) => fileName.includes(term))) {
    warnings.push('Consider using a more discrete filename for better privacy')
  }

  // Auto-detect potential content warnings based on file characteristics
  if (file.size > 5 * 1024 * 1024) {
    // Large files might be high quality explicit content
    contentWarnings.push('sexual-content')
  }

  return {
    isValid: true,
    warnings,
    contentWarnings,
  }
}

/**
 * Generate secure filename with content hash for adult content
 */
export async function generateSecureFilename(
  file: File,
  userId: string
): Promise<string> {
  // Create content hash for deduplication and security
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  // Use first 16 characters of hash + timestamp + user prefix
  const timestamp = Date.now()
  const userPrefix = userId.slice(0, 8)
  const extension = file.name.split('.').pop()?.toLowerCase() || 'bin'

  return `${userPrefix}_${timestamp}_${hashHex.slice(0, 16)}.${extension}`
}

/**
 * Upload adult content to secure storage with enhanced security
 */
export async function uploadAdultContentToStorage(
  file: File,
  userId: string,
  contentWarnings: ContentWarning[] = [],
  isExplicit: boolean = true
): Promise<SecureUploadResult> {
  try {
    // Validate file
    const validation = validateAdultMediaFile(file)
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      }
    }

    const supabase = createClient()
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    // Generate secure filename
    const secureFileName = await generateSecureFilename(file, userId)

    // Determine bucket based on content type and explicit nature
    const bucketName = isExplicit
      ? isImage
        ? 'adult-images'
        : 'adult-videos'
      : isImage
        ? 'images'
        : 'videos'

    const filePath = `products/${secureFileName}`

    // Upload to appropriate bucket
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
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
    } = supabase.storage.from(bucketName).getPublicUrl(filePath)

    // Generate thumbnail for videos
    let thumbnailUrl: string | undefined
    let duration: number | undefined
    let dimensions: { width: number; height: number } | undefined

    if (isVideo) {
      try {
        const videoMetadata = await createVideoThumbnail(file)
        duration = videoMetadata.duration
        dimensions = videoMetadata.dimensions

        // Upload thumbnail to images bucket
        if (videoMetadata.thumbnailBlob) {
          const thumbnailFileName = secureFileName.replace(
            /\.[^.]+$/,
            '_thumb.jpg'
          )
          const thumbnailPath = `thumbnails/${thumbnailFileName}`

          const { error: thumbError } = await supabase.storage
            .from('images')
            .upload(thumbnailPath, videoMetadata.thumbnailBlob, {
              cacheControl: '3600',
              contentType: 'image/jpeg',
            })

          if (!thumbError) {
            const {
              data: { publicUrl: thumbUrl },
            } = supabase.storage.from('images').getPublicUrl(thumbnailPath)
            thumbnailUrl = thumbUrl
          }
        }
      } catch (error) {
        console.warn('Failed to generate video thumbnail:', error)
      }
    }

    // Create content hash for deduplication
    const arrayBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const contentHash = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    // Store metadata in media_files table
    const mediaMetadata: Partial<AdultMediaMetadata> = {
      fileName: secureFileName,
      fileSize: file.size,
      mimeType: file.type,
      mediaType: isImage ? 'image' : 'video',
      bucketName,
      publicUrl,
      thumbnailUrl,
      duration,
      width: dimensions?.width,
      height: dimensions?.height,
      contentHash,
      uploadedBy: userId,
      isExplicit,
      contentWarnings,
      ageRestriction: 18,
      moderationStatus: 'pending',
    }

    const { error: metadataError } = await supabase.from('media_files').insert({
      user_id: userId,
      file_name: secureFileName,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      media_type: isImage ? 'image' : 'video',
      bucket_name: bucketName,
      public_url: publicUrl,
      thumbnail_url: thumbnailUrl,
      duration_seconds: duration,
      width: dimensions?.width,
      height: dimensions?.height,
    })

    if (metadataError) {
      console.warn('Failed to store media metadata:', metadataError)
    }

    return {
      success: true,
      url: publicUrl,
      thumbnailUrl,
      fileSize: file.size,
      duration,
      dimensions,
      contentHash,
      metadata: mediaMetadata as AdultMediaMetadata,
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
 * Create video thumbnail with enhanced quality for adult content
 */
export function createVideoThumbnail(file: File): Promise<{
  thumbnailBlob: Blob
  duration: number
  dimensions: { width: number; height: number }
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    video.onloadedmetadata = () => {
      // Set canvas dimensions (max 1920x1080 for thumbnails)
      const maxWidth = 1920
      const maxHeight = 1080
      const aspectRatio = video.videoWidth / video.videoHeight

      let width = video.videoWidth
      let height = video.videoHeight

      if (width > maxWidth) {
        width = maxWidth
        height = width / aspectRatio
      }

      if (height > maxHeight) {
        height = maxHeight
        width = height * aspectRatio
      }

      canvas.width = width
      canvas.height = height

      // Seek to 10% of duration for better thumbnail
      const seekTime = Math.min(2, video.duration * 0.1)
      video.currentTime = seekTime
    }

    video.onseeked = () => {
      // Draw video frame to canvas
      ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to blob with high quality
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              thumbnailBlob: blob,
              duration: video.duration,
              dimensions: { width: canvas.width, height: canvas.height },
            })
          } else {
            reject(new Error('Failed to create thumbnail blob'))
          }
        },
        'image/jpeg',
        0.9
      ) // High quality JPEG
    }

    video.onerror = () => {
      reject(new Error('Failed to load video for thumbnail generation'))
    }

    video.src = URL.createObjectURL(file)
    video.load()
  })
}

/**
 * Check for duplicate content using content hash
 */
export async function checkContentDuplication(
  contentHash: string,
  userId: string
): Promise<{
  isDuplicate: boolean
  existingProductId?: string
}> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('media_files')
      .select('id, user_id')
      .eq('content_hash', contentHash)
      .limit(1)

    if (error) throw error

    if (data && data.length > 0) {
      const existingFile = data[0]
      return {
        isDuplicate: true,
        existingProductId:
          existingFile.user_id === userId ? existingFile.id : undefined,
      }
    }

    return { isDuplicate: false }
  } catch (error) {
    console.error('Error checking content duplication:', error)
    return { isDuplicate: false }
  }
}

/**
 * Get secure download URL with time-limited access for premium content
 */
export async function getSecureDownloadUrl(
  bucketName: string,
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn)

    if (error) throw error
    return data.signedUrl
  } catch (error) {
    console.error('Error creating signed URL:', error)
    return null
  }
}
