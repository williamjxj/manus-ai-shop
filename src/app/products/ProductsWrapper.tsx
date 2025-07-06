'use client'

import { Suspense } from 'react'

import ProductsLoading from '@/components/ProductsLoading'

import ProductsContent from './ProductsContent'

export default function ProductsWrapper() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsContent />
    </Suspense>
  )
}
