import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfile, updateUserPoints } from "@/lib/profile-utils";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

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
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.metadata?.points) {
          // Handle points purchase
          const userId = session.metadata.user_id;
          const points = parseInt(session.metadata.points);

          // Add points to user profile
          const profile = await getOrCreateProfile(userId);
          if (!profile) {
            console.error("Failed to get or create profile for user:", userId);
            return NextResponse.json(
              { error: "Profile error" },
              { status: 500 }
            );
          }

          const success = await updateUserPoints(userId, points);
          if (!success) {
            console.error("Failed to update points for user:", userId);
            return NextResponse.json(
              { error: "Points update error" },
              { status: 500 }
            );
          }

          // Record points transaction
          await supabase.from("points_transactions").insert({
            user_id: userId,
            amount: points,
            type: "purchase",
            description: `Purchased ${points} points`,
            stripe_payment_intent_id: session.payment_intent as string,
          });
        } else if (session.metadata?.cart_items) {
          // Handle product purchase
          const userId = session.metadata.user_id;
          const cartItems = JSON.parse(session.metadata.cart_items);

          const totalCents = cartItems.reduce(
            (
              total: number,
              item: {
                product_id: string;
                quantity: number;
                price_cents: number;
                points_price: number;
              }
            ) => total + item.price_cents * item.quantity,
            0
          );

          // Create order
          const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
              user_id: userId,
              total_cents: totalCents,
              total_points: 0,
              payment_method: "stripe",
              stripe_payment_intent_id: session.payment_intent as string,
              status: "completed",
            })
            .select()
            .single();

          if (orderError) throw orderError;

          // Create order items
          const orderItems = cartItems.map(
            (item: {
              product_id: string;
              quantity: number;
              price_cents: number;
              points_price: number;
            }) => ({
              order_id: order.id,
              product_id: item.product_id,
              quantity: item.quantity,
              price_cents: item.price_cents,
              points_price: item.points_price,
            })
          );

          await supabase.from("order_items").insert(orderItems);

          // Clear cart
          await supabase.from("cart_items").delete().eq("user_id", userId);
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
