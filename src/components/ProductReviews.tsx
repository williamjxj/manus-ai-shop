'use client'

import { Flag, Star, ThumbsUp, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { ProductReview } from '@/lib/content-moderation'
import { createClient } from '@/lib/supabase/client'

interface ProductReviewsProps {
  productId: string
  className?: string
}

interface ReviewFormData {
  rating: number
  review_text: string
  is_anonymous: boolean
}

export default function ProductReviews({
  productId,
  className = '',
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userReview, setUserReview] = useState<ProductReview | null>(null)
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 5,
    review_text: '',
    is_anonymous: false,
  })

  const supabase = createClient()

  useEffect(() => {
    fetchReviews()
    fetchCurrentUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  const fetchCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  const fetchReviews = async () => {
    try {
      // Fetch approved reviews
      const { data: reviewsData, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })

      if (error) throw error

      setReviews(reviewsData || [])

      // Check if current user has already reviewed
      if (currentUser) {
        const existingReview = reviewsData?.find(
          (review) => review.user_id === currentUser.id
        )
        setUserReview(existingReview || null)
      }
    } catch (error: any) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) {
      toast.error('Please login to submit a review')
      return
    }

    if (userReview) {
      toast.error('You have already reviewed this product')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from('product_reviews').insert({
        product_id: productId,
        user_id: currentUser.id,
        rating: formData.rating,
        review_text: formData.review_text.trim() || null,
        is_anonymous: formData.is_anonymous,
        moderation_status: 'pending',
      })

      if (error) throw error

      toast.success('Review submitted! It will appear after moderation.')
      setShowForm(false)
      setFormData({ rating: 5, review_text: '', is_anonymous: false })
      fetchReviews()
    } catch (error: any) {
      toast.error('Error submitting review: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleVoteHelpful = async (reviewId: string, isHelpful: boolean) => {
    if (!currentUser) {
      toast.error('Please login to vote')
      return
    }

    try {
      const { error } = await supabase.from('review_votes').upsert(
        {
          review_id: reviewId,
          user_id: currentUser.id,
          is_helpful: isHelpful,
        },
        {
          onConflict: 'review_id,user_id',
        }
      )

      if (error) throw error

      // Refresh reviews to show updated helpful count
      fetchReviews()
    } catch (error: any) {
      toast.error('Error voting: ' + error.message)
    }
  }

  const renderStars = (
    rating: number,
    interactive = false,
    onRatingChange?: (_rating: number) => void
  ) => {
    return (
      <div className='flex gap-1'>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            onClick={
              interactive && onRatingChange
                ? () => onRatingChange(star)
                : undefined
            }
            className={`${interactive ? 'transition-transform hover:scale-110' : ''}`}
            disabled={!interactive}
          >
            <Star
              className={`h-5 w-5 ${
                star <= rating
                  ? 'fill-current text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className='mb-4 h-6 rounded bg-gray-200'></div>
        <div className='space-y-4'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='h-20 rounded bg-gray-200'></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Reviews Header */}
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h3 className='text-xl font-semibold text-gray-900'>
            Reviews ({reviews.length})
          </h3>
          {reviews.length > 0 && (
            <div className='mt-1 flex items-center gap-2'>
              {renderStars(Math.round(averageRating))}
              <span className='text-sm text-gray-600'>
                {averageRating.toFixed(1)} out of 5
              </span>
            </div>
          )}
        </div>

        {currentUser && !userReview && (
          <button
            onClick={() => setShowForm(!showForm)}
            className='rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700'
          >
            Write Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <form
          onSubmit={handleSubmitReview}
          className='mb-6 rounded-lg bg-gray-50 p-6'
        >
          <h4 className='mb-4 font-semibold text-gray-900'>Write a Review</h4>

          {/* Rating */}
          <div className='mb-4'>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Rating
            </label>
            {renderStars(formData.rating, true, (rating) =>
              setFormData((prev) => ({ ...prev, rating }))
            )}
          </div>

          {/* Review Text */}
          <div className='mb-4'>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Review (Optional)
            </label>
            <textarea
              value={formData.review_text}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  review_text: e.target.value,
                }))
              }
              rows={4}
              className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500'
              placeholder='Share your thoughts about this product...'
            />
          </div>

          {/* Anonymous Option */}
          <div className='mb-4'>
            <label className='flex items-center'>
              <input
                type='checkbox'
                checked={formData.is_anonymous}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_anonymous: e.target.checked,
                  }))
                }
                className='rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
              />
              <span className='ml-2 text-sm text-gray-700'>
                Post anonymously
              </span>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className='flex gap-3'>
            <button
              type='submit'
              disabled={submitting}
              className='rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 disabled:opacity-50'
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button
              type='button'
              onClick={() => setShowForm(false)}
              className='rounded-lg bg-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-400'
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* User's Existing Review */}
      {userReview && (
        <div className='mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4'>
          <div className='mb-2 flex items-center gap-2'>
            <span className='text-sm font-medium text-blue-800'>
              Your Review
            </span>
            <span className='rounded bg-blue-100 px-2 py-1 text-xs text-blue-600'>
              {userReview.moderation_status}
            </span>
          </div>
          <div className='mb-2 flex items-center gap-2'>
            {renderStars(userReview.rating)}
          </div>
          {userReview.review_text && (
            <p className='text-sm text-blue-800'>{userReview.review_text}</p>
          )}
        </div>
      )}

      {/* Reviews List */}
      <div className='space-y-4'>
        {reviews.length === 0 ? (
          <p className='py-8 text-center text-gray-500'>
            No reviews yet. Be the first to review this product!
          </p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className='rounded-lg border border-gray-200 p-4'
            >
              <div className='mb-3 flex items-start justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='flex items-center gap-2'>
                    {review.is_anonymous ? (
                      <User className='h-5 w-5 text-gray-400' />
                    ) : (
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-300'>
                        <User className='h-4 w-4 text-gray-600' />
                      </div>
                    )}
                    <span className='text-sm font-medium text-gray-900'>
                      {review.is_anonymous ? 'Anonymous' : 'Verified User'}
                    </span>
                  </div>
                  {renderStars(review.rating)}
                </div>
                <span className='text-xs text-gray-500'>
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>

              {review.review_text && (
                <p className='mb-3 text-gray-700'>{review.review_text}</p>
              )}

              <div className='flex items-center gap-4 text-sm'>
                <button
                  onClick={() => handleVoteHelpful(review.id, true)}
                  className='flex items-center gap-1 text-gray-500 transition-colors hover:text-green-600'
                >
                  <ThumbsUp className='h-4 w-4' />
                  Helpful ({review.helpful_count})
                </button>

                <button className='flex items-center gap-1 text-gray-500 transition-colors hover:text-red-600'>
                  <Flag className='h-4 w-4' />
                  Report
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
