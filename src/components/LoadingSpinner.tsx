interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'rose' | 'indigo' | 'blue' | 'gray'
  text?: string
  showText?: boolean
}

export default function LoadingSpinner({
  size = 'md',
  color = 'rose',
  text = 'Loading...',
  showText = true,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  }

  const colorClasses = {
    rose: 'border-rose-500',
    indigo: 'border-indigo-500',
    blue: 'border-blue-500',
    gray: 'border-gray-500',
  }

  const textColorClasses = {
    rose: 'text-rose-600',
    indigo: 'text-indigo-600',
    blue: 'text-blue-600',
    gray: 'text-gray-600',
  }

  return (
    <div className='flex flex-col items-center justify-center space-y-2'>
      <div className='relative'>
        <div
          className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200`}
        ></div>
        <div
          className={`absolute left-0 top-0 ${sizeClasses[size]} animate-spin rounded-full border-4 border-transparent border-t-${color}-500 ${colorClasses[color]}`}
        ></div>
      </div>
      {showText && (
        <p className={`text-sm font-medium ${textColorClasses[color]}`}>
          {text}
        </p>
      )}
    </div>
  )
}
