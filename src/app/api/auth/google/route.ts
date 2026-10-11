import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google OAuth is not configured on the server." }, { status: 500 });
  }

  const { searchParams, origin } = new URL(request.url);
  const redirectTarget = searchParams.get("redirect") || "/account";

  // Base URL for callback
  // Use origin or configured public app url
  const redirectUri = `${origin}/api/auth/google/callback`;

  // Encode redirect target and anti-csrf token in state
  const stateData = {
    redirect: redirectTarget,
    ts: Date.now(),
  };
  const state = Buffer.from(JSON.stringify(stateData)).toString("base64url");

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("state", state);
  googleAuthUrl.searchParams.set("prompt", "select_account");
  googleAuthUrl.searchParams.set("access_type", "online");

  return NextResponse.redirect(googleAuthUrl.toString());
}
