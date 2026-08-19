import { randomBytes, randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import {
  GOOGLE_STATE_COOKIE,
  exchangeCodeForProfile,
  resolveOrigin,
  resolveRedirectUri,
} from "@/lib/google-oauth"
import { getDashboardPath } from "@/lib/user-role"
import { isRemoteProfileImage, saveRemoteProfileImage } from "@/lib/profile-image"

const SESSION_MAX_AGE = 60 * 60 * 24 * 7

function loginRedirect(request: NextRequest, error: string) {
  const loginUrl = new URL("/login", resolveOrigin(request.headers, request.nextUrl.origin))
  loginUrl.searchParams.set("error", error)

  const response = NextResponse.redirect(loginUrl)
  response.cookies.set({ name: GOOGLE_STATE_COOKIE, value: "", path: "/", maxAge: 0 })

  return response
}

export async function GET(request: NextRequest) {
  const origin = resolveOrigin(request.headers, request.nextUrl.origin)
  const code = request.nextUrl.searchParams.get("code")
  const state = request.nextUrl.searchParams.get("state")
  const expectedState = request.cookies.get(GOOGLE_STATE_COOKIE)?.value

  if (request.nextUrl.searchParams.get("error")) {
    return loginRedirect(request, "google_denied")
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return loginRedirect(request, "google_state_mismatch")
  }

  try {
    const profile = await exchangeCodeForProfile({
      code,
      redirectUri: resolveRedirectUri(origin),
    })

    if (!profile.email || !profile.emailVerified) {
      return loginRedirect(request, "google_unverified_email")
    }

    const existing = await prisma.user.findUnique({
      where: { email: profile.email },
      select: { id: true, name: true, role: true, status: true, profile_image: true },
    })

    if (existing && existing.status !== "ACTIVE") {
      return loginRedirect(request, "account_inactive")
    }

    let userId = existing?.id
    let role: string = existing?.role ?? "PATIENT"

    if (!userId) {
      userId = randomUUID()
      role = "PATIENT"
    }

    const storedPhoto = profile.picture
      ? (await saveRemoteProfileImage(userId, profile.picture).catch(() => "")) || profile.picture
      : ""

    if (!profile.picture) {
      console.warn("Google profile did not include a photo for", profile.email)
    } else if (storedPhoto.startsWith("http")) {
      console.warn("Google photo URL was stored because the image download failed for", profile.email)
    }

    if (existing) {
      // Only fill gaps so clinic-managed names and uploaded photos are never overwritten.
      const backfill = {
        ...(existing.name.trim() ? {} : { name: profile.name || profile.email }),
        ...(isRemoteProfileImage(existing.profile_image) && storedPhoto ? { profile_image: storedPhoto } : {}),
      }

      if (Object.keys(backfill).length) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { ...backfill, updatedAt: new Date() },
        })
      }
    } else {
      await prisma.user.create({
        data: {
          id: userId,
          email: profile.email,
          name: profile.name || profile.email,
          role: "PATIENT",
          status: "ACTIVE",
          designations: null,
          // Google-only accounts get an unusable password so email sign-in stays closed.
          password: randomBytes(32).toString("hex"),
          profile_image: storedPhoto,
          updatedAt: new Date(),
        },
      })
    }

    const response = NextResponse.redirect(new URL(getDashboardPath(role), origin))
    response.cookies.set({
      name: "user_id",
      value: String(userId ?? ""),
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
    })
    response.cookies.set({ name: GOOGLE_STATE_COOKIE, value: "", path: "/", maxAge: 0 })

    return response
  } catch (error) {
    console.error("Google sign-in failed:", error)
    const message = error instanceof Error ? error.message : ""
    if (message === "invalid_client_secret") {
      return loginRedirect(request, "google_invalid_secret")
    }
    if (message === "redirect_uri_mismatch") {
      return loginRedirect(request, "google_redirect_mismatch")
    }
    return loginRedirect(request, "google_failed")
  }
}
