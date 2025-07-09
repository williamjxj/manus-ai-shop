// =====================================================
// Product Management Utilities
// =====================================================
// Comprehensive product management functions for adult marketplace

import { ContentWarning } from '@/lib/content-moderation'
import { createClient } from '@/lib/supabase/client'

export interface ProductMedia {
  id: string
  product_id: string
  media_url: string
  media_type: 'image' | 'video'
  thumbnail_url?: string
  is_primary: boolean
  sort_order: number
  alt_text?: string
  file_size?: number
  duration_seconds?: number
  width?: number
  height?: number
  created_at: string
  updated_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  variant_name: string
  variant_options: Record<string, string>
  sku?: string
  price_cents?: number
  stock_quantity: number
  weight_grams?: number
  is_active: boolean
  sort_order: number
}

export interface ProductTag {
  id: string
  name: string
  slug: string
  description?: string
  usage_count: number
  is_featured: boolean
}

export interface ProductCollection {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  is_featured: boolean
  is_active: boolean
  sort_order: number
}

export interface Product {
  id: string
  name: string
  description?: string
  image_url: string
  media_url?: string
  media_type?: 'image' | 'video'
  thumbnail_url?: string
  duration_seconds?: number
  price_cents: number
  points_price: number
  category: string
  sku?: string
  stock_quantity: number
  stock_status: 'in_stock' | 'out_of_stock' | 'discontinued' | 'pre_order'
  weight_grams?: number
  dimensions_cm?: Record<string, number>
  shipping_required: boolean
  digital_download_url?: string
  license_type: 'standard' | 'extended' | 'commercial' | 'exclusive'
  moderation_status: 'pending' | 'approved' | 'rejected' | 'flagged'
  content_warnings?: ContentWarning[]
  age_restriction: number
  is_explicit: boolean
  user_id?: string
  tags?: string[]
  featured: boolean
  view_count: number
  purchase_count: number
  average_rating: number
  total_reviews: number
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  is_archived: boolean
  created_at: string
  updated_at: string
  // Relations
  media?: ProductMedia[]
  variants?: ProductVariant[]
  product_tags?: ProductTag[]
  collections?: ProductCollection[]
}

export interface CreateProductData {
  name: string
  description?: string
  price_cents: number
  points_price: number
  category: string
  content_warnings?: ContentWarning[]
  tags?: string[]
  is_explicit?: boolean
  stock_quantity?: number
  shipping_required?: boolean
  license_type?: string
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string
}

export interface ProductFilters {
  search?: string
  category?: string
  tags?: string[]
  price_min?: number
  price_max?: number
  rating_min?: number
  in_stock_only?: boolean
  featured_only?: boolean
  user_id?: string
  collection_id?: string
}

export interface ProductSortOptions {
  field:
    | 'created_at'
    | 'name'
    | 'price_cents'
    | 'average_rating'
    | 'view_count'
    | 'purchase_count'
  direction: 'asc' | 'desc'
}

/**
 * Create a new product
 */
export async function createProduct(
  data: CreateProductData
): Promise<{ data: Product | null; error: string | null }> {
  try {
    const supabase = createClient()

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        ...data,
        moderation_status: 'approved',
        age_restriction: 18,
        is_explicit: data.is_explicit ?? true,
        stock_quantity: data.stock_quantity ?? 0,
        shipping_required: data.shipping_required ?? false,
        license_type: data.license_type ?? 'standard',
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: product, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(
  data: UpdateProductData
): Promise<{ data: Product | null; error: string | null }> {
  try {
    const supabase = createClient()

    const { id, ...updateData } = data

    const { data: product, error } = await supabase
      .from('products')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: product, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

/**
 * Delete a product and its associated media
 */
export async function deleteProduct(
  productId: string
): Promise<{ error: string | null }> {
  try {
    const supabase = createClient()

    // First, get all media files to delete from storage
    const { data: mediaFiles } = await supabase
      .from('product_media')
      .select('media_url, thumbnail_url')
      .eq('product_id', productId)

    // Delete the product (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (deleteError) {
      return { error: deleteError.message }
    }

    // Clean up storage files (best effort - don't fail if this doesn't work)
    if (mediaFiles && mediaFiles.length > 0) {
      for (const media of mediaFiles) {
        try {
          if (media.media_url) {
            const mediaPath = extractStoragePath(media.media_url)
            if (mediaPath) {
              await supabase.storage.from('images').remove([mediaPath])
            }
          }
          if (media.thumbnail_url) {
            const thumbnailPath = extractStoragePath(media.thumbnail_url)
            if (thumbnailPath) {
              await supabase.storage.from('thumbnails').remove([thumbnailPath])
            }
          }
        } catch (storageError) {
          console.warn('Failed to delete storage file:', storageError)
        }
      }
    }

    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

/**
 * Get products with filtering and sorting
 */
export async function getProducts(
  filters: ProductFilters = {},
  sort: ProductSortOptions = { field: 'created_at', direction: 'desc' },
  limit: number = 20,
  offset: number = 0
): Promise<{ data: Product[]; error: string | null; count: number }> {
  try {
    const supabase = createClient()

    let query = supabase.from('products').select(
      `
        *,
        media:product_media(*)
      `,
      { count: 'exact' }
    )

    // Apply filters
    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      )
    }

    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category)
    }

    if (filters.price_min !== undefined) {
      query = query.gte('price_cents', filters.price_min)
    }

    if (filters.price_max !== undefined) {
      query = query.lte('price_cents', filters.price_max)
    }

    if (filters.rating_min !== undefined) {
      query = query.gte('average_rating', filters.rating_min)
    }

    if (filters.in_stock_only) {
      query = query.eq('stock_status', 'in_stock')
    }

    if (filters.featured_only) {
      query = query.eq('featured', true)
    }

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id)
    }

    // Only show approved products for non-owners
    query = query.eq('moderation_status', 'approved')
    query = query.eq('is_archived', false)

    // Apply sorting
    query = query.order(sort.field, { ascending: sort.direction === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      return { data: [], error: error.message, count: 0 }
    }

    return { data: data || [], error: null, count: count || 0 }
  } catch (error: any) {
    return { data: [], error: error.message, count: 0 }
  }
}

/**
 * Get a single product by ID with all relations
 */
export async function getProduct(
  productId: string
): Promise<{ data: Product | null; error: string | null }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('products')
      .select(
        `
        *,
        media:product_media(*)
      `
      )
      .eq('id', productId)
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

/**
 * Add media to a product
 */
export async function addProductMedia(
  productId: string,
  mediaData: Omit<
    ProductMedia,
    'id' | 'product_id' | 'created_at' | 'updated_at'
  >
): Promise<{ data: ProductMedia | null; error: string | null }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('product_media')
      .insert({
        product_id: productId,
        ...mediaData,
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

/**
 * Delete product media
 */
export async function deleteProductMedia(
  mediaId: string
): Promise<{ error: string | null }> {
  try {
    const supabase = createClient()

    // Get media info before deletion for storage cleanup
    const { data: media } = await supabase
      .from('product_media')
      .select('media_url, thumbnail_url')
      .eq('id', mediaId)
      .single()

    const { error } = await supabase
      .from('product_media')
      .delete()
      .eq('id', mediaId)

    if (error) {
      return { error: error.message }
    }

    // Clean up storage files
    if (media) {
      try {
        if (media.media_url) {
          const mediaPath = extractStoragePath(media.media_url)
          if (mediaPath) {
            await supabase.storage.from('images').remove([mediaPath])
          }
        }
        if (media.thumbnail_url) {
          const thumbnailPath = extractStoragePath(media.thumbnail_url)
          if (thumbnailPath) {
            await supabase.storage.from('thumbnails').remove([thumbnailPath])
          }
        }
      } catch (storageError) {
        console.warn('Failed to delete storage files:', storageError)
      }
    }

    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

/**
 * Track product analytics event
 */
export async function trackProductEvent(
  productId: string,
  eventType: 'view' | 'add_to_cart' | 'purchase' | 'favorite' | 'share',
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    const supabase = createClient()

    await supabase.from('product_analytics').insert({
      product_id: productId,
      event_type: eventType,
      metadata,
      session_id: getSessionId(),
    })
  } catch (error) {
    console.warn('Failed to track product event:', error)
  }
}

/**
 * Helper function to extract storage path from URL
 */
function extractStoragePath(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const storageIndex = pathParts.findIndex((part) => part === 'storage')
    if (storageIndex !== -1 && pathParts.length > storageIndex + 3) {
      return pathParts.slice(storageIndex + 3).join('/')
    }
    return null
  } catch {
    return null
  }
}

/**
 * Helper function to get or create session ID
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return 'server'

  let sessionId = sessionStorage.getItem('session_id')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    sessionStorage.setItem('session_id', sessionId)
  }
  return sessionId
}
