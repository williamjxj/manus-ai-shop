import { ReactNode } from 'react'

interface ShimmerSkeletonProps {
  className?: string
  children?: ReactNode
  variant?: 'default' | 'rounded' | 'circle'
  shimmerColor?: 'gray' | 'blue' | 'indigo'
}

export default function ShimmerSkeleton({
  className = '',
  children,
  variant = 'default',
  shimmerColor = 'gray',
}: ShimmerSkeletonProps) {
  const baseClasses = 'relative overflow-hidden'

  const variantClasses = {
    default: 'rounded',
    rounded: 'rounded-lg',
    circle: 'rounded-full',
  }

  const shimmerColorClasses = {
    gray: 'bg-gray-200',
    blue: 'bg-blue-100',
    indigo: 'bg-indigo-100',
  }

  const shimmerGradientClasses = {
    gray: 'from-transparent via-white to-transparent',
    blue: 'from-transparent via-blue-50 to-transparent',
    indigo: 'from-transparent via-indigo-50 to-transparent',
  }

  return (
    <div
      className={` ${baseClasses} ${variantClasses[variant]} ${shimmerColorClasses[shimmerColor]} ${className} `}
    >
      {children}

      {/* Shimmer overlay */}
      <div
        className={`absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r ${shimmerGradientClasses[shimmerColor]} `}
        style={{
          animation: 'shimmer 2s infinite',
        }}
      />
    </div>
  )
}

// Predefined skeleton components for common use cases
export function SkeletonText({
  className = '',
  lines = 1,
  shimmerColor = 'gray' as const,
}: {
  className?: string
  lines?: number
  shimmerColor?: 'gray' | 'blue' | 'indigo'
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <ShimmerSkeleton
          key={i}
          className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
          shimmerColor={shimmerColor}
        />
      ))}
    </div>
  )
}

export function SkeletonImage({
  className = '',
  shimmerColor = 'gray' as const,
}: {
  className?: string
  shimmerColor?: 'gray' | 'blue' | 'indigo'
}) {
  return (
    <ShimmerSkeleton
      className={`aspect-square w-full ${className}`}
      variant='rounded'
      shimmerColor={shimmerColor}
    />
  )
}

export function SkeletonButton({
  className = '',
  shimmerColor = 'gray' as const,
}: {
  className?: string
  shimmerColor?: 'gray' | 'blue' | 'indigo'
}) {
  return (
    <ShimmerSkeleton
      className={`h-10 w-full ${className}`}
      variant='rounded'
      shimmerColor={shimmerColor}
    />
  )
}

export function SkeletonCard({
  className = '',
  shimmerColor = 'gray' as const,
}: {
  className?: string
  shimmerColor?: 'gray' | 'blue' | 'indigo'
}) {
  return (
    <div className={`rounded-lg bg-white p-4 shadow-md ${className}`}>
      <SkeletonImage className='mb-4' shimmerColor={shimmerColor} />
      <SkeletonText lines={1} className='mb-2' shimmerColor={shimmerColor} />
      <SkeletonText lines={2} className='mb-4' shimmerColor={shimmerColor} />
      <SkeletonText
        lines={1}
        className='mb-4 w-1/2'
        shimmerColor={shimmerColor}
      />
      <SkeletonButton shimmerColor={shimmerColor} />
    </div>
  )
}
