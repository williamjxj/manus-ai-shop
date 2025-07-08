import { ArrowLeft, Calendar, Download, Eye, Heart, Share2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  BlurredContent,
  ContentWarningBadges,
} from '@/components/ContentWarnings'
import ProductReviews from '@/components/ProductReviews'
import { ContentWarning } from '@/lib/content-moderation'
import { createClient } from '@/lib/supabase/server'

interface ProductPageProps {
  params: {
    id: string
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const supabase = await createClient()

  // Fetch product details
  const { data: product, error } = await supabase
    .from('products')
    .select(
      `
      *,
      categories (
        name,
        slug
      )
    `
    )
    .eq('id', params.id)
    .eq('moderation_status', 'approved')
    .single()

  if (error || !product) {
    notFound()
  }

  // Parse content warnings
  const contentWarnings: ContentWarning[] = product.content_warnings || []

  // Increment view count (fire and forget)
  supabase
    .from('products')
    .update({ view_count: (product.view_count || 0) + 1 })
    .eq('id', params.id)
    .then(() => {})

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {/* Back Button */}
        <div className='mb-6'>
          <Link
            href='/products'
            className='inline-flex items-center gap-2 font-medium text-indigo-600 hover:text-indigo-800'
          >
            <ArrowLeft className='h-4 w-4' />
            Back to Gallery
          </Link>
        </div>

        <div className='mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2'>
          {/* Product Images */}
          <div className='space-y-4'>
            <BlurredContent
              warnings={contentWarnings}
              productName={product.name}
              className='aspect-square overflow-hidden rounded-lg bg-white shadow-sm'
            >
              <div className='relative h-full w-full'>
                <Image
                  src={getSafeImageUrl(product.image_url)}
                  alt={product.name}
                  fill
                  className='object-cover'
                  priority
                />
              </div>
            </BlurredContent>

            {/* Additional Images */}
            {product.media && product.media.length > 0 && (
              <div className='grid grid-cols-3 gap-2'>
                {product.media.slice(0, 6).map((media: any, index: number) => (
                  <BlurredContent
                    key={index}
                    warnings={contentWarnings}
                    className='aspect-square overflow-hidden rounded-lg bg-white shadow-sm'
                  >
                    <div className='relative h-full w-full'>
                      <Image
                        src={getSafeImageUrl(media.url)}
                        alt={`${product.name} ${index + 1}`}
                        fill
                        className='object-cover'
                      />
                    </div>
                  </BlurredContent>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className='space-y-6'>
            {/* Content Warnings */}
            {contentWarnings.length > 0 && (
              <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
                <div className='mb-2 flex items-center gap-2'>
                  <svg
                    className='h-5 w-5 text-red-600'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <span className='font-semibold text-red-800'>
                    Content Warning
                  </span>
                </div>
                <ContentWarningBadges
                  warnings={contentWarnings}
                  className='mb-2'
                />
                <p className='text-sm text-red-700'>
                  This content is intended for mature audiences (18+) only.
                </p>
              </div>
            )}

            {/* Product Info */}
            <div>
              <div className='mb-2 flex items-start justify-between'>
                <h1 className='text-3xl font-bold text-gray-900'>
                  {product.name}
                </h1>
                <div className='flex items-center gap-2'>
                  <button className='p-2 text-gray-400 transition-colors hover:text-red-500'>
                    <Heart className='h-5 w-5' />
                  </button>
                  <button className='p-2 text-gray-400 transition-colors hover:text-indigo-500'>
                    <Share2 className='h-5 w-5' />
                  </button>
                </div>
              </div>

              {/* Category */}
              {product.categories && (
                <Link
                  href={`/products?category=${product.categories.slug}`}
                  className='mb-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800'
                >
                  {product.categories.name}
                </Link>
              )}

              {/* Price */}
              <div className='mb-6'>
                <span className='text-3xl font-bold text-gray-900'>
                  {product.points_cost} points
                </span>
                <span className='ml-2 text-lg text-gray-500'>
                  (${(product.points_cost * 0.01).toFixed(2)})
                </span>
              </div>

              {/* Stats */}
              <div className='mb-6 flex items-center gap-6 text-sm text-gray-500'>
                <div className='flex items-center gap-1'>
                  <Eye className='h-4 w-4' />
                  <span>{product.view_count || 0} views</span>
                </div>
                <div className='flex items-center gap-1'>
                  <Download className='h-4 w-4' />
                  <span>{product.purchase_count || 0} downloads</span>
                </div>
                <div className='flex items-center gap-1'>
                  <Calendar className='h-4 w-4' />
                  <span>
                    {new Date(product.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className='mb-6'>
                  <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                    Description
                  </h3>
                  <p className='leading-relaxed text-gray-700'>
                    {product.description}
                  </p>
                </div>
              )}

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className='mb-6'>
                  <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                    Tags
                  </h3>
                  <div className='flex flex-wrap gap-2'>
                    {product.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className='rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700'
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Add to Cart */}
              <div className='space-y-4'>
                <button className='w-full rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'>
                  Add to Cart
                </button>

                <p className='text-center text-sm text-gray-500'>
                  Instant download after purchase • High resolution • Commercial
                  license included
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className='rounded-lg bg-white p-8 shadow-sm'>
          <ProductReviews productId={product.id} />
        </div>

        {/* Related Products */}
        <div className='mt-12'>
          <h2 className='mb-6 text-2xl font-bold text-gray-900'>
            Related Products
          </h2>
          <div className='py-8 text-center text-gray-500'>
            Related products coming soon...
          </div>
        </div>
      </div>
    </div>
  )
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps) {
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('name, description')
    .eq('id', params.id)
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
    robots: 'noindex, nofollow', // Don't index adult content
  }
}
