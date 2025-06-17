import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/profile-utils";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(request: NextRequest) {
  try {
    const { packageId, points, price } = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${points} Points Package`,
              description: `Purchase ${points} points for AI Shop`,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/points?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/points?canceled=true`,
      metadata: {
        user_id: user.id,
        points: points.toString(),
        package_id: packageId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
