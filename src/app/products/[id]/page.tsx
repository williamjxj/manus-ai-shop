import { ArrowLeft, Calendar, Download, Eye, Heart, Share2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import AddToCartButton from '@/components/AddToCartButton'
import ProductActionButtons from '@/components/ProductActionButtons'
import ProductMediaGallery from '@/components/ProductMediaGallery'
import ProductReviews from '@/components/ProductReviews'
import { getSafeImageUrl } from '@/lib/image-utils'
import { createClient } from '@/lib/supabase/server'

interface ProductPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: product, error } = await supabase
    .from('products')
    .select(
      `
      *,
      media:product_media(*)
    `
    )
    .eq('id', id)
    .single()

  if (error || !product) {
    notFound()
  }

  const canView =
    product.moderation_status === 'approved' ||
    (user && product.user_id === user.id)

  if (!canView) {
    notFound()
  }

  supabase
    .from('products')
    .update({ view_count: (product.view_count || 0) + 1 })
    .eq('id', id)
    .then(() => {})

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
      <div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
        <div className='mb-6 flex items-center justify-between'>
          <Link
            href='/products'
            className='group inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-medium text-indigo-600 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-50 hover:text-indigo-800 hover:shadow-md'
          >
            <ArrowLeft className='h-4 w-4 transition-transform group-hover:-translate-x-1' />
            Back to Gallery
          </Link>

          {/* Moderation Status Badge for Product Owners */}
          {user &&
            product.user_id === user.id &&
            product.moderation_status !== 'approved' && (
              <div
                className={`rounded-full px-3 py-1 text-sm font-medium ${
                  product.moderation_status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : product.moderation_status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-orange-100 text-orange-800'
                }`}
              >
                {product.moderation_status === 'pending' && '⏳ Pending Review'}
                {product.moderation_status === 'rejected' && '❌ Rejected'}
                {product.moderation_status === 'flagged' && '🚩 Flagged'}
              </div>
            )}
        </div>

        <div className='mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3 xl:gap-12'>
          {/* Product Media Gallery - Takes 2 columns on large screens */}
          <div className='space-y-6 lg:col-span-2'>
            <div className='overflow-hidden rounded-2xl bg-white p-4 shadow-xl ring-1 ring-gray-200'>
              {/* Use ProductMediaGallery if product has media array, otherwise show single image */}
              {product.media && product.media.length > 0 ? (
                <ProductMediaGallery
                  media={product.media}
                  productName={product.name}
                  className='w-full'
                />
              ) : (
                <div className='relative flex max-h-[70vh] min-h-[300px] w-full items-center justify-center'>
                  <Image
                    src={getSafeImageUrl(product.image_url)}
                    alt={product.name}
                    width={800}
                    height={600}
                    className='max-h-full max-w-full rounded-lg object-contain'
                    priority
                  />
                </div>
              )}
            </div>

            {/* Media Count Info */}
            {product.media && product.media.length > 1 && (
              <div className='text-center'>
                <span className='inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg'>
                  📷 {product.media.length} media file
                  {product.media.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Product Details - Sticky sidebar */}
          <div className='space-y-6 lg:sticky lg:top-6 lg:h-fit'>
            {/* Product Info */}
            <div className='rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-200'>
              <div className='mb-4 flex items-start justify-between'>
                <div className='flex-1'>
                  <h1 className='text-2xl font-bold leading-tight text-gray-900 lg:text-3xl'>
                    {product.name}
                  </h1>
                  {/* Category */}
                  {product.categories && (
                    <Link
                      href={`/products?category=${product.categories.slug}`}
                      className='mt-2 inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 transition-all hover:scale-105 hover:bg-indigo-200 hover:shadow-sm'
                    >
                      {product.categories.name}
                    </Link>
                  )}
                </div>
                <div className='ml-4 flex items-center gap-1'>
                  <button className='group rounded-full p-2 text-gray-400 transition-all hover:scale-110 hover:bg-red-50 hover:text-red-500 active:scale-95'>
                    <Heart className='h-5 w-5 transition-transform group-hover:scale-110' />
                  </button>
                  <button className='group rounded-full p-2 text-gray-400 transition-all hover:scale-110 hover:bg-indigo-50 hover:text-indigo-500 active:scale-95'>
                    <Share2 className='h-5 w-5 transition-transform group-hover:scale-110' />
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className='mb-6 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 p-4'>
                <div className='text-center'>
                  <span className='text-3xl font-bold text-gray-900 lg:text-4xl'>
                    {product.points_price} points
                  </span>
                  <div className='mt-1 text-lg text-gray-600'>
                    (${(product.points_price * 0.01).toFixed(2)})
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className='mb-6 grid grid-cols-3 gap-4'>
                <div className='group rounded-lg bg-gray-50 p-3 text-center transition-all hover:-translate-y-1 hover:bg-gray-100 hover:shadow-md'>
                  <div className='flex items-center justify-center gap-1 text-gray-600 group-hover:text-indigo-600'>
                    <Eye className='h-4 w-4 transition-transform group-hover:scale-110' />
                  </div>
                  <div className='mt-1 text-lg font-semibold text-gray-900'>
                    {product.view_count || 0}
                  </div>
                  <div className='text-xs text-gray-500'>views</div>
                </div>
                <div className='group rounded-lg bg-gray-50 p-3 text-center transition-all hover:-translate-y-1 hover:bg-gray-100 hover:shadow-md'>
                  <div className='flex items-center justify-center gap-1 text-gray-600 group-hover:text-green-600'>
                    <Download className='h-4 w-4 transition-transform group-hover:scale-110' />
                  </div>
                  <div className='mt-1 text-lg font-semibold text-gray-900'>
                    {product.purchase_count || 0}
                  </div>
                  <div className='text-xs text-gray-500'>downloads</div>
                </div>
                <div className='group rounded-lg bg-gray-50 p-3 text-center transition-all hover:-translate-y-1 hover:bg-gray-100 hover:shadow-md'>
                  <div className='flex items-center justify-center gap-1 text-gray-600 group-hover:text-purple-600'>
                    <Calendar className='h-4 w-4 transition-transform group-hover:scale-110' />
                  </div>
                  <div className='mt-1 text-xs font-medium text-gray-900'>
                    {new Date(product.created_at).toLocaleDateString()}
                  </div>
                  <div className='text-xs text-gray-500'>created</div>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className='mb-6'>
                  <h3 className='mb-3 text-lg font-semibold text-gray-900'>
                    Description
                  </h3>
                  <div className='rounded-lg bg-gray-50 p-4'>
                    <p className='leading-relaxed text-gray-700'>
                      {product.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className='mb-6'>
                  <h3 className='mb-3 text-lg font-semibold text-gray-900'>
                    Tags
                  </h3>
                  <div className='flex flex-wrap gap-2'>
                    {product.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className='cursor-pointer rounded-full bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-1 text-sm font-medium text-gray-700 transition-all hover:scale-105 hover:from-indigo-100 hover:to-indigo-200 hover:text-indigo-700 hover:shadow-sm active:scale-95'
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Add to Cart */}
              <div className='space-y-4'>
                <AddToCartButton productId={product.id} />

                <div className='rounded-lg bg-green-50 p-3 text-center'>
                  <p className='text-sm font-medium text-green-800'>
                    ✓ Instant download after purchase
                  </p>
                  <p className='text-xs text-green-600'>
                    High resolution • Commercial license included
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className='rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-200'>
          <ProductReviews productId={product.id} />
        </div>

        {/* Related Products */}
        <div className='mt-8'>
          <div className='rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-200'>
            <h2 className='mb-6 text-2xl font-bold text-gray-900'>
              Related Products
            </h2>
            <div className='rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 py-12 text-center text-gray-500'>
              <div className='mb-4 text-4xl'>🔍</div>
              <p className='text-lg font-medium'>
                Related products coming soon...
              </p>
              <p className='text-sm'>
                We're working on smart recommendations for you!
              </p>
            </div>
          </div>
        </div>

        {/* Floating Action Buttons for Product Owner */}
        <ProductActionButtons
          productId={product.id}
          productName={product.name}
          productUserId={product.user_id}
        />
      </div>
    </div>
  )
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('name, description')
    .eq('id', id)
    .single()

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  return {
    title: `${product.name} - Adult AI Gallery`,
    description:
      product.description ||
      `Premium AI-generated adult content: ${product.name}`,
    robots: 'noindex, nofollow',
  }
}
