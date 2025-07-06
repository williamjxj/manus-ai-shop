import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'

import AgeVerification from '@/components/AgeVerification'
import Navbar from '@/components/Navbar'
import { CartProvider } from '@/contexts/CartContext'

import './globals.css'

export const metadata: Metadata = {
  title: 'Adult AI Gallery - Premium AI Generated Adult Content',
  description:
    'Premium marketplace for AI-generated adult content. 18+ only. High-quality images and videos for mature audiences.',
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
          <AgeVerification>
            <Navbar />
            {children}
            <Toaster />
          </AgeVerification>
        </CartProvider>
      </body>
    </html>
  )
}
