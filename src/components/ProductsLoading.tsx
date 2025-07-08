export default function ProductsLoading() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'>
      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        {/* Header Skeleton */}
        <div className='mb-8 text-center'>
          <div className='relative mx-auto mb-4 h-12 w-96 overflow-hidden rounded-lg bg-gray-200'>
            <div className='animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent'></div>
          </div>
          <div className='relative mx-auto h-6 w-80 overflow-hidden rounded-lg bg-gray-200'>
            <div className='animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent'></div>
          </div>
          <div className='relative mx-auto mt-3 h-4 w-64 overflow-hidden rounded-lg bg-gray-200'>
            <div className='animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent'></div>
          </div>
        </div>

        {/* Action Bar Skeleton */}
        <div className='mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row'>
          <div className='flex items-center gap-4'>
            <div className='relative h-12 w-32 overflow-hidden rounded-lg bg-gray-200'>
              <div className='animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent'></div>
            </div>
            <div className='relative h-8 w-20 overflow-hidden rounded-lg bg-gray-200'>
              <div className='animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent'></div>
            </div>
            <div className='relative h-8 w-16 overflow-hidden rounded-lg bg-gray-200'>
              <div className='animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent'></div>
            </div>
          </div>
          <div className='flex items-center gap-2 rounded-lg bg-white p-1 shadow-sm'>
            <div className='relative h-10 w-10 overflow-hidden rounded-md bg-gray-200'>
              <div className='animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent'></div>
            </div>
            <div className='relative h-10 w-10 overflow-hidden rounded-md bg-gray-200'>
              <div className='animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent'></div>
            </div>
            <div className='relative h-10 w-10 overflow-hidden rounded-md bg-gray-200'>
              <div className='animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent'></div>
            </div>
          </div>
        </div>

        {/* Search Bar Skeleton */}
        <div className='mb-8'>
          <div className='relative mb-4 h-12 w-full overflow-hidden rounded-lg bg-gray-200'>
            <div className='animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent'></div>
          </div>
          <div className='flex gap-4'>
            <div className='relative h-10 w-24 overflow-hidden rounded-lg bg-gray-200'>
              <div className='animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent'></div>
            </div>
            <div className='relative h-10 w-32 overflow-hidden rounded-lg bg-gray-200'>
              <div className='animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent'></div>
            </div>
            <div className='relative h-10 w-28 overflow-hidden rounded-lg bg-gray-200'>
              <div className='animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent'></div>
            </div>
            <div className='relative h-10 w-36 overflow-hidden rounded-lg bg-gray-200'>
              <div className='animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent'></div>
            </div>
            <div className='relative h-10 w-24 overflow-hidden rounded-lg bg-gray-200'>
              <div className='animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent'></div>
            </div>
          </div>
        </div>

        {/* Products Grid Skeleton */}
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className='rounded-lg bg-white p-4 shadow-md'>
              {/* Product Image Skeleton */}
              <div className='relative mb-4 h-48 overflow-hidden rounded-lg bg-gray-200'>
                <div className='animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent'></div>
              </div>

              {/* Product Title Skeleton */}
              <div className='relative mb-2 h-6 w-3/4 overflow-hidden rounded bg-gray-200'>
                <div className='animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent'></div>
              </div>

              {/* Product Description Skeleton */}
              <div className='relative mb-4 h-4 w-full overflow-hidden rounded bg-gray-200'>
                <div className='animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent'></div>
              </div>

              {/* Product Price Skeleton */}
              <div className='relative mb-4 h-4 w-1/2 overflow-hidden rounded bg-gray-200'>
                <div className='animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent'></div>
              </div>

              {/* Add to Cart Button Skeleton */}
              <div className='relative h-10 w-full overflow-hidden rounded-lg bg-gray-200'>
                <div className='animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white to-transparent'></div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading Spinner Overlay */}
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/20 via-rose-500/10 to-pink-500/20 backdrop-blur-sm'>
          <div className='rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-md'>
            <div className='flex flex-col items-center space-y-6'>
              {/* Animated Loading Icon */}
              <div className='relative'>
                <div className='h-20 w-20 animate-spin rounded-full border-4 border-gray-200'></div>
                <div className='absolute left-0 top-0 h-20 w-20 animate-spin rounded-full border-4 border-transparent border-r-pink-500 border-t-rose-500'></div>
                <div className='absolute left-2 top-2 h-16 w-16 animate-pulse rounded-full bg-gradient-to-br from-rose-100 to-pink-100'></div>

                {/* Inner spinning element */}
                <div
                  className='absolute left-4 top-4 h-12 w-12 animate-spin rounded-full border-2 border-transparent border-b-rose-400'
                  style={{
                    animationDirection: 'reverse',
                    animationDuration: '1s',
                  }}
                ></div>

                {/* Center icon */}
                <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'>
                  <svg
                    className='h-6 w-6 animate-pulse text-rose-500'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
                    />
                  </svg>
                </div>
              </div>

              {/* Loading Text */}
              <div className='text-center'>
                <h3 className='bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-xl font-bold text-transparent'>
                  Loading Adult Gallery
                </h3>
                <p className='mt-1 text-sm text-gray-600'>
                  Fetching premium content...
                </p>
                <p className='mt-2 text-xs text-gray-500'>
                  🔞 18+ Content Only
                </p>
              </div>

              {/* Progress Dots */}
              <div className='flex space-x-2'>
                <div
                  className='h-3 w-3 animate-bounce rounded-full bg-gradient-to-r from-rose-500 to-pink-500'
                  style={{ animationDelay: '0ms' }}
                ></div>
                <div
                  className='h-3 w-3 animate-bounce rounded-full bg-gradient-to-r from-rose-500 to-pink-500'
                  style={{ animationDelay: '150ms' }}
                ></div>
                <div
                  className='h-3 w-3 animate-bounce rounded-full bg-gradient-to-r from-rose-500 to-pink-500'
                  style={{ animationDelay: '300ms' }}
                ></div>
              </div>

              {/* Progress Bar */}
              <div className='h-2 w-48 overflow-hidden rounded-full bg-gray-200'>
                <div className='h-full animate-pulse rounded-full bg-gradient-to-r from-rose-500 to-pink-500'></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
