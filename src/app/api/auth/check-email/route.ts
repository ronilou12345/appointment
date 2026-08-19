import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase() ?? ""

  if (!email || !email.includes("@")) {
    return NextResponse.json({ success: false, error: "Please enter a valid email address." }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  return NextResponse.json({ success: true, exists: Boolean(existing) })
}
