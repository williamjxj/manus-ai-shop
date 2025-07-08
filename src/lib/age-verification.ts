// =====================================================
// Age Verification and Compliance System
// =====================================================
// Comprehensive age verification with geo-blocking for adult content marketplace

export interface AgeVerificationResult {
  verified: boolean
  method:
    | 'self_declaration'
    | 'document_verification'
    | 'credit_card'
    | 'third_party'
  timestamp: string
  ipAddress?: string
  location?: {
    country: string
    region: string
    city: string
  }
  error?: string
}

export interface ComplianceCheck {
  ageVerified: boolean
  locationAllowed: boolean
  termsAccepted: boolean
  privacyAccepted: boolean
  marketingOptIn?: boolean
  timestamp: string
}

export interface GeoLocation {
  country: string
  countryCode: string
  region: string
  city: string
  latitude?: number
  longitude?: number
  timezone?: string
}

// Allowed countries for adult content (Canada and US)
const ALLOWED_COUNTRIES = ['CA', 'US']
const ALLOWED_COUNTRY_NAMES = ['Canada', 'United States']

// Age verification storage keys
const AGE_VERIFICATION_KEY = 'age_verification'
const COMPLIANCE_CHECK_KEY = 'compliance_check'
const LOCATION_CHECK_KEY = 'location_check'

/**
 * Get user's geolocation using IP address
 */
export async function getUserLocation(): Promise<GeoLocation | null> {
  try {
    // Try multiple geolocation services for reliability
    const services = [
      'https://ipapi.co/json/',
      'https://ip-api.com/json/',
      'https://ipinfo.io/json',
    ]

    for (const service of services) {
      try {
        const response = await fetch(service)
        if (!response.ok) continue

        const data = await response.json()

        // Normalize response format
        let location: GeoLocation

        if (service.includes('ipapi.co')) {
          location = {
            country: data.country_name,
            countryCode: data.country_code,
            region: data.region,
            city: data.city,
            latitude: data.latitude,
            longitude: data.longitude,
            timezone: data.timezone,
          }
        } else if (service.includes('ip-api.com')) {
          location = {
            country: data.country,
            countryCode: data.countryCode,
            region: data.regionName,
            city: data.city,
            latitude: data.lat,
            longitude: data.lon,
            timezone: data.timezone,
          }
        } else if (service.includes('ipinfo.io')) {
          location = {
            country: data.country,
            countryCode: data.country,
            region: data.region,
            city: data.city,
            timezone: data.timezone,
          }
        } else {
          continue
        }

        return location
      } catch (error) {
        console.warn(`Geolocation service ${service} failed:`, error)
        continue
      }
    }

    return null
  } catch (error) {
    console.error('Failed to get user location:', error)
    return null
  }
}

/**
 * Check if user's location is allowed for adult content
 */
export function isLocationAllowed(location: GeoLocation | null): boolean {
  if (!location) {
    // If we can't determine location, err on the side of caution
    return false
  }

  return (
    ALLOWED_COUNTRIES.includes(location.countryCode.toUpperCase()) ||
    ALLOWED_COUNTRY_NAMES.includes(location.country)
  )
}

/**
 * Store age verification result in localStorage
 */
export function storeAgeVerification(result: AgeVerificationResult): void {
  try {
    localStorage.setItem(AGE_VERIFICATION_KEY, JSON.stringify(result))
  } catch (error) {
    console.error('Failed to store age verification:', error)
  }
}

/**
 * Get stored age verification result
 */
export function getStoredAgeVerification(): AgeVerificationResult | null {
  try {
    const stored = localStorage.getItem(AGE_VERIFICATION_KEY)
    if (!stored) return null

    const result = JSON.parse(stored) as AgeVerificationResult

    // Check if verification is still valid (24 hours)
    const verificationTime = new Date(result.timestamp)
    const now = new Date()
    const hoursDiff =
      (now.getTime() - verificationTime.getTime()) / (1000 * 60 * 60)

    if (hoursDiff > 24) {
      localStorage.removeItem(AGE_VERIFICATION_KEY)
      return null
    }

    return result
  } catch (error) {
    console.error('Failed to get stored age verification:', error)
    return null
  }
}

/**
 * Store compliance check result
 */
export function storeComplianceCheck(check: ComplianceCheck): void {
  try {
    localStorage.setItem(COMPLIANCE_CHECK_KEY, JSON.stringify(check))
  } catch (error) {
    console.error('Failed to store compliance check:', error)
  }
}

/**
 * Get stored compliance check result
 */
export function getStoredComplianceCheck(): ComplianceCheck | null {
  try {
    const stored = localStorage.getItem(COMPLIANCE_CHECK_KEY)
    if (!stored) return null

    return JSON.parse(stored) as ComplianceCheck
  } catch (error) {
    console.error('Failed to get stored compliance check:', error)
    return null
  }
}

/**
 * Perform self-declaration age verification
 */
export async function performSelfDeclarationVerification(
  birthDate: string
): Promise<AgeVerificationResult> {
  try {
    const birth = new Date(birthDate)
    const now = new Date()
    const age = now.getFullYear() - birth.getFullYear()
    const monthDiff = now.getMonth() - birth.getMonth()

    // Adjust age if birthday hasn't occurred this year
    const actualAge =
      monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())
        ? age - 1
        : age

    if (actualAge < 18) {
      return {
        verified: false,
        method: 'self_declaration',
        timestamp: new Date().toISOString(),
        error: 'Must be 18 years or older to access this content',
      }
    }

    // Get location for compliance
    const location = await getUserLocation()

    const result: AgeVerificationResult = {
      verified: true,
      method: 'self_declaration',
      timestamp: new Date().toISOString(),
      location: location
        ? {
            country: location.country,
            region: location.region,
            city: location.city,
          }
        : undefined,
    }

    storeAgeVerification(result)
    return result
  } catch (error: any) {
    return {
      verified: false,
      method: 'self_declaration',
      timestamp: new Date().toISOString(),
      error: error.message || 'Age verification failed',
    }
  }
}

/**
 * Perform comprehensive compliance check
 */
export async function performComplianceCheck(
  ageVerified: boolean,
  termsAccepted: boolean,
  privacyAccepted: boolean,
  marketingOptIn?: boolean
): Promise<ComplianceCheck> {
  const location = await getUserLocation()
  const locationAllowed = isLocationAllowed(location)

  const check: ComplianceCheck = {
    ageVerified,
    locationAllowed,
    termsAccepted,
    privacyAccepted,
    marketingOptIn,
    timestamp: new Date().toISOString(),
  }

  storeComplianceCheck(check)
  return check
}

/**
 * Check if user meets all compliance requirements
 */
export function isCompliant(): boolean {
  const ageVerification = getStoredAgeVerification()
  const complianceCheck = getStoredComplianceCheck()

  if (!ageVerification || !ageVerification.verified) {
    return false
  }

  if (!complianceCheck) {
    return false
  }

  return (
    complianceCheck.ageVerified &&
    complianceCheck.locationAllowed &&
    complianceCheck.termsAccepted &&
    complianceCheck.privacyAccepted
  )
}

/**
 * Clear all stored verification data (for logout/reset)
 */
export function clearVerificationData(): void {
  try {
    localStorage.removeItem(AGE_VERIFICATION_KEY)
    localStorage.removeItem(COMPLIANCE_CHECK_KEY)
    localStorage.removeItem(LOCATION_CHECK_KEY)
  } catch (error) {
    console.error('Failed to clear verification data:', error)
  }
}

/**
 * Get compliance status summary
 */
export function getComplianceStatus(): {
  isCompliant: boolean
  ageVerified: boolean
  locationAllowed: boolean
  termsAccepted: boolean
  privacyAccepted: boolean
  lastVerified?: string
} {
  const ageVerification = getStoredAgeVerification()
  const complianceCheck = getStoredComplianceCheck()

  return {
    isCompliant: isCompliant(),
    ageVerified: ageVerification?.verified || false,
    locationAllowed: complianceCheck?.locationAllowed || false,
    termsAccepted: complianceCheck?.termsAccepted || false,
    privacyAccepted: complianceCheck?.privacyAccepted || false,
    lastVerified: ageVerification?.timestamp,
  }
}

/**
 * Validate birth date format and reasonableness
 */
export function validateBirthDate(birthDate: string): {
  valid: boolean
  error?: string
} {
  try {
    const birth = new Date(birthDate)
    const now = new Date()

    // Check if date is valid
    if (isNaN(birth.getTime())) {
      return { valid: false, error: 'Invalid date format' }
    }

    // Check if date is in the future
    if (birth > now) {
      return { valid: false, error: 'Birth date cannot be in the future' }
    }

    // Check if date is reasonable (not more than 120 years ago)
    const maxAge = 120
    const minBirthYear = now.getFullYear() - maxAge
    if (birth.getFullYear() < minBirthYear) {
      return { valid: false, error: 'Birth date is not reasonable' }
    }

    return { valid: true }
  } catch (error) {
    return { valid: false, error: 'Invalid date format' }
  }
}
