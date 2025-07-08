'use client'

import { Calendar, CreditCard, Filter, Package, SortDesc } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { createClient } from '@/lib/supabase/client'

interface OrderItem {
  id: string
  quantity: number
  price_cents: number
  product: {
    id: string
    name: string
    description: string
    image_url: string
    category: string
  }
}

interface Order {
  id: string
  total_cents: number
  total_points: number
  payment_method: 'stripe' | 'points'
  status: 'pending' | 'completed' | 'failed'
  stripe_payment_intent_id: string | null
  created_at: string
  order_items: OrderItem[]
}

type SortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'
type FilterOption = 'all' | 'pending' | 'completed' | 'failed'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('date_desc')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const supabase = createClient()

  const fetchOrders = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Please login to view your orders')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          id,
          total_cents,
          total_points,
          payment_method,
          status,
          stripe_payment_intent_id,
          created_at,
          order_items (
            id,
            quantity,
            price_cents,
            product:products (
              id,
              name,
              description,
              image_url,
              category
            )
          )
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders((data as unknown as Order[]) || [])
    } catch (err: any) {
      setError(err.message)
      toast.error('Error loading orders: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const getStatusBadge = (status: string) => {
    const baseClasses =
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'

    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
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

  const filteredAndSortedOrders = orders
    .filter((order) => filterBy === 'all' || order.status === filterBy)
    .sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        case 'date_asc':
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        case 'amount_desc':
          return b.total_cents - a.total_cents
        case 'amount_asc':
          return a.total_cents - b.total_cents
        default:
          return 0
      }
    })

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 py-12'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='animate-pulse'>
            <div className='mb-8 h-8 w-48 rounded bg-gray-200'></div>
            <div className='space-y-4'>
              {[...Array(3)].map((_, i) => (
                <div key={i} className='h-32 rounded-lg bg-gray-200'></div>
              ))}
            </div>
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
            <Package className='mx-auto h-12 w-12 text-gray-400' />
            <h3 className='mt-2 text-sm font-medium text-gray-900'>
              Error loading orders
            </h3>
            <p className='mt-1 text-sm text-gray-500'>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 py-12'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent'>
            Your Orders
          </h1>
          <p className='mt-2 text-gray-600'>
            Track and manage your purchase history
          </p>
        </div>

        {/* Filters and Sorting */}
        <div className='mb-6 flex flex-col gap-4 sm:flex-row'>
          <div className='flex items-center space-x-2'>
            <Filter className='h-4 w-4 text-gray-500' />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className='rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
            >
              <option value='all'>All Orders</option>
              <option value='completed'>Completed</option>
              <option value='pending'>Pending</option>
              <option value='failed'>Failed</option>
            </select>
          </div>

          <div className='flex items-center space-x-2'>
            <SortDesc className='h-4 w-4 text-gray-500' />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className='rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
            >
              <option value='date_desc'>Newest First</option>
              <option value='date_asc'>Oldest First</option>
              <option value='amount_desc'>Highest Amount</option>
              <option value='amount_asc'>Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        {filteredAndSortedOrders.length === 0 ? (
          <div className='py-12 text-center'>
            <Package className='mx-auto h-12 w-12 text-gray-400' />
            <h3 className='mt-2 text-sm font-medium text-gray-900'>
              No orders found
            </h3>
            <p className='mt-1 text-sm text-gray-500'>
              {filterBy === 'all'
                ? "You haven't made any purchases yet."
                : `No ${filterBy} orders found.`}
            </p>
          </div>
        ) : (
          <div className='space-y-6'>
            {filteredAndSortedOrders.map((order) => (
              <div
                key={order.id}
                className='overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm'
              >
                {/* Order Header */}
                <div className='border-b border-gray-200 bg-gray-50 px-6 py-4'>
                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
                    <div className='flex items-center space-x-4'>
                      <div>
                        <p className='text-sm font-medium text-gray-900'>
                          Order #{order.id.slice(-8).toUpperCase()}
                        </p>
                        <div className='mt-1 flex items-center space-x-2'>
                          <Calendar className='h-4 w-4 text-gray-400' />
                          <p className='text-sm text-gray-500'>
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className='mt-4 flex items-center space-x-4 sm:mt-0'>
                      <span className={getStatusBadge(order.status)}>
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </span>
                      <div className='text-right'>
                        <p className='text-lg font-semibold text-gray-900'>
                          {order.payment_method === 'points'
                            ? `${order.total_points} points`
                            : formatCurrency(order.total_cents)}
                        </p>
                        <div className='flex items-center text-sm text-gray-500'>
                          <CreditCard className='mr-1 h-4 w-4' />
                          {order.payment_method === 'points'
                            ? 'Points'
                            : 'Card'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className='px-6 py-4'>
                  <div className='space-y-4'>
                    {order.order_items.map((item) => (
                      <div
                        key={item.id}
                        className='flex items-center space-x-4'
                      >
                        <Image
                          src={
                            item.product.image_url || '/placeholder-image.svg'
                          }
                          alt={item.product.name}
                          width={64}
                          height={64}
                          className='h-16 w-16 rounded-lg object-cover'
                        />
                        <div className='min-w-0 flex-1'>
                          <p className='truncate text-sm font-medium text-gray-900'>
                            {item.product.name}
                          </p>
                          <p className='text-sm text-gray-500'>
                            {item.product.category}
                          </p>
                          <p className='text-sm text-gray-500'>
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='text-sm font-medium text-gray-900'>
                            {formatCurrency(item.price_cents * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
