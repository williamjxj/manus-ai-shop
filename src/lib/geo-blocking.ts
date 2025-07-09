import { NextRequest } from 'next/server'

// Configuration for geo-blocking
export const GEO_BLOCKING_CONFIG = {
  // Countries where adult content may be restricted (ISO 3166-1 alpha-2 codes)
  BLOCKED_COUNTRIES: [
    // Add countries as needed based on legal requirements
    // Example: 'CN', 'IN', 'SA', 'AE', 'IR', 'PK'
  ],

  // U.S. states with specific adult content restrictions
  RESTRICTED_US_STATES: [
    // Add state codes as needed
    // Example: 'UT', 'TX' (if specific restrictions apply)
  ],

  // Canadian provinces with specific restrictions
  RESTRICTED_CA_PROVINCES: [
    // Add province codes as needed
  ],

  // Allowed countries (if using allowlist approach)
  // During testing: empty array allows access from anywhere
  ALLOWED_COUNTRIES: [], // ['US', 'CA'] - restore for production

  // Default behavior: 'block' or 'allow'
  DEFAULT_BEHAVIOR: 'allow' as 'block' | 'allow',
}

export interface LocationInfo {
  country?: string
  region?: string
  city?: string
  ip?: string
  isBlocked: boolean
  blockReason?: string
}

/**
 * Get location information from request headers
 * Works with Vercel's geo headers and Cloudflare headers
 */
export function getLocationFromRequest(request: NextRequest): LocationInfo {
  const headers = request.headers

  // Try Vercel geo headers first
  const country =
    headers.get('x-vercel-ip-country') ||
    headers.get('cf-ipcountry') ||
    headers.get('x-country-code')

  const region =
    headers.get('x-vercel-ip-country-region') ||
    headers.get('cf-region-code') ||
    headers.get('x-region-code')

  const city =
    headers.get('x-vercel-ip-city') ||
    headers.get('cf-ipcity') ||
    headers.get('x-city')

  const ip =
    headers.get('x-forwarded-for')?.split(',')[0] ||
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')

  const locationInfo: LocationInfo = {
    country: country?.toUpperCase(),
    region: region?.toUpperCase(),
    city,
    ip,
    isBlocked: false,
  }

  // Check if location should be blocked
  const blockResult = checkLocationBlocking(locationInfo)
  locationInfo.isBlocked = blockResult.isBlocked
  locationInfo.blockReason = blockResult.reason

  return locationInfo
}

/**
 * Check if a location should be blocked based on geo-blocking rules
 */
export function checkLocationBlocking(location: LocationInfo): {
  isBlocked: boolean
  reason?: string
} {
  const { country, region } = location

  // If no country information available, apply default behavior
  if (!country) {
    return {
      isBlocked: GEO_BLOCKING_CONFIG.DEFAULT_BEHAVIOR === 'block',
      reason:
        GEO_BLOCKING_CONFIG.DEFAULT_BEHAVIOR === 'block'
          ? 'Location cannot be determined'
          : undefined,
    }
  }

  // Check blocked countries
  if (GEO_BLOCKING_CONFIG.BLOCKED_COUNTRIES.includes(country)) {
    return {
      isBlocked: true,
      reason: `Access restricted in ${country}`,
    }
  }

  // Check allowed countries (if using allowlist)
  if (
    GEO_BLOCKING_CONFIG.ALLOWED_COUNTRIES.length > 0 &&
    !GEO_BLOCKING_CONFIG.ALLOWED_COUNTRIES.includes(country)
  ) {
    return {
      isBlocked: true,
      reason: `Service not available in ${country}`,
    }
  }

  // Check U.S. state restrictions
  if (
    country === 'US' &&
    region &&
    GEO_BLOCKING_CONFIG.RESTRICTED_US_STATES.includes(region)
  ) {
    return {
      isBlocked: true,
      reason: `Access restricted in ${region}, United States`,
    }
  }

  // Check Canadian province restrictions
  if (
    country === 'CA' &&
    region &&
    GEO_BLOCKING_CONFIG.RESTRICTED_CA_PROVINCES.includes(region)
  ) {
    return {
      isBlocked: true,
      reason: `Access restricted in ${region}, Canada`,
    }
  }

  return { isBlocked: false }
}

/**
 * Check if request is from a development environment
 */
export function isDevelopmentEnvironment(request: NextRequest): boolean {
  const host = request.headers.get('host') || ''
  return (
    host.includes('localhost') ||
    host.includes('127.0.0.1') ||
    host.includes('.local') ||
    process.env.NODE_ENV === 'development'
  )
}

/**
 * Get user-friendly location string
 */
export function getLocationString(location: LocationInfo): string {
  const parts: string[] = []

  if (location.city) parts.push(location.city)
  if (location.region) parts.push(location.region)
  if (location.country) parts.push(location.country)

  return parts.join(', ') || 'Unknown Location'
}

/**
 * Log geo-blocking events for monitoring
 */
export function logGeoBlockingEvent(
  location: LocationInfo,
  action: 'blocked' | 'allowed',
  userAgent?: string
) {
  const logData = {
    timestamp: new Date().toISOString(),
    action,
    location: {
      country: location.country,
      region: location.region,
      city: location.city,
    },
    ip: location.ip,
    userAgent,
    blockReason: location.blockReason,
  }

  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.warn('Geo-blocking event:', logData)
  }

  // In production, integrate with logging service (Vercel Analytics, Datadog, etc.)
}

/**
 * Environment variable configuration
 */
export function getGeoBlockingConfig() {
  return {
    blockedCountries:
      process.env.BLOCKED_COUNTRIES?.split(',') ||
      GEO_BLOCKING_CONFIG.BLOCKED_COUNTRIES,
    restrictedUSStates:
      process.env.RESTRICTED_US_STATES?.split(',') ||
      GEO_BLOCKING_CONFIG.RESTRICTED_US_STATES,
    restrictedCAProvinces:
      process.env.RESTRICTED_CA_PROVINCES?.split(',') ||
      GEO_BLOCKING_CONFIG.RESTRICTED_CA_PROVINCES,
    allowedCountries:
      process.env.ALLOWED_COUNTRIES?.split(',') ||
      GEO_BLOCKING_CONFIG.ALLOWED_COUNTRIES,
    defaultBehavior:
      (process.env.GEO_BLOCKING_DEFAULT_BEHAVIOR as 'block' | 'allow') ||
      GEO_BLOCKING_CONFIG.DEFAULT_BEHAVIOR,
  }
}
