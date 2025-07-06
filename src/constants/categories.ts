// =====================================================
// Adult AI Gallery - Static Category Constants
// =====================================================
// Category definitions matching the static categories table (max 6 items)

export const ADULT_CATEGORIES = [
  'artistic-nude',
  'boudoir',
  'glamour',
  'erotic-art',
  'adult-animation',
  'mature-content',
] as const

// For filtering (includes 'all' option)
export const FILTER_CATEGORIES = ['all', ...ADULT_CATEGORIES] as const

// Category display names for better UX
export const CATEGORY_LABELS: Record<string, string> = {
  all: 'All Categories',
  'artistic-nude': 'Artistic Nude',
  boudoir: 'Boudoir',
  glamour: 'Glamour',
  'erotic-art': 'Erotic Art',
  'adult-animation': 'Adult Animation',
  'mature-content': 'Mature Content',
}

// Category descriptions for upload guidance
export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'artistic-nude':
    'Artistic nude photography and fine art featuring tasteful nudity with emphasis on form, lighting, and composition',
  boudoir:
    'Intimate boudoir photography featuring elegant poses, lingerie, and sensual styling in private settings',
  glamour:
    'Professional glamour photography with high-end styling, makeup, and fashion elements',
  'erotic-art':
    'Artistic erotic content including digital art, paintings, and creative visual expressions of sensuality',
  'adult-animation':
    'Animated adult content including digital animations, motion graphics, and artistic video content',
  'mature-content':
    'General mature content for adult audiences including various themes and artistic expressions',
}

// Type definitions
export type AdultCategory = (typeof ADULT_CATEGORIES)[number]
export type FilterCategory = (typeof FILTER_CATEGORIES)[number]

// Validation function
export function isValidAdultCategory(
  category: string
): category is AdultCategory {
  return ADULT_CATEGORIES.includes(category as AdultCategory)
}

export function isValidFilterCategory(
  category: string
): category is FilterCategory {
  return FILTER_CATEGORIES.includes(category as FilterCategory)
}

// Helper function to get category label
export function getCategoryLabel(category: string): string {
  return (
    CATEGORY_LABELS[category] ||
    category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')
  )
}

// Helper function to get category description
export function getCategoryDescription(category: string): string {
  return CATEGORY_DESCRIPTIONS[category] || 'Adult content category'
}
