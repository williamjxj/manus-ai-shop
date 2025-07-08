import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  try {
    const { id: productId, mediaId } = await params
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
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get media info before deletion for storage cleanup
    const { data: media, error: mediaError } = await supabase
      .from('product_media')
      .select('*')
      .eq('id', mediaId)
      .eq('product_id', productId)
      .single()

    if (mediaError || !media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Check if this is the only media file
    const { count: mediaCount } = await supabase
      .from('product_media')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)

    if (mediaCount === 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last media file. Products must have at least one media file.' },
        { status: 400 }
      )
    }

    // Delete the media record
    const { error: deleteError } = await supabase
      .from('product_media')
      .delete()
      .eq('id', mediaId)
      .eq('product_id', productId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Clean up storage files (best effort - don't fail if this doesn't work)
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
      console.warn('Failed to delete storage files:', storageError)
      // Don't fail the request for storage cleanup failures
    }

    // If the deleted media was primary, set a new primary
    if (media.is_primary) {
      const { data: newPrimary } = await supabase
        .from('product_media')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true })
        .limit(1)
        .single()

      if (newPrimary) {
        // Set new primary
        await supabase
          .from('product_media')
          .update({ is_primary: true, updated_at: new Date().toISOString() })
          .eq('id', newPrimary.id)

        // Update product's primary media for backward compatibility
        await supabase
          .from('products')
          .update({
            image_url: newPrimary.media_url,
            media_url: newPrimary.media_url,
            media_type: newPrimary.media_type,
            thumbnail_url: newPrimary.thumbnail_url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', productId)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting product media:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  try {
    const { id: productId, mediaId } = await params
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
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { alt_text, sort_order } = body

    // Update media
    const { data: updatedMedia, error: updateError } = await supabase
      .from('product_media')
      .update({
        ...(alt_text !== undefined && { alt_text }),
        ...(sort_order !== undefined && { sort_order }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', mediaId)
      .eq('product_id', productId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, media: updatedMedia })
  } catch (error: any) {
    console.error('Error updating product media:', error)
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
    const storageIndex = pathParts.findIndex(part => part === 'storage')
    if (storageIndex !== -1 && pathParts.length > storageIndex + 3) {
      return pathParts.slice(storageIndex + 3).join('/')
    }
    return null
  } catch {
    return null
  }
}
