'use client'

import { useRouter } from 'next/navigation'
import React, { ReactNode, useState } from 'react'

interface LoadingLinkProps {
  href: string
  children: ReactNode
  className?: string
  loadingText?: string
  onClick?: () => void
}

export default function LoadingLink({
  href,
  children,
  className = '',
  loadingText = 'Loading...',
  onClick,
}: LoadingLinkProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (onClick) {
      onClick()
    }

    try {
      router.push(href)
    } catch (error) {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`${className} ${isLoading ? 'cursor-not-allowed opacity-75' : ''}`}
    >
      {isLoading ? (
        <div className='flex items-center justify-center gap-2'>
          <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
          <span>{loadingText}</span>
        </div>
      ) : (
        children
      )}
    </button>
  )
}
