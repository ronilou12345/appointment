import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"
import { normalizePhilippineMobile } from "@/lib/phone-utils"

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
      const appointmentTimeRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT DISTINCT
          to_char(a.appointment_time, 'HH24:MI') AS appointment_time
        FROM "appointment" a
        INNER JOIN "session_tbl" s ON s.session_id = a.session_id
        WHERE s.doctor_id = $1 AND s.session_date = $2 AND a.appointment_time IS NOT NULL
        ORDER BY to_char(a.appointment_time, 'HH24:MI') ASC`,
        doctorId,
        selectedDate,
      )

      bookedTimes = appointmentTimeRows
        .map((row) => String(row.appointment_time ?? "").trim())
        .filter(Boolean)
        .sort((a, b) => {
          const aMinutes = parseTimeToMinutes(a) ?? 0
          const bMinutes = parseTimeToMinutes(b) ?? 0
          return aMinutes - bMinutes
        })

      if (bookedTimes.length === 0) {
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
      }
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

function normalizeContactNumber(value: string): string | null {
  return normalizePhilippineMobile(value)
}

async function sendAppointmentSms(contactNumber: string | null, details: {
  patientName?: string
  doctorName?: string
  date?: string | null
  time?: string | null
  appointmentType?: string | null
  reasonForVisit?: string | null
}) {
  if (!contactNumber) return { success: false, reason: "missing-contact-number" }

  const apiKey = process.env.SEMAPHORE_API_KEY
  if (!apiKey) {
    console.warn("SEMAPHORE_API_KEY is not configured; skipping SMS notification.")
    return { success: false, reason: "missing-api-key" }
  }

  const normalizedNumber = normalizeContactNumber(contactNumber)
  if (!normalizedNumber) {
    return { success: false, reason: "invalid-contact-number" }
  }

  const patientName = details.patientName?.trim() || "Patient"
  const doctorName = details.doctorName?.trim() || "Doctor"
  const appointmentDate = details.date || "[Date]"
  const appointmentTime = details.time || "[Time]"

  const message = `Hello, ${patientName}!

Your appointment request at C2M Family Clinic has been received and is currently **pending doctor confirmation**.

📅 Date: ${appointmentDate}
🕒 Time: ${appointmentTime}
👨‍⚕️ Doctor: Dr. ${doctorName}

Please wait for confirmation. **You will receive another text message once your appointment has been confirmed.**

— C2M Family Clinic`

  const configuredSenderName = process.env.SEMAPHORE_SENDER_NAME?.trim()

  const attemptSend = async (senderName?: string) => {
    const payload: Record<string, string> = {
      apikey: apiKey,
      number: normalizedNumber,
      message,
    }

    if (senderName) {
      payload.sendername = senderName
    }

    const response = await fetch("https://api.semaphore.co/api/v4/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()

    if (!response.ok) {
      const errorPayload = responseText ? responseText : "No response body returned"
      return {
        success: false,
        reason: "provider-error",
        status: response.status,
        providerResponse: errorPayload,
      }
    }

    return { success: true, response: responseText }
  }

  try {
    const primaryAttempt = await attemptSend(configuredSenderName)

    if (primaryAttempt.success) {
      return primaryAttempt
    }

    const providerText = String(primaryAttempt.providerResponse || "")
    const senderRejected = configuredSenderName && (
      providerText.toLowerCase().includes("sender") ||
      providerText.toLowerCase().includes("invalid") ||
      providerText.toLowerCase().includes("not allowed") ||
      providerText.toLowerCase().includes("rejected")
    )

    if (senderRejected) {
      console.warn("Semaphore sender rejected; retrying without sendername:", providerText)
      const fallbackAttempt = await attemptSend()
      if (fallbackAttempt.success) {
        return fallbackAttempt
      }

      return {
        success: false,
        reason: fallbackAttempt.reason,
        status: fallbackAttempt.status,
        providerResponse: fallbackAttempt.providerResponse,
      }
    }

    return primaryAttempt
  } catch (error) {
    console.error("Semaphore SMS error:", error)
    return { success: false, reason: "request-failed" }
  }
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
    const rawContactNumber = payload.contactNumber ? String(payload.contactNumber).trim().slice(0, 20) : null
    const contactNumber = rawContactNumber ? normalizePhilippineMobile(rawContactNumber) : null
    if (rawContactNumber && !contactNumber) {
      return NextResponse.json({ success: false, error: "Please enter a valid Philippine mobile number." }, { status: 400 })
    }
    const gender = payload.gender ? String(payload.gender).trim().slice(0, 20) : null
    const symptoms = payload.symptoms ? String(payload.symptoms).trim().slice(0, 1000) : null
    const durationOfSymptoms = payload.durationOfSymptoms ? String(payload.durationOfSymptoms).trim().slice(0, 100) : null
    const additionalNotes = payload.additionalNotes ? String(payload.additionalNotes).trim().slice(0, 1000) : null
    const age = typeof payload.age === "number" ? payload.age : null
    const painLevel = typeof payload.painLevel === "number" ? payload.painLevel : null
    const appointmentDate = payload.appointmentDate ? String(payload.appointmentDate).trim().slice(0, 10) : null
    const appointmentTime = payload.appointmentTime ? String(payload.appointmentTime).trim().slice(0, 5) : null

    let appointmentDetails: {
      patientName?: string
      doctorName?: string
      date?: string | null
      time?: string | null
      appointmentType?: string | null
      reasonForVisit?: string | null
    } = {}
    let savedContactNumber: string | null = contactNumber

    await prisma.$transaction(async (tx) => {
      const session = await tx.$queryRawUnsafe<any[]>(
        `SELECT session_id, slots, status, to_char(session_date, 'YYYY-MM-DD') AS session_date, to_char(start_time, 'HH24:MI') AS start_time, to_char(end_time, 'HH24:MI') AS end_time
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

      const doctor = await tx.$queryRawUnsafe<any[]>(
        `SELECT u.name, u.email
         FROM "doctor" d
         INNER JOIN "user" u ON u.id = d.user_id
         WHERE d.doctor_id = $1
         LIMIT 1`,
        doctorId,
      )

      const selectedAppointmentDate = session[0].session_date ? String(session[0].session_date).slice(0, 10) : appointmentDate
      const selectedAppointmentTime = appointmentTime && /^\d{1,2}:\d{2}$/.test(appointmentTime)
        ? appointmentTime
        : session[0].start_time ? String(session[0].start_time).slice(0, 5) : null

      appointmentDetails = {
        patientName: user.name ?? user.email ?? "Patient",
        doctorName: doctor?.[0]?.name ?? "Doctor",
        date: selectedAppointmentDate,
        time: selectedAppointmentTime,
        appointmentType,
        reasonForVisit,
      }

      await tx.$executeRawUnsafe(
        `INSERT INTO "appointment" ("user_id", "doctor_id", "session_id", "appointment_type", "reason_for_visit", "relationship", "age", "gender", "contact_number", "symptoms", "duration_of_symptoms", "pain_level", "additional_notes", "appointment_date", "appointment_time") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
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
        selectedAppointmentDate,
        selectedAppointmentTime ? `${selectedAppointmentTime}:00` : null,
      )

      const createdAppointmentRows = await tx.$queryRawUnsafe<{ contact_number: string | null }[]>(
        `SELECT contact_number FROM "appointment" WHERE user_id = $1 AND doctor_id = $2 AND session_id = $3 ORDER BY appointment_id DESC LIMIT 1`,
        user.id,
        doctorId,
        sessionId,
      )

      const persistedContactNumber = createdAppointmentRows?.[0]?.contact_number ?? contactNumber
      if (persistedContactNumber) {
        savedContactNumber = persistedContactNumber
      }
    })

    const smsResult = await sendAppointmentSms(savedContactNumber, appointmentDetails)

    if (!smsResult.success) {
      console.warn("Appointment booked, SMS skipped or failed:", smsResult)
    }

    return NextResponse.json({ success: true, smsSent: smsResult.success })
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
    const reasonCancel = typeof body.reasonCancel === "string" ? body.reasonCancel.trim().slice(0, 1000) : ""
    const allowedActions = ["Confirm", "Complete", "Cancel"]

    if (!appointmentId || !allowedActions.includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid appointment action" }, { status: 400 })
    }

    const shouldCancel = action === "Cancel"
    const appointment = shouldCancel
      ? await prisma.appointment.findFirst({
          where: {
            appointment_id: appointmentId,
            user_id: user.id,
          },
          select: {
            appointment_id: true,
            appointment_status: true,
            reason_cancel: true,
          },
        })
      : await prisma.appointment.findFirst({
          where: {
            appointment_id: appointmentId,
            doctor: { user_id: user.id },
          },
          select: {
            appointment_id: true,
            appointment_status: true,
            reason_cancel: true,
          },
        })

    if (!appointment) {
      return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 })
    }

    const normalizedStatus = String(appointment.appointment_status || "Pending").trim()
    const targetStatus = shouldCancel ? "Cancelled" : action === "Confirm" ? "Confirmed" : "Completed"

    if (normalizedStatus.toLowerCase() === "cancelled") {
      return NextResponse.json({ success: false, error: "Cannot update a cancelled appointment" }, { status: 400 })
    }

    if (normalizedStatus === targetStatus) {
      return NextResponse.json({ success: true, status: normalizedStatus })
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { appointment_id: appointmentId },
      data: {
        appointment_status: targetStatus,
        ...(shouldCancel && reasonCancel ? { reason_cancel: reasonCancel } : {}),
        ...(shouldCancel && !reasonCancel && appointment.reason_cancel ? {} : {}),
      },
    })

    return NextResponse.json({ success: true, status: updatedAppointment.appointment_status })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
