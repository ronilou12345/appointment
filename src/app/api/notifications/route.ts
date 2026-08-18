import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import { getNotificationsForUser } from "@/lib/notifications"
import { normalizeUserRole } from "@/lib/user-role"

export async function GET() {
  try {
    const session = await getSession()

    if (!session?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const notifications = await getNotificationsForUser(session.id, session.role)

    return NextResponse.json({
      success: true,
      role: normalizeUserRole(session.role),
      notifications,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
