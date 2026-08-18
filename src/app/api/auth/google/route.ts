import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import {
  GOOGLE_STATE_COOKIE,
  buildGoogleAuthUrl,
  isAllowedOAuthOrigin,
  isGoogleOAuthConfigured,
  loopbackEquivalent,
  resolveOrigin,
  resolveRedirectUri,
} from "@/lib/google-oauth"

export async function GET(request: NextRequest) {
  const origin = resolveOrigin(request.headers, request.nextUrl.origin)
  const loginUrl = new URL("/login", origin)

  if (!isGoogleOAuthConfigured()) {
    loginUrl.searchParams.set("error", "google_not_configured")
    return NextResponse.redirect(loginUrl)
  }

  // Restart on a host Google accepts so the state cookie and redirect URI agree.
  const loopback = loopbackEquivalent(origin)
  if (loopback) {
    return NextResponse.redirect(new URL(request.nextUrl.pathname, loopback))
  }

  if (!isAllowedOAuthOrigin(origin)) {
    loginUrl.searchParams.set("error", "google_bad_origin")
    return NextResponse.redirect(loginUrl)
  }

  const state = randomUUID()
  const authUrl = buildGoogleAuthUrl({
    redirectUri: resolveRedirectUri(origin),
    state,
  })

  const response = NextResponse.redirect(authUrl)
  response.cookies.set({
    name: GOOGLE_STATE_COOKIE,
    value: state,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 10,
  })

  return response
}
