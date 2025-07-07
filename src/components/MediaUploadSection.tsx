'use client'

import { ImageIcon, Plus, Star, Video, X } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'

import { validateImageFile, validateVideoFile } from '@/lib/media-upload-utils'

interface MediaFile {
  file: File
  preview?: string
  mediaType: 'image' | 'video'
  id: string
  isPrimary: boolean
  sortOrder: number
  altText?: string
}

interface MediaUploadSectionProps {
  files: MediaFile[]
  onFilesChange: (_files: MediaFile[]) => void
  maxFiles?: number
  className?: string
}

export default function MediaUploadSection({
  files,
  onFilesChange,
  maxFiles = 10,
  className = '',
}: MediaUploadSectionProps) {
  const [dragActive, setDragActive] = useState(false)

  const createPreview = useCallback(
    async (file: File): Promise<string | undefined> => {
      return new Promise((resolve) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.onerror = () => resolve(undefined)
          reader.readAsDataURL(file)
        } else if (file.type.startsWith('video/')) {
          const video = document.createElement('video')
          video.preload = 'metadata'
          video.onloadedmetadata = () => {
            video.currentTime = 1 // Seek to 1 second for thumbnail
          }
          video.onseeked = () => {
            const canvas = document.createElement('canvas')
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(video, 0, 0)
              resolve(canvas.toDataURL())
            } else {
              resolve(undefined)
            }
          }
          video.onerror = () => resolve(undefined)
          video.src = URL.createObjectURL(file)
        } else {
          resolve(undefined)
        }
      })
    },
    []
  )

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const newFiles: MediaFile[] = []
      const filesToProcess = Array.from(fileList)

      // Check if adding these files would exceed the limit
      if (files.length + filesToProcess.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`)
        return
      }

      for (const file of filesToProcess) {
        // Validate file
        const isImage = file.type.startsWith('image/')
        const isVideo = file.type.startsWith('video/')

        if (!isImage && !isVideo) {
          toast.error(`${file.name}: Only images and videos are supported`)
          continue
        }

        // Validate based on type
        const validation = isImage
          ? validateImageFile(file)
          : validateVideoFile(file)
        if (!validation.isValid) {
          toast.error(`${file.name}: ${validation.error}`)
          continue
        }

        // Create preview
        const preview = await createPreview(file)

        newFiles.push({
          file,
          preview,
          mediaType: isImage ? 'image' : 'video',
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          isPrimary: files.length === 0 && newFiles.length === 0, // First file is primary
          sortOrder: files.length + newFiles.length,
          altText: '',
        })
      }

      if (newFiles.length > 0) {
        onFilesChange([...files, ...newFiles])
        toast.success(
          `Added ${newFiles.length} file${newFiles.length > 1 ? 's' : ''}`
        )
      }
    },
    [files, maxFiles, onFilesChange, createPreview]
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files)
      }
    },
    [processFiles]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files)
        e.target.value = '' // Reset input
      }
    },
    [processFiles]
  )

  const removeFile = useCallback(
    (id: string) => {
      const updatedFiles = files.filter((file) => file.id !== id)
      // If we removed the primary file, make the first remaining file primary
      if (updatedFiles.length > 0) {
        const removedFile = files.find((f) => f.id === id)
        if (removedFile?.isPrimary) {
          updatedFiles[0].isPrimary = true
        }
      }
      onFilesChange(updatedFiles)
    },
    [files, onFilesChange]
  )

  const setPrimaryFile = useCallback(
    (id: string) => {
      const updatedFiles = files.map((file) => ({
        ...file,
        isPrimary: file.id === id,
      }))
      onFilesChange(updatedFiles)
    },
    [files, onFilesChange]
  )

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type='file'
          multiple
          accept='image/*,video/*'
          onChange={handleFileInput}
          className='absolute inset-0 h-full w-full cursor-pointer opacity-0'
        />

        <div className='space-y-4'>
          <div className='flex justify-center'>
            <div className='flex space-x-2'>
              <ImageIcon className='h-8 w-8 text-gray-400' />
              <Video className='h-8 w-8 text-gray-400' />
            </div>
          </div>

          <div>
            <p className='text-lg font-medium text-gray-900'>
              {files.length === 0 ? 'Upload Media Files' : 'Add More Files'}
            </p>
            <p className='text-sm text-gray-500'>
              Drag and drop images or videos, or click to browse
            </p>
            <p className='mt-1 text-xs text-gray-400'>
              Supports: JPEG, PNG, GIF, WebP, MP4, MOV, AVI (Max {maxFiles}{' '}
              files)
            </p>
          </div>

          {files.length < maxFiles && (
            <button
              type='button'
              className='inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700'
            >
              <Plus className='h-4 w-4' />
              Choose Files
            </button>
          )}
        </div>
      </div>

      {/* File Preview Grid */}
      {files.length > 0 && (
        <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4'>
          {files.map((mediaFile) => (
            <div
              key={mediaFile.id}
              className='group relative aspect-square overflow-hidden rounded-lg border bg-gray-100'
            >
              {/* Preview */}
              {mediaFile.preview ? (
                <Image
                  src={mediaFile.preview}
                  alt={mediaFile.file.name}
                  fill
                  className='object-cover'
                />
              ) : (
                <div className='flex h-full items-center justify-center'>
                  {mediaFile.mediaType === 'video' ? (
                    <Video className='h-8 w-8 text-gray-400' />
                  ) : (
                    <ImageIcon className='h-8 w-8 text-gray-400' />
                  )}
                </div>
              )}

              {/* Media Type Badge */}
              <div className='absolute left-2 top-2'>
                <span className='rounded bg-black bg-opacity-75 px-2 py-1 text-xs font-medium text-white'>
                  {mediaFile.mediaType.toUpperCase()}
                </span>
              </div>

              {/* Primary Badge */}
              {mediaFile.isPrimary && (
                <div className='absolute bottom-2 left-2'>
                  <span className='inline-flex items-center gap-1 rounded bg-yellow-500 px-2 py-1 text-xs font-medium text-white'>
                    <Star className='h-3 w-3' />
                    PRIMARY
                  </span>
                </div>
              )}

              {/* Primary Button */}
              {!mediaFile.isPrimary && (
                <button
                  type='button'
                  onClick={() => setPrimaryFile(mediaFile.id)}
                  className='absolute bottom-2 left-2 rounded bg-gray-500 bg-opacity-75 p-1 text-white opacity-0 transition-opacity hover:bg-yellow-500 group-hover:opacity-100'
                  title='Set as primary image'
                >
                  <Star className='h-3 w-3' />
                </button>
              )}

              {/* Remove Button */}
              <button
                type='button'
                onClick={() => removeFile(mediaFile.id)}
                className='absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100'
              >
                <X className='h-4 w-4' />
              </button>

              {/* File Info */}
              <div className='absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-2'>
                <p
                  className='truncate text-xs text-white'
                  title={mediaFile.file.name}
                >
                  {mediaFile.file.name}
                </p>
                <p className='text-xs text-gray-300'>
                  {(mediaFile.file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Count */}
      {files.length > 0 && (
        <div className='flex items-center justify-between text-sm text-gray-600'>
          <span>
            {files.length} file{files.length > 1 ? 's' : ''} selected
          </span>
          {files.length >= maxFiles && (
            <span className='text-amber-600'>Maximum files reached</span>
          )}
        </div>
      )}
    </div>
  )
}
