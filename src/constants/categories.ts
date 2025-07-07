// =====================================================
// Adult Products Gallery - Comprehensive Category Constants
// =====================================================
// Category definitions for adult products marketplace (expanded from 6 to 12 categories)

export const ADULT_CATEGORIES = [
  'adult-toys',
  'lingerie',
  'wellness',
  'digital-content',
  'accessories',
  'couples',
] as const

// For filtering (includes 'all' option)
export const FILTER_CATEGORIES = ['all', ...ADULT_CATEGORIES] as const

// Category display names for better UX
export const CATEGORY_LABELS: Record<string, string> = {
  all: 'All Categories',
  'adult-toys': '🔥 Adult Toys',
  lingerie: '👙 Lingerie',
  wellness: '💊 Wellness',
  'digital-content': '� Digital Content',
  accessories: '🎀 Accessories',
  couples: '� Couples',
}

// Category descriptions for upload guidance
export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'adult-toys':
    'Adult toys, devices, and intimate products for personal pleasure and exploration.',
  lingerie: 'Lingerie, intimate apparel, costumes, and adult fashion items.',
  wellness:
    'Wellness products, enhancement supplements, and health-focused adult products.',
  'digital-content':
    'Digital adult content including images, videos, art, and media for mature audiences.',
  accessories:
    'Adult accessories, jewelry, and complementary products for the adult lifestyle.',
  couples:
    'Products designed for couples including games and items to enhance relationships.',
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
