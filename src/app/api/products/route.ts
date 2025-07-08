import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { ContentWarning } from '@/lib/content-moderation'

interface CreateProductRequest {
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
  weight_grams?: number
  dimensions_cm?: Record<string, number>
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)
    const priceMin = searchParams.get('price_min')
    const priceMax = searchParams.get('price_max')
    const ratingMin = searchParams.get('rating_min')
    const inStockOnly = searchParams.get('in_stock_only') === 'true'
    const featuredOnly = searchParams.get('featured_only') === 'true'
    const userId = searchParams.get('user_id')
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('products')
      .select(`
        *,
        media:product_media(*),
        categories(name, slug),
        product_tags:product_tag_items(
          tag:product_tags(*)
        )
      `, { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (priceMin) {
      query = query.gte('price_cents', parseInt(priceMin))
    }

    if (priceMax) {
      query = query.lte('price_cents', parseInt(priceMax))
    }

    if (ratingMin) {
      query = query.gte('average_rating', parseFloat(ratingMin))
    }

    if (inStockOnly) {
      query = query.eq('stock_status', 'in_stock')
    }

    if (featuredOnly) {
      query = query.eq('featured', true)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    } else {
      // Only show approved products for public access
      query = query.eq('moderation_status', 'approved')
    }

    // Don't show archived products
    query = query.eq('is_archived', false)

    // Apply sorting
    const validSortFields = ['created_at', 'name', 'price_cents', 'average_rating', 'view_count', 'purchase_count']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at'
    query = query.order(sortField, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: products, error, count } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      products: products || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('Error in GET /api/products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateProductRequest = await request.json()

    // Validate required fields
    if (!body.name || !body.price_cents || !body.points_price || !body.category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, price_cents, points_price, category' },
        { status: 400 }
      )
    }

    // Validate price values
    if (body.price_cents < 0 || body.points_price < 0) {
      return NextResponse.json(
        { error: 'Prices must be non-negative' },
        { status: 400 }
      )
    }

    // Check if product name already exists for this user
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('name', body.name.trim())
      .eq('user_id', user.id)
      .single()

    if (existingProduct) {
      return NextResponse.json(
        { error: 'A product with this name already exists' },
        { status: 409 }
      )
    }

    // Create product
    const productData = {
      name: body.name.trim(),
      description: body.description?.trim(),
      price_cents: body.price_cents,
      points_price: body.points_price,
      category: body.category,
      content_warnings: body.content_warnings || ['sexual-content'],
      tags: body.tags || [],
      is_explicit: body.is_explicit ?? true,
      stock_quantity: body.stock_quantity ?? 0,
      shipping_required: body.shipping_required ?? false,
      license_type: body.license_type ?? 'standard',
      seo_title: body.seo_title?.trim(),
      seo_description: body.seo_description?.trim(),
      seo_keywords: body.seo_keywords || [],
      weight_grams: body.weight_grams,
      dimensions_cm: body.dimensions_cm,
      user_id: user.id,
      moderation_status: 'pending',
      age_restriction: 18,
      featured: false,
      view_count: 0,
      purchase_count: 0,
      average_rating: 0,
      total_reviews: 0,
      is_archived: false,
      // Temporary placeholder - will be updated when media is uploaded
      image_url: '/placeholder-product.jpg',
    }

    const { data: product, error: insertError } = await supabase
      .from('products')
      .insert(productData)
      .select(`
        *,
        media:product_media(*),
        categories(name, slug)
      `)
      .single()

    if (insertError) {
      console.error('Error creating product:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ product }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
