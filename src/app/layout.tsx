import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'

import Navbar from '@/components/Navbar'
import { CartProvider } from '@/contexts/CartContext'

import './globals.css'

export const metadata: Metadata = {
  title: 'AI Shop - Purchase AI Generated Images',
  description: 'Shop for AI generated images with points and Stripe payments',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <body className='antialiased' suppressHydrationWarning={true}>
        <CartProvider>
          <Navbar />
          {children}
          <Toaster />
        </CartProvider>
      </body>
    </html>
  )
}
