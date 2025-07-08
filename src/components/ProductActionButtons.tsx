'use client'

import { Edit, MoreVertical, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { createClient } from '@/lib/supabase/client'

interface ProductActionButtonsProps {
  productId: string
  productName: string
  productUserId?: string
}

export default function ProductActionButtons({
  productId,
  productName,
  productUserId,
}: ProductActionButtonsProps) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setCurrentUser(user)
        setIsOwner(user && productUserId && user.id === productUserId)
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }

    fetchUser()
  }, [supabase, productUserId])

  const handleEdit = () => {
    router.push(`/products/${productId}/edit`)
  }

  const handleDelete = async () => {
    if (!currentUser) {
      toast.error('Please login to delete products')
      return
    }

    if (!isOwner) {
      toast.error('You can only delete your own products')
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${productName}"? This action cannot be undone.`
    )

    if (!confirmed) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete product')
      }

      toast.success('Product deleted successfully')
      router.push('/products')
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error.message || 'Failed to delete product')
    } finally {
      setIsDeleting(false)
    }
  }

  // Don't render if user is not the owner
  if (!currentUser || !isOwner) {
    return null
  }

  return (
    <div className='fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6'>
      {/* Main Action Button */}
      <div className='relative'>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className='group flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl active:scale-95 md:h-14 md:w-14'
          aria-label='Product actions'
        >
          <MoreVertical className='h-5 w-5 transition-transform group-hover:rotate-90 md:h-6 md:w-6' />
        </button>

        {/* Action Menu */}
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className='fixed inset-0 z-40'
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu Items */}
            <div className='absolute bottom-14 right-0 z-50 flex flex-col gap-2 md:bottom-16 md:gap-3'>
              {/* Edit Button */}
              <button
                onClick={handleEdit}
                className='group flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all hover:bg-green-600 hover:shadow-xl active:scale-95 md:h-12 md:w-12'
                title='Edit Product'
              >
                <Edit className='h-4 w-4 md:h-5 md:w-5' />
              </button>

              {/* Delete Button */}
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className='group flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-all hover:bg-red-600 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 md:h-12 md:w-12'
                title='Delete Product'
              >
                {isDeleting ? (
                  <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-white md:h-5 md:w-5' />
                ) : (
                  <Trash2 className='h-4 w-4 md:h-5 md:w-5' />
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Labels for better UX */}
      {isMenuOpen && (
        <div className='absolute bottom-14 right-12 z-50 hidden flex-col gap-2 text-right md:bottom-16 md:right-16 md:flex md:gap-3'>
          <div className='rounded-lg bg-black bg-opacity-75 px-3 py-1 text-sm text-white'>
            Edit Product
          </div>
          <div className='rounded-lg bg-black bg-opacity-75 px-3 py-1 text-sm text-white'>
            Delete Product
          </div>
        </div>
      )}
    </div>
  )
}
