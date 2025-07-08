'use client'

import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import {
  Camera,
  Edit3,
  Eye,
  FileVideo,
  GripVertical,
  Image as ImageIcon,
  Play,
  Plus,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'

import { ProductMedia } from '@/lib/product-management'

interface ProductMediaManagerProps {
  productId: string
  media: ProductMedia[]
  onMediaUpdate: (media: ProductMedia[]) => void
  onMediaUpload: (files: File[]) => Promise<void>
  onMediaDelete: (mediaId: string) => Promise<void>
  onMediaReorder: (media: ProductMedia[]) => Promise<void>
  onSetPrimary: (mediaId: string) => Promise<void>
  isUploading?: boolean
  maxFiles?: number
  allowedTypes?: string[]
}

export default function ProductMediaManager({
  productId,
  media,
  onMediaUpdate,
  onMediaUpload,
  onMediaDelete,
  onMediaReorder,
  onSetPrimary,
  isUploading = false,
  maxFiles = 10,
  allowedTypes = ['image/*', 'video/*'],
}: ProductMediaManagerProps) {
  const [draggedOver, setDraggedOver] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<ProductMedia | null>(null)
  const [editingAltText, setEditingAltText] = useState<string | null>(null)
  const [altTextValue, setAltTextValue] = useState('')

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || [])
      if (files.length === 0) return

      if (media.length + files.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`)
        return
      }

      try {
        await onMediaUpload(files)
        toast.success(`${files.length} file(s) uploaded successfully`)
      } catch (error: any) {
        toast.error(`Upload failed: ${error.message}`)
      }

      // Reset input
      event.target.value = ''
    },
    [media.length, maxFiles, onMediaUpload]
  )

  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault()
      setDraggedOver(false)

      const files = Array.from(event.dataTransfer.files)
      if (files.length === 0) return

      if (media.length + files.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`)
        return
      }

      try {
        await onMediaUpload(files)
        toast.success(`${files.length} file(s) uploaded successfully`)
      } catch (error: any) {
        toast.error(`Upload failed: ${error.message}`)
      }
    },
    [media.length, maxFiles, onMediaUpload]
  )

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setDraggedOver(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setDraggedOver(false)
  }, [])

  const handleDragEnd = useCallback(
    async (result: any) => {
      if (!result.destination) return

      const items = Array.from(media)
      const [reorderedItem] = items.splice(result.source.index, 1)
      items.splice(result.destination.index, 0, reorderedItem)

      // Update sort_order for all items
      const updatedItems = items.map((item, index) => ({
        ...item,
        sort_order: index,
      }))

      onMediaUpdate(updatedItems)
      await onMediaReorder(updatedItems)
    },
    [media, onMediaUpdate, onMediaReorder]
  )

  const handleDelete = useCallback(
    async (mediaId: string) => {
      if (!confirm('Are you sure you want to delete this media?')) return

      try {
        await onMediaDelete(mediaId)
        toast.success('Media deleted successfully')
      } catch (error: any) {
        toast.error(`Delete failed: ${error.message}`)
      }
    },
    [onMediaDelete]
  )

  const handleSetPrimary = useCallback(
    async (mediaId: string) => {
      try {
        await onSetPrimary(mediaId)
        toast.success('Primary media updated')
      } catch (error: any) {
        toast.error(`Failed to set primary: ${error.message}`)
      }
    },
    [onSetPrimary]
  )

  const handleAltTextSave = useCallback(
    async (mediaId: string) => {
      // TODO: Implement alt text update API call
      setEditingAltText(null)
      toast.success('Alt text updated')
    },
    []
  )

  const sortedMedia = [...media].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className='space-y-6'>
      {/* Upload Area */}
      <div
        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          draggedOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type='file'
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          className='absolute inset-0 h-full w-full cursor-pointer opacity-0'
          disabled={isUploading || media.length >= maxFiles}
        />

        <div className='space-y-4'>
          <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
            {isUploading ? (
              <div className='h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent' />
            ) : (
              <Upload className='h-8 w-8 text-gray-600' />
            )}
          </div>

          <div>
            <p className='text-lg font-medium text-gray-900'>
              {isUploading ? 'Uploading...' : 'Upload Media Files'}
            </p>
            <p className='text-sm text-gray-500'>
              Drag and drop files here, or click to select
            </p>
            <p className='text-xs text-gray-400'>
              Supports images and videos • Max {maxFiles} files • {media.length}/
              {maxFiles} used
            </p>
          </div>

          {media.length >= maxFiles && (
            <p className='text-sm font-medium text-red-600'>
              Maximum file limit reached
            </p>
          )}
        </div>
      </div>

      {/* Media Gallery */}
      {sortedMedia.length > 0 && (
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-medium text-gray-900'>
              Media Gallery ({sortedMedia.length})
            </h3>
            <p className='text-sm text-gray-500'>
              Drag to reorder • Click star to set as primary
            </p>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId='media-gallery'>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
                >
                  {sortedMedia.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`group relative overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow ${
                            snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                          } ${item.is_primary ? 'ring-2 ring-blue-500' : ''}`}
                        >
                          {/* Drag Handle */}
                          <div
                            {...provided.dragHandleProps}
                            className='absolute left-2 top-2 z-10 cursor-grab rounded bg-black bg-opacity-50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100'
                          >
                            <GripVertical className='h-4 w-4' />
                          </div>

                          {/* Primary Badge */}
                          {item.is_primary && (
                            <div className='absolute right-2 top-2 z-10 rounded bg-blue-500 px-2 py-1 text-xs font-medium text-white'>
                              Primary
                            </div>
                          )}

                          {/* Media Preview */}
                          <div className='relative aspect-square'>
                            {item.media_type === 'image' ? (
                              <Image
                                src={item.media_url}
                                alt={item.alt_text || 'Product media'}
                                fill
                                className='object-cover'
                              />
                            ) : (
                              <div className='relative h-full w-full'>
                                <Image
                                  src={item.thumbnail_url || '/placeholder-video.jpg'}
                                  alt={item.alt_text || 'Video thumbnail'}
                                  fill
                                  className='object-cover'
                                />
                                <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-30'>
                                  <div className='rounded-full bg-white bg-opacity-90 p-3'>
                                    <Play className='h-6 w-6 text-gray-900' fill='currentColor' />
                                  </div>
                                </div>
                                {item.duration_seconds && (
                                  <div className='absolute bottom-2 right-2 rounded bg-black bg-opacity-75 px-2 py-1 text-xs text-white'>
                                    {Math.floor(item.duration_seconds / 60)}:
                                    {(item.duration_seconds % 60).toString().padStart(2, '0')}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Overlay Actions */}
                            <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 transition-all group-hover:bg-opacity-50'>
                              <div className='flex gap-2 opacity-0 transition-opacity group-hover:opacity-100'>
                                <button
                                  onClick={() => setSelectedMedia(item)}
                                  className='rounded-full bg-white p-2 text-gray-900 shadow-lg transition-transform hover:scale-110'
                                  title='Preview'
                                >
                                  <Eye className='h-4 w-4' />
                                </button>
                                <button
                                  onClick={() => handleSetPrimary(item.id)}
                                  className={`rounded-full p-2 shadow-lg transition-transform hover:scale-110 ${
                                    item.is_primary
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-white text-gray-900'
                                  }`}
                                  title='Set as primary'
                                >
                                  <Star className='h-4 w-4' />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className='rounded-full bg-red-500 p-2 text-white shadow-lg transition-transform hover:scale-110'
                                  title='Delete'
                                >
                                  <Trash2 className='h-4 w-4' />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Media Info */}
                          <div className='p-3'>
                            <div className='flex items-center gap-2 text-sm text-gray-600'>
                              {item.media_type === 'image' ? (
                                <ImageIcon className='h-4 w-4' />
                              ) : (
                                <FileVideo className='h-4 w-4' />
                              )}
                              <span className='capitalize'>{item.media_type}</span>
                              {item.file_size && (
                                <span>• {formatFileSize(item.file_size)}</span>
                              )}
                              {item.width && item.height && (
                                <span>• {item.width}×{item.height}</span>
                              )}
                            </div>

                            {/* Alt Text */}
                            <div className='mt-2'>
                              {editingAltText === item.id ? (
                                <div className='flex gap-2'>
                                  <input
                                    type='text'
                                    value={altTextValue}
                                    onChange={(e) => setAltTextValue(e.target.value)}
                                    placeholder='Alt text for accessibility'
                                    className='flex-1 rounded border border-gray-300 px-2 py-1 text-sm'
                                  />
                                  <button
                                    onClick={() => handleAltTextSave(item.id)}
                                    className='rounded bg-blue-500 px-2 py-1 text-xs text-white'
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingAltText(null)}
                                    className='rounded bg-gray-500 px-2 py-1 text-xs text-white'
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingAltText(item.id)
                                    setAltTextValue(item.alt_text || '')
                                  }}
                                  className='flex w-full items-center gap-2 rounded border border-gray-200 px-2 py-1 text-left text-sm text-gray-600 hover:bg-gray-50'
                                >
                                  <Edit3 className='h-3 w-3' />
                                  {item.alt_text || 'Add alt text...'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}

      {/* Media Preview Modal */}
      {selectedMedia && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4'>
          <div className='relative max-h-full max-w-4xl overflow-hidden rounded-lg bg-white'>
            <button
              onClick={() => setSelectedMedia(null)}
              className='absolute right-4 top-4 z-10 rounded-full bg-black bg-opacity-50 p-2 text-white hover:bg-opacity-75'
            >
              <X className='h-5 w-5' />
            </button>

            {selectedMedia.media_type === 'image' ? (
              <Image
                src={selectedMedia.media_url}
                alt={selectedMedia.alt_text || 'Product media'}
                width={800}
                height={600}
                className='max-h-[80vh] w-auto object-contain'
              />
            ) : (
              <video
                src={selectedMedia.media_url}
                controls
                className='max-h-[80vh] w-auto'
                autoPlay
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
