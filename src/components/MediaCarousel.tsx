'use client'

import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

import { ProductMedia } from '@/lib/product-management'
import '@/styles/carousel.css'

interface MediaCarouselProps {
  media: ProductMedia[]
  productName: string
  className?: string
}

export default function MediaCarousel({
  media,
  productName,
  className = '',
}: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const sortedMedia = [...media].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.sort_order - b.sort_order
  })

  const currentMedia = sortedMedia[currentIndex]
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? sortedMedia.length - 1 : prev - 1))
    setIsVideoPlaying(false)
  }, [sortedMedia.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === sortedMedia.length - 1 ? 0 : prev + 1))
    setIsVideoPlaying(false)
  }, [sortedMedia.length])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isModalOpen) {
        switch (event.key) {
          case 'ArrowLeft':
            event.preventDefault()
            goToPrevious()
            break
          case 'ArrowRight':
            event.preventDefault()
            goToNext()
            break
          case 'Escape':
            event.preventDefault()
            setIsModalOpen(false)
            setIsVideoPlaying(false)
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen, goToPrevious, goToNext])

  useEffect(() => {
    if (sortedMedia.length <= 1 || isModalOpen || isVideoPlaying) return

    const interval = setInterval(() => {
      if (currentMedia.media_type === 'image') {
        goToNext()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [
    currentIndex,
    sortedMedia.length,
    isModalOpen,
    isVideoPlaying,
    currentMedia.media_type,
    goToNext,
  ])

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
      <div
        className='group relative cursor-pointer touch-pan-x overflow-hidden rounded-xl bg-gray-100 shadow-lg'
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsModalOpen(true)}
      >
        <div className='relative flex max-h-[70vh] min-h-[300px] items-center justify-center'>
          {currentMedia.media_type === 'video' ? (
            <div className='relative flex h-full w-full items-center justify-center'>
              {!isVideoPlaying ? (
                <div className='relative max-h-full max-w-full'>
                  <Image
                    src={currentMedia.thumbnail_url || '/placeholder-video.svg'}
                    alt={currentMedia.alt_text || `${productName} video`}
                    width={currentMedia.width || 800}
                    height={currentMedia.height || 600}
                    className='max-h-full max-w-full cursor-pointer object-contain transition-transform duration-300 group-hover:scale-105'
                  />
                  <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-30'>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsVideoPlaying(true)
                      }}
                      className='rounded-full bg-white bg-opacity-90 p-6 shadow-lg transition-transform hover:scale-110'
                    >
                      <Play
                        className='h-12 w-12 text-gray-900'
                        fill='currentColor'
                      />
                    </button>
                  </div>
                </div>
              ) : (
                <video
                  src={currentMedia.media_url}
                  controls
                  autoPlay
                  className='max-h-full max-w-full object-contain'
                  onEnded={() => setIsVideoPlaying(false)}
                  width={currentMedia.width}
                  height={currentMedia.height}
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
              width={currentMedia.width || 800}
              height={currentMedia.height || 600}
              className='max-h-full max-w-full cursor-pointer object-contain transition-transform duration-300 group-hover:scale-105'
              priority={currentIndex === 0}
            />
          )}

          {isHovered && (
            <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 transition-opacity'>
              <div className='rounded-lg bg-white bg-opacity-95 px-4 py-2 shadow-lg backdrop-blur-sm'>
                <div className='flex items-center gap-2 text-gray-900'>
                  <svg
                    className='h-5 w-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7'
                    />
                  </svg>
                  <span className='text-sm font-medium'>
                    Click to view full size
                  </span>
                </div>
              </div>
            </div>
          )}

          {sortedMedia.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrevious()
                }}
                className='absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black bg-opacity-50 p-2 text-white opacity-0 transition-all hover:bg-opacity-70 group-hover:opacity-100 md:left-4 md:p-3 md:opacity-100 lg:opacity-0'
                aria-label='Previous image'
              >
                <ChevronLeft className='h-5 w-5 md:h-6 md:w-6' />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
                className='absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black bg-opacity-50 p-2 text-white opacity-0 transition-all hover:bg-opacity-70 group-hover:opacity-100 md:right-4 md:p-3 md:opacity-100 lg:opacity-0'
                aria-label='Next image'
              >
                <ChevronRight className='h-5 w-5 md:h-6 md:w-6' />
              </button>
            </>
          )}

          {sortedMedia.length > 1 && (
            <div className='absolute bottom-4 right-4 rounded-full bg-black bg-opacity-50 px-3 py-1 text-sm text-white'>
              {currentIndex + 1} / {sortedMedia.length}
            </div>
          )}

          {currentMedia.is_primary && (
            <div className='absolute left-4 top-4 rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white shadow-lg'>
              Primary
            </div>
          )}
        </div>

        {sortedMedia.length > 1 && (
          <div className='absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-2'>
            {sortedMedia.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentIndex(index)
                  setIsVideoPlaying(false)
                }}
                className={`h-3 w-3 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-white shadow-lg'
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {sortedMedia.length > 1 && (
        <div className='scrollbar-hide mt-4 flex gap-2 overflow-x-auto pb-2 md:gap-3'>
          {sortedMedia.map((item, index) => (
            <button
              key={item.id}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentIndex(index)
                setIsVideoPlaying(false)
              }}
              className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all md:h-20 md:w-20 ${
                index === currentIndex
                  ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
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
                  <Play className='h-4 w-4 text-white' fill='currentColor' />
                </div>
              )}
              {item.is_primary && (
                <div className='absolute -right-1 -top-1 h-3 w-3 rounded-full border border-white bg-blue-500'></div>
              )}
            </button>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className='fixed inset-0 z-50 bg-black bg-opacity-95'>
          <div className='relative h-full w-full overflow-auto'>
            <button
              onClick={() => {
                setIsModalOpen(false)
                setIsVideoPlaying(false)
              }}
              className='fixed right-4 top-4 z-10 rounded-full bg-white bg-opacity-20 p-3 text-white backdrop-blur-sm hover:bg-opacity-30'
            >
              <X className='h-6 w-6' />
            </button>

            {sortedMedia.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className='fixed left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white bg-opacity-20 p-3 text-white backdrop-blur-sm hover:bg-opacity-30'
                >
                  <ChevronLeft className='h-8 w-8' />
                </button>
                <button
                  onClick={goToNext}
                  className='fixed right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white bg-opacity-20 p-3 text-white backdrop-blur-sm hover:bg-opacity-30'
                >
                  <ChevronRight className='h-8 w-8' />
                </button>
              </>
            )}

            <div className='flex min-h-full items-center justify-center p-4'>
              {currentMedia.media_type === 'video' ? (
                <video
                  src={currentMedia.media_url}
                  controls
                  autoPlay
                  className='max-h-none max-w-none'
                  width={currentMedia.width}
                  height={currentMedia.height}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                  }}
                />
              ) : (
                <Image
                  src={currentMedia.media_url}
                  alt={
                    currentMedia.alt_text ||
                    `${productName} image ${currentIndex + 1}`
                  }
                  width={currentMedia.width || 1200}
                  height={currentMedia.height || 800}
                  className='max-h-none max-w-none'
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                  }}
                />
              )}
            </div>

            <div className='fixed bottom-4 left-4 z-10 rounded bg-black bg-opacity-50 px-4 py-2 text-white backdrop-blur-sm'>
              <div className='text-sm font-medium'>
                {currentIndex + 1} of {sortedMedia.length}
              </div>
              {currentMedia.alt_text && (
                <div className='text-xs opacity-75'>
                  {currentMedia.alt_text}
                </div>
              )}
              <div className='mt-1 text-xs opacity-75'>
                {currentMedia.width &&
                  currentMedia.height &&
                  `${currentMedia.width} × ${currentMedia.height}px`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
