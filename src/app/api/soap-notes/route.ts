import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { normalizeNextFollowUp } from "@/lib/utils"
import { logCurrentUserActivity } from "@/lib/activity-log"
import { getSession } from "@/lib/auth-utils"
import { normalizeUserRole } from "@/lib/user-role"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const role = normalizeUserRole(session.role)
    if (role !== "ADMIN" && role !== "DOCTOR") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const {
      appointmentId,
      chiefComplaints,
      physicalExamination,
      diagnosis,
      prescription,
      nextFollowUp,
    } = body || {}

    const parsedAppointmentId = Number(appointmentId)
    if (!Number.isInteger(parsedAppointmentId) || parsedAppointmentId <= 0 || !chiefComplaints || !diagnosis) {
      return NextResponse.json(
        { success: false, error: "Appointment ID, chief complaints, and diagnosis are required." },
        { status: 400 }
      )
    }

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.soap_notes (
        soap_id BIGSERIAL PRIMARY KEY,
        appointment_id INTEGER NOT NULL,
        chief_complaints TEXT NOT NULL,
        physical_examination TEXT,
        diagnosis TEXT NOT NULL,
        prescription TEXT,
        next_follow_up TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    const nextFollowUpValue = normalizeNextFollowUp(nextFollowUp)
    const note = await prisma.$transaction(async (tx) => {
      const appointments = await tx.$queryRawUnsafe<{
        appointment_status: string | null
        relationship: string | null
      }[]>(
        `SELECT a.appointment_status, a.relationship
         FROM public.appointment a
         INNER JOIN public.doctor d ON d.doctor_id = a.doctor_id
         WHERE a.appointment_id = $1
           AND ($2 = 'ADMIN' OR d.user_id = $3)
         FOR UPDATE OF a`,
        parsedAppointmentId,
        role,
        session.id,
      )

      const appointment = appointments[0]
      if (!appointment) {
        throw new Error("Appointment not found or you do not have permission to add a SOAP note.")
      }

      const isWalkIn = String(appointment.relationship ?? "").trim().toLowerCase().startsWith("walk-in")
      if (!isWalkIn && String(appointment.appointment_status ?? "").trim().toLowerCase() !== "confirmed") {
        throw new Error("A SOAP note can only be added after the appointment is confirmed.")
      }

      const existingNotes = await tx.$queryRawUnsafe<{ soap_id: number }[]>(
        `SELECT soap_id
         FROM public.soap_notes
         WHERE appointment_id = $1
         LIMIT 1`,
        parsedAppointmentId,
      )
      if (existingNotes.length) {
        throw new Error("A SOAP note already exists for this appointment.")
      }

      await tx.$executeRawUnsafe(
        `INSERT INTO public.soap_notes (
           appointment_id,
           chief_complaints,
           physical_examination,
           diagnosis,
           prescription,
           next_follow_up,
           created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        parsedAppointmentId,
        String(chiefComplaints),
        physicalExamination ? String(physicalExamination) : null,
        String(diagnosis),
        prescription ? String(prescription) : null,
        nextFollowUpValue,
      )

      return { appointmentId: parsedAppointmentId }
    })

    await logCurrentUserActivity("Saved SOAP note", `Appointment #${note.appointmentId}`, {
      type: "appointment",
      id: note.appointmentId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("SOAP note save failed", error)
    const message = error instanceof Error ? error.message : "Unable to save SOAP note"
    if (message === "A SOAP note already exists for this appointment.") {
      return NextResponse.json({ success: false, error: message }, { status: 409 })
    }
    if (message === "A SOAP note can only be added after the appointment is confirmed.") {
      return NextResponse.json({ success: false, error: message }, { status: 409 })
    }
    if (message.startsWith("Appointment not found")) {
      return NextResponse.json({ success: false, error: message }, { status: 404 })
    }
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
 
 export async function GET(request: Request) {
   try {
     const url = new URL(request.url)
     const appointmentId = url.searchParams.get("appointmentId")
     if (!appointmentId) {
       return NextResponse.json({ success: false, error: "appointmentId is required" }, { status: 400 })
     }
 
     const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT soap_id AS id, appointment_id, chief_complaints, physical_examination, diagnosis, prescription, next_follow_up, created_at
       FROM public.soap_notes
       WHERE appointment_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
       Number(appointmentId)
     )
 
     return NextResponse.json({ success: true, note: rows[0] ?? null })
   } catch (error) {
     console.error("SOAP note GET failed", error)
     return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to load SOAP note" }, { status: 500 })
   }
 }
 
 export async function PATCH(request: Request) {
   try {
     const body = await request.json()
     const { id, appointmentId, chiefComplaints, physicalExamination, diagnosis, prescription, nextFollowUp } = body || {}
 
     // Resolve target note id: prefer explicit id, otherwise latest for appointmentId
     let targetId = id
     if (!targetId) {
       if (!appointmentId) {
         return NextResponse.json({ success: false, error: "id or appointmentId is required" }, { status: 400 })
       }
      const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT soap_id AS id FROM public.soap_notes WHERE appointment_id = $1 ORDER BY created_at DESC LIMIT 1`, Number(appointmentId))
       targetId = rows[0]?.id
       if (!targetId) {
         return NextResponse.json({ success: false, error: "No existing SOAP note found for appointment" }, { status: 404 })
       }
     }

     const nextFollowUpValue = normalizeNextFollowUp(nextFollowUp)
 
     await prisma.$executeRawUnsafe(
      `UPDATE public.soap_notes SET chief_complaints = $1, physical_examination = $2, diagnosis = $3, prescription = $4, next_follow_up = $5, updated_at = NOW() WHERE soap_id = $6`,
       String(chiefComplaints),
       physicalExamination ? String(physicalExamination) : null,
       String(diagnosis),
       prescription ? String(prescription) : null,
       nextFollowUpValue,
       Number(targetId)
     )

     await logCurrentUserActivity("Updated SOAP note", `Appointment #${appointmentId ?? targetId}`, {
       type: "soap_note",
       id: targetId,
     })

     return NextResponse.json({ success: true })
   } catch (error) {
     console.error("SOAP note update failed", error)
     return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unable to update SOAP note" }, { status: 500 })
   }
}

export async function DELETE(request: Request) {
    try {
      const session = await getSession()
      if (!session?.id) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
      }

      const role = normalizeUserRole(session.role)
      if (role !== "ADMIN" && role !== "DOCTOR") {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
      }

      const id = Number(new URL(request.url).searchParams.get("id"))
      if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json({ success: false, error: "A valid SOAP note ID is required." }, { status: 400 })
      }

      const notes = await prisma.$queryRawUnsafe<{ appointment_id: number }[]>(
        `SELECT sn.appointment_id
         FROM public.soap_notes sn
         INNER JOIN public.appointment a ON a.appointment_id = sn.appointment_id
         LEFT JOIN public.doctor d ON d.doctor_id = a.doctor_id
         WHERE sn.soap_id = $1
           AND ($2 = 'ADMIN' OR d.user_id = $3)
         LIMIT 1`,
        id,
        role,
        session.id,
      )

      if (!notes.length) {
        return NextResponse.json({ success: false, error: "SOAP note not found." }, { status: 404 })
      }

      await prisma.$executeRawUnsafe(`DELETE FROM public.soap_notes WHERE soap_id = $1`, id)

      await logCurrentUserActivity("Deleted SOAP note", `Appointment #${notes[0].appointment_id}`, {
        type: "soap_note",
        id,
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("SOAP note deletion failed", error)
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : "Unable to delete SOAP note." },
        { status: 500 },
      )
    }
 }
