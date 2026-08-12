import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const password = String(body?.password ?? "")

    const cookieStore = await cookies()
    const userId = cookieStore.get("user_id")?.value
    if (!userId) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } })
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })

    const match = user.password === password

    return NextResponse.json({ success: true, match })
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error)?.message ?? "Error validating password" }, { status: 500 })
  }
}
