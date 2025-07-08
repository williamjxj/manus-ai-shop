'use client'

import {
  Archive,
  Filter,
  Grid3X3,
  List,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { ADULT_CATEGORIES, getCategoryLabel } from '@/constants/categories'
import { useProductCRUD } from '@/hooks/useProductCRUD'
import { Product, ProductSortOptions } from '@/lib/product-management'

import ProductGridItem from './ProductGridItem'
import ProductListItem from './ProductListItem'

type ViewMode = 'grid' | 'list'
type SelectionMode = 'none' | 'single' | 'multiple'

interface ProductManagementDashboardProps {
  userId?: string
  initialProducts?: Product[]
}

export default function ProductManagementDashboard({
  userId,
  initialProducts = [],
}: ProductManagementDashboardProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('none')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  )
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const {
    products,
    loading,
    creating,
    updating,
    deleting,
    total,
    currentPage,
    totalPages,
    filters,
    sortOptions,
    validationErrors,
    validationWarnings,
    loadProducts,
    refreshProducts,
    deleteProduct,
    setFilters,
    setSortOptions,
    setPage,
    bulkDelete,
    bulkArchive,
    bulkFeature,
  } = useProductCRUD({
    initialProducts,
    autoRefresh: true,
  })

  // Load products on mount
  useEffect(() => {
    if (userId) {
      setFilters({ user_id: userId })
    } else {
      loadProducts()
    }
  }, [userId, setFilters, loadProducts])

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      setFilters({ search: query || undefined })
    },
    [setFilters]
  )

  const handleCategoryFilter = useCallback(
    (category: string) => {
      setFilters({ category: category === 'all' ? undefined : category })
    },
    [setFilters]
  )

  const handleSortChange = useCallback(
    (field: string, direction: 'asc' | 'desc') => {
      setSortOptions({
        field: field as ProductSortOptions['field'],
        direction,
      })
    },
    [setSortOptions]
  )

  const toggleProductSelection = useCallback((productId: string) => {
    setSelectedProducts((prev) => {
      const newSelection = new Set(prev)
      if (newSelection.has(productId)) {
        newSelection.delete(productId)
      } else {
        newSelection.add(productId)
      }
      return newSelection
    })
  }, [])

  const selectAllProducts = useCallback(() => {
    setSelectedProducts(new Set(products.map((p) => p.id)))
  }, [products])

  const clearSelection = useCallback(() => {
    setSelectedProducts(new Set())
    setSelectionMode('none')
  }, [])

  const handleBulkDelete = useCallback(async () => {
    if (selectedProducts.size === 0) return

    const success = await bulkDelete(Array.from(selectedProducts))
    if (success) {
      clearSelection()
    }
  }, [selectedProducts, bulkDelete, clearSelection])

  const handleBulkArchive = useCallback(
    async (archived: boolean) => {
      if (selectedProducts.size === 0) return

      const success = await bulkArchive(Array.from(selectedProducts), archived)
      if (success) {
        clearSelection()
      }
    },
    [selectedProducts, bulkArchive, clearSelection]
  )

  const handleBulkFeature = useCallback(
    async (featured: boolean) => {
      if (selectedProducts.size === 0) return

      const success = await bulkFeature(Array.from(selectedProducts), featured)
      if (success) {
        clearSelection()
      }
    },
    [selectedProducts, bulkFeature, clearSelection]
  )

  const handleDeleteProduct = useCallback(
    async (productId: string) => {
      const success = await deleteProduct(productId)
      if (success && selectedProducts.has(productId)) {
        setSelectedProducts((prev) => {
          const newSelection = new Set(prev)
          newSelection.delete(productId)
          return newSelection
        })
      }
    },
    [deleteProduct, selectedProducts]
  )

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='mx-auto max-w-7xl space-y-6'>
        {/* Header */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>
              Product Management
            </h1>
            <p className='text-gray-600'>
              {total} products • {selectedProducts.size} selected
            </p>
          </div>

          <div className='flex gap-2'>
            <Link
              href='/upload'
              className='inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700'
            >
              <Plus className='h-4 w-4' />
              Add Product
            </Link>
          </div>
        </div>

        {/* Validation Messages */}
        {validationErrors.length > 0 && (
          <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
            <h3 className='font-medium text-red-800'>Validation Errors:</h3>
            <ul className='mt-2 list-inside list-disc text-sm text-red-700'>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {validationWarnings.length > 0 && (
          <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
            <h3 className='font-medium text-yellow-800'>Warnings:</h3>
            <ul className='mt-2 list-inside list-disc text-sm text-yellow-700'>
              {validationWarnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Toolbar */}
        <div className='flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between'>
          {/* Search */}
          <div className='relative max-w-md flex-1'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
            <input
              type='text'
              placeholder='Search products...'
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className='w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none'
            />
          </div>

          {/* Controls */}
          <div className='flex items-center gap-2'>
            {/* Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                showFilters
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className='h-4 w-4' />
              Filters
            </button>

            {/* View Mode */}
            <div className='flex rounded-lg border border-gray-300 bg-white'>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${
                  viewMode === 'grid'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Grid3X3 className='h-4 w-4' />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${
                  viewMode === 'list'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List className='h-4 w-4' />
              </button>
            </div>

            {/* Selection Mode */}
            <button
              onClick={() =>
                setSelectionMode(selectionMode === 'none' ? 'multiple' : 'none')
              }
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                selectionMode !== 'none'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Select
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className='rounded-lg bg-white p-4 shadow-sm'>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              {/* Category Filter */}
              <div>
                <label className='mb-2 block text-sm font-medium text-gray-700'>
                  Category
                </label>
                <select
                  value={filters.category || 'all'}
                  onChange={(e) => handleCategoryFilter(e.target.value)}
                  className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
                >
                  <option value='all'>All Categories</option>
                  {ADULT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {getCategoryLabel(category)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className='mb-2 block text-sm font-medium text-gray-700'>
                  Price Range
                </label>
                <div className='flex gap-2'>
                  <input
                    type='number'
                    placeholder='Min'
                    value={filters.price_min || ''}
                    onChange={(e) =>
                      setFilters({
                        price_min: e.target.value
                          ? Number(e.target.value) * 100
                          : undefined,
                      })
                    }
                    className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
                  />
                  <input
                    type='number'
                    placeholder='Max'
                    value={filters.price_max || ''}
                    onChange={(e) =>
                      setFilters({
                        price_max: e.target.value
                          ? Number(e.target.value) * 100
                          : undefined,
                      })
                    }
                    className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
                  />
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <label className='mb-2 block text-sm font-medium text-gray-700'>
                  Sort By
                </label>
                <select
                  value={`${sortOptions.field}-${sortOptions.direction}`}
                  onChange={(e) => {
                    const [field, direction] = e.target.value.split('-')
                    handleSortChange(field, direction as 'asc' | 'desc')
                  }}
                  className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none'
                >
                  <option value='created_at-desc'>Newest First</option>
                  <option value='created_at-asc'>Oldest First</option>
                  <option value='name-asc'>Name A-Z</option>
                  <option value='name-desc'>Name Z-A</option>
                  <option value='price_cents-asc'>Price Low-High</option>
                  <option value='price_cents-desc'>Price High-Low</option>
                  <option value='average_rating-desc'>Highest Rated</option>
                  <option value='view_count-desc'>Most Viewed</option>
                </select>
              </div>

              {/* Quick Filters */}
              <div>
                <label className='mb-2 block text-sm font-medium text-gray-700'>
                  Quick Filters
                </label>
                <div className='space-y-2'>
                  <label className='flex items-center'>
                    <input
                      type='checkbox'
                      checked={filters.in_stock_only || false}
                      onChange={(e) =>
                        setFilters({
                          in_stock_only: e.target.checked || undefined,
                        })
                      }
                      className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                    />
                    <span className='ml-2 text-sm text-gray-700'>
                      In Stock Only
                    </span>
                  </label>
                  <label className='flex items-center'>
                    <input
                      type='checkbox'
                      checked={filters.featured_only || false}
                      onChange={(e) =>
                        setFilters({
                          featured_only: e.target.checked || undefined,
                        })
                      }
                      className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                    />
                    <span className='ml-2 text-sm text-gray-700'>
                      Featured Only
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectionMode !== 'none' && selectedProducts.size > 0 && (
          <div className='flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-4'>
            <span className='text-sm font-medium text-blue-900'>
              {selectedProducts.size} products selected
            </span>
            <div className='ml-auto flex gap-2'>
              <button
                onClick={() => handleBulkFeature(true)}
                disabled={updating}
                className='inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-3 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50'
              >
                <Star className='h-4 w-4' />
                Feature
              </button>
              <button
                onClick={() => handleBulkArchive(true)}
                disabled={updating}
                className='inline-flex items-center gap-2 rounded-lg bg-gray-600 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50'
              >
                <Archive className='h-4 w-4' />
                Archive
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deleting}
                className='inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50'
              >
                <Trash2 className='h-4 w-4' />
                Delete
              </button>
              <button
                onClick={clearSelection}
                className='inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Products Grid/List */}
        {loading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent' />
          </div>
        ) : products.length === 0 ? (
          <div className='py-12 text-center'>
            <Upload className='mx-auto h-12 w-12 text-gray-400' />
            <h3 className='mt-4 text-lg font-medium text-gray-900'>
              No products found
            </h3>
            <p className='mt-2 text-gray-600'>
              {filters.search || filters.category
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by creating your first product.'}
            </p>
            {!filters.search && !filters.category && (
              <Link
                href='/upload'
                className='mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700'
              >
                <Plus className='h-4 w-4' />
                Add Your First Product
              </Link>
            )}
          </div>
        ) : (
          <ProductGrid
            products={products}
            viewMode={viewMode}
            selectionMode={selectionMode}
            selectedProducts={selectedProducts}
            onToggleSelection={toggleProductSelection}
            onDeleteProduct={handleDeleteProduct}
            deleting={deleting}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='flex items-center justify-between rounded-lg bg-white p-4 shadow-sm'>
            <div className='text-sm text-gray-700'>
              Showing {(currentPage - 1) * 20 + 1} to{' '}
              {Math.min(currentPage * 20, total)} of {total} products
            </div>
            <div className='flex gap-2'>
              <button
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 1}
                className='rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page =
                  Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                return (
                  <button
                    key={page}
                    onClick={() => setPage(page)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium ${
                      page === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
              <button
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className='rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface ProductGridProps {
  products: Product[]
  viewMode: ViewMode
  selectionMode: SelectionMode
  selectedProducts: Set<string>
  onToggleSelection: (productId: string) => void
  onDeleteProduct: (productId: string) => void
  deleting: boolean
}

function ProductGrid({
  products,
  viewMode,
  selectionMode,
  selectedProducts,
  onToggleSelection,
  onDeleteProduct,
  deleting,
}: ProductGridProps) {
  if (viewMode === 'list') {
    return (
      <div className='space-y-4'>
        {products.map((product) => (
          <ProductListItem
            key={product.id}
            product={product}
            selectionMode={selectionMode}
            isSelected={selectedProducts.has(product.id)}
            onToggleSelection={onToggleSelection}
            onDelete={onDeleteProduct}
            deleting={deleting}
          />
        ))}
      </div>
    )
  }

  return (
    <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      {products.map((product) => (
        <ProductGridItem
          key={product.id}
          product={product}
          selectionMode={selectionMode}
          isSelected={selectedProducts.has(product.id)}
          onToggleSelection={onToggleSelection}
          onDelete={onDeleteProduct}
          deleting={deleting}
        />
      ))}
    </div>
  )
}
