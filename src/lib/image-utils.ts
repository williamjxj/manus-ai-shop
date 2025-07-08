// =====================================================
// Image Utilities
// =====================================================
// Utilities for handling images safely across the application

import { Product } from '@/lib/product-management'

/**
 * Get a safe image URL with fallback to placeholder
 */
export function getSafeImageUrl(
  url?: string | null,
  fallback: string = '/placeholder-product.svg'
): string {
  if (!url || url.trim() === '') {
    return fallback
  }
  return url
}

/**
 * Get the primary image URL from a product with fallback
 */
export function getProductImageUrl(product: Partial<Product>): string {
  // Try primary media first
  const primaryMedia = product.media?.find((m) => m.is_primary)
  if (primaryMedia?.media_url) {
    return getSafeImageUrl(primaryMedia.media_url)
  }

  // Try first media item
  const firstMedia = product.media?.[0]
  if (firstMedia?.media_url) {
    return getSafeImageUrl(firstMedia.media_url)
  }

  // Try legacy image_url
  if (product.image_url) {
    return getSafeImageUrl(product.image_url)
  }

  // Return placeholder
  return '/placeholder-product.svg'
}

/**
 * Get the thumbnail URL from a product with fallback
 */
export function getProductThumbnailUrl(product: Partial<Product>): string {
  // Try primary media thumbnail first
  const primaryMedia = product.media?.find((m) => m.is_primary)
  if (primaryMedia?.thumbnail_url) {
    return getSafeImageUrl(primaryMedia.thumbnail_url)
  }

  // Try first media thumbnail
  const firstMedia = product.media?.[0]
  if (firstMedia?.thumbnail_url) {
    return getSafeImageUrl(firstMedia.thumbnail_url)
  }

  // Fall back to main image
  return getProductImageUrl(product)
}

/**
 * Check if a product has video content
 */
export function hasVideoContent(product: Partial<Product>): boolean {
  return product.media?.some((m) => m.media_type === 'video') || false
}

/**
 * Get video URL from product
 */
export function getProductVideoUrl(product: Partial<Product>): string | null {
  const videoMedia = product.media?.find((m) => m.media_type === 'video')
  return videoMedia?.media_url || null
}

/**
 * Get all image URLs from a product
 */
export function getProductImageUrls(product: Product): string[] {
  const imageMedia =
    product.media?.filter((m) => m.media_type === 'image') || []
  return imageMedia.map((m) => getSafeImageUrl(m.media_url))
}

/**
 * Get optimized image URL with size parameters
 */
export function getOptimizedImageUrl(
  url: string,
  width?: number,
  height?: number,
  quality: number = 80
): string {
  if (!url || url === '/placeholder-product.svg') {
    return url
  }

  // If it's a Supabase storage URL, we can add transformation parameters
  if (url.includes('supabase')) {
    const urlObj = new URL(url)
    const params = new URLSearchParams()

    if (width) params.set('width', width.toString())
    if (height) params.set('height', height.toString())
    params.set('quality', quality.toString())

    if (params.toString()) {
      urlObj.search = params.toString()
    }

    return urlObj.toString()
  }

  return url
}

/**
 * Generate srcSet for responsive images
 */
export function generateSrcSet(
  baseUrl: string,
  sizes: number[] = [400, 800, 1200]
): string {
  if (!baseUrl || baseUrl === '/placeholder-product.svg') {
    return baseUrl
  }

  return sizes
    .map((size) => `${getOptimizedImageUrl(baseUrl, size)} ${size}w`)
    .join(', ')
}

/**
 * Get image dimensions from URL or return defaults
 */
export function getImageDimensions(product: Product): {
  width: number
  height: number
} {
  const primaryMedia =
    product.media?.find((m) => m.is_primary) || product.media?.[0]

  return {
    width: primaryMedia?.width || 800,
    height: primaryMedia?.height || 600,
  }
}

/**
 * Check if image URL is valid
 */
export function isValidImageUrl(url?: string | null): boolean {
  if (!url || url.trim() === '') {
    return false
  }

  try {
    new URL(url)
    return true
  } catch {
    // If it's a relative path, it might still be valid
    return url.startsWith('/') || url.startsWith('./') || url.startsWith('../')
  }
}

/**
 * Get image alt text with fallback
 */
export function getImageAltText(
  product: Product,
  mediaIndex: number = 0
): string {
  const media = product.media?.[mediaIndex]

  if (media?.alt_text) {
    return media.alt_text
  }

  return `${product.name} - Image ${mediaIndex + 1}`
}

/**
 * Image loading priorities for performance
 */
export const IMAGE_PRIORITIES = {
  HERO: true,
  ABOVE_FOLD: true,
  BELOW_FOLD: false,
  LAZY: false,
} as const

/**
 * Get appropriate image sizes for different contexts
 */
export const IMAGE_SIZES = {
  THUMBNAIL: '(max-width: 768px) 100px, 150px',
  CARD: '(max-width: 768px) 50vw, 25vw',
  GALLERY: '(max-width: 768px) 100vw, 50vw',
  HERO: '100vw',
  FULL: '100vw',
} as const

/**
 * Common image quality settings
 */
export const IMAGE_QUALITY = {
  LOW: 60,
  MEDIUM: 75,
  HIGH: 85,
  LOSSLESS: 100,
} as const
