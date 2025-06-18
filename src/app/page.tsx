import Link from 'next/link'

export default function Home() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50'>
      <div className='mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8'>
        <div className='text-center'>
          <h1 className='text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl'>
            Welcome to <span className='text-indigo-600'>AI Shop</span>
          </h1>
          <p className='mx-auto mt-3 max-w-md text-base text-gray-500 sm:text-lg md:mt-5 md:max-w-3xl md:text-xl'>
            Discover and purchase amazing AI-generated images. Use points or pay
            with Stripe for instant access to high-quality digital art.
          </p>
          <div className='mx-auto mt-5 max-w-md sm:flex sm:justify-center md:mt-8'>
            <div className='rounded-md shadow'>
              <Link
                href='/products'
                className='flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 md:px-10 md:py-4 md:text-lg'
              >
                Browse Products
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
