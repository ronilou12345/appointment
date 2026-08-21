import { NextRequest, NextResponse } from "next/server"
import { loginUser } from "@/lib/actions/auth"
import { logActivity } from "@/lib/activity-log"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const formData = new FormData()

    Object.entries(body).forEach(([key, value]) => {
      formData.set(key, String(value ?? ""))
    })

    const result = await loginUser(formData)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 })
    }

    const response = NextResponse.json({ success: true, role: result.role ?? "PATIENT" })
    response.cookies.set({
      name: "user_id",
      value: String(result.userId ?? ""),
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    })

    await logActivity({
      userId: result.userId,
      action: "Signed in",
      details: "Signed in with email and password",
    })

    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
