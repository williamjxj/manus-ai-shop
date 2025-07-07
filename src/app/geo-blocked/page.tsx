import Link from 'next/link'

interface GeoBlockedPageProps {
  searchParams: {
    reason?: string
    location?: string
  }
}

export default function GeoBlockedPage({ searchParams }: GeoBlockedPageProps) {
  const reason = searchParams.reason || 'Geographic restrictions apply'
  const location = searchParams.location || 'your location'

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8 text-center'>
        <div>
          {/* Icon */}
          <div className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
            <svg
              className='h-8 w-8 text-red-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className='mb-4 text-3xl font-bold text-gray-900'>
            Access Restricted
          </h1>

          {/* Main message */}
          <div className='space-y-4 text-gray-600'>
            <p className='text-lg'>
              We're sorry, but our service is not available in your location.
            </p>

            <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
              <div className='flex items-start gap-3'>
                <svg
                  className='mt-0.5 h-5 w-5 flex-shrink-0 text-red-500'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                  />
                </svg>
                <div className='text-left'>
                  <p className='text-sm font-semibold text-red-800'>
                    Restriction Reason:
                  </p>
                  <p className='mt-1 text-sm text-red-700'>{reason}</p>
                  <p className='mt-2 text-xs text-red-600'>
                    Detected location: {location}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Legal compliance notice */}
          <div className='mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4'>
            <h3 className='mb-2 text-sm font-semibold text-blue-900'>
              Legal Compliance Notice
            </h3>
            <p className='text-left text-xs text-blue-800'>
              This restriction is in place to comply with local laws and
              regulations regarding adult content. We are committed to operating
              within the legal framework of all jurisdictions where our service
              is available.
            </p>
          </div>

          {/* What you can do */}
          <div className='mt-8 space-y-4'>
            <h3 className='font-semibold text-gray-900'>What can you do?</h3>

            <div className='space-y-3 text-left text-sm text-gray-600'>
              <div className='flex items-start gap-3'>
                <div className='mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-gray-400'></div>
                <p>
                  <strong>Check your location:</strong> Ensure you're accessing
                  from a supported region (Canada or United States).
                </p>
              </div>

              <div className='flex items-start gap-3'>
                <div className='mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-gray-400'></div>
                <p>
                  <strong>Verify legal compliance:</strong> Adult content laws
                  vary by jurisdiction. Ensure you're legally permitted to
                  access such content in your area.
                </p>
              </div>

              <div className='flex items-start gap-3'>
                <div className='mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-gray-400'></div>
                <p>
                  <strong>Contact support:</strong> If you believe this
                  restriction is in error, please contact our support team.
                </p>
              </div>
            </div>
          </div>

          {/* Contact information */}
          <div className='mt-8 rounded-lg bg-gray-100 p-4'>
            <h3 className='mb-2 text-sm font-semibold text-gray-900'>
              Need Help?
            </h3>
            <div className='space-y-2 text-xs text-gray-600'>
              <p>
                <strong>Email:</strong> support@adultaigallery.com
              </p>
              <p>
                <strong>Subject:</strong> "Geographic Access Issue"
              </p>
              <p className='text-gray-500'>
                Please include your approximate location and the error message
                you received.
              </p>
            </div>
          </div>

          {/* Alternative actions */}
          <div className='mt-8 space-y-3'>
            <Link
              href='/'
              className='inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
            >
              ← Return to Homepage
            </Link>

            <div className='flex justify-center space-x-4 text-xs'>
              <Link
                href='/privacy'
                className='text-gray-500 hover:text-gray-700'
              >
                Privacy Policy
              </Link>
              <span className='text-gray-300'>|</span>
              <Link href='/terms' className='text-gray-500 hover:text-gray-700'>
                Terms of Service
              </Link>
            </div>
          </div>
        </div>

        {/* Footer disclaimer */}
        <div className='mt-12 border-t border-gray-200 pt-6'>
          <p className='text-xs text-gray-500'>
            Adult AI Gallery is committed to legal compliance and responsible
            operation. We respect local laws and regulations in all
            jurisdictions.
          </p>
        </div>
      </div>
    </div>
  )
}
