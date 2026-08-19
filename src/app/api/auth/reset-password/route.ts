import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { consumePasswordResetCode } from "@/lib/password-reset"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body.email ?? "").trim().toLowerCase()
    const code = String(body.code ?? "").replace(/\s/g, "")
    const password = String(body.password ?? "")
    const confirmPassword = String(body.confirmPassword ?? "")

    if (!email || !code) {
      return NextResponse.json({ success: false, error: "Please enter the email and the 6-digit code." }, { status: 400 })
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ success: false, error: "The verification code must be 6 digits." }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters long." }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, error: "Passwords do not match." }, { status: 400 })
    }

    const consumed = await consumePasswordResetCode(email, code)

    if (!consumed.ok) {
      const error =
        consumed.reason === "expired"
          ? "That code has expired. Please request a new one."
          : consumed.reason === "locked"
            ? "Too many incorrect attempts. Please request a new code."
            : "The verification code is incorrect."

      return NextResponse.json({ success: false, error }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, status: true },
    })

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ success: false, error: "No active account was found for that email." }, { status: 404 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password, updatedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
