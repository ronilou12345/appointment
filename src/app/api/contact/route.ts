import { NextRequest, NextResponse } from "next/server"
import { sendContactMessage } from "@/lib/contact-email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body.email ?? "").trim().toLowerCase()
    const message = String(body.message ?? "").trim()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address." }, { status: 400 })
    }

    if (!message) {
      return NextResponse.json({ success: false, error: "Please enter a message." }, { status: 400 })
    }

    if (message.length > 4000) {
      return NextResponse.json({ success: false, error: "Message is too long." }, { status: 400 })
    }

    const result = await sendContactMessage({ email, message })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "We could not send your message right now. Please try again later." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
