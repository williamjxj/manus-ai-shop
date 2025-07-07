import { NextRequest, NextResponse } from 'next/server'

// Simple webhook test endpoint to debug configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    console.warn('🔍 Webhook Test Debug:', {
      timestamp: new Date().toISOString(),
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      webhookSecretLength: process.env.STRIPE_WEBHOOK_SECRET?.length || 0,
      webhookSecretPrefix:
        process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) || 'MISSING',
      hasSignature: !!sig,
      signaturePrefix: sig?.substring(0, 20) || 'MISSING',
      bodyLength: body.length,
      bodyPreview: body.substring(0, 100),
      headers: Object.fromEntries(request.headers.entries()),
    })

    return NextResponse.json({
      status: 'webhook test received',
      hasSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      hasSignature: !!sig,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Webhook test error:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Webhook test endpoint',
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    secretLength: process.env.STRIPE_WEBHOOK_SECRET?.length || 0,
    timestamp: new Date().toISOString(),
  })
}
