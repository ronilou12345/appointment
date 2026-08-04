import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"
import prisma from "@/lib/prisma"

function parsePositiveInteger(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && Number.isInteger(value) && value >= 1 ? value : null
  }

  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return null

    const parsed = Number(trimmed)
    return Number.isFinite(parsed) && Number.isInteger(parsed) && parsed >= 1 ? parsed : null
  }

  return null
}

async function getDoctorIdFromRequest(request: NextRequest) {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")?.value
  if (!userId) return null

  try {
    const doctor = await prisma.doctor.findUnique({
      where: { user_id: userId },
      select: { doctor_id: true },
    })
    return doctor?.doctor_id ?? null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const mine = request.nextUrl.searchParams.get("mine") === "true"
    let rows: any[] = []

    if (mine) {
      const doctorId = await getDoctorIdFromRequest(request)
      if (!doctorId) {
        return NextResponse.json({ success: true, sessions: [] })
      }

      rows = await prisma.$queryRawUnsafe<any[]>(`
        SELECT
          session_id AS id,
          doctor_id,
          to_char(session_date, 'YYYY-MM-DD') AS date,
          to_char(start_time, 'HH24:MI') AS "startTime",
          to_char(end_time, 'HH24:MI') AS "endTime",
          slots,
          appointment_type AS appointmentType
        FROM "session_tbl"
        WHERE doctor_id = $1
        ORDER BY session_date ASC, start_time ASC
      `, doctorId)
    } else {
      rows = await prisma.$queryRawUnsafe<any[]>(`
        SELECT
          session_id AS id,
          doctor_id,
          to_char(session_date, 'YYYY-MM-DD') AS date,
          to_char(start_time, 'HH24:MI') AS "startTime",
          to_char(end_time, 'HH24:MI') AS "endTime",
          slots,
          appointment_type AS appointmentType
        FROM "session_tbl"
        ORDER BY session_date ASC, start_time ASC
      `)
    }

    const normalizeDateValue = (value: unknown) => {
      if (!value) return ""
      if (typeof value === "string") {
        return value.slice(0, 10)
      }
      if (value instanceof Date) {
        return value.toISOString().slice(0, 10)
      }
      return String(value).slice(0, 10)
    }

    const normalizeTimeValue = (value: unknown) => {
      if (!value) return ""
      if (typeof value === "string") {
        const normalized = value.trim().slice(0, 5)
        if (/^\d{2}:\d{2}$/.test(normalized)) {
          return normalized
        }
        const fallback = value.trim().split(" ")[0]
        return fallback.slice(0, 5)
      }
      if (value instanceof Date) {
        return value.toTimeString().slice(0, 5)
      }
      return String(value).slice(0, 5)
    }

    const sessions = rows.map((row) => ({
      id: String(row.id),
      doctorId: String(row.doctor_id),
      date: normalizeDateValue(row.date),
      startTime: normalizeTimeValue(row.starttime ?? row.startTime),
      endTime: normalizeTimeValue(row.endtime ?? row.endTime),
      duration: "",
      slots: Number(row.slots ?? 0),
      status: "Active",
      appointmentTypes: row.appointmenttype ? String(row.appointmenttype).split(",").map((s) => s.trim()).filter(Boolean) : [],
    }))

    return NextResponse.json({ success: true, sessions })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

type SessionPayload = {
  date: string
  startTime: string
  endTime: string
  slots: number
  appointmentType?: string
  appointmentTypes?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const sessions: SessionPayload[] = Array.isArray(body?.sessions) ? body.sessions : []

    if (!sessions.length) {
      return NextResponse.json({ success: false, error: "No sessions were provided" }, { status: 400 })
    }

    const doctorId = await getDoctorIdFromRequest(request)

    if (!doctorId) {
      return NextResponse.json({ success: false, error: "No valid doctor record was found for this session" }, { status: 400 })
    }

    for (const session of sessions) {
      const slotCount = parsePositiveInteger(session.slots)
      if (!session.date || !session.startTime || !session.endTime || !slotCount) {
        return NextResponse.json({ success: false, error: "Missing required session fields or invalid slot count" }, { status: 400 })
      }

      const existingSession = await prisma.$queryRawUnsafe<any[]>(
        `SELECT 1 FROM "session_tbl" WHERE "session_date" = $1 AND "start_time" = $2 AND "doctor_id" = $3 LIMIT 1`,
        session.date,
        session.startTime,
        doctorId,
      )

      if (existingSession?.length) {
        return NextResponse.json(
          { success: false, error: "A session with the same date and time already exists for this doctor." },
          { status: 400 },
        )
      }

      const types = Array.isArray(session.appointmentTypes)
        ? session.appointmentTypes.map((t) => String(t).trim().slice(0, 50)).filter(Boolean)
        : (session.appointmentType ? [String(session.appointmentType).trim().slice(0, 50)] : ["General Consultation"])

      const appointmentType = types.join(", ").slice(0, 50)

      await prisma.$executeRawUnsafe(
        `INSERT INTO "session_tbl" ("doctor_id", "session_date", "start_time", "end_time", "slots", "appointment_type") VALUES ($1, $2, $3, $4, $5, $6)`,
        doctorId,
        session.date,
        session.startTime,
        session.endTime,
        slotCount,
        appointmentType,
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const id = body?.id
    if (!id) return NextResponse.json({ success: false, error: 'Missing session id' }, { status: 400 })

    const doctorId = await getDoctorIdFromRequest(request)
    if (!doctorId) return NextResponse.json({ success: false, error: 'No valid doctor' }, { status: 403 })

    // verify ownership
    const owner = await prisma.$queryRawUnsafe<any[]>(`SELECT doctor_id FROM "session_tbl" WHERE session_id = $1 LIMIT 1`, id)
    if (!owner?.length || Number(owner[0].doctor_id) !== Number(doctorId)) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 })
    }

    const date = body?.date
    const startTime = body?.startTime
    const endTime = body?.endTime
    const slots = parsePositiveInteger(body?.slots)
    if (!slots) {
      return NextResponse.json({ success: false, error: "Slots must be a whole number greater than zero" }, { status: 400 })
    }
    const types = Array.isArray(body?.appointmentTypes)
      ? body.appointmentTypes.map((t: any) => String(t).trim().slice(0, 50)).filter(Boolean)
      : (body?.appointmentType ? [String(body.appointmentType).trim().slice(0, 50)] : [])

    const appointmentType = types.length ? types.join(', ').slice(0, 50) : null

    await prisma.$executeRawUnsafe(
      `UPDATE "session_tbl" SET "session_date" = $1, "start_time" = $2, "end_time" = $3, "slots" = $4, "appointment_type" = $5, "updated_at" = now() WHERE session_id = $6 AND doctor_id = $7`,
      date,
      startTime,
      endTime,
      slots,
      appointmentType,
      id,
      doctorId,
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const id = body?.id
    if (!id) return NextResponse.json({ success: false, error: 'Missing session id' }, { status: 400 })

    const doctorId = await getDoctorIdFromRequest(request)
    if (!doctorId) return NextResponse.json({ success: false, error: 'No valid doctor' }, { status: 403 })

    await prisma.$executeRawUnsafe(`DELETE FROM "session_tbl" WHERE session_id = $1 AND doctor_id = $2`, id, doctorId)

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
