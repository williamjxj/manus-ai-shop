import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfile, updateUserPoints } from "@/lib/profile-utils";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

interface CartItem {
  product: {
    id: string;
    name: string;
    description: string;
    image_url: string;
    price_cents: number;
    points_price: number;
  };
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const {
      cartItems,
      paymentMethod,
    }: {
      cartItems: CartItem[];
      paymentMethod: string;
    } = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (paymentMethod === "points") {
      // Handle points payment
      const totalPoints = cartItems.reduce(
        (total: number, item: CartItem) =>
          total + item.product.points_price * item.quantity,
        0
      );

      // Check user's points balance
      const profile = await getOrCreateProfile(
        user.id,
        user.email || undefined
      );

      if (!profile) {
        return NextResponse.json(
          { error: "Error accessing profile" },
          { status: 500 }
        );
      }

      if (profile.points < totalPoints) {
        return NextResponse.json(
          { error: "Insufficient points" },
          { status: 400 }
        );
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_cents: 0,
          total_points: totalPoints,
          payment_method: "points",
          status: "completed",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map((item: CartItem) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price_cents: item.product.price_cents,
        points_price: item.product.points_price,
      }));

      await supabase.from("order_items").insert(orderItems);

      // Deduct points
      const success = await updateUserPoints(user.id, -totalPoints);
      if (!success) {
        return NextResponse.json(
          { error: "Error updating points" },
          { status: 500 }
        );
      }

      // Record points transaction
      await supabase.from("points_transactions").insert({
        user_id: user.id,
        amount: -totalPoints,
        type: "spend",
        description: `Purchase order #${order.id}`,
        order_id: order.id,
      });

      // Clear cart
      await supabase.from("cart_items").delete().eq("user_id", user.id);

      return NextResponse.json({ success: true, orderId: order.id });
    } else {
      // Handle Stripe payment
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: cartItems.map((item: CartItem) => ({
          price_data: {
            currency: "usd",
            product_data: {
              name: item.product.name,
              description: item.product.description,
              images: [
                item.product.image_url.startsWith("http")
                  ? item.product.image_url
                  : `${process.env.NEXT_PUBLIC_APP_URL}${item.product.image_url}`,
              ],
            },
            unit_amount: item.product.price_cents,
          },
          quantity: item.quantity,
        })),
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
        metadata: {
          user_id: user.id,
          cart_items: JSON.stringify(
            cartItems.map((item: CartItem) => ({
              product_id: item.product.id,
              quantity: item.quantity,
              price_cents: item.product.price_cents,
              points_price: item.product.points_price,
            }))
          ),
        },
      });

      return NextResponse.json({ url: session.url });
    }
  } catch (error: unknown) {
    console.error("Error processing checkout:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
