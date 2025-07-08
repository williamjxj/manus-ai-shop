'use client'

import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'

import { ProductMedia } from '@/lib/product-management'

interface ProductMediaGalleryProps {
  media: ProductMedia[]
  productName: string
  className?: string
}

export default function ProductMediaGallery({
  media,
  productName,
  className = '',
}: ProductMediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  // Sort media by sort_order and ensure primary is first
  const sortedMedia = [...media].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.sort_order - b.sort_order
  })

  const currentMedia = sortedMedia[currentIndex]

  const nextMedia = () => {
    setCurrentIndex((prev) => (prev + 1) % sortedMedia.length)
    setIsVideoPlaying(false)
  }

  const prevMedia = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + sortedMedia.length) % sortedMedia.length
    )
    setIsVideoPlaying(false)
  }

  const openModal = () => {
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setIsVideoPlaying(false)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return

      if (e.key === 'ArrowLeft') prevMedia()
      if (e.key === 'ArrowRight') nextMedia()
      if (e.key === 'Escape') closeModal()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen, prevMedia, nextMedia])

  if (!sortedMedia.length) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
      >
        <div className='text-center text-gray-500'>
          <div className='mb-2 text-4xl'>📷</div>
          <p>No media available</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Main Media Display */}
      <div className='relative aspect-square overflow-hidden rounded-lg bg-gray-100'>
        {currentMedia.media_type === 'video' ? (
          <div className='relative h-full w-full'>
            {!isVideoPlaying ? (
              <>
                <Image
                  src={currentMedia.thumbnail_url || '/placeholder-video.svg'}
                  alt={currentMedia.alt_text || `${productName} video`}
                  fill
                  className='cursor-pointer object-cover'
                  onClick={openModal}
                />
                <button
                  onClick={() => setIsVideoPlaying(true)}
                  className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 transition-all hover:bg-opacity-50'
                >
                  <div className='rounded-full bg-white bg-opacity-90 p-4 shadow-lg transition-transform hover:scale-110'>
                    <Play
                      className='h-8 w-8 text-gray-900'
                      fill='currentColor'
                    />
                  </div>
                </button>
              </>
            ) : (
              <video
                src={currentMedia.media_url}
                controls
                autoPlay
                className='h-full w-full object-cover'
                onEnded={() => setIsVideoPlaying(false)}
              />
            )}
          </div>
        ) : (
          <Image
            src={currentMedia.media_url}
            alt={
              currentMedia.alt_text ||
              `${productName} image ${currentIndex + 1}`
            }
            fill
            className='cursor-pointer object-cover transition-transform hover:scale-105'
            onClick={openModal}
          />
        )}

        {/* Navigation Arrows */}
        {sortedMedia.length > 1 && (
          <>
            <button
              onClick={prevMedia}
              className='absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black bg-opacity-50 p-2 text-white transition-all hover:bg-opacity-75'
            >
              <ChevronLeft className='h-5 w-5' />
            </button>
            <button
              onClick={nextMedia}
              className='absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black bg-opacity-50 p-2 text-white transition-all hover:bg-opacity-75'
            >
              <ChevronRight className='h-5 w-5' />
            </button>
          </>
        )}

        {/* Media Counter */}
        {sortedMedia.length > 1 && (
          <div className='absolute bottom-2 right-2 rounded bg-black bg-opacity-75 px-2 py-1 text-xs text-white'>
            {currentIndex + 1} / {sortedMedia.length}
          </div>
        )}

        {/* Primary Badge */}
        {currentMedia.is_primary && (
          <div className='absolute left-2 top-2 rounded bg-blue-500 px-2 py-1 text-xs font-medium text-white'>
            Primary
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {sortedMedia.length > 1 && (
        <div className='mt-4 flex gap-2 overflow-x-auto pb-2'>
          {sortedMedia.map((item, index) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentIndex(index)
                setIsVideoPlaying(false)
              }}
              className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border-2 transition-all ${
                index === currentIndex
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Image
                src={item.thumbnail_url || item.media_url}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                className='object-cover'
              />
              {item.media_type === 'video' && (
                <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-30'>
                  <Play className='h-3 w-3 text-white' fill='currentColor' />
                </div>
              )}
              {item.is_primary && (
                <div className='absolute -right-1 -top-1 h-3 w-3 rounded-full bg-blue-500'></div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Full Screen Modal */}
      {isModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4'>
          <div className='relative max-h-full max-w-full'>
            {/* Close Button */}
            <button
              onClick={closeModal}
              className='absolute -top-12 right-0 rounded-full bg-white bg-opacity-20 p-2 text-white hover:bg-opacity-30'
            >
              <X className='h-6 w-6' />
            </button>

            {/* Navigation */}
            {sortedMedia.length > 1 && (
              <>
                <button
                  onClick={prevMedia}
                  className='absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white bg-opacity-20 p-3 text-white hover:bg-opacity-30'
                >
                  <ChevronLeft className='h-6 w-6' />
                </button>
                <button
                  onClick={nextMedia}
                  className='absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white bg-opacity-20 p-3 text-white hover:bg-opacity-30'
                >
                  <ChevronRight className='h-6 w-6' />
                </button>
              </>
            )}

            {/* Media Content */}
            {currentMedia.media_type === 'video' ? (
              <video
                src={currentMedia.media_url}
                controls
                autoPlay
                className='max-h-[90vh] max-w-[90vw] object-contain'
              />
            ) : (
              <Image
                src={currentMedia.media_url}
                alt={
                  currentMedia.alt_text ||
                  `${productName} image ${currentIndex + 1}`
                }
                width={1200}
                height={800}
                className='max-h-[90vh] max-w-[90vw] object-contain'
              />
            )}

            {/* Media Info */}
            <div className='absolute bottom-4 left-4 rounded bg-black bg-opacity-50 px-3 py-2 text-white'>
              <div className='text-sm font-medium'>
                {currentIndex + 1} of {sortedMedia.length}
              </div>
              {currentMedia.alt_text && (
                <div className='text-xs opacity-75'>
                  {currentMedia.alt_text}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
