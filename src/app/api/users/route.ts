import { NextRequest, NextResponse } from "next/server"
import { createUserAction } from "@/lib/actions/user"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")?.trim().toUpperCase()

    const users = await prisma.user.findMany({
      where: role ? { role: role as any } : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        designations: true,
        role: true,
        status: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ success: true, users })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const formData = new FormData()

    Object.entries(body).forEach(([key, value]) => {
      formData.set(key, String(value ?? ""))
    })

    const result = await createUserAction(formData)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
