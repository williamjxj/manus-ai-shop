import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfile } from "@/lib/profile-utils";
import {
  logError,
  logSuccess,
  validatePointsPackage,
  createErrorResponse,
  pointsPurchaseRateLimiter,
} from "@/lib/error-handling";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

// Points packages configuration
const POINTS_PACKAGES = {
  basic: { points: 100, bonus: 0, price: 999 },
  premium: { points: 500, bonus: 50, price: 3999 },
  pro: { points: 1000, bonus: 200, price: 6999 },
} as const;

export async function POST(request: NextRequest) {
  try {
    const { packageId, points, price } = await request.json();

    // Enhanced input validation using centralized validation
    const validation = validatePointsPackage({ packageId, points, price });
    if (!validation.valid) {
      logError("POINTS_CHECKOUT", new Error("Invalid points package data"), {
        packageId,
        points,
        price,
        errors: validation.errors,
      });
      const errorResponse = createErrorResponse("INVALID_POINTS_PACKAGE", {
        errors: validation.errors,
      });
      return NextResponse.json(errorResponse.error, {
        status: errorResponse.statusCode,
      });
    }

    // Validate package exists and data matches
    const validPackage =
      POINTS_PACKAGES[packageId as keyof typeof POINTS_PACKAGES];
    if (!validPackage) {
      return NextResponse.json(
        { error: "Invalid package ID" },
        { status: 400 }
      );
    }

    const expectedPoints = validPackage.points + validPackage.bonus;
    if (points !== expectedPoints || price !== validPackage.price) {
      return NextResponse.json(
        { error: "Package data mismatch" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const errorResponse = createErrorResponse("UNAUTHORIZED");
      return NextResponse.json(errorResponse.error, {
        status: errorResponse.statusCode,
      });
    }

    // Rate limiting check
    if (!pointsPurchaseRateLimiter.isAllowed(user.id)) {
      logError("POINTS_CHECKOUT", new Error("Rate limit exceeded"), {
        userId: user.id,
      });
      return NextResponse.json(
        { error: "Too many points purchase attempts. Please try again later." },
        { status: 429 }
      );
    }

    // Ensure user profile exists
    const profile = await getOrCreateProfile(user.id, user.email || undefined);
    if (!profile) {
      logError("POINTS_CHECKOUT", new Error("Failed to access user profile"), {
        userId: user.id,
      });
      const errorResponse = createErrorResponse("PROFILE_ERROR");
      return NextResponse.json(errorResponse.error, {
        status: errorResponse.statusCode,
      });
    }

    // Create enhanced Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${points} Points Package`,
              description: `Purchase ${validPackage.points} points${
                validPackage.bonus > 0
                  ? ` + ${validPackage.bonus} bonus points`
                  : ""
              } for AI Shop`,
              images: [
                `${process.env.NEXT_PUBLIC_APP_URL}/images/points-package.png`,
              ],
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/points?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/points?canceled=true`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        points: points.toString(),
        package_id: packageId,
        base_points: validPackage.points.toString(),
        bonus_points: validPackage.bonus.toString(),
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
    });

    // Log the points purchase attempt
    logSuccess("POINTS_CHECKOUT", "Points purchase session created", {
      userId: user.id,
      packageId,
      points,
      price: price / 100,
      sessionId: session.id,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      expiresAt: session.expires_at,
    });
  } catch (error: unknown) {
    logError(
      "POINTS_CHECKOUT",
      error instanceof Error ? error : new Error(String(error))
    );

    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes("stripe")) {
        const errorResponse = createErrorResponse("STRIPE_ERROR");
        return NextResponse.json(errorResponse.error, {
          status: errorResponse.statusCode,
        });
      }
    }

    const errorResponse = createErrorResponse("INTERNAL_ERROR");
    return NextResponse.json(errorResponse.error, {
      status: errorResponse.statusCode,
    });
  }
}
