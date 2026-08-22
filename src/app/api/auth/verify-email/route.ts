import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { logActivity } from "@/lib/activity-log"
import { consumeEmailVerificationToken } from "@/lib/email-verification"
import { resolveOrigin } from "@/lib/google-oauth"

export async function GET(request: NextRequest) {
  const origin = resolveOrigin(request.headers, request.nextUrl.origin)
  const loginUrl = new URL("/login", origin)
  const token = request.nextUrl.searchParams.get("token")?.trim() ?? ""

  if (!token) {
    loginUrl.searchParams.set("verified", "invalid")
    return NextResponse.redirect(loginUrl)
  }

  const result = await consumeEmailVerificationToken(token)

  if (!result.ok) {
    loginUrl.searchParams.set("verified", result.reason)
    return NextResponse.redirect(loginUrl)
  }

  const user = await prisma.user.findUnique({
    where: { id: result.userId },
    select: { id: true, status: true },
  })

  if (!user) {
    loginUrl.searchParams.set("verified", "invalid")
    return NextResponse.redirect(loginUrl)
  }

  if (user.status !== "ACTIVE") {
    await prisma.user.update({
      where: { id: user.id },
      data: { status: "ACTIVE", updatedAt: new Date() },
    })
  }

  await logActivity({
    userId: user.id,
    action: "Verified email",
    details: result.email,
  })

  loginUrl.searchParams.set("verified", "success")
  return NextResponse.redirect(loginUrl)
}
