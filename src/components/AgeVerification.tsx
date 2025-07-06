'use client'

import { useEffect, useState } from 'react'

interface AgeVerificationProps {
  children: React.ReactNode
}

export default function AgeVerification({ children }: AgeVerificationProps) {
  const [isVerified, setIsVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user has already verified their age
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      const verified = localStorage.getItem('ageVerified')
      if (verified === 'true') {
        setIsVerified(true)
      }
    }
    setIsLoading(false)
  }, [])

  const handleVerify = (isAdult: boolean) => {
    if (typeof window !== 'undefined') {
      if (isAdult) {
        localStorage.setItem('ageVerified', 'true')
        setIsVerified(true)
      } else {
        // Redirect to a safe site or show a message
        window.location.href = 'https://www.google.com'
      }
    }
  }

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'>
        <div className='h-32 w-32 animate-spin rounded-full border-b-2 border-pink-500'></div>
      </div>
    )
  }

  if (!isVerified) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4'>
        <div className='w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl'>
          {/* Warning Icon */}
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
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className='mb-4 text-2xl font-bold text-gray-900'>
            Age Verification Required
          </h1>

          {/* Description */}
          <div className='mb-8 space-y-3 text-gray-600'>
            <p className='font-semibold text-red-600'>
              🔞 ADULT CONTENT WARNING
            </p>
            <p>
              This website contains adult content intended for mature audiences
              only.
            </p>
            <p>
              You must be <strong>18 years or older</strong> to access this
              site.
            </p>
            <p className='text-sm'>
              By clicking "I am 18 or older", you confirm that you are of legal
              age to view adult content in your jurisdiction.
            </p>
          </div>

          {/* Buttons */}
          <div className='space-y-3'>
            <button
              onClick={() => handleVerify(true)}
              className='w-full rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-rose-700 hover:to-pink-700'
            >
              I am 18 or older - Enter Site
            </button>

            <button
              onClick={() => handleVerify(false)}
              className='w-full rounded-lg bg-gray-200 px-6 py-3 font-semibold text-gray-800 transition-all duration-200 hover:bg-gray-300'
            >
              I am under 18 - Exit
            </button>
          </div>

          {/* Legal Notice */}
          <div className='mt-6 border-t pt-4 text-xs text-gray-500'>
            <p>
              This site uses cookies to remember your age verification. By
              entering, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
