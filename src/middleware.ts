import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const DEFAULT_SECRET = "resin-art-super-secure-admin-jwt-session-secret-key-32chars";
const SECRET_KEY = new TextEncoder().encode(process.env.ADMIN_SESSION_SECRET || DEFAULT_SECRET);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin paths
  if (pathname.startsWith("/admin")) {
    // Exclude /admin/login and /admin/setup
    if (pathname === "/admin/login" || pathname === "/admin/setup") {
      return NextResponse.next();
    }

    const token = request.cookies.get("resin_admin_token")?.value;

    if (!token) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      await jwtVerify(token, SECRET_KEY);
      return NextResponse.next();
    } catch {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
