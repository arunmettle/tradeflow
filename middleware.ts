import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, isTokenExpired } from "@/lib/auth/session";

const PROTECTED_PREFIXES = ["/quotes", "/leads", "/tradie", "/profile"];
const AUTH_PAGES = ["/auth/sign-in", "/auth/sign-up", "/auth/callback"];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isAuthPath(pathname: string) {
  return AUTH_PAGES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/t/") ||
    pathname.startsWith("/q/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  const hasSession = Boolean(token && !isTokenExpired(token));

  if (isProtectedPath(pathname) && !hasSession) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = "/auth/sign-in";
    signInUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthPath(pathname) && hasSession) {
    const quotesUrl = request.nextUrl.clone();
    quotesUrl.pathname = "/quotes";
    quotesUrl.search = "";
    return NextResponse.redirect(quotesUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
