import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { normalizeNextFollowUp } from "@/lib/utils"
import { logCurrentUserActivity } from "@/lib/activity-log"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      appointmentId,
      chiefComplaints,
      physicalExamination,
      diagnosis,
      prescription,
      nextFollowUp,
    } = body || {}

    if (!appointmentId || !chiefComplaints || !diagnosis) {
      return NextResponse.json(
        { success: false, error: "Appointment ID, chief complaints, and diagnosis are required." },
        { status: 400 }
      )
    }

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.soap_notes (
        id BIGSERIAL PRIMARY KEY,
        appointment_id INTEGER NOT NULL,
        chief_complaints TEXT NOT NULL,
        physical_examination TEXT,
        diagnosis TEXT NOT NULL,
        prescription TEXT,
        next_follow_up TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // Normalize nextFollowUp as free text (DB column is VARCHAR)
    const nextFollowUpValue = normalizeNextFollowUp(nextFollowUp)

    const note = await prisma.$executeRawUnsafe(
      `
        INSERT INTO public.soap_notes (
          appointment_id,
          chief_complaints,
          physical_examination,
          diagnosis,
          prescription,
          next_follow_up,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `,
      Number(appointmentId),
      String(chiefComplaints),
      physicalExamination ? String(physicalExamination) : null,
      String(diagnosis),
      prescription ? String(prescription) : null,
      nextFollowUpValue
    )

    await logCurrentUserActivity("Saved SOAP note", `Appointment #${appointmentId}`, {
      type: "appointment",
      id: appointmentId,
    })

    return NextResponse.json({ success: true, note })
  } catch (error) {
    console.error("SOAP note save failed", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unable to save SOAP note" },
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
       `SELECT * FROM public.soap_notes WHERE appointment_id = $1 ORDER BY created_at DESC LIMIT 1`,
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
       const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT id FROM public.soap_notes WHERE appointment_id = $1 ORDER BY created_at DESC LIMIT 1`, Number(appointmentId))
       targetId = rows[0]?.id
       if (!targetId) {
         return NextResponse.json({ success: false, error: "No existing SOAP note found for appointment" }, { status: 404 })
       }
     }
 
     const nextFollowUpValue = normalizeNextFollowUp(nextFollowUp)
 
     await prisma.$executeRawUnsafe(
       `UPDATE public.soap_notes SET chief_complaints = $1, physical_examination = $2, diagnosis = $3, prescription = $4, next_follow_up = $5 WHERE id = $6`,
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
