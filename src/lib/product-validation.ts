// =====================================================
// Product Validation Utilities
// =====================================================
// Comprehensive validation for product data and operations

import { ContentWarning, CONTENT_WARNINGS } from '@/lib/content-moderation'
import { ADULT_CATEGORIES } from '@/constants/categories'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface ProductValidationData {
  name?: string
  description?: string
  price_cents?: number
  points_price?: number
  category?: string
  content_warnings?: ContentWarning[]
  tags?: string[]
  is_explicit?: boolean
  stock_quantity?: number
  weight_grams?: number
  dimensions_cm?: Record<string, number>
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
}

/**
 * Validate product data for creation or update
 */
export function validateProductData(
  data: ProductValidationData,
  isUpdate: boolean = false
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Name validation
  if (data.name !== undefined) {
    if (!data.name || data.name.trim().length === 0) {
      if (!isUpdate) errors.push('Product name is required')
    } else {
      const trimmedName = data.name.trim()
      if (trimmedName.length < 3) {
        errors.push('Product name must be at least 3 characters long')
      }
      if (trimmedName.length > 100) {
        errors.push('Product name must be less than 100 characters')
      }
      if (!/^[a-zA-Z0-9\s\-_.,!?()&]+$/.test(trimmedName)) {
        errors.push('Product name contains invalid characters')
      }
    }
  } else if (!isUpdate) {
    errors.push('Product name is required')
  }

  // Description validation
  if (data.description !== undefined && data.description) {
    const trimmedDescription = data.description.trim()
    if (trimmedDescription.length > 2000) {
      errors.push('Product description must be less than 2000 characters')
    }
    if (trimmedDescription.length < 10) {
      warnings.push('Product description is very short. Consider adding more details.')
    }
  }

  // Price validation
  if (data.price_cents !== undefined) {
    if (!Number.isInteger(data.price_cents) || data.price_cents < 0) {
      errors.push('Price must be a non-negative integer (in cents)')
    } else if (data.price_cents === 0) {
      warnings.push('Product is set as free. Consider if this is intentional.')
    } else if (data.price_cents > 100000000) { // $1M limit
      errors.push('Price cannot exceed $1,000,000')
    }
  } else if (!isUpdate) {
    errors.push('Product price is required')
  }

  // Points price validation
  if (data.points_price !== undefined) {
    if (!Number.isInteger(data.points_price) || data.points_price < 0) {
      errors.push('Points price must be a non-negative integer')
    } else if (data.points_price > 100000) {
      errors.push('Points price cannot exceed 100,000 points')
    }
  } else if (!isUpdate) {
    errors.push('Points price is required')
  }

  // Category validation
  if (data.category !== undefined) {
    if (!data.category) {
      if (!isUpdate) errors.push('Product category is required')
    } else if (!ADULT_CATEGORIES.includes(data.category as any)) {
      errors.push('Invalid product category')
    }
  } else if (!isUpdate) {
    errors.push('Product category is required')
  }

  // Content warnings validation
  if (data.content_warnings !== undefined) {
    if (!Array.isArray(data.content_warnings)) {
      errors.push('Content warnings must be an array')
    } else {
      const invalidWarnings = data.content_warnings.filter(
        warning => !Object.keys(CONTENT_WARNINGS).includes(warning)
      )
      if (invalidWarnings.length > 0) {
        errors.push(`Invalid content warnings: ${invalidWarnings.join(', ')}`)
      }
      if (data.content_warnings.length === 0) {
        warnings.push('No content warnings specified. Consider adding appropriate warnings.')
      }
    }
  }

  // Tags validation
  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      errors.push('Tags must be an array')
    } else {
      if (data.tags.length > 20) {
        errors.push('Maximum 20 tags allowed')
      }
      const invalidTags = data.tags.filter(tag => 
        typeof tag !== 'string' || 
        tag.trim().length === 0 || 
        tag.length > 50 ||
        !/^[a-zA-Z0-9\s\-_]+$/.test(tag)
      )
      if (invalidTags.length > 0) {
        errors.push('Tags must be non-empty strings with valid characters (max 50 chars each)')
      }
    }
  }

  // Stock quantity validation
  if (data.stock_quantity !== undefined) {
    if (!Number.isInteger(data.stock_quantity) || data.stock_quantity < 0) {
      errors.push('Stock quantity must be a non-negative integer')
    } else if (data.stock_quantity > 1000000) {
      errors.push('Stock quantity cannot exceed 1,000,000')
    }
  }

  // Weight validation
  if (data.weight_grams !== undefined && data.weight_grams !== null) {
    if (!Number.isInteger(data.weight_grams) || data.weight_grams < 0) {
      errors.push('Weight must be a non-negative integer (in grams)')
    } else if (data.weight_grams > 100000000) { // 100 tons limit
      errors.push('Weight cannot exceed 100,000,000 grams (100 tons)')
    }
  }

  // Dimensions validation
  if (data.dimensions_cm !== undefined && data.dimensions_cm !== null) {
    if (typeof data.dimensions_cm !== 'object') {
      errors.push('Dimensions must be an object')
    } else {
      const requiredDimensions = ['length', 'width', 'height']
      const providedDimensions = Object.keys(data.dimensions_cm)
      
      for (const dim of requiredDimensions) {
        if (!(dim in data.dimensions_cm)) {
          errors.push(`Missing dimension: ${dim}`)
        } else {
          const value = data.dimensions_cm[dim]
          if (typeof value !== 'number' || value < 0) {
            errors.push(`${dim} must be a non-negative number`)
          } else if (value > 10000) { // 100 meters limit
            errors.push(`${dim} cannot exceed 10,000 cm (100 meters)`)
          }
        }
      }

      const extraDimensions = providedDimensions.filter(
        dim => !requiredDimensions.includes(dim)
      )
      if (extraDimensions.length > 0) {
        warnings.push(`Extra dimensions will be ignored: ${extraDimensions.join(', ')}`)
      }
    }
  }

  // SEO validation
  if (data.seo_title !== undefined && data.seo_title) {
    if (data.seo_title.length > 60) {
      warnings.push('SEO title is longer than 60 characters. Consider shortening for better SEO.')
    }
  }

  if (data.seo_description !== undefined && data.seo_description) {
    if (data.seo_description.length > 160) {
      warnings.push('SEO description is longer than 160 characters. Consider shortening for better SEO.')
    }
  }

  if (data.seo_keywords !== undefined) {
    if (!Array.isArray(data.seo_keywords)) {
      errors.push('SEO keywords must be an array')
    } else if (data.seo_keywords.length > 10) {
      warnings.push('More than 10 SEO keywords may not be effective. Consider focusing on the most important ones.')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate file upload for products
 */
export function validateProductFile(file: File): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // File size limits
  const maxImageSize = 50 * 1024 * 1024 // 50MB
  const maxVideoSize = 500 * 1024 * 1024 // 500MB

  if (file.type.startsWith('image/')) {
    if (file.size > maxImageSize) {
      errors.push(`Image file size cannot exceed ${maxImageSize / (1024 * 1024)}MB`)
    }
    
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedImageTypes.includes(file.type)) {
      errors.push('Only JPEG, PNG, WebP, and GIF images are allowed')
    }
  } else if (file.type.startsWith('video/')) {
    if (file.size > maxVideoSize) {
      errors.push(`Video file size cannot exceed ${maxVideoSize / (1024 * 1024)}MB`)
    }
    
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime']
    if (!allowedVideoTypes.includes(file.type)) {
      errors.push('Only MP4, WebM, and QuickTime videos are allowed')
    }
  } else {
    errors.push('Only image and video files are allowed')
  }

  // File name validation
  if (file.name.length > 255) {
    errors.push('File name is too long (max 255 characters)')
  }

  if (!/^[a-zA-Z0-9\s\-_.,()]+\.[a-zA-Z0-9]+$/.test(file.name)) {
    warnings.push('File name contains special characters that may cause issues')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate bulk operations
 */
export function validateBulkOperation(
  operation: 'delete' | 'archive' | 'feature' | 'update_category',
  productIds: string[],
  data?: any
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!Array.isArray(productIds) || productIds.length === 0) {
    errors.push('No products selected for bulk operation')
    return { isValid: false, errors, warnings }
  }

  if (productIds.length > 100) {
    errors.push('Cannot perform bulk operation on more than 100 products at once')
  }

  // Validate product IDs format
  const invalidIds = productIds.filter(id => 
    typeof id !== 'string' || 
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
  if (invalidIds.length > 0) {
    errors.push('Invalid product ID format detected')
  }

  // Operation-specific validation
  switch (operation) {
    case 'delete':
      if (productIds.length > 10) {
        warnings.push('Deleting many products at once. This action cannot be undone.')
      }
      break

    case 'update_category':
      if (!data?.category || !ADULT_CATEGORIES.includes(data.category)) {
        errors.push('Valid category is required for bulk category update')
      }
      break

    case 'archive':
    case 'feature':
      // No additional validation needed
      break

    default:
      errors.push('Invalid bulk operation type')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate product search/filter parameters
 */
export function validateSearchParams(params: Record<string, any>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (params.search && typeof params.search === 'string') {
    if (params.search.length > 100) {
      errors.push('Search query is too long (max 100 characters)')
    }
  }

  if (params.price_min !== undefined) {
    const priceMin = Number(params.price_min)
    if (isNaN(priceMin) || priceMin < 0) {
      errors.push('Minimum price must be a non-negative number')
    }
  }

  if (params.price_max !== undefined) {
    const priceMax = Number(params.price_max)
    if (isNaN(priceMax) || priceMax < 0) {
      errors.push('Maximum price must be a non-negative number')
    }
  }

  if (params.price_min !== undefined && params.price_max !== undefined) {
    const priceMin = Number(params.price_min)
    const priceMax = Number(params.price_max)
    if (!isNaN(priceMin) && !isNaN(priceMax) && priceMin > priceMax) {
      errors.push('Minimum price cannot be greater than maximum price')
    }
  }

  if (params.rating_min !== undefined) {
    const rating = Number(params.rating_min)
    if (isNaN(rating) || rating < 0 || rating > 5) {
      errors.push('Minimum rating must be between 0 and 5')
    }
  }

  if (params.limit !== undefined) {
    const limit = Number(params.limit)
    if (isNaN(limit) || limit < 1 || limit > 100) {
      errors.push('Limit must be between 1 and 100')
    }
  }

  if (params.offset !== undefined) {
    const offset = Number(params.offset)
    if (isNaN(offset) || offset < 0) {
      errors.push('Offset must be a non-negative number')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}
