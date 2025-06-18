import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Debug endpoint to check webhook configuration and status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check environment variables (without exposing secrets)
    const envCheck = {
      hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7) + "...",
      webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 8) + "..."
    };

    // Check database connectivity
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('count(*)')
      .limit(1);

    // Check recent webhook events
    const { data: webhookEvents, error: webhookError } = await supabase
      .from('webhook_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Check recent points transactions
    const { data: transactions, error: transError } = await supabase
      .from('points_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    // Check if database functions exist
    const { data: functions, error: funcError } = await supabase
      .rpc('pg_get_functiondef', { funcoid: 'process_points_purchase'::regproc })
      .single();

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: {
        connected: !profileError,
        profileError,
        webhookEventsCount: webhookEvents?.length || 0,
        transactionsCount: transactions?.length || 0,
        recentWebhookEvents: webhookEvents,
        recentTransactions: transactions,
        functionsExist: !funcError
      },
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/stripe`,
      testEndpoints: {
        webhookTest: `${process.env.NEXT_PUBLIC_APP_URL}/api/test/webhook`,
        pointsTest: `${process.env.NEXT_PUBLIC_APP_URL}/api/test/points-purchase`,
        statusCheck: `${process.env.NEXT_PUBLIC_APP_URL}/api/debug/webhook-status`
      }
    });

  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { 
        error: "Debug check failed", 
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST endpoint to manually trigger webhook processing for a specific session
export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, points, packageId } = await request.json();

    if (!sessionId || !userId || !points || !packageId) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId, userId, points, packageId" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    console.log("=== MANUAL WEBHOOK PROCESSING ===");
    console.log("Session ID:", sessionId);
    console.log("User ID:", userId);
    console.log("Points:", points);
    console.log("Package ID:", packageId);

    // Simulate webhook processing
    const { data: result, error } = await supabase.rpc('process_points_purchase', {
      p_user_id: userId,
      p_points: points,
      p_package_id: packageId,
      p_payment_intent_id: `manual-${sessionId}`,
      p_session_id: sessionId,
      p_webhook_event_id: `manual-${Date.now()}`
    });

    if (error) {
      console.error("Manual processing failed:", error);
      return NextResponse.json(
        { error: "Manual processing failed", details: error },
        { status: 500 }
      );
    }

    // Check updated profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single();

    // Record manual processing
    await supabase
      .from('webhook_events')
      .insert({
        stripe_event_id: `manual-${sessionId}`,
        event_type: 'manual.points.purchase',
        status: 'success',
        processed_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      message: "Manual webhook processing completed",
      result,
      newPointsBalance: profile?.points,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Manual processing error:", error);
    return NextResponse.json(
      { 
        error: "Manual processing failed", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
