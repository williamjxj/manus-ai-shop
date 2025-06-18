import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Test endpoint to manually trigger points purchase processing
// This helps debug webhook issues by simulating the webhook call
export async function POST(request: NextRequest) {
  try {
    const { userId, points, packageId, sessionId } = await request.json();

    if (!userId || !points || !packageId) {
      return NextResponse.json(
        { error: "Missing required fields: userId, points, packageId" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    console.log("Testing points purchase with data:", {
      userId,
      points,
      packageId,
      sessionId: sessionId || "test-session"
    });

    // Test the database function directly
    const { data: result, error } = await supabase.rpc('process_points_purchase', {
      p_user_id: userId,
      p_points: points,
      p_package_id: packageId,
      p_payment_intent_id: sessionId || "test-payment-intent",
      p_session_id: sessionId || "test-session",
      p_webhook_event_id: "test-webhook-event"
    });

    if (error) {
      console.error("Database function error:", error);
      return NextResponse.json(
        { error: "Database function failed", details: error },
        { status: 500 }
      );
    }

    console.log("Database function result:", result);

    // Check the updated profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
    }

    // Check recent transactions
    const { data: transactions, error: transError } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (transError) {
      console.error("Transactions fetch error:", transError);
    }

    return NextResponse.json({
      success: true,
      result,
      profile,
      transactions,
      message: "Points purchase test completed"
    });

  } catch (error) {
    console.error("Test endpoint error:", error);
    return NextResponse.json(
      { error: "Test failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint to check current user status
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Get transactions
    const { data: transactions, error: transError } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Get orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Get webhook events
    const { data: webhookEvents, error: webhookError } = await supabase
      .from('webhook_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      profile: profileError ? null : profile,
      transactions: transError ? [] : transactions,
      orders: ordersError ? [] : orders,
      webhookEvents: webhookError ? [] : webhookEvents,
      errors: {
        profile: profileError,
        transactions: transError,
        orders: ordersError,
        webhooks: webhookError
      }
    });

  } catch (error) {
    console.error("GET test endpoint error:", error);
    return NextResponse.json(
      { error: "Test failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
