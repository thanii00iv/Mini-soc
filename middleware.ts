import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Minimal guard: if no Supabase auth cookies, redirect to /login for app pages
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Always allow API routes, Next internals, and auth pages
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/account/signin") ||
    pathname.startsWith("/account/signup") ||
    pathname.startsWith("/account/logout") ||
    pathname.startsWith("/auth/callback")
  ) {
    return NextResponse.next();
  }
  const hasAccess =
  req.cookies.has("sb-access-token") ||
  req.cookies.has("sb-refresh-token");

if (!hasAccess) {
  const url = req.nextUrl.clone();
  url.pathname = "/account/signin";
  url.searchParams.set("redirect", pathname);
  return NextResponse.redirect(url);
}

  return NextResponse.next();
}
export const config = {
  matcher: [
    // Run middleware on all routes except API, _next/static, _next/image, and files with extensions
    "/((?!api|_next/static|_next/image|.*\\..*).*)",
  ],
};


