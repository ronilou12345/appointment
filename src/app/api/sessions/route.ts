import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"
import prisma from "@/lib/prisma"

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
          session_date AS date,
          start_time AS startTime,
          end_time AS endTime,
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
          session_date AS date,
          start_time AS startTime,
          end_time AS endTime,
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
      appointmentTypes: row.appointmenttype ? [String(row.appointmenttype)] : [],
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
      if (!session.date || !session.startTime || !session.endTime || !session.slots) {
        return NextResponse.json({ success: false, error: "Missing required session fields" }, { status: 400 })
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

      const appointmentType = (session.appointmentType || "General Consultation").slice(0, 50)

      await prisma.$executeRawUnsafe(
        `INSERT INTO "session_tbl" ("doctor_id", "session_date", "start_time", "end_time", "slots", "appointment_type") VALUES ($1, $2, $3, $4, $5, $6)`,
        doctorId,
        session.date,
        session.startTime,
        session.endTime,
        Number(session.slots),
        appointmentType,
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
