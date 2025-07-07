'use client'

import { Check, Crown, Eye, Shield, Star, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import {
  ADULT_SUBSCRIPTION_PLANS,
  SubscriptionPlan,
  calculateSubscriptionSavings,
  createSubscriptionCheckout,
  formatPrice,
  getRecommendedPlan,
  getUserSubscriptionStatus,
} from '@/lib/adult-ecommerce-utils'
import { createClient } from '@/lib/supabase/client'

export default function SubscriptionsPage() {
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)
  const [recommendedPlan, setRecommendedPlan] =
    useState<SubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchUserData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      setUser(user)

      // Get current subscription status
      const subscriptionStatus = await getUserSubscriptionStatus(user.id)
      setCurrentSubscription(subscriptionStatus)

      // Get recommended plan
      const recommendation = await getRecommendedPlan(user.id)
      setRecommendedPlan(recommendation.recommendedPlan)
    } catch (error: any) {
      console.error('Error fetching user data:', error)
      toast.error('Failed to load subscription data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast.error('Please login to subscribe')
      return
    }

    setSubscribing(planId)
    try {
      const discreteOptions = {
        discreteBilling: true,
        anonymousOrder: false,
        hideFromHistory: false,
        customBillingDescriptor: 'PREMIUM MEDIA SUB',
      }

      const { url } = await createSubscriptionCheckout(
        planId,
        user.id,
        user.email,
        discreteOptions
      )

      window.location.href = url
    } catch (error: any) {
      toast.error('Failed to start subscription: ' + error.message)
    } finally {
      setSubscribing(null)
    }
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'adult_basic':
        return <Star className='h-6 w-6' />
      case 'adult_premium':
        return <Crown className='h-6 w-6' />
      case 'adult_annual':
        return <Zap className='h-6 w-6' />
      default:
        return <Star className='h-6 w-6' />
    }
  }

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'adult_basic':
        return 'from-blue-500 to-blue-600'
      case 'adult_premium':
        return 'from-purple-500 to-purple-600'
      case 'adult_annual':
        return 'from-gold-500 to-yellow-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 py-12'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='animate-pulse'>
            <div className='mb-6 h-8 rounded bg-gray-200'></div>
            <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='rounded-lg bg-white p-8'>
                  <div className='mb-4 h-6 rounded bg-gray-200'></div>
                  <div className='mb-6 h-4 rounded bg-gray-200'></div>
                  <div className='space-y-3'>
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className='h-4 rounded bg-gray-200'></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-12 text-center'>
          <h1 className='mb-4 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent'>
            Premium Adult Content Subscriptions
          </h1>
          <p className='mx-auto max-w-3xl text-xl text-gray-600'>
            Unlock unlimited access to premium adult content with our
            subscription plans. Discrete billing and complete privacy
            guaranteed.
          </p>

          {/* Adult Content Warning */}
          <div className='mt-6 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-100 px-4 py-2'>
            <Shield className='h-5 w-5 text-red-600' />
            <span className='font-medium text-red-800'>
              18+ Adult Content Only
            </span>
          </div>
        </div>

        {/* Current Subscription Status */}
        {currentSubscription?.isSubscribed && (
          <div className='mb-12 rounded-lg border border-green-200 bg-green-50 p-6'>
            <div className='mb-4 flex items-center gap-3'>
              <Crown className='h-6 w-6 text-green-600' />
              <h3 className='text-lg font-semibold text-green-800'>
                Active Subscription: {currentSubscription.plan?.name}
              </h3>
            </div>
            <div className='grid grid-cols-1 gap-4 text-sm md:grid-cols-3'>
              <div>
                <span className='font-medium text-green-700'>
                  Credits Remaining:
                </span>
                <span className='ml-2 text-green-800'>
                  {currentSubscription.creditsRemaining === 999999
                    ? 'Unlimited'
                    : currentSubscription.creditsRemaining}
                </span>
              </div>
              <div>
                <span className='font-medium text-green-700'>
                  Renewal Date:
                </span>
                <span className='ml-2 text-green-800'>
                  {new Date(
                    currentSubscription.renewalDate
                  ).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className='font-medium text-green-700'>Status:</span>
                <span className='ml-2 capitalize text-green-800'>
                  {currentSubscription.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        <div className='mb-12 grid grid-cols-1 gap-8 md:grid-cols-3'>
          {ADULT_SUBSCRIPTION_PLANS.map((plan) => {
            const savings = calculateSubscriptionSavings(plan)
            const isRecommended = recommendedPlan?.id === plan.id
            const isCurrentPlan = currentSubscription?.plan?.id === plan.id

            return (
              <div
                key={plan.id}
                className={`relative overflow-hidden rounded-2xl bg-white shadow-lg ${
                  isRecommended ? 'ring-2 ring-purple-500' : ''
                } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
              >
                {/* Recommended Badge */}
                {isRecommended && (
                  <div className='absolute right-0 top-0 rounded-bl-lg bg-purple-500 px-3 py-1 text-xs font-medium text-white'>
                    Recommended
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className='absolute left-0 top-0 rounded-br-lg bg-green-500 px-3 py-1 text-xs font-medium text-white'>
                    Current Plan
                  </div>
                )}

                <div className='p-8'>
                  {/* Plan Header */}
                  <div className='mb-6 text-center'>
                    <div
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r ${getPlanColor(plan.id)} mb-4 text-white`}
                    >
                      {getPlanIcon(plan.id)}
                    </div>
                    <h3 className='mb-2 text-2xl font-bold text-gray-900'>
                      {plan.name}
                    </h3>
                    <p className='mb-4 text-gray-600'>{plan.description}</p>

                    {/* Pricing */}
                    <div className='mb-4'>
                      <span className='text-4xl font-bold text-gray-900'>
                        {formatPrice(plan.price_cents)}
                      </span>
                      <span className='text-gray-600'>/{plan.interval}</span>
                    </div>

                    {/* Savings */}
                    {plan.interval === 'year' && (
                      <div className='text-sm font-medium text-green-600'>
                        Save {formatPrice(savings.annualSavings)} per year
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className='mb-8 space-y-3'>
                    {plan.features.map((feature, index) => (
                      <li key={index} className='flex items-start gap-3'>
                        <Check className='mt-0.5 h-5 w-5 flex-shrink-0 text-green-500' />
                        <span className='text-sm text-gray-700'>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={subscribing === plan.id || isCurrentPlan}
                    className={`w-full rounded-lg px-6 py-3 font-semibold transition-colors ${
                      isCurrentPlan
                        ? 'cursor-not-allowed bg-gray-100 text-gray-500'
                        : subscribing === plan.id
                          ? 'cursor-not-allowed bg-gray-400 text-white'
                          : `bg-gradient-to-r ${getPlanColor(plan.id)} text-white hover:opacity-90`
                    }`}
                  >
                    {isCurrentPlan
                      ? 'Current Plan'
                      : subscribing === plan.id
                        ? 'Processing...'
                        : 'Subscribe Now'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Privacy & Billing Information */}
        <div className='mb-8 rounded-lg bg-white p-8'>
          <h3 className='mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900'>
            <Eye className='h-5 w-5' />
            Privacy & Discrete Billing
          </h3>

          <div className='grid grid-cols-1 gap-8 md:grid-cols-2'>
            <div>
              <h4 className='mb-3 font-semibold text-gray-900'>
                Discrete Billing
              </h4>
              <ul className='space-y-2 text-sm text-gray-700'>
                <li>• Charges appear as "PREMIUM MEDIA SUB" on statements</li>
                <li>• No explicit content descriptions</li>
                <li>• Professional billing descriptors</li>
                <li>• Secure payment processing</li>
              </ul>
            </div>

            <div>
              <h4 className='mb-3 font-semibold text-gray-900'>
                Privacy Protection
              </h4>
              <ul className='space-y-2 text-sm text-gray-700'>
                <li>• Anonymous browsing options</li>
                <li>• Private download history</li>
                <li>• Secure account management</li>
                <li>• No spam or promotional emails</li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className='rounded-lg bg-gray-100 p-8'>
          <h3 className='mb-6 text-xl font-semibold text-gray-900'>
            Frequently Asked Questions
          </h3>

          <div className='space-y-6'>
            <div>
              <h4 className='mb-2 font-semibold text-gray-900'>
                How does discrete billing work?
              </h4>
              <p className='text-sm text-gray-700'>
                All charges appear with professional descriptors like "PREMIUM
                MEDIA SUB" on your credit card statements. No explicit content
                references are included.
              </p>
            </div>

            <div>
              <h4 className='mb-2 font-semibold text-gray-900'>
                Can I cancel anytime?
              </h4>
              <p className='text-sm text-gray-700'>
                Yes, you can cancel your subscription at any time. You'll
                continue to have access until the end of your current billing
                period.
              </p>
            </div>

            <div>
              <h4 className='mb-2 font-semibold text-gray-900'>
                What happens to my downloads if I cancel?
              </h4>
              <p className='text-sm text-gray-700'>
                All content you've downloaded remains yours permanently. You can
                access your download history even after cancellation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
