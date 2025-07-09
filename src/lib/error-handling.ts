// Enhanced error handling utilities for AI Shop

export interface ApiError {
  code: string
  message: string
  details?: any
  statusCode: number
}

export class PurchaseError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly details?: any

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: any
  ) {
    super(message)
    this.name = 'PurchaseError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

// Common error codes and messages
export const ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Authentication required',
    statusCode: 401,
  },
  FORBIDDEN: { code: 'FORBIDDEN', message: 'Access denied', statusCode: 403 },

  // Validation errors
  INVALID_INPUT: {
    code: 'INVALID_INPUT',
    message: 'Invalid input data',
    statusCode: 400,
  },
  MISSING_FIELDS: {
    code: 'MISSING_FIELDS',
    message: 'Required fields missing',
    statusCode: 400,
  },
  INVALID_CART: {
    code: 'INVALID_CART',
    message: 'Invalid cart data',
    statusCode: 400,
  },
  EMPTY_CART: { code: 'EMPTY_CART', message: 'Cart is empty', statusCode: 400 },

  // Points errors
  INSUFFICIENT_POINTS: {
    code: 'INSUFFICIENT_POINTS',
    message: 'Insufficient points balance',
    statusCode: 400,
  },
  POINTS_UPDATE_FAILED: {
    code: 'POINTS_UPDATE_FAILED',
    message: 'Failed to update points',
    statusCode: 500,
  },
  INVALID_POINTS_PACKAGE: {
    code: 'INVALID_POINTS_PACKAGE',
    message: 'Invalid points package',
    statusCode: 400,
  },

  // Payment errors
  PAYMENT_FAILED: {
    code: 'PAYMENT_FAILED',
    message: 'Payment processing failed',
    statusCode: 500,
  },
  STRIPE_ERROR: {
    code: 'STRIPE_ERROR',
    message: 'Payment service unavailable',
    statusCode: 503,
  },
  MINIMUM_AMOUNT: {
    code: 'MINIMUM_AMOUNT',
    message: 'Order does not meet minimum amount',
    statusCode: 400,
  },

  // Database errors
  DATABASE_ERROR: {
    code: 'DATABASE_ERROR',
    message: 'Database operation failed',
    statusCode: 500,
  },
  TRANSACTION_FAILED: {
    code: 'TRANSACTION_FAILED',
    message: 'Transaction could not be completed',
    statusCode: 500,
  },
  PROFILE_ERROR: {
    code: 'PROFILE_ERROR',
    message: 'User profile error',
    statusCode: 500,
  },

  // Order errors
  ORDER_CREATION_FAILED: {
    code: 'ORDER_CREATION_FAILED',
    message: 'Failed to create order',
    statusCode: 500,
  },
  ORDER_NOT_FOUND: {
    code: 'ORDER_NOT_FOUND',
    message: 'Order not found',
    statusCode: 404,
  },

  // Webhook errors
  WEBHOOK_VERIFICATION_FAILED: {
    code: 'WEBHOOK_VERIFICATION_FAILED',
    message: 'Webhook signature verification failed',
    statusCode: 400,
  },
  DUPLICATE_WEBHOOK: {
    code: 'DUPLICATE_WEBHOOK',
    message: 'Duplicate webhook event',
    statusCode: 200,
  },

  // Generic errors
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
    statusCode: 500,
  },
  SERVICE_UNAVAILABLE: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Service temporarily unavailable',
    statusCode: 503,
  },
} as const

// Create standardized error responses
export function createErrorResponse(
  errorCode: keyof typeof ERROR_CODES,
  details?: any
) {
  const error = ERROR_CODES[errorCode]
  return {
    error: {
      code: error.code,
      message: error.message,
      details,
    },
    statusCode: error.statusCode,
  }
}

// Enhanced logging with structured data
export function logError(
  context: string,
  error: Error | unknown,
  metadata?: Record<string, any>
) {
  const timestamp = new Date().toISOString()
  const errorData = {
    timestamp,
    context,
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error,
    metadata,
  }

  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.error(
      `[ERROR ${timestamp}] ${context}:`,
      JSON.stringify(errorData, null, 2)
    )
  }
}

// Log successful operations
export function logSuccess(
  context: string,
  message: string,
  metadata?: Record<string, any>
) {
  const timestamp = new Date().toISOString()
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `[SUCCESS ${timestamp}] ${context}: ${message}`,
      metadata ? JSON.stringify(metadata, null, 2) : ''
    )
  }
}

// Log warnings
export function logWarning(
  context: string,
  message: string,
  metadata?: Record<string, any>
) {
  const timestamp = new Date().toISOString()
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `[WARNING ${timestamp}] ${context}: ${message}`,
      metadata ? JSON.stringify(metadata, null, 2) : ''
    )
  }
}

// Validate cart items structure
export function validateCartItems(cartItems: any[]): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!Array.isArray(cartItems)) {
    errors.push('Cart items must be an array')
    return { valid: false, errors }
  }

  if (cartItems.length === 0) {
    errors.push('Cart cannot be empty')
    return { valid: false, errors }
  }

  cartItems.forEach((item, index) => {
    if (!item.product) {
      errors.push(`Item ${index}: Missing product data`)
      return
    }

    if (!item.product.id) {
      errors.push(`Item ${index}: Missing product ID`)
    }

    if (
      typeof item.product.price_cents !== 'number' ||
      item.product.price_cents < 0
    ) {
      errors.push(`Item ${index}: Invalid price_cents`)
    }

    if (
      typeof item.product.points_price !== 'number' ||
      item.product.points_price < 0
    ) {
      errors.push(`Item ${index}: Invalid points_price`)
    }

    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      errors.push(`Item ${index}: Invalid quantity`)
    }
  })

  return { valid: errors.length === 0, errors }
}

// Validate points package data
export function validatePointsPackage(packageData: any): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!packageData.packageId) {
    errors.push('Missing package ID')
  }

  if (typeof packageData.points !== 'number' || packageData.points <= 0) {
    errors.push('Invalid points amount')
  }

  if (typeof packageData.price !== 'number' || packageData.price <= 0) {
    errors.push('Invalid price amount')
  }

  return { valid: errors.length === 0, errors }
}

// Rate limiting helper
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> =
    new Map()

  private maxAttempts: number
  private windowMs: number

  constructor(
    maxAttempts: number = 10,
    windowMs: number = 60000 // 1 minute
  ) {
    this.maxAttempts = maxAttempts
    this.windowMs = windowMs
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const record = this.attempts.get(identifier)

    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      })
      return true
    }

    if (record.count >= this.maxAttempts) {
      return false
    }

    record.count++
    return true
  }

  getRemainingAttempts(identifier: string): number {
    const record = this.attempts.get(identifier)
    if (!record || Date.now() > record.resetTime) {
      return this.maxAttempts
    }
    return Math.max(0, this.maxAttempts - record.count)
  }
}

// Global rate limiters for different operations
export const checkoutRateLimiter = new RateLimiter(5, 60000) // 5 attempts per minute
export const pointsPurchaseRateLimiter = new RateLimiter(3, 300000) // 3 attempts per 5 minutes

// Sanitize sensitive data for logging
export function sanitizeForLogging(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'stripe_payment_intent_id',
  ]
  const sanitized = { ...data }

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]'
    }
  }

  return sanitized
}

// Retry mechanism for database operations
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === maxRetries) {
        throw lastError
      }

      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, delayMs * Math.pow(2, attempt - 1))
      )
    }
  }

  throw lastError!
}
