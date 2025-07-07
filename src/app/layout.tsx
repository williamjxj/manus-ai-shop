import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'

import AgeVerification from '@/components/AgeVerification'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import { CartProvider } from '@/contexts/CartContext'

import './globals.css'

// Configure Inter font for professional e-commerce appearance
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title:
    'Adult Products Gallery - Premium Adult Products & Content Marketplace',
  description:
    'Comprehensive adult products marketplace featuring toys, lingerie, wellness products, and premium digital content. 18+ only. Discrete shipping and billing available.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' className={inter.variable}>
      <body
        className={`${inter.className} antialiased`}
        suppressHydrationWarning={true}
      >
        <CartProvider>
          <AgeVerification>
            <Navbar />
            {children}
            <Footer />
            <Toaster />
          </AgeVerification>
        </CartProvider>
      </body>
    </html>
  )
}
