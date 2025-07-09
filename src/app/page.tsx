'use client'

import { Heart, Play, Star, Zap } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const heroSlides = [
    {
      title: 'Premium AI Adult Content',
      subtitle: 'Discover exclusive AI-generated adult art',
      gradient: 'from-purple-600 via-pink-600 to-red-500',
      emoji: '🔥',
    },
    {
      title: 'Unlimited Access',
      subtitle: 'Join thousands of satisfied members',
      gradient: 'from-blue-600 via-purple-600 to-pink-500',
      emoji: '💎',
    },
    {
      title: 'New Content Daily',
      subtitle: 'Fresh AI creations added every day',
      gradient: 'from-green-500 via-teal-500 to-blue-500',
      emoji: '⚡',
    },
  ]

  return (
    <div className='min-h-screen overflow-hidden bg-white'>
      {/* Animated Background */}
      <div className='absolute inset-0 overflow-hidden'>
        {/* Subtle Background Video - Optimized */}
        <div className='absolute inset-0 opacity-5'>
          <video
            className='h-full w-full object-cover'
            autoPlay
            muted
            loop
            playsInline
            preload='none'
            poster='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM2NjdlZWEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM3NjRiYTIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg=='
          >
            <source
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cdnmedia/kling.mp4`}
              type='video/mp4'
            />
          </video>
          <div className='absolute inset-0 bg-gradient-to-br from-slate-900/80 via-purple-900/80 to-slate-900/80'></div>
        </div>

        <div className='absolute -inset-10 opacity-50'>
          <div className='animate-float absolute left-1/4 top-1/4 h-72 w-72 animate-pulse rounded-full bg-gradient-to-r from-pink-400 to-purple-600 opacity-20 blur-xl'></div>
          <div className='absolute right-1/4 top-3/4 h-96 w-96 animate-pulse rounded-full bg-gradient-to-r from-blue-400 to-cyan-600 opacity-20 blur-xl delay-1000'></div>
          <div className='delay-2000 animate-float absolute left-1/2 top-1/2 h-80 w-80 animate-pulse rounded-full bg-gradient-to-r from-red-400 to-pink-600 opacity-20 blur-xl'></div>
          <div className='delay-3000 absolute left-3/4 top-1/4 h-64 w-64 animate-pulse rounded-full bg-gradient-to-r from-yellow-400 to-orange-600 opacity-15 blur-xl'></div>
          <div className='left-1/6 delay-4000 animate-float absolute top-2/3 h-48 w-48 animate-pulse rounded-full bg-gradient-to-r from-green-400 to-teal-600 opacity-15 blur-xl'></div>
        </div>

        {/* Floating Particles */}
        <div className='particles'>
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className='particle'
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${8 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <div className='relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8'>
        <div
          className={`text-center transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
        >
          {/* Dynamic Hero Content */}
          <div className='mb-8 animate-bounce text-6xl'>
            {heroSlides[currentSlide].emoji}
          </div>

          <h1 className='text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl'>
            <span
              className={`bg-gradient-to-r ${heroSlides[currentSlide].gradient} hover-lift animate-pulse cursor-default bg-clip-text text-transparent`}
            >
              Adult AI Gallery
            </span>
          </h1>

          <div className='mt-3 h-12'>
            <h2
              className={`text-lg font-semibold text-gray-800 transition-all duration-500 sm:text-xl md:text-2xl`}
            >
              {heroSlides[currentSlide].title}
            </h2>
            <p className='mt-1 text-sm text-gray-600 sm:text-base'>
              {heroSlides[currentSlide].subtitle}
            </p>
          </div>

          {/* Age Warning with Style */}
          <div className='mt-4 flex items-center justify-center gap-2 rounded-full border border-red-500 bg-red-50 px-4 py-2 text-red-600'>
            <Zap className='h-4 w-4 animate-pulse' />
            <span className='text-sm font-semibold'>18+ ADULTS ONLY</span>
            <Zap className='h-4 w-4 animate-pulse' />
          </div>

          {/* CTA Buttons */}
          <div className='mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center'>
            <Link
              href='/products'
              className='btn-glow animate-glow group relative overflow-hidden rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 px-5 py-2.5 text-sm font-bold text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-pink-500/25'
            >
              <span className='relative z-10 flex items-center gap-2'>
                <Play className='h-3 w-3 animate-pulse' />
                Explore Gallery
                <Heart className='h-3 w-3 animate-pulse text-yellow-300' />
              </span>
              <div className='absolute inset-0 bg-gradient-to-r from-yellow-500 via-red-500 to-pink-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100'></div>
            </Link>

            <Link
              href='/signup'
              className='animate-pulse-glow group rounded-full border-2 border-gray-300 bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-700 transition-all duration-300 hover:scale-105 hover:bg-gray-200'
            >
              <span className='flex items-center gap-2'>
                <Star className='h-3 w-3 animate-pulse text-yellow-500' />
                Join Premium
              </span>
            </Link>
          </div>
        </div>

        {/* Video Gallery - Krea.ai Inspired */}
        <div className='mt-8'>
          <div className='mb-4 text-center'>
            <h2 className='mb-1 text-xl font-bold text-gray-900 sm:text-2xl'>
              🎬 Featured{' '}
              <span className='bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent'>
                AI Videos
              </span>
            </h2>
            <p className='text-sm text-gray-600'>Premium AI creations</p>
          </div>

          {/* Masonry-style Video Grid */}
          <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3'>
            {[
              'kling.mp4',
              'hailuo.mp4',
              'shakker.mp4',
              'tang-girl.mp4',
              'twin.mp4',
              'young_idol.mp4',
            ].map((filename, index) => (
              <video
                key={index}
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cdnmedia/${filename}`}
                autoPlay
                muted
                loop
                playsInline
                className='h-auto w-full rounded-lg transition-transform duration-300 hover:scale-[1.02]'
              />
            ))}
          </div>

          {/* Stats Row */}
          <div className='mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4'>
            <div className='group cursor-pointer rounded-xl border border-pink-500/30 bg-gradient-to-br from-pink-500/20 to-purple-600/20 p-4 text-center shadow-sm transition-transform duration-300 hover:scale-105'>
              <div className='text-xl font-bold text-pink-500'>10K+</div>
              <div className='text-xs text-gray-600'>Premium Videos</div>
            </div>
            <div className='group cursor-pointer rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-cyan-600/20 p-4 text-center shadow-sm transition-transform duration-300 hover:scale-105'>
              <div className='text-xl font-bold text-blue-500'>5K+</div>
              <div className='text-xs text-gray-600'>Happy Members</div>
            </div>
            <div className='group cursor-pointer rounded-xl border border-green-500/30 bg-gradient-to-br from-green-500/20 to-emerald-600/20 p-4 text-center shadow-sm transition-transform duration-300 hover:scale-105'>
              <div className='text-xl font-bold text-green-500'>4K</div>
              <div className='text-xs text-gray-600'>Ultra HD</div>
            </div>
            <div className='group cursor-pointer rounded-xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/20 to-orange-600/20 p-4 text-center shadow-sm transition-transform duration-300 hover:scale-105'>
              <div className='text-xl font-bold text-yellow-500'>24/7</div>
              <div className='text-xs text-gray-600'>New Content</div>
            </div>
          </div>
        </div>

        {/* Compact Features */}
        <div className='mt-8'>
          <div className='mb-4 text-center'>
            <h2 className='mb-1 text-lg font-bold text-gray-900 sm:text-xl'>
              Why Choose{' '}
              <span className='bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent'>
                Our Platform?
              </span>
            </h2>
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            {/* Feature 1 */}
            <div className='group relative overflow-hidden rounded-xl border border-pink-500/30 bg-gradient-to-br from-pink-500/20 to-purple-600/20 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-pink-500/25'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-lg'>
                  🎨
                </div>
                <div>
                  <h3 className='text-sm font-bold text-gray-900'>
                    Premium AI Art
                  </h3>
                  <p className='text-xs text-gray-600'>
                    Cutting-edge technology
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className='group relative overflow-hidden rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-cyan-600/20 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-lg'>
                  💳
                </div>
                <div>
                  <h3 className='text-sm font-bold text-gray-900'>
                    Flexible Payment
                  </h3>
                  <p className='text-xs text-gray-600'>Secure & anonymous</p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className='group relative overflow-hidden rounded-xl border border-green-500/30 bg-gradient-to-br from-green-500/20 to-emerald-600/20 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/25'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-lg'>
                  ⚡
                </div>
                <div>
                  <h3 className='text-sm font-bold text-gray-900'>
                    Instant Access
                  </h3>
                  <p className='text-xs text-gray-600'>Immediate download</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact CTA */}
        <div className='mt-8 text-center'>
          <div className='relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 p-6 shadow-sm'>
            {/* Background Video Effect - Optimized */}
            <div className='absolute inset-0 opacity-10'>
              <video
                className='h-full w-full object-cover'
                autoPlay
                muted
                loop
                playsInline
                preload='none'
                poster='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNlYzQ4OTkiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNhODU1ZjciLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg=='
              >
                <source
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cdnmedia/hailuo.mp4`}
                  type='video/mp4'
                />
              </video>
              <div className='absolute inset-0 bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-blue-500/30'></div>
            </div>

            <div className='relative z-10'>
              <h2 className='mb-3 text-lg font-bold text-gray-900 sm:text-xl'>
                🎬 Experience AI Magic! 🚀
              </h2>
              <p className='mx-auto mb-4 max-w-md text-sm text-gray-700'>
                Join thousands exploring the future of adult entertainment.
              </p>

              <div className='flex flex-col justify-center gap-2 sm:flex-row'>
                <Link
                  href='/products'
                  className='group relative overflow-hidden rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 px-6 py-3 text-sm font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-pink-500/50'
                >
                  <span className='relative z-10 flex items-center gap-2'>
                    🔥 Watch Videos Now
                  </span>
                  <div className='absolute inset-0 bg-gradient-to-r from-yellow-500 via-red-500 to-pink-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100'></div>
                </Link>

                <Link
                  href='/signup'
                  className='rounded-full border-2 border-gray-300 bg-gray-100 px-6 py-3 text-sm font-bold text-gray-700 transition-all duration-300 hover:scale-105 hover:bg-gray-200'
                >
                  💎 Join Premium
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
