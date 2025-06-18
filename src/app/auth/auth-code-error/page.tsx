'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function AuthCodeErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const description = searchParams.get('description')

  const getErrorMessage = () => {
    if (error === 'server_error' && description?.includes('Database error')) {
      return {
        title: 'Database Configuration Error',
        message:
          'The database is not properly configured. Please ensure the database schema has been set up correctly.',
        details: description,
      }
    }

    if (
      error === 'validation_failed' &&
      description?.includes('provider is not enabled')
    ) {
      return {
        title: 'OAuth Provider Not Enabled',
        message:
          'The social login provider is not enabled in the authentication settings.',
        details: description,
      }
    }

    return {
      title: 'Authentication Error',
      message: "Sorry, we couldn't authenticate you. Please try again.",
      details:
        description || 'An unknown error occurred during authentication.',
    }
  }

  const errorInfo = getErrorMessage()

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8 text-center'>
        <div>
          <h2 className='mt-6 text-3xl font-extrabold text-gray-900'>
            {errorInfo.title}
          </h2>
          <p className='mt-2 text-sm text-gray-600'>{errorInfo.message}</p>
          {errorInfo.details && (
            <div className='mt-4 rounded-md border border-red-200 bg-red-50 p-3'>
              <p className='font-mono text-xs text-red-700'>
                {errorInfo.details}
              </p>
            </div>
          )}
        </div>
        <div>
          <Link
            href='/login'
            className='group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

function AuthCodeErrorFallback() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8 text-center'>
        <div>
          <h2 className='mt-6 text-3xl font-extrabold text-gray-900'>
            Authentication Error
          </h2>
          <p className='mt-2 text-sm text-gray-600'>
            Sorry, we couldn&apos;t authenticate you. Please try again.
          </p>
        </div>
        <div>
          <Link
            href='/login'
            className='group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AuthCodeError() {
  return (
    <Suspense fallback={<AuthCodeErrorFallback />}>
      <AuthCodeErrorContent />
    </Suspense>
  )
}
