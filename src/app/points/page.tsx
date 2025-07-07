'use client'

import { Coins, CreditCard, Crown, Star, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { createClient } from '@/lib/supabase/client'

interface PointsTransaction {
  id: string
  amount: number
  type: string
  description: string
  created_at: string
}

interface UserProfile {
  points: number
}

export default function PointsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [transactions, setTransactions] = useState<PointsTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const supabase = createClient()

  const pointsPackages = [
    {
      id: 'basic',
      name: 'Basic Pack',
      points: 100,
      price: 999, // $9.99
      icon: Star,
      popular: false,
    },
    {
      id: 'premium',
      name: 'Premium Pack',
      points: 500,
      price: 3999, // $39.99
      icon: Zap,
      popular: true,
      bonus: 50, // bonus points
    },
    {
      id: 'pro',
      name: 'Pro Pack',
      points: 1000,
      price: 6999, // $69.99
      icon: Crown,
      popular: false,
      bonus: 200, // bonus points
    },
  ]

  useEffect(() => {
    fetchUserData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        throw profileError
      }

      // If profile doesn't exist, it will be created by the trigger
      setProfile({ points: profileData?.points || 0 })

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } =
        await supabase
          .from('points_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

      if (transactionsError) throw transactionsError
      setTransactions(transactionsData || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const purchasePoints = async (packageId: string) => {
    setPurchasing(packageId)
    try {
      const selectedPackage = pointsPackages.find((p) => p.id === packageId)
      if (!selectedPackage) return

      // Create Stripe checkout session
      const response = await fetch('/api/checkout/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          points: selectedPackage.points + (selectedPackage.bonus || 0),
          price: selectedPackage.price,
        }),
      })

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (err: any) {
      toast.error('Error purchasing points: ' + err.message)
    } finally {
      setPurchasing(null)
    }
  }

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 py-12'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='mx-auto h-32 w-32 animate-spin rounded-full border-b-2 border-indigo-600'></div>
            <p className='mt-4 text-gray-600'>Loading points data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 py-12'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <p className='text-red-600'>Error loading points data: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='mb-12 text-center'>
          <h1 className='bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl'>
            Points & Subscriptions
          </h1>
          <p className='mt-4 text-xl text-gray-600'>
            Purchase points to buy AI-generated images
          </p>
        </div>

        {/* Current Points Balance */}
        <div className='mb-8 rounded-lg bg-white p-6 shadow-sm'>
          <div className='flex items-center justify-center'>
            <Coins className='mr-3 h-8 w-8 text-indigo-600' />
            <div className='text-center'>
              <h2 className='text-2xl font-bold text-gray-900'>
                {profile?.points || 0} Points
              </h2>
              <p className='text-gray-600'>Your current balance</p>
            </div>
          </div>
        </div>

        {/* Points Packages */}
        <div className='mb-12'>
          <h2 className='mb-8 text-center text-2xl font-bold text-gray-900'>
            Purchase Points
          </h2>
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {pointsPackages.map((pkg) => {
              const IconComponent = pkg.icon
              return (
                <div
                  key={pkg.id}
                  className={`relative rounded-lg bg-white p-6 shadow-sm ${
                    pkg.popular ? 'ring-2 ring-indigo-600' : ''
                  }`}
                >
                  {pkg.popular && (
                    <div className='absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 transform'>
                      <span className='inline-flex items-center rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white'>
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className='text-center'>
                    <IconComponent className='mx-auto mb-4 h-12 w-12 text-indigo-600' />
                    <h3 className='mb-2 text-lg font-semibold text-gray-900'>
                      {pkg.name}
                    </h3>
                    <div className='mb-4'>
                      <span className='text-3xl font-bold text-gray-900'>
                        {pkg.points}
                      </span>
                      {pkg.bonus && (
                        <span className='ml-1 text-lg text-indigo-600'>
                          +{pkg.bonus}
                        </span>
                      )}
                      <span className='ml-1 text-gray-600'>points</span>
                    </div>
                    <div className='mb-6'>
                      <span className='text-2xl font-bold text-gray-900'>
                        {formatPrice(pkg.price)}
                      </span>
                    </div>
                    <button
                      onClick={() => purchasePoints(pkg.id)}
                      disabled={purchasing === pkg.id}
                      className={`flex w-full items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white ${
                        pkg.popular
                          ? 'bg-indigo-600 hover:bg-indigo-700'
                          : 'bg-gray-600 hover:bg-gray-700'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {purchasing === pkg.id ? (
                        <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-white'></div>
                      ) : (
                        <>
                          <CreditCard className='mr-2 h-4 w-4' />
                          Purchase
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Transaction History */}
        <div className='rounded-lg bg-white shadow-sm'>
          <div className='border-b border-gray-200 px-6 py-4'>
            <h2 className='text-lg font-semibold text-gray-900'>
              Recent Transactions
            </h2>
          </div>
          <div className='divide-y divide-gray-200'>
            {transactions.length === 0 ? (
              <div className='px-6 py-8 text-center text-gray-500'>
                No transactions yet
              </div>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className='flex items-center justify-between px-6 py-4'
                >
                  <div>
                    <p className='text-sm font-medium text-gray-900'>
                      {transaction.description}
                    </p>
                    <p className='text-sm text-gray-500'>
                      {formatDate(transaction.created_at)}
                    </p>
                  </div>
                  <div className='text-right'>
                    <span
                      className={`text-sm font-medium ${
                        transaction.amount > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {transaction.amount > 0 ? '+' : ''}
                      {transaction.amount} points
                    </span>
                    <p className='text-xs capitalize text-gray-500'>
                      {transaction.type}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
