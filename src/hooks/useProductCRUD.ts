'use client'

import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'

import { Product, ProductFilters, ProductSortOptions } from '@/lib/product-management'
import { validateProductData, ValidationResult } from '@/lib/product-validation'

interface UseProductCRUDProps {
  initialProducts?: Product[]
  autoRefresh?: boolean
}

interface UseProductCRUDReturn {
  products: Product[]
  loading: boolean
  creating: boolean
  updating: boolean
  deleting: boolean
  total: number
  currentPage: number
  totalPages: number
  filters: ProductFilters
  sortOptions: ProductSortOptions
  validationErrors: string[]
  validationWarnings: string[]
  
  // CRUD operations
  createProduct: (data: any) => Promise<Product | null>
  updateProduct: (id: string, data: any) => Promise<Product | null>
  deleteProduct: (id: string) => Promise<boolean>
  getProduct: (id: string) => Promise<Product | null>
  
  // List operations
  loadProducts: (filters?: ProductFilters, sort?: ProductSortOptions, page?: number) => Promise<void>
  refreshProducts: () => Promise<void>
  
  // Filter and sort
  setFilters: (filters: Partial<ProductFilters>) => void
  setSortOptions: (sort: ProductSortOptions) => void
  setPage: (page: number) => void
  
  // Bulk operations
  bulkDelete: (productIds: string[]) => Promise<boolean>
  bulkArchive: (productIds: string[], archived: boolean) => Promise<boolean>
  bulkFeature: (productIds: string[], featured: boolean) => Promise<boolean>
  
  // Validation
  validateProduct: (data: any, isUpdate?: boolean) => ValidationResult
  clearValidation: () => void
}

const ITEMS_PER_PAGE = 20

export function useProductCRUD({
  initialProducts = [],
  autoRefresh = false,
}: UseProductCRUDProps = {}): UseProductCRUDReturn {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [validationWarnings, setValidationWarnings] = useState<string[]>([])
  
  const [filters, setFiltersState] = useState<ProductFilters>({})
  const [sortOptions, setSortOptionsState] = useState<ProductSortOptions>({
    field: 'created_at',
    direction: 'desc',
  })

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  const clearValidation = useCallback(() => {
    setValidationErrors([])
    setValidationWarnings([])
  }, [])

  const validateProduct = useCallback((data: any, isUpdate: boolean = false): ValidationResult => {
    const result = validateProductData(data, isUpdate)
    setValidationErrors(result.errors)
    setValidationWarnings(result.warnings)
    return result
  }, [])

  const loadProducts = useCallback(
    async (
      newFilters: ProductFilters = filters,
      newSort: ProductSortOptions = sortOptions,
      page: number = currentPage
    ) => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        
        // Add filters
        if (newFilters.search) params.append('search', newFilters.search)
        if (newFilters.category) params.append('category', newFilters.category)
        if (newFilters.tags?.length) params.append('tags', newFilters.tags.join(','))
        if (newFilters.price_min !== undefined) params.append('price_min', newFilters.price_min.toString())
        if (newFilters.price_max !== undefined) params.append('price_max', newFilters.price_max.toString())
        if (newFilters.rating_min !== undefined) params.append('rating_min', newFilters.rating_min.toString())
        if (newFilters.in_stock_only) params.append('in_stock_only', 'true')
        if (newFilters.featured_only) params.append('featured_only', 'true')
        if (newFilters.user_id) params.append('user_id', newFilters.user_id)
        if (newFilters.collection_id) params.append('collection_id', newFilters.collection_id)
        
        // Add sorting
        params.append('sort_by', newSort.field)
        params.append('sort_order', newSort.direction)
        
        // Add pagination
        params.append('limit', ITEMS_PER_PAGE.toString())
        params.append('offset', ((page - 1) * ITEMS_PER_PAGE).toString())

        const response = await fetch(`/api/products?${params.toString()}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to load products')
        }

        const data = await response.json()
        setProducts(data.products)
        setTotal(data.total)
        setCurrentPage(page)
      } catch (error: any) {
        console.error('Error loading products:', error)
        toast.error(error.message || 'Failed to load products')
      } finally {
        setLoading(false)
      }
    },
    [filters, sortOptions, currentPage]
  )

  const refreshProducts = useCallback(() => {
    return loadProducts(filters, sortOptions, currentPage)
  }, [loadProducts, filters, sortOptions, currentPage])

  const createProduct = useCallback(async (data: any): Promise<Product | null> => {
    const validation = validateProduct(data, false)
    if (!validation.isValid) {
      toast.error('Please fix validation errors before creating the product')
      return null
    }

    setCreating(true)
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create product')
      }

      const result = await response.json()
      const newProduct = result.product

      // Add to products list if it matches current filters
      setProducts(prev => [newProduct, ...prev])
      setTotal(prev => prev + 1)

      toast.success('Product created successfully!')
      clearValidation()
      
      if (autoRefresh) {
        await refreshProducts()
      }

      return newProduct
    } catch (error: any) {
      console.error('Error creating product:', error)
      toast.error(error.message || 'Failed to create product')
      return null
    } finally {
      setCreating(false)
    }
  }, [validateProduct, clearValidation, autoRefresh, refreshProducts])

  const updateProduct = useCallback(async (id: string, data: any): Promise<Product | null> => {
    const validation = validateProduct(data, true)
    if (!validation.isValid) {
      toast.error('Please fix validation errors before updating the product')
      return null
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update product')
      }

      const result = await response.json()
      const updatedProduct = result.product

      // Update in products list
      setProducts(prev => 
        prev.map(product => 
          product.id === id ? updatedProduct : product
        )
      )

      toast.success('Product updated successfully!')
      clearValidation()

      if (autoRefresh) {
        await refreshProducts()
      }

      return updatedProduct
    } catch (error: any) {
      console.error('Error updating product:', error)
      toast.error(error.message || 'Failed to update product')
      return null
    } finally {
      setUpdating(false)
    }
  }, [validateProduct, clearValidation, autoRefresh, refreshProducts])

  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return false
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete product')
      }

      // Remove from products list
      setProducts(prev => prev.filter(product => product.id !== id))
      setTotal(prev => Math.max(0, prev - 1))

      toast.success('Product deleted successfully!')

      if (autoRefresh) {
        await refreshProducts()
      }

      return true
    } catch (error: any) {
      console.error('Error deleting product:', error)
      toast.error(error.message || 'Failed to delete product')
      return false
    } finally {
      setDeleting(false)
    }
  }, [autoRefresh, refreshProducts])

  const getProduct = useCallback(async (id: string): Promise<Product | null> => {
    try {
      const response = await fetch(`/api/products/${id}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get product')
      }

      const result = await response.json()
      return result.product
    } catch (error: any) {
      console.error('Error getting product:', error)
      toast.error(error.message || 'Failed to get product')
      return null
    }
  }, [])

  const bulkDelete = useCallback(async (productIds: string[]): Promise<boolean> => {
    if (!confirm(`Are you sure you want to delete ${productIds.length} products? This action cannot be undone.`)) {
      return false
    }

    setDeleting(true)
    try {
      const promises = productIds.map(id => 
        fetch(`/api/products/${id}`, { method: 'DELETE' })
      )
      
      const results = await Promise.allSettled(promises)
      const successful = results.filter(result => result.status === 'fulfilled').length
      const failed = results.length - successful

      if (successful > 0) {
        setProducts(prev => prev.filter(product => !productIds.includes(product.id)))
        setTotal(prev => Math.max(0, prev - successful))
        toast.success(`${successful} products deleted successfully!`)
      }

      if (failed > 0) {
        toast.error(`Failed to delete ${failed} products`)
      }

      if (autoRefresh) {
        await refreshProducts()
      }

      return failed === 0
    } catch (error: any) {
      console.error('Error in bulk delete:', error)
      toast.error('Bulk delete operation failed')
      return false
    } finally {
      setDeleting(false)
    }
  }, [autoRefresh, refreshProducts])

  const bulkArchive = useCallback(async (productIds: string[], archived: boolean): Promise<boolean> => {
    setUpdating(true)
    try {
      const promises = productIds.map(id => 
        fetch(`/api/products/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_archived: archived }),
        })
      )
      
      const results = await Promise.allSettled(promises)
      const successful = results.filter(result => result.status === 'fulfilled').length
      const failed = results.length - successful

      if (successful > 0) {
        toast.success(`${successful} products ${archived ? 'archived' : 'unarchived'} successfully!`)
      }

      if (failed > 0) {
        toast.error(`Failed to ${archived ? 'archive' : 'unarchive'} ${failed} products`)
      }

      if (autoRefresh) {
        await refreshProducts()
      }

      return failed === 0
    } catch (error: any) {
      console.error('Error in bulk archive:', error)
      toast.error('Bulk archive operation failed')
      return false
    } finally {
      setUpdating(false)
    }
  }, [autoRefresh, refreshProducts])

  const bulkFeature = useCallback(async (productIds: string[], featured: boolean): Promise<boolean> => {
    setUpdating(true)
    try {
      const promises = productIds.map(id => 
        fetch(`/api/products/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ featured }),
        })
      )
      
      const results = await Promise.allSettled(promises)
      const successful = results.filter(result => result.status === 'fulfilled').length
      const failed = results.length - successful

      if (successful > 0) {
        toast.success(`${successful} products ${featured ? 'featured' : 'unfeatured'} successfully!`)
      }

      if (failed > 0) {
        toast.error(`Failed to ${featured ? 'feature' : 'unfeature'} ${failed} products`)
      }

      if (autoRefresh) {
        await refreshProducts()
      }

      return failed === 0
    } catch (error: any) {
      console.error('Error in bulk feature:', error)
      toast.error('Bulk feature operation failed')
      return false
    } finally {
      setUpdating(false)
    }
  }, [autoRefresh, refreshProducts])

  const setFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFiltersState(updatedFilters)
    setCurrentPage(1) // Reset to first page when filters change
    loadProducts(updatedFilters, sortOptions, 1)
  }, [filters, sortOptions, loadProducts])

  const setSortOptions = useCallback((newSort: ProductSortOptions) => {
    setSortOptionsState(newSort)
    setCurrentPage(1) // Reset to first page when sort changes
    loadProducts(filters, newSort, 1)
  }, [filters, loadProducts])

  const setPage = useCallback((page: number) => {
    setCurrentPage(page)
    loadProducts(filters, sortOptions, page)
  }, [filters, sortOptions, loadProducts])

  return {
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
    
    createProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    
    loadProducts,
    refreshProducts,
    
    setFilters,
    setSortOptions,
    setPage,
    
    bulkDelete,
    bulkArchive,
    bulkFeature,
    
    validateProduct,
    clearValidation,
  }
}
