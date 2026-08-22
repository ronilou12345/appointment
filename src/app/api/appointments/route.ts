import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"
import { normalizePhilippineMobile } from "@/lib/phone-utils"
import { sendAppointmentEmail, sendAppointmentRescheduledEmail, sendAppointmentStatusEmail, sendCancellationRequestEmail } from "@/lib/appointment-email"
import { sendAppointmentSms } from "@/lib/appointment-sms"
import { logActivity } from "@/lib/activity-log"

// Date and time columns come back as UTC-anchored Date objects, so the calendar
// parts have to be read off the ISO string rather than local getters.
const isoDatePart = (value: Date | null | undefined) => (value ? value.toISOString().slice(0, 10) : null)
const isoTimePart = (value: Date | null | undefined) => (value ? value.toISOString().slice(11, 16) : null)

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

    const excludeAppointmentId = Number(request.nextUrl.searchParams.get("excludeAppointmentId"))

    const existing = await prisma.$queryRawUnsafe<any[]>(
      `SELECT 1
       FROM "appointment" a
       JOIN "session_tbl" s ON s.session_id = a.session_id
       WHERE a.user_id = $1
         AND s.doctor_id = $2
         AND s.session_date = $3
         AND ($4::int IS NULL OR a.appointment_id <> $4)
         AND LOWER(COALESCE(a.appointment_status, '')) NOT IN ('cancelled', 'canceled')
       LIMIT 1`,
      user.id,
      doctorId,
      selectedDate,
      Number.isInteger(excludeAppointmentId) && excludeAppointmentId > 0 ? excludeAppointmentId : null,
    )

    let bookedTimes: string[] = []
    try {
      const appointmentTimeRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT DISTINCT
          to_char(a.appointment_time, 'HH24:MI') AS appointment_time
        FROM "appointment" a
        INNER JOIN "session_tbl" s ON s.session_id = a.session_id
        WHERE s.doctor_id = $1
          AND s.session_date = $2
          AND a.appointment_time IS NOT NULL
          AND ($3::int IS NULL OR a.appointment_id <> $3)
          AND LOWER(COALESCE(a.appointment_status, '')) NOT IN ('cancelled', 'canceled')
        ORDER BY to_char(a.appointment_time, 'HH24:MI') ASC`,
        doctorId,
        selectedDate,
        Number.isInteger(excludeAppointmentId) && excludeAppointmentId > 0 ? excludeAppointmentId : null,
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

    const [smsResult, emailResult] = await Promise.all([
      sendAppointmentSms(savedContactNumber, appointmentDetails, "Pending"),
      sendAppointmentEmail(user.email ?? null, appointmentDetails),
    ])

    if (!smsResult.success) {
      console.warn("Appointment booked, SMS skipped or failed:", smsResult)
    }

    if (!emailResult.success) {
      console.warn("Appointment booked, email skipped or failed:", emailResult)
    }

    await logActivity({
      actor: user,
      action: "Booked appointment",
      details: [
        appointmentDetails.doctorName ? `Doctor: ${appointmentDetails.doctorName}` : null,
        appointmentDetails.date ? `Date: ${appointmentDetails.date}` : null,
        appointmentDetails.time ? `Time: ${appointmentDetails.time}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      entityType: "appointment",
    })

    return NextResponse.json({ success: true, smsSent: smsResult.success, emailSent: emailResult.success })
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
    const allowedActions = ["Confirm", "Complete", "Cancel", "Reschedule"]

    if (!appointmentId || !allowedActions.includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid appointment action" }, { status: 400 })
    }

    if (action === "Reschedule") {
      const sessionId = Number(body.sessionId)
      const requestedTime = typeof body.appointmentTime === "string" ? body.appointmentTime.trim().slice(0, 5) : ""

      if (!sessionId) {
        return NextResponse.json({ success: false, error: "Please select an available session." }, { status: 400 })
      }

      const appointment = await prisma.appointment.findFirst({
        where: {
          appointment_id: appointmentId,
          OR: [{ user_id: user.id }, { doctor: { user_id: user.id } }],
        },
        select: {
          appointment_id: true,
          appointment_status: true,
          session_id: true,
          doctor_id: true,
          user_id: true,
          appointment_type: true,
          reason_for_visit: true,
          contact_number: true,
          user: { select: { name: true, email: true } },
          doctor: {
            select: {
              doctor_id: true,
              first_name: true,
              last_name: true,
              user: { select: { id: true } },
            },
          },
        },
      })

      if (!appointment) {
        return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 })
      }

      const isDoctorActor = appointment.doctor?.user?.id === user.id
      const currentStatus = String(appointment.appointment_status || "").trim().toLowerCase()
      if (["cancelled", "canceled", "completed"].includes(currentStatus)) {
        return NextResponse.json({ success: false, error: "This appointment can no longer be rescheduled." }, { status: 400 })
      }

      if (isDoctorActor && !reasonCancel) {
        return NextResponse.json({ success: false, error: "Please provide a reason for cancellation." }, { status: 400 })
      }

      const sessionRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT
          session_id,
          doctor_id,
          slots,
          status,
          to_char(session_date, 'YYYY-MM-DD') AS session_date,
          to_char(start_time, 'HH24:MI') AS start_time,
          to_char(end_time, 'HH24:MI') AS end_time
         FROM "session_tbl"
         WHERE session_id = $1
         LIMIT 1`,
        sessionId,
      )

      const session = sessionRows[0]
      if (!session) {
        return NextResponse.json({ success: false, error: "Selected session is not available for this doctor." }, { status: 400 })
      }

      if (isDoctorActor && Number(session.doctor_id) !== Number(appointment.doctor_id)) {
        return NextResponse.json({ success: false, error: "Please choose one of your own available session times." }, { status: 400 })
      }

      const sessionStatus = String(session.status ?? "Active").trim().toLowerCase()
      if (sessionStatus === "inactive" || sessionStatus === "cancelled") {
        return NextResponse.json({ success: false, error: "This session is inactive or not available." }, { status: 400 })
      }

      const sessionDate = String(session.session_date ?? "").slice(0, 10)
      const startTime = String(session.start_time ?? "").slice(0, 5)
      const endTime = String(session.end_time ?? "").slice(0, 5)
      const appointmentTime = /^\d{1,2}:\d{2}$/.test(requestedTime) ? requestedTime : startTime

      if (appointmentTime) {
        const selectedMinutes = parseTimeToMinutes(appointmentTime)
        const startMinutes = parseTimeToMinutes(startTime)
        const endMinutes = parseTimeToMinutes(endTime)
        if (
          selectedMinutes === null ||
          startMinutes === null ||
          endMinutes === null ||
          selectedMinutes < startMinutes ||
          selectedMinutes >= endMinutes
        ) {
          return NextResponse.json({ success: false, error: "Please choose a time within the selected session." }, { status: 400 })
        }
      }

      if (Number(appointment.session_id) !== sessionId) {
        const capacity = parsePositiveInteger(session.slots)
        const bookedCountRows = await prisma.$queryRawUnsafe<any[]>(
          `SELECT COALESCE(COUNT(appointment_id), 0)::int AS booked_count
           FROM "appointment"
           WHERE session_id = $1
             AND appointment_id <> $2
             AND LOWER(COALESCE(appointment_status, '')) NOT IN ('cancelled', 'canceled')`,
          sessionId,
          appointmentId,
        )
        const remaining = Number(capacity ?? 0) - Number(bookedCountRows[0]?.booked_count ?? 0)
        if (remaining <= 0) {
          return NextResponse.json({ success: false, error: "No slots available for the selected session." }, { status: 400 })
        }
      }

      const nextDoctorId = Number(session.doctor_id)

      const conflict = await prisma.$queryRawUnsafe<any[]>(
        `SELECT 1
         FROM "appointment" a
         JOIN "session_tbl" s ON s.session_id = a.session_id
         WHERE a.user_id = $1
           AND s.doctor_id = $2
           AND s.session_date = $3::date
           AND a.appointment_id <> $4
           AND LOWER(COALESCE(a.appointment_status, '')) NOT IN ('cancelled', 'canceled')
         LIMIT 1`,
        appointment.user_id,
        nextDoctorId,
        sessionDate,
        appointmentId,
      )

      if (conflict?.length) {
        return NextResponse.json({
          success: false,
          error: isDoctorActor
            ? "This patient already has an appointment with you on that date."
            : "You already have an appointment with this doctor on that date.",
        }, { status: 409 })
      }

      if (appointmentTime) {
        const takenTime = await prisma.$queryRawUnsafe<any[]>(
          `SELECT 1
           FROM "appointment" a
           JOIN "session_tbl" s ON s.session_id = a.session_id
           WHERE s.doctor_id = $1
             AND s.session_date = $2::date
             AND to_char(a.appointment_time, 'HH24:MI') = $3
             AND a.appointment_id <> $4
             AND LOWER(COALESCE(a.appointment_status, '')) NOT IN ('cancelled', 'canceled')
           LIMIT 1`,
          nextDoctorId,
          sessionDate,
          appointmentTime,
          appointmentId,
        )

        if (takenTime?.length) {
          return NextResponse.json({ success: false, error: "That time is already booked. Please choose another slot." }, { status: 409 })
        }
      }

      await prisma.$executeRawUnsafe(
        `UPDATE "appointment"
         SET session_id = $1,
             doctor_id = $2,
             appointment_date = $3::date,
             appointment_time = $4::time,
             appointment_status = 'Pending',
             reason_cancel = CASE WHEN $6 <> '' THEN $6 ELSE reason_cancel END,
             updated_at = now()
         WHERE appointment_id = $5`,
        sessionId,
        nextDoctorId,
        sessionDate,
        appointmentTime ? `${appointmentTime}:00` : null,
        appointmentId,
        reasonCancel,
      )

      const doctorName = [appointment.doctor?.first_name, appointment.doctor?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim()
      const rescheduleDetails = {
        patientName: appointment.user?.name ?? undefined,
        doctorName,
        date: sessionDate,
        time: appointmentTime,
        appointmentType: appointment.appointment_type,
        reasonForVisit: appointment.reason_for_visit,
        cancelReason: reasonCancel || null,
      }

      const emailResult = isDoctorActor
        ? await sendAppointmentRescheduledEmail(appointment.user?.email ?? null, rescheduleDetails)
        : { success: false, reason: "skipped" }

      if (isDoctorActor && !emailResult.success) {
        console.warn("Appointment rescheduled, email skipped or failed:", emailResult)
      }

      await logActivity({
        actor: user,
        action: "Rescheduled appointment",
        details: `Date: ${sessionDate}${appointmentTime ? ` · Time: ${appointmentTime}` : ""}`,
        entityType: "appointment",
        entityId: appointmentId,
      })

      return NextResponse.json({
        success: true,
        status: "Pending",
        date: sessionDate,
        time: appointmentTime,
        emailSent: emailResult.success,
      })
    }

    const shouldCancel = action === "Cancel"
    // Either side may cancel; only the assigned doctor may confirm or complete.
    const accessScope = shouldCancel
      ? { OR: [{ user_id: user.id }, { doctor: { user_id: user.id } }] }
      : { doctor: { user_id: user.id } }

    const appointment = await prisma.appointment.findFirst({
      where: { appointment_id: appointmentId, ...accessScope },
      select: {
        appointment_id: true,
        appointment_status: true,
        reason_cancel: true,
        appointment_type: true,
        reason_for_visit: true,
        appointment_date: true,
        appointment_time: true,
        contact_number: true,
        user_id: true,
        user: { select: { name: true, email: true } },
        doctor: {
          select: {
            first_name: true,
            last_name: true,
            user: { select: { id: true, email: true, name: true } },
          },
        },
        session_tbl: { select: { session_date: true, start_time: true } },
      },
    })

    if (!appointment) {
      return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 })
    }

    const normalizedStatus = String(appointment.appointment_status || "Pending").trim()
    const normalizedStatusKey = normalizedStatus.toLowerCase()
    const isClientActor = appointment.user_id === user.id
    const isDoctorActor = appointment.doctor?.user?.id === user.id
    const isCancelRequest = shouldCancel && isClientActor && !isDoctorActor
    const targetStatus = isCancelRequest
      ? "Cancel Requested"
      : shouldCancel
        ? "Cancelled"
        : action === "Confirm"
          ? "Confirmed"
          : "Completed"

    if (normalizedStatusKey === "cancelled" || normalizedStatusKey === "canceled") {
      return NextResponse.json({ success: false, error: "Cannot update a cancelled appointment" }, { status: 400 })
    }

    if (isCancelRequest && (normalizedStatusKey === "cancel requested" || normalizedStatusKey === "awaiting cancellation")) {
      return NextResponse.json({
        success: true,
        status: normalizedStatus,
        awaitingApproval: true,
      })
    }

    if (normalizedStatus === targetStatus) {
      return NextResponse.json({ success: true, status: normalizedStatus })
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { appointment_id: appointmentId },
      data: {
        appointment_status: targetStatus,
        updated_at: new Date(),
        ...(shouldCancel && reasonCancel ? { reason_cancel: reasonCancel } : {}),
        ...(shouldCancel && !reasonCancel && appointment.reason_cancel ? {} : {}),
      },
    })

    const doctorName = [appointment.doctor?.first_name, appointment.doctor?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim()
    const statusDetails = {
      patientName: appointment.user?.name ?? undefined,
      doctorName,
      date: isoDatePart(appointment.appointment_date ?? appointment.session_tbl?.session_date),
      time: isoTimePart(appointment.appointment_time ?? appointment.session_tbl?.start_time),
      appointmentType: appointment.appointment_type,
      reasonForVisit: appointment.reason_for_visit,
      cancelReason: shouldCancel ? reasonCancel || appointment.reason_cancel : null,
    }

    const [smsResult, emailResult] = isCancelRequest
      ? [{ success: false, reason: "skipped" }, await sendCancellationRequestEmail(appointment.doctor?.user?.email ?? null, statusDetails)]
      : await Promise.all([
          sendAppointmentSms(appointment.contact_number, statusDetails, targetStatus as "Confirmed" | "Completed" | "Cancelled"),
          sendAppointmentStatusEmail(
            appointment.user?.email ?? null,
            targetStatus as "Confirmed" | "Completed" | "Cancelled",
            statusDetails
          ),
        ])

    if (!smsResult.success && !isCancelRequest) {
      console.warn(`Appointment ${targetStatus.toLowerCase()}, SMS skipped or failed:`, smsResult)
    }

    if (!emailResult.success) {
      console.warn(`Appointment ${targetStatus.toLowerCase()}, email skipped or failed:`, emailResult)
    }

    await logActivity({
      actor: user,
      action: isCancelRequest ? "Requested appointment cancellation" : `${targetStatus} appointment`,
      details: `Patient: ${appointment.user?.name ?? "Unknown"}`,
      entityType: "appointment",
      entityId: appointmentId,
    })

    return NextResponse.json({
      success: true,
      status: updatedAppointment.appointment_status,
      awaitingApproval: isCancelRequest,
      emailSent: emailResult.success,
      smsSent: isCancelRequest ? false : smsResult.success,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
