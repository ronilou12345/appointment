import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"

type Payload = {
  weight?: number | null
  height?: number | null
  heart_rate?: number | null
  body_temperature?: number | null
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSession()
    if (!user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = (await req.json()) as Payload

    // Use raw query to insert into existing vital_sign table (not present in Prisma schema)
    const res = await prisma.$queryRawUnsafe<any>(
      `INSERT INTO "vital_signs" (user_id, weight, height, heart_rate, body_temperature, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      user.id,
      body.weight ?? null,
      body.height ?? null,
      body.heart_rate ?? null,
      body.body_temperature ?? null,
    )

    return NextResponse.json({ success: true, data: res })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSession()
    if (!user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id, weight, height, heart_rate, body_temperature, created_at FROM "vital_signs" WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
      String(user.id),
    )

    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
