import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"
import { logCurrentUserActivity } from "@/lib/activity-log"
import { ensureVitalSignsColumns, toVitalNumber } from "@/lib/vital-signs"
import { resolveProfileAvatar } from "@/lib/profile-image"

type Payload = {
  user_id?: string | null
  weight?: number | null
  height?: number | null
  heart_rate?: number | null
  body_temperature?: number | null
  blood_sugar?: number | null
}

function isAdmin(user: Awaited<ReturnType<typeof getSession>>) {
  return user?.role === "ADMIN"
}

async function getTargetUserId(user: NonNullable<Awaited<ReturnType<typeof getSession>>>, requestedUserId?: string | null) {
  if (!requestedUserId || requestedUserId === user.id) return user.id
  if (!isAdmin(user)) return null

  const target = await prisma.user.findUnique({
    where: { id: requestedUserId },
    select: { id: true, role: true, status: true },
  })
  if (!target || target.role !== "PATIENT" || target.status !== "ACTIVE") return null
  return target.id
}

function mapVitalRow(row: any) {
  const userId = row.user_id ?? row.owner_id ?? null
  return {
    id: row.id ?? row.vital_id,
    user_id: userId,
    user_name: row.user_name ?? "Unknown client",
    user_avatar: userId ? resolveProfileAvatar(String(userId), row.profile_image) : "",
    weight: toVitalNumber(row.weight),
    height: toVitalNumber(row.height),
    heart_rate: toVitalNumber(row.heart_rate),
    body_temperature: toVitalNumber(row.body_temperature),
    blood_sugar: toVitalNumber(row.blood_sugar),
    created_at: row.created_at ?? null,
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSession()
    if (!user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = (await req.json()) as Payload
    const targetUserId = await getTargetUserId(user, body.user_id)
    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "Select an active client user." }, { status: 400 })
    }
    await ensureVitalSignsColumns()

    let res: any[] = []
    try {
      res = await prisma.$queryRawUnsafe<any[]>(
        `INSERT INTO "vital_signs" (user_id, weight, height, heart_rate, body_temperature, blood_sugar, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING vital_id AS id, weight, height, heart_rate, body_temperature, blood_sugar, created_at`,
        targetUserId,
        body.weight ?? null,
        body.height ?? null,
        body.heart_rate ?? null,
        body.body_temperature ?? null,
        body.blood_sugar ?? null,
      )
    } catch {
      const appointments = await prisma.$queryRawUnsafe<any[]>(
        `SELECT appointment_id FROM "appointment" WHERE user_id = $1 ORDER BY appointment_id DESC LIMIT 1`,
        targetUserId,
      )
      const appointmentId = Number(appointments[0]?.appointment_id)
      if (!appointmentId) {
        throw new Error("Unable to save vitals. Book an appointment first, then try again.")
      }

      res = await prisma.$queryRawUnsafe<any[]>(
        `INSERT INTO "vital_signs" (appointment_id, user_id, weight, height, heart_rate, body_temperature, blood_sugar, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING vital_id AS id, weight, height, heart_rate, body_temperature, blood_sugar, created_at`,
        appointmentId,
        targetUserId,
        body.weight ?? null,
        body.height ?? null,
        body.heart_rate ?? null,
        body.body_temperature ?? null,
        body.blood_sugar ?? null,
      )
    }

    await logCurrentUserActivity("Added BMI / vital signs")

    return NextResponse.json({ success: true, data: Array.isArray(res) ? res.map(mapVitalRow) : res })
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

    const requestedUserId = req.nextUrl.searchParams.get("userId")
    await ensureVitalSignsColumns()

    if (isAdmin(user) && !requestedUserId) {
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT
            v.vital_id AS id,
            COALESCE(v.user_id, a.user_id) AS user_id,
            u.name AS user_name,
            u.profile_image,
            v.weight,
            v.height,
            v.heart_rate,
            v.body_temperature,
            v.blood_sugar,
            v.created_at
          FROM "vital_signs" v
          LEFT JOIN "appointment" a ON a.appointment_id = v.appointment_id
          LEFT JOIN "user" u ON u.id = COALESCE(v.user_id, a.user_id)
          ORDER BY v.created_at DESC NULLS LAST
          LIMIT 100`,
      )

      return NextResponse.json({ success: true, data: rows.map(mapVitalRow) })
    }

    const targetUserId = await getTargetUserId(user, requestedUserId)
    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "Select an active client user." }, { status: 400 })
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT
          v.vital_id AS id,
          COALESCE(v.user_id, a.user_id) AS user_id,
          u.name AS user_name,
          u.profile_image,
          v.weight,
          v.height,
          v.heart_rate,
          v.body_temperature,
          v.blood_sugar,
          v.created_at
        FROM "vital_signs" v
        LEFT JOIN "appointment" a ON a.appointment_id = v.appointment_id
        LEFT JOIN "user" u ON u.id = COALESCE(v.user_id, a.user_id)
          WHERE v.user_id = $1 OR a.user_id = $1
        ORDER BY v.created_at DESC NULLS LAST
        LIMIT 100`,
      String(targetUserId),
    )

    return NextResponse.json({ success: true, data: rows.map(mapVitalRow) })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

async function assertOwnedVital(vitalId: number, userId: string, admin: boolean) {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT v.vital_id
     FROM "vital_signs" v
     LEFT JOIN "appointment" a ON a.appointment_id = v.appointment_id
     WHERE v.vital_id = $1 AND ($3 OR v.user_id = $2 OR a.user_id = $2)
     LIMIT 1`,
    vitalId,
    userId,
    admin,
  )
  return Boolean(rows[0]?.vital_id)
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getSession()
    if (!user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = (await req.json()) as Payload & { id?: unknown }
    const vitalId = Number(body.id)
    if (!vitalId) {
      return NextResponse.json({ success: false, error: "Missing vitals id" }, { status: 400 })
    }

    await ensureVitalSignsColumns()

    const owned = await assertOwnedVital(vitalId, user.id, isAdmin(user))
    if (!owned) {
      return NextResponse.json({ success: false, error: "Vitals record not found" }, { status: 404 })
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `UPDATE "vital_signs"
       SET weight = $2,
           height = $3,
           heart_rate = $4,
           body_temperature = $5,
           blood_sugar = $6,
           updated_at = NOW()
       WHERE vital_id = $1
       RETURNING vital_id AS id, weight, height, heart_rate, body_temperature, blood_sugar, created_at`,
      vitalId,
      body.weight ?? null,
      body.height ?? null,
      body.heart_rate ?? null,
      body.body_temperature ?? null,
      body.blood_sugar ?? null,
    )

    await logCurrentUserActivity("Updated BMI / vital signs", undefined, { type: "vital_signs", id: vitalId })

    return NextResponse.json({ success: true, data: rows.map(mapVitalRow) })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSession()
    if (!user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const vitalId = Number(body?.id)
    if (!vitalId) {
      return NextResponse.json({ success: false, error: "Missing vitals id" }, { status: 400 })
    }

    await ensureVitalSignsColumns()

    const owned = await assertOwnedVital(vitalId, user.id, isAdmin(user))
    if (!owned) {
      return NextResponse.json({ success: false, error: "Vitals record not found" }, { status: 404 })
    }

    await prisma.$executeRawUnsafe(`DELETE FROM "vital_signs" WHERE vital_id = $1`, vitalId)
    await logCurrentUserActivity("Deleted BMI / vital signs", undefined, { type: "vital_signs", id: vitalId })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
