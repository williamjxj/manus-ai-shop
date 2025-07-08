import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { uploadImageToStorage, uploadVideoToStorage } from '@/lib/media-upload-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
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

    // Get all media for the product
    const { data: media, error: mediaError } = await supabase
      .from('product_media')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true })

    if (mediaError) {
      return NextResponse.json({ error: mediaError.message }, { status: 500 })
    }

    return NextResponse.json({ media })
  } catch (error: any) {
    console.error('Error fetching product media:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
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

    // Parse form data
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Check current media count
    const { count: currentMediaCount } = await supabase
      .from('product_media')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)

    const maxFiles = 10
    if ((currentMediaCount || 0) + files.length > maxFiles) {
      return NextResponse.json(
        { error: `Maximum ${maxFiles} files allowed per product` },
        { status: 400 }
      )
    }

    const uploadedMedia = []
    const errors = []

    // Process each file
    for (const file of files) {
      try {
        let uploadResult

        if (file.type.startsWith('image/')) {
          uploadResult = await uploadImageToStorage(file)
        } else if (file.type.startsWith('video/')) {
          uploadResult = await uploadVideoToStorage(file)
        } else {
          errors.push(`Unsupported file type: ${file.type}`)
          continue
        }

        if (!uploadResult.success || !uploadResult.url) {
          errors.push(`Failed to upload ${file.name}: ${uploadResult.error}`)
          continue
        }

        // Determine if this should be the primary media
        const isPrimary = (currentMediaCount || 0) === 0 && uploadedMedia.length === 0

        // Insert media record
        const { data: mediaRecord, error: insertError } = await supabase
          .from('product_media')
          .insert({
            product_id: productId,
            media_url: uploadResult.url,
            media_type: file.type.startsWith('image/') ? 'image' : 'video',
            thumbnail_url: uploadResult.thumbnailUrl,
            is_primary: isPrimary,
            file_size: uploadResult.fileSize,
            duration_seconds: uploadResult.duration,
            width: uploadResult.dimensions?.width,
            height: uploadResult.dimensions?.height,
            alt_text: `${file.name} - Product media`,
          })
          .select()
          .single()

        if (insertError) {
          errors.push(`Failed to save ${file.name}: ${insertError.message}`)
          continue
        }

        uploadedMedia.push(mediaRecord)
      } catch (error: any) {
        errors.push(`Error processing ${file.name}: ${error.message}`)
      }
    }

    // Update product's primary media URL for backward compatibility
    if (uploadedMedia.length > 0) {
      const primaryMedia = uploadedMedia.find(m => m.is_primary) || uploadedMedia[0]
      await supabase
        .from('products')
        .update({
          image_url: primaryMedia.media_url,
          media_url: primaryMedia.media_url,
          media_type: primaryMedia.media_type,
          thumbnail_url: primaryMedia.thumbnail_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedMedia,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('Error uploading product media:', error)
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
    const { id: productId } = await params
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
    const { action, mediaId, mediaOrder, altText } = body

    switch (action) {
      case 'reorder':
        if (!mediaOrder || !Array.isArray(mediaOrder)) {
          return NextResponse.json(
            { error: 'Invalid media order' },
            { status: 400 }
          )
        }

        // Update sort order for all media
        for (let i = 0; i < mediaOrder.length; i++) {
          await supabase
            .from('product_media')
            .update({ sort_order: i, updated_at: new Date().toISOString() })
            .eq('id', mediaOrder[i])
            .eq('product_id', productId)
        }

        return NextResponse.json({ success: true })

      case 'set_primary':
        if (!mediaId) {
          return NextResponse.json(
            { error: 'Media ID required' },
            { status: 400 }
          )
        }

        // Unset current primary
        await supabase
          .from('product_media')
          .update({ is_primary: false, updated_at: new Date().toISOString() })
          .eq('product_id', productId)
          .eq('is_primary', true)

        // Set new primary
        const { data: newPrimary, error: primaryError } = await supabase
          .from('product_media')
          .update({ is_primary: true, updated_at: new Date().toISOString() })
          .eq('id', mediaId)
          .eq('product_id', productId)
          .select()
          .single()

        if (primaryError) {
          return NextResponse.json(
            { error: primaryError.message },
            { status: 500 }
          )
        }

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

        return NextResponse.json({ success: true })

      case 'update_alt_text':
        if (!mediaId) {
          return NextResponse.json(
            { error: 'Media ID required' },
            { status: 400 }
          )
        }

        await supabase
          .from('product_media')
          .update({ alt_text: altText, updated_at: new Date().toISOString() })
          .eq('id', mediaId)
          .eq('product_id', productId)

        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error updating product media:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
