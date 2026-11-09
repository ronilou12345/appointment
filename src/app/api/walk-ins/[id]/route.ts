import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import { normalizeUserRole } from "@/lib/user-role"
import prisma from "@/lib/prisma"
import { ensureWalkInAddressColumn } from "@/lib/walk-in"

type RouteContext = { params: Promise<{ id: string }> }

function parseId(value: string) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function parseOptionalNumber(value: unknown, label: string, integer = false) {
  const text = String(value ?? "").trim()
  if (!text) return null
  const number = Number(text)
  if (!Number.isFinite(number) || number < 0 || (integer && !Number.isInteger(number))) {
    throw new Error(`${label} must be a valid non-negative ${integer ? "whole number" : "number"}.`)
  }
  return number
}

function cleanText(value: unknown, label: string, maxLength: number) {
  const text = String(value ?? "").trim()
  if (text.length > maxLength) throw new Error(`${label} must be ${maxLength} characters or fewer.`)
  return text
}

function isValidDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const [, year, month, day] = match.map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

async function authorizeWalkIn(id: number) {
  const user = await getSession()
  if (!user?.id) return { response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }) }

  const role = normalizeUserRole(user.role)
  if (role !== "ADMIN" && role !== "DOCTOR") {
    return { response: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }) }
  }

  const rows = await prisma.$queryRaw<{ appointment_id: number }[]>`
    SELECT a.appointment_id
    FROM public.appointment a
    INNER JOIN public.walk_in w ON w.appointment_id = a.appointment_id
    LEFT JOIN public.doctor d ON d.doctor_id = a.doctor_id
    WHERE a.appointment_id = ${id}
      AND (${role} = 'ADMIN' OR d.user_id = ${user.id})
    LIMIT 1
  `
  if (!rows.length) {
    return { response: NextResponse.json({ success: false, error: "Walk-in record not found" }, { status: 404 }) }
  }

  return { user, role }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const id = parseId((await params).id)
    if (!id) return NextResponse.json({ success: false, error: "Invalid walk-in record ID" }, { status: 400 })

    const access = await authorizeWalkIn(id)
    if ("response" in access) return access.response

    const body = await request.json() as Record<string, unknown>
    const patientName = cleanText(body.patientName, "Patient name", 200)
    if (!patientName) return NextResponse.json({ success: false, error: "Patient name is required." }, { status: 400 })

    const email = cleanText(body.email, "Email", 320)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "Enter a valid email address." }, { status: 400 })
    }
    const contactNumber = cleanText(body.contactNumber, "Contact number", 20)
    const address = cleanText(body.address, "Address", 500)
    const birthday = cleanText(body.birthday, "Birthday", 10)
    const appointmentDate = cleanText(body.appointmentDate, "Appointment date", 10)
    const appointmentTime = cleanText(body.appointmentTime, "Appointment time", 5)
    if (birthday && !isValidDate(birthday)) {
      return NextResponse.json({ success: false, error: "Enter a valid birthday." }, { status: 400 })
    }
    if (appointmentDate && !isValidDate(appointmentDate)) {
      return NextResponse.json({ success: false, error: "Enter a valid appointment date." }, { status: 400 })
    }
    const [hours, minutes] = appointmentTime.split(":").map(Number)
    if (appointmentTime && (!/^\d{2}:\d{2}$/.test(appointmentTime) || hours > 23 || minutes > 59)) {
      return NextResponse.json({ success: false, error: "Enter a valid appointment time." }, { status: 400 })
    }

    const age = parseOptionalNumber(body.age, "Age", true)
    const painLevel = parseOptionalNumber(body.painLevel, "Pain level", true)
    const temperature = parseOptionalNumber(body.temperature, "Temperature")
    const oxygenSaturation = parseOptionalNumber(body.oxygenSaturation, "Oxygen saturation")
    const pulseRate = parseOptionalNumber(body.pulseRate, "Pulse rate", true)
    const weight = parseOptionalNumber(body.weight, "Weight")
    const height = parseOptionalNumber(body.height, "Height")
    const bmi = parseOptionalNumber(body.bmi, "BMI")
    if (painLevel !== null && painLevel > 10) {
      return NextResponse.json({ success: false, error: "Pain level must be between 0 and 10." }, { status: 400 })
    }
    if (oxygenSaturation !== null && oxygenSaturation > 100) {
      return NextResponse.json({ success: false, error: "Oxygen saturation cannot exceed 100%." }, { status: 400 })
    }

    const civilStatus = cleanText(body.civilStatus, "Civil status", 50)
    const gender = cleanText(body.gender, "Gender", 20)
    const appointmentType = cleanText(body.appointmentType, "Appointment type", 200)
    const reasonForVisit = cleanText(body.reasonForVisit, "Reason for visit", 2000)
    const symptoms = cleanText(body.symptoms, "Symptoms", 5000)
    const durationOfSymptoms = cleanText(body.durationOfSymptoms, "Duration of symptoms", 100)
    const additionalNotes = cleanText(body.additionalNotes, "Additional notes", 5000)
    const bloodPressure = cleanText(body.bloodPressure, "Blood pressure", 50)

    await ensureWalkInAddressColumn()
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE public.appointment
        SET age = ${age}::int,
            gender = ${gender},
            contact_number = ${contactNumber},
            appointment_type = ${appointmentType},
            appointment_date = ${appointmentDate || null}::date,
            appointment_time = ${appointmentTime || null}::time,
            reason_for_visit = ${reasonForVisit},
            symptoms = ${symptoms},
            duration_of_symptoms = ${durationOfSymptoms},
            pain_level = ${painLevel}::int,
            additional_notes = ${additionalNotes},
            updated_at = NOW()
        WHERE appointment_id = ${id}
      `
      await tx.$executeRaw`
        UPDATE public.walk_in
        SET patient_name = ${patientName},
            address = ${address},
            email = ${email},
            birthday = ${birthday || null}::date,
            civil_status = ${civilStatus},
            appointment_date = ${appointmentDate || null}::date,
            blood_pressure = ${bloodPressure},
            temperature = ${temperature},
            oxygen_saturation = ${oxygenSaturation},
            pulse_rate = ${pulseRate}::int,
            weight = ${weight},
            height = ${height},
            bmi = ${bmi}
        WHERE appointment_id = ${id}
      `
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update walk-in record."
    const status = message.includes("must be") || message.includes("valid") || message.includes("required") ? 400 : 500
    if (status === 500) console.error("Walk-in record update failed:", error)
    return NextResponse.json({ success: false, error: message }, { status })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const id = parseId((await params).id)
    if (!id) return NextResponse.json({ success: false, error: "Invalid walk-in record ID" }, { status: 400 })

    const access = await authorizeWalkIn(id)
    if ("response" in access) return access.response

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`DELETE FROM public.walk_in WHERE appointment_id = ${id}`
      await tx.appointment.delete({ where: { appointment_id: id } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Walk-in record deletion failed:", error)
    return NextResponse.json({ success: false, error: "Unable to delete walk-in record." }, { status: 500 })
  }
}
