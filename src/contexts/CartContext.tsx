'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import { createClient } from '@/lib/supabase/client'

interface CartItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    description: string
    image_url: string
    price_cents: number
    points_price: number
    category: string
  }
}

interface CartContextType {
  cartItems: CartItem[]
  cartCount: number
  loading: boolean
  refreshCart: () => Promise<void>
  addToCart: (_productId: string) => Promise<void>
  updateQuantity: (_itemId: string, _quantity: number) => Promise<void>
  removeFromCart: (_itemId: string) => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchCartItems = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setCartItems([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('cart_items')
        .select(
          `
          id,
          quantity,
          product:products (
            id,
            name,
            description,
            image_url,
            price_cents,
            points_price,
            category
          )
        `
        )
        .eq('user_id', user.id)

      if (error) throw error
      setCartItems((data as unknown as CartItem[]) || [])
    } catch (error) {
      console.error('Error fetching cart items:', error)
      setCartItems([])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const addToCart = async (productId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Please login to add items to cart')
      }

      const { error } = await supabase.from('cart_items').upsert(
        {
          user_id: user.id,
          product_id: productId,
          quantity: 1,
        },
        {
          onConflict: 'user_id,product_id',
        }
      )

      if (error) throw error

      // Refresh cart items after adding
      await fetchCartItems()
    } catch (error) {
      console.error('Error adding to cart:', error)
      throw error
    }
  }

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId)

      if (error) throw error

      setCartItems((items) =>
        items.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      )
    } catch (error) {
      console.error('Error updating quantity:', error)
      throw error
    }
  }

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      setCartItems((items) => items.filter((item) => item.id !== itemId))
    } catch (error) {
      console.error('Error removing from cart:', error)
      throw error
    }
  }

  const refreshCart = async () => {
    await fetchCartItems()
  }

  useEffect(() => {
    fetchCartItems()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchCartItems()
      } else {
        setCartItems([])
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth, fetchCartItems])

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)

  const value: CartContextType = {
    cartItems,
    cartCount,
    loading,
    refreshCart,
    addToCart,
    updateQuantity,
    removeFromCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
