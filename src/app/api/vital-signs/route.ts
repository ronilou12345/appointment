import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"
import { logCurrentUserActivity } from "@/lib/activity-log"
import { ensureVitalSignsColumns, toVitalNumber } from "@/lib/vital-signs"

type Payload = {
  weight?: number | null
  height?: number | null
  heart_rate?: number | null
  body_temperature?: number | null
  blood_sugar?: number | null
}

function mapVitalRow(row: any) {
  return {
    id: row.id ?? row.vital_id,
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
    await ensureVitalSignsColumns()

    let res: any[] = []
    try {
      res = await prisma.$queryRawUnsafe<any[]>(
        `INSERT INTO "vital_signs" (user_id, weight, height, heart_rate, body_temperature, blood_sugar, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING vital_id AS id, weight, height, heart_rate, body_temperature, blood_sugar, created_at`,
        user.id,
        body.weight ?? null,
        body.height ?? null,
        body.heart_rate ?? null,
        body.body_temperature ?? null,
        body.blood_sugar ?? null,
      )
    } catch {
      const appointments = await prisma.$queryRawUnsafe<any[]>(
        `SELECT appointment_id FROM "appointment" WHERE user_id = $1 ORDER BY appointment_id DESC LIMIT 1`,
        user.id,
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
        user.id,
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

    await ensureVitalSignsColumns()

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT
          v.vital_id AS id,
          v.weight,
          v.height,
          v.heart_rate,
          v.body_temperature,
          v.blood_sugar,
          v.created_at
        FROM "vital_signs" v
        LEFT JOIN "appointment" a ON a.appointment_id = v.appointment_id
        WHERE v.user_id = $1 OR a.user_id = $1
        ORDER BY v.created_at DESC NULLS LAST
        LIMIT 100`,
      String(user.id),
    )

    return NextResponse.json({ success: true, data: rows.map(mapVitalRow) })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

async function assertOwnedVital(vitalId: number, userId: string) {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT v.vital_id
     FROM "vital_signs" v
     LEFT JOIN "appointment" a ON a.appointment_id = v.appointment_id
     WHERE v.vital_id = $1 AND (v.user_id = $2 OR a.user_id = $2)
     LIMIT 1`,
    vitalId,
    userId,
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

    const owned = await assertOwnedVital(vitalId, user.id)
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

    const owned = await assertOwnedVital(vitalId, user.id)
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
