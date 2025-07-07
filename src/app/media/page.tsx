'use client'

import { Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { createClient } from '@/lib/supabase/client'

interface MediaFile {
  id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  media_type: 'image' | 'video'
  bucket_name: string
  public_url: string
  thumbnail_url?: string
  duration_seconds?: number
  width?: number
  height?: number
  created_at: string
}

export default function MediaManagementPage() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadMediaFiles = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          toast.error('Please login to view your media files')
          return
        }

        setCurrentUser(user)

        const { data, error } = await supabase
          .from('media_files')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        setMediaFiles(data || [])
      } catch (error: any) {
        console.error('Load error:', error)
        toast.error('Failed to load media files: ' + error.message)
      } finally {
        setLoading(false)
      }
    }

    loadMediaFiles()
  }, [supabase])

  const deleteMediaFile = async (mediaFile: MediaFile) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${mediaFile.file_name}"? This action cannot be undone.`
      )
    ) {
      return
    }

    setDeleting(mediaFile.id)
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(mediaFile.bucket_name)
        .remove([mediaFile.file_path])

      if (storageError) {
        console.warn('Storage deletion failed:', storageError)
        // Continue with database deletion even if storage fails
      }

      // Delete thumbnail if exists
      if (mediaFile.thumbnail_url) {
        const thumbnailPath = extractStoragePath(mediaFile.thumbnail_url)
        if (thumbnailPath) {
          await supabase.storage.from('images').remove([thumbnailPath])
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('media_files')
        .delete()
        .eq('id', mediaFile.id)

      if (dbError) throw dbError

      // Remove from local state
      setMediaFiles((prev) => prev.filter((file) => file.id !== mediaFile.id))
      toast.success('Media file deleted successfully!')
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error('Failed to delete media file: ' + error.message)
    } finally {
      setDeleting(null)
    }
  }

  // Helper function to extract storage path from URL
  const extractStoragePath = (url: string): string | null => {
    try {
      const urlParts = url.split('/storage/v1/object/public/')
      if (urlParts.length > 1) {
        const pathParts = urlParts[1].split('/')
        if (pathParts.length > 1) {
          return pathParts.slice(1).join('/') // Remove bucket name, keep path
        }
      }
      return null
    } catch {
      return null
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 p-8'>
        <div className='mx-auto max-w-6xl'>
          <h1 className='mb-8 text-3xl font-bold'>Media Management</h1>
          <div className='text-center'>Loading media files...</div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className='min-h-screen bg-gray-50 p-8'>
        <div className='mx-auto max-w-6xl'>
          <h1 className='mb-8 text-3xl font-bold'>Media Management</h1>
          <div className='text-center text-red-600'>
            Please login to view your media files
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='mx-auto max-w-6xl'>
        <div className='mb-8 flex items-center justify-between'>
          <h1 className='text-3xl font-bold'>Media Management</h1>
          <div className='text-sm text-gray-600'>
            {mediaFiles.length} file{mediaFiles.length !== 1 ? 's' : ''}
          </div>
        </div>

        {mediaFiles.length === 0 ? (
          <div className='py-16 text-center'>
            <div className='text-gray-500'>No media files found</div>
            <p className='mt-2 text-sm text-gray-400'>
              Upload some images or videos to see them here
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {mediaFiles.map((file) => (
              <div
                key={file.id}
                className='overflow-hidden rounded-lg bg-white shadow-md transition-all duration-200 hover:shadow-lg'
              >
                {/* Media Preview */}
                <div className='relative aspect-square bg-gray-100'>
                  {file.media_type === 'video' ? (
                    <video
                      src={file.public_url}
                      poster={file.thumbnail_url}
                      className='h-full w-full object-cover'
                      muted
                    />
                  ) : (
                    <Image
                      src={file.public_url}
                      alt={file.file_name}
                      fill
                      className='object-cover'
                    />
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteMediaFile(file)}
                    disabled={deleting === file.id}
                    className='absolute right-2 top-2 rounded-full bg-red-500 p-2 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                    title='Delete media file'
                  >
                    {deleting === file.id ? (
                      <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-white'></div>
                    ) : (
                      <Trash2 className='h-4 w-4' />
                    )}
                  </button>

                  {/* Video Duration */}
                  {file.media_type === 'video' && file.duration_seconds && (
                    <div className='absolute bottom-2 right-2 rounded bg-black bg-opacity-75 px-2 py-1 text-xs text-white'>
                      {formatDuration(file.duration_seconds)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className='p-4'>
                  <h3 className='truncate font-medium text-gray-900'>
                    {file.file_name}
                  </h3>
                  <div className='mt-2 space-y-1 text-sm text-gray-600'>
                    <div>Type: {file.media_type}</div>
                    <div>Size: {formatFileSize(file.file_size)}</div>
                    {file.width && file.height && (
                      <div>
                        Dimensions: {file.width} × {file.height}
                      </div>
                    )}
                    <div>
                      Uploaded: {new Date(file.created_at).toLocaleDateString()}
                    </div>
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
