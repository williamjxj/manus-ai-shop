import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('id')
    const status = searchParams.get('status') || 'pending'

    const supabase = await createClient()

    if (productId) {
      // Get specific product status
      const { data, error } = await supabase
        .from('products')
        .select('id, name, moderation_status, created_at, moderated_at')
        .eq('id', productId)
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ product: data })
    } else {
      // Get products by status
      const { data, error } = await supabase
        .from('products')
        .select('id, name, moderation_status, created_at, moderated_at')
        .eq('moderation_status', status)
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({
        products: data,
        count: data.length,
        status: status,
      })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { productId, status, notes } = await request.json()

    if (!productId || !status) {
      return NextResponse.json(
        { error: 'Product ID and status are required' },
        { status: 400 }
      )
    }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: pending, approved, or rejected' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if user is authenticated (basic check)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('products')
      .update({
        moderation_status: status,
        moderated_at: new Date().toISOString(),
        moderator_notes: notes || null,
      })
      .eq('id', productId)
      .select('id, name, moderation_status')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (data.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: `Product ${status} successfully`,
      product: data[0],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
