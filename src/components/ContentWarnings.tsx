import { AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

import {
  ContentWarning,
  formatContentWarnings,
  getContentSeverityLevel,
  getContentWarningInfo,
  getWarningBadgeClasses,
} from '@/lib/content-moderation'

interface ContentWarningsProps {
  warnings: ContentWarning[]
  showDetails?: boolean
  className?: string
}

export function ContentWarningBadges({
  warnings,
  className = '',
}: ContentWarningsProps) {
  if (!warnings || warnings.length === 0) return null

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {warnings.map((warning) => {
        const info = getContentWarningInfo(warning)
        const badgeClasses = getWarningBadgeClasses(warning)

        return (
          <span
            key={warning}
            className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium ${badgeClasses}`}
            title={info.warning_description}
          >
            {info.warning_label}
          </span>
        )
      })}
    </div>
  )
}

interface ContentWarningOverlayProps {
  warnings: ContentWarning[]
  onAccept: () => void
  onDecline?: () => void
  productName?: string
}

export function ContentWarningOverlay({
  warnings,
  onAccept,
  onDecline,
  productName,
}: ContentWarningOverlayProps) {
  const severityLevel = getContentSeverityLevel(warnings)
  const warningText = formatContentWarnings(warnings)

  const getSeverityColor = () => {
    if (severityLevel >= 4) return 'from-red-600 to-red-700'
    if (severityLevel >= 3) return 'from-orange-600 to-orange-700'
    return 'from-yellow-600 to-yellow-700'
  }

  const getSeverityIcon = () => {
    if (severityLevel >= 4) {
      return (
        <svg className='h-8 w-8' fill='currentColor' viewBox='0 0 20 20'>
          <path
            fillRule='evenodd'
            d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
            clipRule='evenodd'
          />
        </svg>
      )
    }
    return <AlertTriangle className='h-8 w-8' />
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4'>
      <div className='w-full max-w-md rounded-lg bg-white p-6 text-center'>
        {/* Warning Icon */}
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r ${getSeverityColor()} mb-4 text-white`}
        >
          {getSeverityIcon()}
        </div>

        {/* Title */}
        <h2 className='mb-4 text-2xl font-bold text-gray-900'>
          Content Warning
        </h2>

        {/* Product name */}
        {productName && (
          <p className='mb-3 text-lg font-semibold text-gray-800'>
            "{productName}"
          </p>
        )}

        {/* Warning details */}
        <div className='mb-6 space-y-3'>
          <p className='font-semibold text-red-600'>🔞 ADULT CONTENT WARNING</p>
          <p className='text-gray-700'>
            This content contains: <strong>{warningText}</strong>
          </p>
          <p className='text-sm text-gray-600'>
            You must be 18 years or older and legally permitted to view adult
            content in your jurisdiction to proceed.
          </p>
        </div>

        {/* Warning badges */}
        <div className='mb-6'>
          <ContentWarningBadges
            warnings={warnings}
            className='justify-center'
          />
        </div>

        {/* Action buttons */}
        <div className='space-y-3'>
          <button
            onClick={onAccept}
            className={`w-full rounded-lg bg-gradient-to-r px-6 py-3 font-semibold text-white ${getSeverityColor()} transition-opacity hover:opacity-90`}
          >
            I am 18+ and understand - View Content
          </button>

          {onDecline && (
            <button
              onClick={onDecline}
              className='w-full rounded-lg bg-gray-200 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-300'
            >
              Go Back
            </button>
          )}
        </div>

        {/* Legal notice */}
        <div className='mt-6 border-t border-gray-200 pt-4'>
          <p className='text-xs text-gray-500'>
            By proceeding, you confirm that you are of legal age and that
            viewing adult content is legal in your jurisdiction.
          </p>
        </div>
      </div>
    </div>
  )
}

interface BlurredContentProps {
  warnings: ContentWarning[]
  children: React.ReactNode
  productName?: string
  className?: string
}

export function BlurredContent({
  warnings,
  children,
  productName,
  className = '',
}: BlurredContentProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const [showWarning, setShowWarning] = useState(false)

  const severityLevel = getContentSeverityLevel(warnings)

  const handleReveal = () => {
    if (severityLevel >= 3) {
      setShowWarning(true)
    } else {
      setIsRevealed(true)
    }
  }

  const handleAcceptWarning = () => {
    setShowWarning(false)
    setIsRevealed(true)
  }

  const handleDeclineWarning = () => {
    setShowWarning(false)
  }

  if (isRevealed) {
    return <div className={className}>{children}</div>
  }

  return (
    <>
      <div className={`relative ${className}`}>
        {/* Blurred content */}
        <div className='pointer-events-none select-none blur-lg filter'>
          {children}
        </div>

        {/* Overlay */}
        <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-50'>
          <div className='p-4 text-center text-white'>
            <div className='mb-4'>
              <EyeOff className='mx-auto mb-2 h-12 w-12 opacity-75' />
              <p className='font-semibold'>Adult Content</p>
              <p className='text-sm opacity-75'>Click to reveal</p>
            </div>

            {/* Content warnings */}
            <div className='mb-4'>
              <ContentWarningBadges
                warnings={warnings}
                className='justify-center'
              />
            </div>

            <button
              onClick={handleReveal}
              className='inline-flex items-center gap-2 rounded-lg bg-white bg-opacity-20 px-4 py-2 font-medium transition-all hover:bg-opacity-30'
            >
              <Eye className='h-4 w-4' />
              Reveal Content (18+)
            </button>
          </div>
        </div>
      </div>

      {/* Warning modal */}
      {showWarning && (
        <ContentWarningOverlay
          warnings={warnings}
          productName={productName}
          onAccept={handleAcceptWarning}
          onDecline={handleDeclineWarning}
        />
      )}
    </>
  )
}
