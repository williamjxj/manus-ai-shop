import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/profile-utils";
import {
  logError,
  logSuccess,
  logWarning,
  createErrorResponse,
  ERROR_CODES,
} from "@/lib/error-handling";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

// Enhanced logging utility using centralized error handling
const logWebhookEvent = (
  level: "info" | "error" | "warn",
  message: string,
  data?: any
) => {
  switch (level) {
    case "error":
      logError("WEBHOOK", new Error(message), data);
      break;
    case "warn":
      logWarning("WEBHOOK", message, data);
      break;
    case "info":
      logSuccess("WEBHOOK", message, data);
      break;
  }
};

// Idempotency check to prevent duplicate processing
const checkIdempotency = async (
  supabase: any,
  eventId: string,
  eventType: string
) => {
  const { data: existingEvent } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("stripe_event_id", eventId)
    .eq("event_type", eventType)
    .maybeSingle();

  return !!existingEvent;
};

// Record webhook event for idempotency
const recordWebhookEvent = async (
  supabase: any,
  eventId: string,
  eventType: string,
  status: string
) => {
  await supabase.from("webhook_events").insert({
    stripe_event_id: eventId,
    event_type: eventType,
    status,
    processed_at: new Date().toISOString(),
  });
};

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    logWebhookEvent("error", "Webhook signature verification failed", {
      error: err,
    });
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  try {
    // Check for duplicate processing
    const isDuplicate = await checkIdempotency(supabase, event.id, event.type);
    if (isDuplicate) {
      logWebhookEvent("info", "Duplicate webhook event ignored", {
        eventId: event.id,
      });
      return NextResponse.json({ received: true, duplicate: true });
    }

    logWebhookEvent("info", "Processing webhook event", {
      eventId: event.id,
      eventType: event.type,
    });

    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.metadata?.points) {
          // Handle points purchase with enhanced error handling and validation
          await handlePointsPurchase(supabase, session, event.id);
        } else if (session.metadata?.cart_items) {
          // Handle product purchase with enhanced error handling and validation
          await handleProductPurchase(supabase, session, event.id);
        } else {
          logWebhookEvent("warn", "Unknown session type", {
            sessionId: session.id,
          });
        }
        break;

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailure(supabase, failedPayment, event.id);
        break;

      default:
        logWebhookEvent("info", `Unhandled event type: ${event.type}`, {
          eventId: event.id,
        });
    }

    // Record successful processing
    await recordWebhookEvent(supabase, event.id, event.type, "success");

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    logWebhookEvent("error", "Error processing webhook", {
      error: error,
      eventId: event.id,
      eventType: event.type,
    });

    // Record failed processing
    try {
      await recordWebhookEvent(supabase, event.id, event.type, "failed");
    } catch (recordError) {
      logWebhookEvent("error", "Failed to record webhook event", {
        error: recordError,
      });
    }

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Enhanced points purchase handler with database transactions
async function handlePointsPurchase(
  supabase: any,
  session: Stripe.Checkout.Session,
  eventId: string
) {
  const userId = session.metadata!.user_id;
  const points = parseInt(session.metadata!.points);
  const packageId = session.metadata!.package_id;
  const paymentIntentId = session.payment_intent as string;

  logWebhookEvent("info", "Processing points purchase", {
    userId,
    points,
    packageId,
    sessionId: session.id,
  });

  // Validate input data
  if (!userId || !points || points <= 0) {
    throw new Error(
      `Invalid points purchase data: userId=${userId}, points=${points}`
    );
  }

  // Use database transaction for atomicity
  const { error: transactionError } = await supabase.rpc(
    "process_points_purchase",
    {
      p_user_id: userId,
      p_points: points,
      p_package_id: packageId,
      p_payment_intent_id: paymentIntentId,
      p_session_id: session.id,
      p_webhook_event_id: eventId,
    }
  );

  if (transactionError) {
    logWebhookEvent("error", "Points purchase transaction failed", {
      error: transactionError,
      userId,
      points,
    });
    throw transactionError;
  }

  logWebhookEvent("info", "Points purchase completed successfully", {
    userId,
    points,
    sessionId: session.id,
  });
}
// Enhanced product purchase handler with database transactions
async function handleProductPurchase(
  supabase: any,
  session: Stripe.Checkout.Session,
  eventId: string
) {
  const userId = session.metadata!.user_id;
  const cartItems = JSON.parse(session.metadata!.cart_items);
  const paymentIntentId = session.payment_intent as string;

  logWebhookEvent("info", "Processing product purchase", {
    userId,
    itemCount: cartItems.length,
    sessionId: session.id,
  });

  // Validate cart items
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error("Invalid cart items data");
  }

  const totalCents = cartItems.reduce(
    (total: number, item: any) => total + item.price_cents * item.quantity,
    0
  );

  // Use database transaction for atomicity
  const { error: transactionError } = await supabase.rpc(
    "process_product_purchase",
    {
      p_user_id: userId,
      p_cart_items: JSON.stringify(cartItems),
      p_total_cents: totalCents,
      p_payment_intent_id: paymentIntentId,
      p_session_id: session.id,
      p_webhook_event_id: eventId,
    }
  );

  if (transactionError) {
    logWebhookEvent("error", "Product purchase transaction failed", {
      error: transactionError,
      userId,
      totalCents,
    });
    throw transactionError;
  }

  logWebhookEvent("info", "Product purchase completed successfully", {
    userId,
    totalCents,
    sessionId: session.id,
  });
}

// Handle payment failures
async function handlePaymentFailure(
  supabase: any,
  paymentIntent: Stripe.PaymentIntent,
  eventId: string
) {
  logWebhookEvent("warn", "Payment failed", {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
  });

  // Update any pending orders to failed status
  const { error } = await supabase
    .from("orders")
    .update({
      status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_payment_intent_id", paymentIntent.id)
    .eq("status", "pending");

  if (error) {
    logWebhookEvent("error", "Failed to update order status", { error });
  }

  // Record the webhook event
  await recordWebhookEvent(
    supabase,
    eventId,
    "payment_intent.payment_failed",
    "success"
  );
}
