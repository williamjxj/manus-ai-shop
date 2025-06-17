import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/products";

  // If there's an error in the URL params, log it and redirect to error page
  if (error) {
    console.error("Auth callback error:", {
      error,
      error_description,
      searchParams: Object.fromEntries(searchParams.entries()),
    });

    const isLocalEnv = process.env.NODE_ENV === "development";
    const baseUrl = isLocalEnv
      ? origin
      : process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
        process.env.AUTH_URL ||
        origin;

    return NextResponse.redirect(
      `${baseUrl}/auth/auth-code-error?error=${error}&description=${encodeURIComponent(
        error_description || ""
      )}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code
    );
    if (!exchangeError) {
      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";

      // Use environment variable for production base URL
      const baseUrl = isLocalEnv
        ? origin
        : process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
          process.env.AUTH_URL ||
          `https://${forwardedHost}` ||
          origin;

      return NextResponse.redirect(`${baseUrl}${next}`);
    } else {
      console.error("Error exchanging code for session:", exchangeError);

      const isLocalEnv = process.env.NODE_ENV === "development";
      const baseUrl = isLocalEnv
        ? origin
        : process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
          process.env.AUTH_URL ||
          origin;

      return NextResponse.redirect(
        `${baseUrl}/auth/auth-code-error?error=exchange_error&description=${encodeURIComponent(
          exchangeError.message
        )}`
      );
    }
  }

  // return the user to an error page with instructions
  const isLocalEnv = process.env.NODE_ENV === "development";
  const baseUrl = isLocalEnv
    ? origin
    : process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      process.env.AUTH_URL ||
      origin;

  return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`);
}
