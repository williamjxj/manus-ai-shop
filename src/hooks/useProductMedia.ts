'use client'

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { ProductMedia } from '@/lib/product-management'

interface UseProductMediaProps {
  productId: string
  initialMedia?: ProductMedia[]
}

interface UseProductMediaReturn {
  media: ProductMedia[]
  isLoading: boolean
  isUploading: boolean
  uploadMedia: (files: File[]) => Promise<void>
  deleteMedia: (mediaId: string) => Promise<void>
  reorderMedia: (media: ProductMedia[]) => Promise<void>
  setPrimaryMedia: (mediaId: string) => Promise<void>
  updateAltText: (mediaId: string, altText: string) => Promise<void>
  refreshMedia: () => Promise<void>
  setMedia: (media: ProductMedia[]) => void
}

export function useProductMedia({
  productId,
  initialMedia = [],
}: UseProductMediaProps): UseProductMediaReturn {
  const [media, setMedia] = useState<ProductMedia[]>(initialMedia)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const refreshMedia = useCallback(async () => {
    if (!productId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/products/${productId}/media`)
      if (!response.ok) {
        throw new Error('Failed to fetch media')
      }

      const data = await response.json()
      setMedia(data.media || [])
    } catch (error: any) {
      console.error('Error fetching media:', error)
      toast.error('Failed to load media')
    } finally {
      setIsLoading(false)
    }
  }, [productId])

  // Auto-load media when productId changes
  useEffect(() => {
    if (productId) {
      refreshMedia()
    }
  }, [productId, refreshMedia])

  const uploadMedia = useCallback(
    async (files: File[]) => {
      if (!productId || files.length === 0) return

      setIsUploading(true)
      try {
        const formData = new FormData()
        files.forEach((file) => {
          formData.append('files', file)
        })

        const response = await fetch(`/api/products/${productId}/media`, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Upload failed')
        }

        const data = await response.json()

        if (data.errors && data.errors.length > 0) {
          data.errors.forEach((error: string) => {
            toast.error(error)
          })
        }

        if (data.uploaded && data.uploaded.length > 0) {
          // Add uploaded media to current state
          setMedia((prev) =>
            [...prev, ...data.uploaded].sort(
              (a, b) => a.sort_order - b.sort_order
            )
          )
          toast.success(`${data.uploaded.length} file(s) uploaded successfully`)
        }
      } catch (error: any) {
        console.error('Error uploading media:', error)
        toast.error(error.message || 'Upload failed')
        throw error
      } finally {
        setIsUploading(false)
      }
    },
    [productId]
  )

  const deleteMedia = useCallback(
    async (mediaId: string) => {
      if (!productId || !mediaId) return

      try {
        const response = await fetch(
          `/api/products/${productId}/media/${mediaId}`,
          {
            method: 'DELETE',
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Delete failed')
        }

        // Remove media from state
        setMedia((prev) => prev.filter((item) => item.id !== mediaId))
        toast.success('Media deleted successfully')
      } catch (error: any) {
        console.error('Error deleting media:', error)
        toast.error(error.message || 'Delete failed')
        throw error
      }
    },
    [productId]
  )

  const reorderMedia = useCallback(
    async (reorderedMedia: ProductMedia[]) => {
      if (!productId) return

      try {
        const mediaOrder = reorderedMedia.map((item) => item.id)

        const response = await fetch(`/api/products/${productId}/media`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'reorder',
            mediaOrder,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Reorder failed')
        }

        // Update state with new order
        setMedia(reorderedMedia)
      } catch (error: any) {
        console.error('Error reordering media:', error)
        toast.error(error.message || 'Reorder failed')
        throw error
      }
    },
    [productId]
  )

  const setPrimaryMedia = useCallback(
    async (mediaId: string) => {
      if (!productId || !mediaId) return

      try {
        const response = await fetch(`/api/products/${productId}/media`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'set_primary',
            mediaId,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to set primary media')
        }

        // Update state to reflect new primary
        setMedia((prev) =>
          prev.map((item) => ({
            ...item,
            is_primary: item.id === mediaId,
          }))
        )

        toast.success('Primary media updated')
      } catch (error: any) {
        console.error('Error setting primary media:', error)
        toast.error(error.message || 'Failed to set primary media')
        throw error
      }
    },
    [productId]
  )

  const updateAltText = useCallback(
    async (mediaId: string, altText: string) => {
      if (!productId || !mediaId) return

      try {
        const response = await fetch(
          `/api/products/${productId}/media/${mediaId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              alt_text: altText,
            }),
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update alt text')
        }

        // Update state with new alt text
        setMedia((prev) =>
          prev.map((item) =>
            item.id === mediaId ? { ...item, alt_text: altText } : item
          )
        )

        toast.success('Alt text updated')
      } catch (error: any) {
        console.error('Error updating alt text:', error)
        toast.error(error.message || 'Failed to update alt text')
        throw error
      }
    },
    [productId]
  )

  return {
    media,
    isLoading,
    isUploading,
    uploadMedia,
    deleteMedia,
    reorderMedia,
    setPrimaryMedia,
    updateAltText,
    refreshMedia,
    setMedia,
  }
}
