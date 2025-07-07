'use client'

import {
  DollarSign,
  Edit,
  Heart,
  Play,
  ShoppingCart,
  Star,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import { ContentWarningBadges } from '@/components/ContentWarnings'
import { getCategoryLabel } from '@/constants/categories'
import { ContentWarning } from '@/lib/content-moderation'

interface Product {
  id: string
  name: string
  description: string
  image_url: string
  media_url?: string
  media_type?: 'image' | 'video'
  thumbnail_url?: string
  duration_seconds?: number
  price_cents: number
  points_price: number
  category: string
  user_id?: string
  content_warnings?: ContentWarning[]
  tags?: string[]
  is_explicit?: boolean
  created_at?: string
  updated_at?: string
}

interface ProductDetailModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  currentUser: any
  onAddToCart: (productId: string) => void
  onDelete: (productId: string, productName: string) => void
  onToggleFavorite: (productId: string) => void
  isFavorite: boolean
  isAddingToCart: boolean
  isDeletingProduct: boolean
  formatPrice: (cents: number) => string
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  currentUser,
  onAddToCart,
  onDelete,
  onToggleFavorite,
  isFavorite,
  isAddingToCart,
  isDeletingProduct,
  formatPrice,
}: ProductDetailModalProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Handle ESC key and click outside
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)
    document.body.style.overflow = 'hidden' // Prevent background scroll

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Reset video state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setIsVideoPlaying(false)
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
      }
    }
  }, [isOpen])

  if (!isOpen || !product) return null

  const handleVideoPlay = () => {
    setIsVideoPlaying(true)
    if (videoRef.current) {
      videoRef.current.play()
    }
  }

  const handleVideoPause = () => {
    setIsVideoPlaying(false)
    if (videoRef.current) {
      videoRef.current.pause()
    }
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getMediaSrc = () => {
    return (
      product.media_url ||
      product.image_url ||
      (product.media_type === 'video'
        ? '/placeholder-video.svg'
        : '/placeholder-image.svg')
    )
  }

  const getThumbnailSrc = () => {
    return (
      product.thumbnail_url ||
      product.media_url ||
      product.image_url ||
      '/placeholder-video.svg'
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div
        ref={modalRef}
        className="relative max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-2xl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-black bg-opacity-50 p-2 text-white hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex h-full flex-col lg:flex-row">
          {/* Media Section - 60% */}
          <div className="relative flex-1 bg-gray-900 lg:flex-[3]">
            {product.media_type === 'video' ? (
              <div className="relative h-full min-h-[300px] lg:min-h-[500px]">
                {!isVideoPlaying ? (
                  // Video Thumbnail with Play Button
                  <div className="relative h-full w-full">
                    <Image
                      src={getThumbnailSrc()}
                      alt={product.name}
                      fill
                      className="object-contain"
                    />
                    <button
                      onClick={handleVideoPlay}
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 transition-all hover:bg-opacity-50"
                    >
                      <div className="rounded-full bg-white bg-opacity-90 p-4 shadow-lg transition-transform hover:scale-110">
                        <Play className="h-8 w-8 text-gray-900" fill="currentColor" />
                      </div>
                    </button>
                    {product.duration_seconds && (
                      <div className="absolute bottom-4 right-4 rounded bg-black bg-opacity-75 px-2 py-1 text-sm text-white">
                        {formatDuration(product.duration_seconds)}
                      </div>
                    )}
                  </div>
                ) : (
                  // Video Player
                  <video
                    ref={videoRef}
                    src={getMediaSrc()}
                    controls
                    autoPlay
                    className="h-full w-full object-contain"
                    onPause={handleVideoPause}
                    onEnded={handleVideoPause}
                  />
                )}
              </div>
            ) : (
              // Image Display
              <div className="relative h-full min-h-[300px] lg:min-h-[500px]">
                <Image
                  src={getMediaSrc()}
                  alt={product.name}
                  fill
                  className="object-contain"
                />
              </div>
            )}
          </div>

          {/* Product Details Section - 40% */}
          <div className="flex flex-col lg:flex-[2]">
            <div className="flex-1 overflow-y-auto p-6">
              {/* Product Title */}
              <h1 className="mb-4 text-2xl font-bold text-gray-900 lg:text-3xl">
                {product.name}
              </h1>

              {/* Pricing */}
              <div className="mb-6 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">
                    {formatPrice(product.price_cents)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="text-lg font-semibold text-yellow-600">
                    {product.points_price} points
                  </span>
                </div>
              </div>

              {/* Category */}
              <div className="mb-4">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                  {getCategoryLabel(product.category)}
                </span>
              </div>

              {/* Content Warnings */}
              {product.content_warnings && product.content_warnings.length > 0 && (
                <div className="mb-4">
                  <ContentWarningBadges warnings={product.content_warnings} />
                </div>
              )}

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="mb-6">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Tag className="h-4 w-4" />
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Media Info */}
              <div className="mb-6 text-sm text-gray-500">
                <div>Type: {product.media_type || 'image'}</div>
                {product.duration_seconds && (
                  <div>Duration: {formatDuration(product.duration_seconds)}</div>
                )}
                {product.created_at && (
                  <div>
                    Added: {new Date(product.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t bg-gray-50 p-6">
              <div className="flex flex-wrap gap-3">
                {/* Add to Cart */}
                <button
                  onClick={() => onAddToCart(product.id)}
                  disabled={isAddingToCart}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isAddingToCart ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                  ) : (
                    <ShoppingCart className="h-4 w-4" />
                  )}
                  Add to Cart
                </button>

                {/* Favorite */}
                <button
                  onClick={() => onToggleFavorite(product.id)}
                  className={`rounded-lg p-3 transition-colors ${
                    isFavorite
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>

                {/* Owner Actions */}
                {currentUser && product.user_id === currentUser.id && (
                  <>
                    <button
                      onClick={() => {
                        onClose()
                        router.push(`/products/${product.id}/edit`)
                      }}
                      className="rounded-lg bg-green-100 p-3 text-green-600 hover:bg-green-200"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onDelete(product.id, product.name)}
                      disabled={isDeletingProduct}
                      className="rounded-lg bg-red-100 p-3 text-red-600 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDeletingProduct ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="h-5 w-5" />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
