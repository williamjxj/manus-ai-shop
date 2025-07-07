// =====================================================
// Content Moderation Utilities for Adult Content
// =====================================================

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged'
export type ReportType =
  | 'inappropriate'
  | 'copyright'
  | 'spam'
  | 'illegal'
  | 'other'
export type ContentWarning =
  | 'nudity'
  | 'sexual-content'
  | 'fetish'
  | 'bdsm'
  | 'violence'
  | 'substance-use'
  | 'mature-themes'
  | 'fantasy'

export interface ContentReport {
  id: string
  reporter_id: string
  product_id: string
  report_type: ReportType
  description?: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  created_at: string
}

export interface ProductReview {
  id: string
  product_id: string
  user_id: string
  rating: number
  review_text?: string
  is_anonymous: boolean
  moderation_status: ModerationStatus
  helpful_count: number
  created_at: string
  updated_at: string
}

export interface ContentWarningType {
  warning_code: ContentWarning
  warning_label: string
  warning_description: string
  severity_level: number
}

// Content warning definitions
export const CONTENT_WARNINGS: Record<ContentWarning, ContentWarningType> = {
  nudity: {
    warning_code: 'nudity',
    warning_label: 'Nudity',
    warning_description: 'Contains full or partial nudity',
    severity_level: 3,
  },
  'sexual-content': {
    warning_code: 'sexual-content',
    warning_label: 'Sexual Content',
    warning_description: 'Contains explicit sexual content',
    severity_level: 4,
  },
  fetish: {
    warning_code: 'fetish',
    warning_label: 'Fetish Content',
    warning_description: 'Contains fetish or kink related content',
    severity_level: 4,
  },
  bdsm: {
    warning_code: 'bdsm',
    warning_label: 'BDSM',
    warning_description: 'Contains BDSM or bondage content',
    severity_level: 4,
  },
  violence: {
    warning_code: 'violence',
    warning_label: 'Violence',
    warning_description: 'Contains violent or aggressive content',
    severity_level: 5,
  },
  'substance-use': {
    warning_code: 'substance-use',
    warning_label: 'Substance Use',
    warning_description: 'Contains drug or alcohol use',
    severity_level: 2,
  },
  'mature-themes': {
    warning_code: 'mature-themes',
    warning_label: 'Mature Themes',
    warning_description: 'Contains mature themes and situations',
    severity_level: 2,
  },
  fantasy: {
    warning_code: 'fantasy',
    warning_label: 'Fantasy Content',
    warning_description: 'Contains fantasy or fictional scenarios',
    severity_level: 1,
  },
}

// Report type definitions
export const REPORT_TYPES: Record<
  ReportType,
  { label: string; description: string }
> = {
  inappropriate: {
    label: 'Inappropriate Content',
    description: 'Content that violates community guidelines',
  },
  copyright: {
    label: 'Copyright Violation',
    description: 'Unauthorized use of copyrighted material',
  },
  spam: {
    label: 'Spam',
    description: 'Repetitive or promotional content',
  },
  illegal: {
    label: 'Illegal Content',
    description: 'Content that may violate laws',
  },
  other: {
    label: 'Other',
    description: 'Other issues not covered above',
  },
}

/**
 * Get content warning display information
 */
export function getContentWarningInfo(
  warningCode: ContentWarning
): ContentWarningType {
  return CONTENT_WARNINGS[warningCode]
}

/**
 * Get all content warnings sorted by severity
 */
export function getAllContentWarnings(): ContentWarningType[] {
  return Object.values(CONTENT_WARNINGS).sort(
    (a, b) => b.severity_level - a.severity_level
  )
}

/**
 * Get content warnings for display with proper formatting
 */
export function formatContentWarnings(warnings: ContentWarning[]): string {
  if (!warnings || warnings.length === 0) return ''

  return warnings
    .map((warning) => CONTENT_WARNINGS[warning]?.warning_label || warning)
    .join(', ')
}

/**
 * Check if content requires age verification based on warnings
 */
export function requiresAgeVerification(warnings: ContentWarning[]): boolean {
  if (!warnings || warnings.length === 0) return true // Default to requiring verification

  return warnings.some((warning) => {
    const info = CONTENT_WARNINGS[warning]
    return info && info.severity_level >= 3
  })
}

/**
 * Get severity level for content based on warnings
 */
export function getContentSeverityLevel(warnings: ContentWarning[]): number {
  if (!warnings || warnings.length === 0) return 1

  return Math.max(
    ...warnings.map((warning) => CONTENT_WARNINGS[warning]?.severity_level || 1)
  )
}

/**
 * Validate content warnings array
 */
export function validateContentWarnings(warnings: string[]): ContentWarning[] {
  return warnings.filter(
    (warning): warning is ContentWarning => warning in CONTENT_WARNINGS
  )
}

/**
 * Get report type information
 */
export function getReportTypeInfo(reportType: ReportType) {
  return REPORT_TYPES[reportType]
}

/**
 * Generate content warning badge classes based on severity
 */
export function getWarningBadgeClasses(warning: ContentWarning): string {
  const severity = CONTENT_WARNINGS[warning]?.severity_level || 1

  switch (severity) {
    case 5:
      return 'bg-red-100 text-red-800 border-red-200'
    case 4:
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 3:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 2:
      return 'bg-blue-100 text-blue-800 border-blue-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

/**
 * Check if user can moderate content (placeholder for role-based access)
 */
export function canModerateContent(_userId: string): boolean {
  // TODO: Implement role-based access control
  // For now, return false - only admins should moderate
  return false
}

/**
 * Generate moderation action classes
 */
export function getModerationStatusClasses(status: ModerationStatus): string {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'flagged':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'pending':
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }
}

/**
 * Get moderation status display text
 */
export function getModerationStatusText(status: ModerationStatus): string {
  switch (status) {
    case 'approved':
      return 'Approved'
    case 'rejected':
      return 'Rejected'
    case 'flagged':
      return 'Flagged'
    case 'pending':
    default:
      return 'Pending Review'
  }
}
