import { Metadata } from 'next'

export interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  canonical?: string
  noindex?: boolean
  ogImage?: string
  ogType?: 'website' | 'article' | 'product'
  twitterCard?: 'summary' | 'summary_large_image'
  structuredData?: any
}

/**
 * Generate metadata for adult content pages with proper SEO
 */
export function generateAdultContentMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    canonical,
    noindex = false,
    ogImage,
    ogType = 'website',
    twitterCard = 'summary_large_image',
    structuredData,
  } = config

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://adult-ai-gallery.com'
  const defaultOgImage = `${baseUrl}/og-image-adult.jpg`

  return {
    title: `${title} | Adult AI Gallery - Premium AI Generated Content`,
    description,
    keywords: [
      'adult content',
      'AI generated',
      'premium content',
      '18+',
      'digital art',
      'adult entertainment',
      ...keywords,
    ].join(', '),

    robots: {
      index: !noindex,
      follow: !noindex,
      googleBot: {
        index: !noindex,
        follow: !noindex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    alternates: canonical
      ? {
          canonical,
        }
      : undefined,

    openGraph: {
      title,
      description,
      url: canonical || baseUrl,
      siteName: 'Adult AI Gallery',
      images: [
        {
          url: ogImage || defaultOgImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
      type: ogType === 'product' ? 'website' : ogType,
    },

    twitter: {
      card: twitterCard,
      title,
      description,
      images: [ogImage || defaultOgImage],
      creator: '@adultaigallery',
    },

    other: {
      rating: 'adult',
      'content-rating': 'mature',
      'age-rating': '18+',
      ...(structuredData && {
        'structured-data': JSON.stringify(structuredData),
      }),
    },
  }
}

/**
 * Generate structured data for adult products
 */
export function generateProductStructuredData(product: {
  id: string
  name: string
  description: string
  image_url: string
  price_cents: number
  category: string
  average_rating?: number
  review_count?: number
  created_at: string
}) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://adult-ai-gallery.com'

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image_url,
    url: `${baseUrl}/products/${product.id}`,
    sku: product.id,
    category: 'Digital Content',
    brand: {
      '@type': 'Brand',
      name: 'Adult AI Gallery',
    },
    offers: {
      '@type': 'Offer',
      price: (product.price_cents / 100).toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Adult AI Gallery',
      },
    },
    ...(product.average_rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.average_rating,
        reviewCount: product.review_count || 0,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    datePublished: product.created_at,
    contentRating: 'adult',
    audience: {
      '@type': 'Audience',
      suggestedMinAge: 18,
    },
  }
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(
  breadcrumbs: Array<{
    name: string
    url: string
  }>
) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://adult-ai-gallery.com'

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${baseUrl}${crumb.url}`,
    })),
  }
}

/**
 * Generate organization structured data
 */
export function generateOrganizationStructuredData() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://adult-ai-gallery.com'

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Adult AI Gallery',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description:
      'Premium marketplace for AI-generated adult content. 18+ only.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@adult-ai-gallery.com',
    },
    sameAs: [
      'https://twitter.com/adultaigallery',
      'https://instagram.com/adultaigallery',
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CA',
      addressRegion: 'ON',
    },
  }
}

/**
 * Generate FAQ structured data
 */
export function generateFAQStructuredData(
  faqs: Array<{
    question: string
    answer: string
  }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

/**
 * Generate website structured data
 */
export function generateWebsiteStructuredData() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://adult-ai-gallery.com'

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Adult AI Gallery',
    url: baseUrl,
    description: 'Premium marketplace for AI-generated adult content',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    audience: {
      '@type': 'Audience',
      suggestedMinAge: 18,
    },
  }
}

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(path: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://adult-ai-gallery.com'
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Generate meta tags for adult content compliance
 */
export function generateAdultContentMetaTags() {
  return {
    rating: 'adult',
    'content-rating': 'mature',
    'age-rating': '18+',
    audience: 'adult',
    'content-classification': 'adult-content',
    'restricted-content': 'true',
  }
}

/**
 * Generate sitemap entry for adult content
 */
export function generateSitemapEntry(
  url: string,
  options: {
    lastModified?: Date
    changeFrequency?:
      | 'always'
      | 'hourly'
      | 'daily'
      | 'weekly'
      | 'monthly'
      | 'yearly'
      | 'never'
    priority?: number
    isAdultContent?: boolean
  } = {}
) {
  const {
    lastModified = new Date(),
    changeFrequency = 'weekly',
    priority = 0.5,
    isAdultContent = true,
  } = options

  return {
    url,
    lastModified: lastModified.toISOString(),
    changeFrequency,
    priority,
    ...(isAdultContent && {
      'adult-content': 'true',
    }),
  }
}

/**
 * Performance optimization utilities
 */
export const performanceUtils = {
  /**
   * Preload critical resources
   */
  preloadCriticalResources: () => {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // Preload critical fonts
      const fontLink = document.createElement('link')
      fontLink.rel = 'preload'
      fontLink.href = '/fonts/inter-var.woff2'
      fontLink.as = 'font'
      fontLink.type = 'font/woff2'
      fontLink.crossOrigin = 'anonymous'
      document.head.appendChild(fontLink)

      // Preload critical images
      const logoLink = document.createElement('link')
      logoLink.rel = 'preload'
      logoLink.href = '/logo.png'
      logoLink.as = 'image'
      document.head.appendChild(logoLink)
    }
  },

  /**
   * Lazy load images with intersection observer
   */
  setupLazyLoading: () => {
    if (
      typeof window !== 'undefined' &&
      typeof document !== 'undefined' &&
      'IntersectionObserver' in window
    ) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            if (img.dataset.src) {
              img.src = img.dataset.src
              img.classList.remove('lazy')
              observer.unobserve(img)
            }
          }
        })
      })

      document.querySelectorAll('img[data-src]').forEach((img) => {
        imageObserver.observe(img)
      })
    }
  },

  /**
   * Optimize Core Web Vitals
   */
  optimizeWebVitals: () => {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // Reduce layout shift by setting image dimensions
      document.querySelectorAll('img').forEach((img) => {
        if (!img.width || !img.height) {
          img.style.aspectRatio = '16/9'
        }
      })

      // Optimize largest contentful paint
      const criticalImages = document.querySelectorAll('img[data-critical]')
      criticalImages.forEach((img) => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.href = (img as HTMLImageElement).src
        link.as = 'image'
        document.head.appendChild(link)
      })
    }
  },
}
