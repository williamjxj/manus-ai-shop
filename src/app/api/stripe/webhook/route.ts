// Redirect to the correct webhook endpoint
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.warn('🔄 STRIPE WEBHOOK REDIRECT - Old URL called, redirecting to new URL')
  
  // Get the request body and headers
  const body = await request.text()
  const headers = Object.fromEntries(request.headers.entries())
  
  // Forward to the correct endpoint
  const correctUrl = new URL('/api/webhooks/stripe', request.url)
  
  try {
    const response = await fetch(correctUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': headers['stripe-signature'] || '',
      },
      body: body,
    })
    
    const result = await response.text()
    
    console.warn('🔄 WEBHOOK FORWARDED:', {
      status: response.status,
      result: result.substring(0, 200),
    })
    
    return new NextResponse(result, {
      status: response.status,
      headers: response.headers,
    })
  } catch (error) {
    console.error('❌ WEBHOOK FORWARD FAILED:', error)
    return NextResponse.json(
      { error: 'Webhook forwarding failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'This is the old webhook URL. Please update Stripe to use /api/webhooks/stripe',
    correctUrl: '/api/webhooks/stripe',
  })
}
