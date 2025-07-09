import { ProductMedia } from '@/lib/product-management'

import MediaCarousel from './MediaCarousel'

interface ProductMediaGalleryProps {
  media: ProductMedia[]
  productName: string
  className?: string
}

export default function ProductMediaGallery({
  media,
  productName,
  className = '',
}: ProductMediaGalleryProps) {
  return (
    <MediaCarousel
      media={media}
      productName={productName}
      className={`${className} w-full`}
    />
  )
}
