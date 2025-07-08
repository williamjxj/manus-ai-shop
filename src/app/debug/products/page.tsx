'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        // Get all products
        const { data: products, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setProducts(products || [])
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug: Products Database</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Current User:</h2>
        {user ? (
          <div>
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>
        ) : (
          <p>Not logged in</p>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">All Products ({products.length}):</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Owner</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Created</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 font-mono text-xs">
                    {product.id}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {product.name}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      product.moderation_status === 'approved' 
                        ? 'bg-green-100 text-green-800'
                        : product.moderation_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.moderation_status}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 font-mono text-xs">
                    {product.user_id}
                    {user && product.user_id === user.id && (
                      <span className="ml-2 text-green-600 font-semibold">(YOU)</span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-xs">
                    {new Date(product.created_at).toLocaleString()}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <a 
                      href={`/products/${product.id}`}
                      className="text-blue-600 hover:underline text-sm"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Details
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <p className="text-sm">• Products with status 'approved' should be visible to everyone</p>
        <p className="text-sm">• Products with other statuses should only be visible to their owners</p>
        <p className="text-sm">• Click "View Details" to test if the product page loads correctly</p>
      </div>
    </div>
  )
}
