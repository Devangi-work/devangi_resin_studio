import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db";
import { signCustomerSession, setCustomerSessionCookie } from "@/lib/auth/customer";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  let redirectTarget = "/account";
  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
      if (decoded.redirect && decoded.redirect.startsWith("/") && !decoded.redirect.startsWith("//")) {
        redirectTarget = decoded.redirect;
      }
    } catch {
      // ignore state parse errors
    }
  }

  if (error || !code) {
    const errorMsg = error || "Authorization was cancelled or failed.";
    return NextResponse.redirect(
      new URL(`/account/login?error=${encodeURIComponent(errorMsg)}`, origin)
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL(`/account/login?error=${encodeURIComponent("Google OAuth not configured on server")}`, origin)
    );
  }

  try {
    const redirectUri = `${origin}/api/auth/google/callback`;

    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("[Google OAuth] Token exchange failed:", errBody);
      return NextResponse.redirect(
        new URL(`/account/login?error=${encodeURIComponent("Failed to exchange code with Google")}`, origin)
      );
    }

    const tokens = await tokenRes.json();

    // 2. Fetch user profile from Google UserInfo endpoint
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileRes.ok) {
      return NextResponse.redirect(
        new URL(`/account/login?error=${encodeURIComponent("Failed to fetch Google profile")}`, origin)
      );
    }

    const profile = await profileRes.json();

    if (!profile.email) {
      return NextResponse.redirect(
        new URL(`/account/login?error=${encodeURIComponent("Google account did not provide an email address")}`, origin)
      );
    }

    // 3. Find or create customer in database
    const customer = await dbStore.findOrCreateGoogleCustomer({
      googleId: profile.sub,
      name: profile.name || profile.given_name || profile.email.split("@")[0],
      email: profile.email,
      avatarUrl: profile.picture,
    });

    // 4. Create and set customer session
    const sessionToken = await signCustomerSession({
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
    });

    await setCustomerSessionCookie(sessionToken);

    // 5. Redirect user to destination (e.g. /checkout or /account)
    return NextResponse.redirect(new URL(redirectTarget, origin));
  } catch (err: any) {
    console.error("[Google OAuth Callback Error]:", err);
    return NextResponse.redirect(
      new URL(`/account/login?error=${encodeURIComponent("An unexpected error occurred during Google sign-in.")}`, origin)
    );
  }
}
