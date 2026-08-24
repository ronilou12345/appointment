import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { discardPasswordResetCode, issuePasswordResetCode } from "@/lib/password-reset"
import { sendPasswordResetEmail } from "@/lib/password-reset-email"

const GENERIC_SUCCESS = {
  success: true,
  message: "If an account exists for that email, a reset code has been sent.",
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body.email ?? "").trim().toLowerCase()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address." }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, status: true },
    })

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(GENERIC_SUCCESS)
    }

    const issued = await issuePasswordResetCode(email)

    if (!issued.ok) {
      return NextResponse.json({
        success: false,
        error: "Please wait a minute before requesting another code.",
      }, { status: 429 })
    }

    const emailed = await sendPasswordResetEmail(email, user.name, issued.code)

    if (!emailed.success) {
      console.warn("Password reset email skipped or failed:", emailed)
      await discardPasswordResetCode(email)
      return NextResponse.json(
        { success: false, error: "We could not send the reset email right now. Please try again later." },
        { status: 500 }
      )
    }

    return NextResponse.json(GENERIC_SUCCESS)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
