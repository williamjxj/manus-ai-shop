import { NextRequest, NextResponse } from 'next/server'

import { ContentWarning } from '@/lib/content-moderation'
import { createClient } from '@/lib/supabase/server'

interface UpdateProductRequest {
  name?: string
  description?: string
  price_cents?: number
  points_price?: number
  category?: string
  content_warnings?: ContentWarning[]
  tags?: string[]
  is_explicit?: boolean
  stock_quantity?: number
  stock_status?: 'in_stock' | 'out_of_stock' | 'discontinued' | 'pre_order'
  shipping_required?: boolean
  license_type?: string
  seo_title?: string
  seo_description?: string
  seo_keywords?: string[]
  weight_grams?: number
  dimensions_cm?: Record<string, number>
  featured?: boolean
  is_archived?: boolean
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: product, error } = await supabase
      .from('products')
      .select(
        `
        *,
        media:product_media(*),
        variants:product_variants(*),
        categories(name, slug),
        product_tags:product_tag_items(
          tag:product_tags(*)
        ),
        reviews:product_reviews(
          id,
          rating,
          review_text,
          is_anonymous,
          created_at,
          user:profiles(full_name)
        )
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Check if user can view this product
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // If product is not approved and user is not the owner, deny access
    if (
      product.moderation_status !== 'approved' &&
      (!user || product.user_id !== user.id)
    ) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Increment view count (fire and forget)
    if (product.moderation_status === 'approved') {
      try {
        await supabase
          .from('products')
          .update({ view_count: (product.view_count || 0) + 1 })
          .eq('id', id)
      } catch (error) {
        // Silently ignore view count update errors
        console.warn('Failed to update view count:', error)
      }
    }

    return NextResponse.json({ product })
  } catch (error: any) {
    console.error('Error in GET /api/products/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns the product
    const { data: existingProduct, error: productError } = await supabase
      .from('products')
      .select('user_id, name')
      .eq('id', id)
      .single()

    if (productError) {
      if (productError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ error: productError.message }, { status: 500 })
    }

    if (existingProduct.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body: UpdateProductRequest = await request.json()

    // Validate price values if provided
    if (
      (body.price_cents !== undefined && body.price_cents < 0) ||
      (body.points_price !== undefined && body.points_price < 0)
    ) {
      return NextResponse.json(
        { error: 'Prices must be non-negative' },
        { status: 400 }
      )
    }

    // Check if new name conflicts with existing products (if name is being changed)
    if (body.name && body.name.trim() !== existingProduct.name) {
      const { data: nameConflict } = await supabase
        .from('products')
        .select('id')
        .eq('name', body.name.trim())
        .eq('user_id', user.id)
        .neq('id', id)
        .single()

      if (nameConflict) {
        return NextResponse.json(
          { error: 'A product with this name already exists' },
          { status: 409 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Only include fields that are provided
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.description !== undefined)
      updateData.description = body.description?.trim()
    if (body.price_cents !== undefined)
      updateData.price_cents = body.price_cents
    if (body.points_price !== undefined)
      updateData.points_price = body.points_price
    if (body.category !== undefined) updateData.category = body.category
    if (body.content_warnings !== undefined)
      updateData.content_warnings = body.content_warnings
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.is_explicit !== undefined)
      updateData.is_explicit = body.is_explicit
    if (body.stock_quantity !== undefined)
      updateData.stock_quantity = body.stock_quantity
    if (body.stock_status !== undefined)
      updateData.stock_status = body.stock_status
    if (body.shipping_required !== undefined)
      updateData.shipping_required = body.shipping_required
    if (body.license_type !== undefined)
      updateData.license_type = body.license_type
    if (body.seo_title !== undefined)
      updateData.seo_title = body.seo_title?.trim()
    if (body.seo_description !== undefined)
      updateData.seo_description = body.seo_description?.trim()
    if (body.seo_keywords !== undefined)
      updateData.seo_keywords = body.seo_keywords
    if (body.weight_grams !== undefined)
      updateData.weight_grams = body.weight_grams
    if (body.dimensions_cm !== undefined)
      updateData.dimensions_cm = body.dimensions_cm
    if (body.featured !== undefined) updateData.featured = body.featured
    if (body.is_archived !== undefined)
      updateData.is_archived = body.is_archived

    // Update product
    const { data: product, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select(
        `
        *,
        media:product_media(*),
        variants:product_variants(*),
        categories(name, slug),
        product_tags:product_tag_items(
          tag:product_tags(*)
        )
      `
      )
      .single()

    if (updateError) {
      console.error('Error updating product:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ product })
  } catch (error: any) {
    console.error('Error in PATCH /api/products/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns the product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('user_id')
      .eq('id', id)
      .single()

    if (productError) {
      if (productError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ error: productError.message }, { status: 500 })
    }

    if (product.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all media files for cleanup
    const { data: mediaFiles } = await supabase
      .from('product_media')
      .select('media_url, thumbnail_url, media_type')
      .eq('product_id', id)

    // Delete the product (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting product:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Clean up storage files (best effort - don't fail if this doesn't work)
    if (mediaFiles && mediaFiles.length > 0) {
      for (const media of mediaFiles) {
        try {
          if (media.media_url) {
            const mediaPath = extractStoragePath(media.media_url)
            if (mediaPath) {
              const bucket = media.media_type === 'video' ? 'videos' : 'images'
              await supabase.storage.from(bucket).remove([mediaPath])
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

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/products/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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
