import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className='bg-gray-900 text-white'>
      <div className='mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 gap-8 md:grid-cols-4'>
          {/* Brand Section */}
          <div className='col-span-1 md:col-span-2'>
            <div className='mb-4 flex items-center'>
              <span className='bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-2xl font-bold text-transparent'>
                Adult AI Gallery
              </span>
            </div>
            <p className='mb-4 max-w-md text-sm text-gray-400'>
              Premium marketplace for AI-generated adult content. Serving mature
              audiences in Canada and the United States with high-quality
              digital content.
            </p>
            <div className='flex items-center gap-2 text-sm font-medium text-red-400'>
              <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                  clipRule='evenodd'
                />
              </svg>
              <span>18+ ADULT CONTENT ONLY</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className='mb-4 text-lg font-semibold'>Quick Links</h3>
            <ul className='space-y-2 text-sm'>
              <li>
                <Link
                  href='/products'
                  className='text-gray-400 transition-colors hover:text-white'
                >
                  Browse Gallery
                </Link>
              </li>
              <li>
                <Link
                  href='/points'
                  className='text-gray-400 transition-colors hover:text-white'
                >
                  Buy Points
                </Link>
              </li>
              <li>
                <Link
                  href='/upload'
                  className='text-gray-400 transition-colors hover:text-white'
                >
                  Upload Content
                </Link>
              </li>
              <li>
                <Link
                  href='/orders'
                  className='text-gray-400 transition-colors hover:text-white'
                >
                  Order History
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h3 className='mb-4 text-lg font-semibold'>Legal & Support</h3>
            <ul className='space-y-2 text-sm'>
              <li>
                <Link
                  href='/terms'
                  className='text-gray-400 transition-colors hover:text-white'
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href='/privacy'
                  className='text-gray-400 transition-colors hover:text-white'
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href='/cookies'
                  className='text-gray-400 transition-colors hover:text-white'
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <a
                  href='mailto:support@adultaigallery.com'
                  className='text-gray-400 transition-colors hover:text-white'
                >
                  Contact Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className='mt-8 border-t border-gray-800 pt-8'>
          <div className='flex flex-col items-center justify-between md:flex-row'>
            <div className='mb-4 text-sm text-gray-400 md:mb-0'>
              <p>© {currentYear} Adult AI Gallery. All rights reserved.</p>
              <p className='mt-1'>
                Licensed for operation in Canada and the United States.
              </p>
            </div>

            <div className='flex items-center space-x-6 text-sm text-gray-400'>
              <div className='flex items-center gap-2'>
                <svg
                  className='h-4 w-4 text-green-500'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
                <span>SSL Secured</span>
              </div>

              <div className='flex items-center gap-2'>
                <svg
                  className='h-4 w-4 text-blue-500'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
                <span>Privacy Protected</span>
              </div>

              <div className='flex items-center gap-2'>
                <svg
                  className='h-4 w-4 text-purple-500'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path d='M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z' />
                  <path
                    fillRule='evenodd'
                    d='M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z'
                    clipRule='evenodd'
                  />
                </svg>
                <span>Stripe Payments</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className='mt-6 border-t border-gray-800 pt-6'>
          <div className='rounded-lg bg-gray-800 p-4'>
            <h4 className='mb-2 flex items-center gap-2 text-sm font-semibold text-yellow-400'>
              <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                  clipRule='evenodd'
                />
              </svg>
              Legal Disclaimer
            </h4>
            <p className='text-xs leading-relaxed text-gray-400'>
              This website contains adult content intended for mature audiences
              only. By accessing this site, you confirm that you are 18 years of
              age or older and legally permitted to view adult content in your
              jurisdiction. All content is AI-generated and fictional. We comply
              with applicable laws in Canada and the United States regarding
              adult content distribution. Users are responsible for ensuring
              compliance with local laws in their jurisdiction.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
