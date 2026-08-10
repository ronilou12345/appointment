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
    const doctorIdParam = request.nextUrl.searchParams.get("doctorId")
    const requestedDoctorId = parsePositiveInteger(doctorIdParam)

    let rows: any[] = []

    const readStatusAwareRows = async () => {
      if (mine || requestedDoctorId) {
        const doctorId = requestedDoctorId ?? (await getDoctorIdFromRequest(request))

        if (!doctorId) {
          return []
        }

        return await prisma.$queryRawUnsafe<any[]>(`
          SELECT
            s.session_id AS id,
            s.doctor_id,
            to_char(s.session_date, 'YYYY-MM-DD') AS date,
            to_char(s.start_time, 'HH24:MI') AS "startTime",
            to_char(s.end_time, 'HH24:MI') AS "endTime",
            s.slots,
            s.appointment_type AS appointmentType,
            s.status AS status,
            COALESCE(COUNT(a.appointment_id), 0)::int AS booked_count
          FROM "session_tbl" s
          LEFT JOIN "appointment" a ON a.session_id = s.session_id
          WHERE s.doctor_id = $1
          GROUP BY s.session_id, s.doctor_id, s.session_date, s.start_time, s.end_time, s.slots, s.appointment_type, s.status
          ORDER BY s.session_date ASC, s.start_time ASC
        `, doctorId)
      }

      return await prisma.$queryRawUnsafe<any[]>(`
        SELECT
          s.session_id AS id,
          s.doctor_id,
          to_char(s.session_date, 'YYYY-MM-DD') AS date,
          to_char(s.start_time, 'HH24:MI') AS "startTime",
          to_char(s.end_time, 'HH24:MI') AS "endTime",
          s.slots,
          s.appointment_type AS appointmentType,
          s.status AS status,
          COALESCE(COUNT(a.appointment_id), 0)::int AS booked_count
        FROM "session_tbl" s
        LEFT JOIN "appointment" a ON a.session_id = s.session_id
        GROUP BY s.session_id, s.doctor_id, s.session_date, s.start_time, s.end_time, s.slots, s.appointment_type, s.status
        ORDER BY s.session_date ASC, s.start_time ASC
      `)
    }

    try {
      rows = await readStatusAwareRows()
    } catch {
      const readLegacyRows = async () => {
        if (mine || requestedDoctorId) {
          const doctorId = requestedDoctorId ?? (await getDoctorIdFromRequest(request))
          if (!doctorId) {
            return []
          }

          return await prisma.$queryRawUnsafe<any[]>(`
            SELECT
              s.session_id AS id,
              s.doctor_id,
              to_char(s.session_date, 'YYYY-MM-DD') AS date,
              to_char(s.start_time, 'HH24:MI') AS "startTime",
              to_char(s.end_time, 'HH24:MI') AS "endTime",
              s.slots,
              s.appointment_type AS appointmentType,
              COALESCE(COUNT(a.appointment_id), 0)::int AS booked_count
            FROM "session_tbl" s
            LEFT JOIN "appointment" a ON a.session_id = s.session_id
            WHERE s.doctor_id = $1
            GROUP BY s.session_id, s.doctor_id, s.session_date, s.start_time, s.end_time, s.slots, s.appointment_type
            ORDER BY s.session_date ASC, s.start_time ASC
          `, doctorId)
        }

        return await prisma.$queryRawUnsafe<any[]>(`
          SELECT
            s.session_id AS id,
            s.doctor_id,
            to_char(s.session_date, 'YYYY-MM-DD') AS date,
            to_char(s.start_time, 'HH24:MI') AS "startTime",
            to_char(s.end_time, 'HH24:MI') AS "endTime",
            s.slots,
            s.appointment_type AS appointmentType,
            COALESCE(COUNT(a.appointment_id), 0)::int AS booked_count
          FROM "session_tbl" s
          LEFT JOIN "appointment" a ON a.session_id = s.session_id
          GROUP BY s.session_id, s.doctor_id, s.session_date, s.start_time, s.end_time, s.slots, s.appointment_type
          ORDER BY s.session_date ASC, s.start_time ASC
        `)
      }

      rows = await readLegacyRows()
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

    const sessions = rows.map((row) => {
      const capacity = Number(row.slots ?? 0)
      const bookedCount = Number(row.booked_count ?? 0)
      const remaining = Math.max(capacity - bookedCount, 0)

      const requestedStatus = typeof row.status === "string" ? row.status.trim() : ""
      const normalizedStatus = ["Active", "Inactive", "Cancelled"].includes(requestedStatus)
        ? requestedStatus
        : "Active"

      return {
        id: String(row.id),
        doctorId: String(row.doctor_id),
        date: normalizeDateValue(row.date),
        startTime: normalizeTimeValue(row.starttime ?? row.startTime),
        endTime: normalizeTimeValue(row.endtime ?? row.endTime),
        duration: "",
        slots: remaining,
        status: normalizedStatus,
        appointmentTypes: row.appointmenttype || row.appointmentType ? String(row.appointmenttype ?? row.appointmentType).split(",").map((s) => s.trim()).filter(Boolean) : [],
      }
    })

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
  status?: string
}

function timeStringToMinutes(value: unknown): number {
  const text = String(value ?? "").trim()
  if (!/^\d{1,2}:\d{2}$/.test(text)) return NaN

  const [hourText, minuteText] = text.split(":")
  const hour = Number(hourText)
  const minute = Number(minuteText)

  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return NaN
  }

  return hour * 60 + minute
}

function timeRangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const startAValue = timeStringToMinutes(startA)
  const endAValue = timeStringToMinutes(endA)
  const startBValue = timeStringToMinutes(startB)
  const endBValue = timeStringToMinutes(endB)

  if (![startAValue, endAValue, startBValue, endBValue].every((value) => Number.isFinite(value))) {
    return false
  }

  if (endAValue <= startAValue || endBValue <= startBValue) {
    return false
  }

  return startAValue < endBValue && startBValue < endAValue
}

function normalizeStatusValue(value: unknown): string {
  const requestedStatus = typeof value === "string" ? value.trim() : "Active"
  const whitelistedStatus = ["Active", "Inactive", "Cancelled"].includes(requestedStatus) ? requestedStatus : "Active"
  return whitelistedStatus
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

      const existingSessions = await prisma.$queryRawUnsafe<any[]>(
        `SELECT "start_time", "end_time" FROM "session_tbl" WHERE "doctor_id" = $1 AND "session_date" = $2`,
        doctorId,
        session.date,
      )

      const overlap = existingSessions.some((row) => {
        const existingStart = String(row.start_time ?? row.startTime ?? "")
        const existingEnd = String(row.end_time ?? row.endTime ?? "")
        return timeRangesOverlap(session.startTime, session.endTime, existingStart, existingEnd)
      })

      if (overlap) {
        return NextResponse.json(
          { success: false, error: "You cannot create a session in the same time range on the selected date." },
          { status: 400 },
        )
      }

      const types = Array.isArray(session.appointmentTypes)
        ? session.appointmentTypes.map((t) => String(t).trim().slice(0, 50)).filter(Boolean)
        : (session.appointmentType ? [String(session.appointmentType).trim().slice(0, 50)] : ["General Consultation"])

      const appointmentType = types.join(", ").slice(0, 50)
      const requestedStatus = normalizeStatusValue(session.status)

      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "session_tbl" ("doctor_id", "session_date", "start_time", "end_time", "slots", "appointment_type", "status") VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          doctorId,
          session.date,
          session.startTime,
          session.endTime,
          slotCount,
          appointmentType,
          requestedStatus,
        )
      } catch (err) {
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

    const typedSessionName = body?.sessionName || body?.appointmentType || (Array.isArray(body?.appointmentTypes) ? body.appointmentTypes[0] : "")
    const types = Array.isArray(body?.appointmentTypes)
      ? body.appointmentTypes.map((t: any) => String(t).trim().slice(0, 50)).filter(Boolean)
      : (typedSessionName ? [String(typedSessionName).trim().slice(0, 50)] : [])

    const appointmentType = types.length ? types.join(', ').slice(0, 50) : null

    const requestedStatus = normalizeStatusValue(body?.status)

    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "session_tbl" SET "session_date" = $1, "start_time" = $2, "end_time" = $3, "slots" = $4, "appointment_type" = $5, "status" = $6, "updated_at" = now() WHERE session_id = $7 AND doctor_id = $8`,
        date,
        startTime,
        endTime,
        slots,
        appointmentType,
        requestedStatus,
        id,
        doctorId,
      )
    } catch (err) {
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
    }

    return NextResponse.json({ success: true, status: requestedStatus })
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
