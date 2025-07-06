import Link from 'next/link'

export default function Home() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50'>
      <div className='mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8'>
        <div className='text-center'>
          <h1 className='text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl'>
            Welcome to{' '}
            <span className='bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent'>
              Adult AI Gallery
            </span>
          </h1>
          <p className='mx-auto mt-3 max-w-md text-base text-gray-500 sm:text-lg md:mt-5 md:max-w-3xl md:text-xl'>
            Premium marketplace for AI-generated adult content. Discover and
            purchase high-quality adult images and videos for mature audiences.
          </p>
          <div className='mt-4 flex items-center justify-center gap-2 text-sm font-medium text-red-600'>
            <svg
              className='h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
            <span>
              18+ ADULT CONTENT - You must be 18 or older to access this site
            </span>
          </div>
          <div className='mx-auto mt-5 max-w-md sm:flex sm:justify-center md:mt-8'>
            <div className='rounded-md shadow'>
              <Link
                href='/products'
                className='flex w-full items-center justify-center rounded-md border border-transparent bg-gradient-to-r from-rose-600 to-pink-600 px-8 py-3 text-base font-medium text-white transition-all duration-200 hover:from-rose-700 hover:to-pink-700 md:px-10 md:py-4 md:text-lg'
              >
                Browse Adult Gallery
              </Link>
            </div>
            <div className='mt-3 rounded-md shadow sm:ml-3 sm:mt-0'>
              <Link
                href='/signup'
                className='flex w-full items-center justify-center rounded-md border border-transparent bg-white px-8 py-3 text-base font-medium text-indigo-600 hover:bg-gray-50 md:px-10 md:py-4 md:text-lg'
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>

        <div className='mt-20'>
          <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3'>
            <div className='pt-6'>
              <div className='flow-root rounded-lg bg-white px-6 pb-8'>
                <div className='-mt-6'>
                  <div>
                    <span className='inline-flex items-center justify-center rounded-md bg-indigo-500 p-3 shadow-lg'>
                      <svg
                        className='h-6 w-6 text-white'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                        />
                      </svg>
                    </span>
                  </div>
                  <h3 className='mt-8 text-lg font-medium tracking-tight text-gray-900'>
                    AI Generated Art
                  </h3>
                  <p className='mt-5 text-base text-gray-500'>
                    High-quality images created by advanced AI models, perfect
                    for your creative projects.
                  </p>
                </div>
              </div>
            </div>

            <div className='pt-6'>
              <div className='flow-root rounded-lg bg-white px-6 pb-8'>
                <div className='-mt-6'>
                  <div>
                    <span className='inline-flex items-center justify-center rounded-md bg-indigo-500 p-3 shadow-lg'>
                      <svg
                        className='h-6 w-6 text-white'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
                        />
                      </svg>
                    </span>
                  </div>
                  <h3 className='mt-8 text-lg font-medium tracking-tight text-gray-900'>
                    Flexible Payment
                  </h3>
                  <p className='mt-5 text-base text-gray-500'>
                    Pay with Stripe or use our points system for convenient and
                    secure transactions.
                  </p>
                </div>
              </div>
            </div>

            <div className='pt-6'>
              <div className='flow-root rounded-lg bg-white px-6 pb-8'>
                <div className='-mt-6'>
                  <div>
                    <span className='inline-flex items-center justify-center rounded-md bg-indigo-500 p-3 shadow-lg'>
                      <svg
                        className='h-6 w-6 text-white'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M13 10V3L4 14h7v7l9-11h-7z'
                        />
                      </svg>
                    </span>
                  </div>
                  <h3 className='mt-8 text-lg font-medium tracking-tight text-gray-900'>
                    Instant Access
                  </h3>
                  <p className='mt-5 text-base text-gray-500'>
                    Download your purchased images immediately after payment
                    confirmation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
