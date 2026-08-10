import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"

function parseTimeToMinutes(value: string): number | null {
  const trimmed = String(value ?? "").trim()
  if (!/^\d{1,2}:\d{2}$/.test(trimmed)) {
    return null
  }

  const [hours, minutes] = trimmed.split(":").map(Number)
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null
  }

  return hours * 60 + minutes
}

function buildTimeSlots(startTime: string, endTime: string, stepMinutes = 20): string[] {
  const start = parseTimeToMinutes(startTime)
  const end = parseTimeToMinutes(endTime)
  if (start === null || end === null || end <= start) {
    return []
  }

  const slots: string[] = []
  for (let minutes = start; minutes < end; minutes += stepMinutes) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    slots.push(`${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`)
  }

  return slots
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const doctorId = Number(request.nextUrl.searchParams.get("doctorId"))
    const selectedDate = request.nextUrl.searchParams.get("date")

    if (!doctorId || !selectedDate) {
      return NextResponse.json({ success: false, error: "Missing doctor or date" }, { status: 400 })
    }

    const existing = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 1 FROM "appointment" a JOIN "session_tbl" s ON s.session_id = a.session_id WHERE a.user_id = $1 AND s.doctor_id = $2 AND s.session_date = $3 LIMIT 1`,
      user.id,
      doctorId,
      selectedDate,
    )

    let bookedTimes: string[] = []
    try {
      const sessionRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT
          s.session_id,
          s.session_date,
          to_char(s.start_time, 'HH24:MI') AS start_time,
          to_char(s.end_time, 'HH24:MI') AS end_time,
          s.slots,
          COALESCE(COUNT(a.appointment_id), 0)::int AS booked_count
        FROM "session_tbl" s
        LEFT JOIN "appointment" a ON a.session_id = s.session_id
        WHERE s.doctor_id = $1 AND s.session_date = $2
        GROUP BY s.session_id, s.session_date, s.start_time, s.end_time, s.slots`,
        doctorId,
        selectedDate,
      )

      const bookedSlotSet = new Set<string>()

      for (const row of sessionRows) {
        const capacity = Number(row.slots ?? 0)
        const bookedCount = Number(row.booked_count ?? 0)
        if (!capacity || bookedCount <= 0) continue

        const slotKeys = buildTimeSlots(String(row.start_time ?? ""), String(row.end_time ?? ""))
        const slotsToMark = Math.min(slotKeys.length, bookedCount)

        slotKeys.slice(0, slotsToMark).forEach((slot) => bookedSlotSet.add(slot))
      }

      bookedTimes = Array.from(bookedSlotSet).sort((a, b) => {
        const aMinutes = parseTimeToMinutes(a) ?? 0
        const bMinutes = parseTimeToMinutes(b) ?? 0
        return aMinutes - bMinutes
      })
    } catch {
      bookedTimes = []
    }

    return NextResponse.json({ success: true, hasAppointment: Boolean(existing?.length), bookedTimes })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

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

type AppointmentPayload = {
  doctorId: number
  sessionId: number
  appointmentDate?: string | null
  appointmentTime?: string | null
  appointmentType?: string
  reasonForVisit: string
  relationship: string
  age?: number | null
  gender?: string | null
  contactNumber?: string | null
  symptoms?: string | null
  durationOfSymptoms?: string | null
  painLevel?: number | null
  additionalNotes?: string | null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const user = await getSession()

    if (!user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const payload = body as AppointmentPayload
    const doctorId = Number(payload.doctorId)
    const sessionId = Number(payload.sessionId)

    if (!doctorId || !sessionId || !payload.reasonForVisit || !payload.relationship) {
      return NextResponse.json({ success: false, error: "Missing required appointment fields" }, { status: 400 })
    }

    const appointmentType = payload.appointmentType ? String(payload.appointmentType).trim().slice(0, 50) : "General Consultation"
    const relationship = payload.relationship.trim().slice(0, 100)
    const reasonForVisit = payload.reasonForVisit.trim().slice(0, 500)
    const contactNumber = payload.contactNumber ? String(payload.contactNumber).trim().slice(0, 20) : null
    const gender = payload.gender ? String(payload.gender).trim().slice(0, 20) : null
    const symptoms = payload.symptoms ? String(payload.symptoms).trim().slice(0, 1000) : null
    const durationOfSymptoms = payload.durationOfSymptoms ? String(payload.durationOfSymptoms).trim().slice(0, 100) : null
    const additionalNotes = payload.additionalNotes ? String(payload.additionalNotes).trim().slice(0, 1000) : null
    const age = typeof payload.age === "number" ? payload.age : null
    const painLevel = typeof payload.painLevel === "number" ? payload.painLevel : null
    const appointmentDate = payload.appointmentDate ? String(payload.appointmentDate).trim().slice(0, 10) : null
    const appointmentTime = payload.appointmentTime ? String(payload.appointmentTime).trim().slice(0, 5) : null

    await prisma.$transaction(async (tx) => {
      const session = await tx.$queryRawUnsafe<any[]>(
        `SELECT session_id, slots, status
         FROM "session_tbl"
         WHERE session_id = $1 AND doctor_id = $2
         FOR UPDATE`,
        sessionId,
        doctorId,
      )

      if (!session?.length) {
        throw new Error("Selected session not found for this doctor")
      }

      const status = String(session[0].status ?? "Active").trim().toLowerCase()
      if (status === "inactive" || status === "cancelled") {
        throw new Error("This session is inactive or not available")
      }

      const capacity = parsePositiveInteger(session[0].slots)
      if (!capacity || capacity <= 0) {
        throw new Error("No slots available for the selected session")
      }

      const bookedCountRows = await tx.$queryRawUnsafe<any[]>(
        `SELECT COALESCE(COUNT(appointment_id), 0)::int AS booked_count FROM "appointment" WHERE session_id = $1`,
        sessionId,
      )
      const bookedCount = Number(bookedCountRows[0]?.booked_count ?? 0)

      const remainingCapacity = capacity - bookedCount
      if (remainingCapacity <= 0) {
        throw new Error("No slots available for the selected session")
      }

      const existingAppointment = await tx.$queryRawUnsafe<any[]>(
        `SELECT 1 FROM "appointment" a JOIN "session_tbl" s ON s.session_id = a.session_id WHERE a.user_id = $1 AND s.doctor_id = $2 AND s.session_date = (SELECT session_date FROM "session_tbl" WHERE session_id = $3) LIMIT 1`,
        user.id,
        doctorId,
        sessionId,
      )

      if (existingAppointment?.length) {
        throw new Error("You already have an appointment for this date")
      }

      await tx.$executeRawUnsafe(
        `INSERT INTO "appointment" ("user_id", "doctor_id", "session_id", "appointment_type", "reason_for_visit", "relationship", "age", "gender", "contact_number", "symptoms", "duration_of_symptoms", "pain_level", "additional_notes") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        user.id,
        doctorId,
        sessionId,
        appointmentType,
        reasonForVisit,
        relationship,
        age,
        gender,
        contactNumber,
        symptoms,
        durationOfSymptoms,
        painLevel,
        additionalNotes,
      )
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const status = message.includes("already have an appointment") ? 409 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const user = await getSession()

    if (!user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const appointmentId = Number(body.appointmentId)
    const action = String(body.action || "").trim()
    const allowedActions = ["Confirm", "Complete"]

    if (!appointmentId || !allowedActions.includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid appointment action" }, { status: 400 })
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        appointment_id: appointmentId,
        doctor: { user_id: user.id },
      },
      select: {
        appointment_id: true,
        appointment_status: true,
      },
    })

    if (!appointment) {
      return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 })
    }

    const normalizedStatus = String(appointment.appointment_status || "Pending").trim()
    const targetStatus = action === "Confirm" ? "Confirmed" : "Completed"

    if (normalizedStatus.toLowerCase() === "cancelled") {
      return NextResponse.json({ success: false, error: "Cannot update a cancelled appointment" }, { status: 400 })
    }

    if (normalizedStatus === targetStatus) {
      return NextResponse.json({ success: true, status: normalizedStatus })
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { appointment_id: appointmentId },
      data: { appointment_status: targetStatus },
    })

    return NextResponse.json({ success: true, status: updatedAppointment.appointment_status })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
