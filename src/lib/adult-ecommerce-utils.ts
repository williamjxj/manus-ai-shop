import { createClient } from '@/lib/supabase/client'

export interface DiscreteCheckoutOptions {
  discreteBilling: boolean
  anonymousOrder: boolean
  hideFromHistory: boolean
  customBillingDescriptor?: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price_cents: number
  interval: 'month' | 'year'
  features: string[]
  credits_per_period: number
  is_adult_plan: boolean
}

export interface AdultOrderMetadata {
  isAdultContent: boolean
  contentWarnings: string[]
  ageVerified: boolean
  discreteOptions: DiscreteCheckoutOptions
  subscriptionId?: string
}

/**
 * Adult content subscription plans
 */
export const ADULT_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'adult_basic',
    name: 'Adult Basic',
    description: 'Access to premium adult content',
    price_cents: 1999, // $19.99/month
    interval: 'month',
    features: [
      '100 premium downloads per month',
      'HD quality content',
      'Basic content categories',
      'Mobile access',
      'Discrete billing',
    ],
    credits_per_period: 100,
    is_adult_plan: true,
  },
  {
    id: 'adult_premium',
    name: 'Adult Premium',
    description: 'Full access to all adult content',
    price_cents: 3999, // $39.99/month
    interval: 'month',
    features: [
      'Unlimited premium downloads',
      '4K quality content',
      'All content categories',
      'Early access to new content',
      'Mobile & desktop access',
      'Discrete billing',
      'Priority support',
    ],
    credits_per_period: 999999, // Unlimited
    is_adult_plan: true,
  },
  {
    id: 'adult_annual',
    name: 'Adult Annual',
    description: 'Best value for adult content access',
    price_cents: 39999, // $399.99/year (save $80)
    interval: 'year',
    features: [
      'Unlimited premium downloads',
      '4K quality content',
      'All content categories',
      'Early access to new content',
      'Mobile & desktop access',
      'Discrete billing',
      'Priority support',
      'Annual exclusive content',
    ],
    credits_per_period: 999999, // Unlimited
    is_adult_plan: true,
  },
]

/**
 * Generate discrete billing descriptor for adult content
 */
export function generateDiscreteBillingDescriptor(
  orderType: 'product' | 'subscription' | 'points',
  customDescriptor?: string
): string {
  if (customDescriptor) {
    return customDescriptor.slice(0, 22) // Stripe limit
  }

  const descriptors = {
    product: 'DIGITAL MEDIA SVCS',
    subscription: 'PREMIUM MEDIA SUB',
    points: 'DIGITAL CREDITS',
  }

  return descriptors[orderType]
}

/**
 * Create discrete Stripe checkout session for adult content
 */
export async function createDiscreteCheckoutSession(
  items: any[],
  userId: string,
  userEmail: string,
  options: DiscreteCheckoutOptions
): Promise<{ sessionId: string; url: string }> {
  const billingDescriptor = generateDiscreteBillingDescriptor(
    'product',
    options.customBillingDescriptor
  )

  const response = await fetch('/api/checkout/discrete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items,
      userId,
      userEmail,
      discreteOptions: options,
      billingDescriptor,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to create discrete checkout session')
  }

  return response.json()
}

/**
 * Create subscription checkout for adult content
 */
export async function createSubscriptionCheckout(
  planId: string,
  userId: string,
  userEmail: string,
  discreteOptions: DiscreteCheckoutOptions
): Promise<{ sessionId: string; url: string }> {
  const plan = ADULT_SUBSCRIPTION_PLANS.find((p) => p.id === planId)
  if (!plan) {
    throw new Error('Invalid subscription plan')
  }

  const billingDescriptor = generateDiscreteBillingDescriptor(
    'subscription',
    discreteOptions.customBillingDescriptor
  )

  const response = await fetch('/api/subscriptions/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      planId,
      userId,
      userEmail,
      discreteOptions,
      billingDescriptor,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to create subscription checkout')
  }

  return response.json()
}

/**
 * Check user's subscription status
 */
export async function getUserSubscriptionStatus(userId: string): Promise<{
  isSubscribed: boolean
  plan?: SubscriptionPlan
  creditsRemaining?: number
  renewalDate?: string
  status?: 'active' | 'canceled' | 'past_due'
}> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error || !data) {
      return { isSubscribed: false }
    }

    const plan = ADULT_SUBSCRIPTION_PLANS.find((p) => p.id === data.plan_id)

    return {
      isSubscribed: true,
      plan,
      creditsRemaining: data.credits_remaining,
      renewalDate: data.current_period_end,
      status: data.status,
    }
  } catch (error) {
    console.error('Error checking subscription status:', error)
    return { isSubscribed: false }
  }
}

/**
 * Process subscription credit usage
 */
export async function useSubscriptionCredits(
  userId: string,
  creditsToUse: number
): Promise<{ success: boolean; remainingCredits?: number; error?: string }> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.rpc('use_subscription_credits', {
      p_user_id: userId,
      p_credits_to_use: creditsToUse,
    })

    if (error) throw error

    return {
      success: true,
      remainingCredits: data?.remaining_credits,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get user's order history with privacy options
 */
export async function getOrderHistory(
  userId: string,
  includeHidden: boolean = false
): Promise<any[]> {
  const supabase = createClient()

  try {
    let query = supabase
      .from('orders')
      .select(
        `
        id,
        total_cents,
        total_points,
        payment_method,
        status,
        created_at,
        is_hidden,
        order_items (
          id,
          quantity,
          price_cents,
          product:products (
            id,
            name,
            image_url,
            category,
            is_explicit
          )
        )
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!includeHidden) {
      query = query.eq('is_hidden', false)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching order history:', error)
    return []
  }
}

/**
 * Hide/unhide order from history
 */
export async function toggleOrderVisibility(
  orderId: string,
  userId: string,
  hidden: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('orders')
      .update({ is_hidden: hidden })
      .eq('id', orderId)
      .eq('user_id', userId)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Create anonymous guest checkout for adult content
 */
export async function createAnonymousCheckout(
  items: any[],
  guestEmail: string,
  discreteOptions: DiscreteCheckoutOptions
): Promise<{ sessionId: string; url: string }> {
  const response = await fetch('/api/checkout/anonymous', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items,
      guestEmail,
      discreteOptions,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to create anonymous checkout')
  }

  return response.json()
}

/**
 * Validate age verification for checkout
 */
export async function validateAgeForCheckout(userId?: string): Promise<{
  isVerified: boolean
  requiresVerification: boolean
  error?: string
}> {
  if (!userId) {
    // Guest checkout - require age confirmation
    return {
      isVerified: false,
      requiresVerification: true,
    }
  }

  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('age_verified, age_verified_at')
      .eq('id', userId)
      .single()

    if (error) throw error

    return {
      isVerified: data?.age_verified || false,
      requiresVerification: !data?.age_verified,
    }
  } catch (error: any) {
    return {
      isVerified: false,
      requiresVerification: true,
      error: error.message,
    }
  }
}

/**
 * Get recommended subscription plan based on usage
 */
export async function getRecommendedPlan(userId: string): Promise<{
  recommendedPlan: SubscriptionPlan
  reason: string
  potentialSavings?: number
}> {
  const supabase = createClient()

  try {
    // Get user's purchase history from last 3 months
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const { data: orders, error } = await supabase
      .from('orders')
      .select('total_cents, created_at')
      .eq('user_id', userId)
      .gte('created_at', threeMonthsAgo.toISOString())

    if (error) throw error

    const totalSpent =
      orders?.reduce((sum, order) => sum + order.total_cents, 0) || 0
    const monthlyAverage = totalSpent / 3

    // Recommend plan based on spending
    if (monthlyAverage >= 3999) {
      return {
        recommendedPlan: ADULT_SUBSCRIPTION_PLANS[1], // Premium
        reason: 'Based on your spending, Premium plan offers unlimited access',
        potentialSavings: Math.max(0, monthlyAverage - 3999),
      }
    } else if (monthlyAverage >= 1999) {
      return {
        recommendedPlan: ADULT_SUBSCRIPTION_PLANS[0], // Basic
        reason: 'Basic plan matches your current usage pattern',
        potentialSavings: Math.max(0, monthlyAverage - 1999),
      }
    } else {
      return {
        recommendedPlan: ADULT_SUBSCRIPTION_PLANS[0], // Basic
        reason: 'Start with Basic plan for regular access to premium content',
      }
    }
  } catch {
    // Default recommendation
    return {
      recommendedPlan: ADULT_SUBSCRIPTION_PLANS[0],
      reason: 'Basic plan recommended for new users',
    }
  }
}

/**
 * Format price for display with currency
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * Calculate subscription savings
 */
export function calculateSubscriptionSavings(plan: SubscriptionPlan): {
  monthlySavings: number
  annualSavings: number
} {
  const monthlyEquivalent =
    plan.interval === 'year' ? plan.price_cents / 12 : plan.price_cents
  const regularMonthlyPrice = 4999 // Assume $49.99 regular price

  const monthlySavings = Math.max(0, regularMonthlyPrice - monthlyEquivalent)
  const annualSavings = monthlySavings * 12

  return { monthlySavings, annualSavings }
}
