import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import { normalizeUserRole } from "@/lib/user-role"
import { ensureWalkInAddressColumn } from "@/lib/walk-in"
import { DoctorWalkInClient, type DoctorWalkInRow } from "./walk-in-client"

async function getDoctorWalkIns(userId: string): Promise<DoctorWalkInRow[]> {
  const doctor = await prisma.doctor.findUnique({
    where: { user_id: userId },
    select: { doctor_id: true },
  })

  if (!doctor) return []

  try {
    await ensureWalkInAddressColumn()
    const rows = await prisma.$queryRawUnsafe<DoctorWalkInRow[]>(
      `SELECT
        w.appointment_id::text AS id,
        a.doctor_id::text AS "doctorId",
        a.session_id::text AS "sessionId",
        w.patient_name AS "patientName",
        COALESCE(w.address, '') AS address,
        to_char(w.appointment_date, 'YYYY-MM-DD') AS "appointmentDate",
        COALESCE(to_char(a.appointment_time, 'HH24:MI'), to_char(s.start_time, 'HH24:MI'), '') AS "appointmentTime",
        COALESCE(a.appointment_type, 'General Consultation') AS "appointmentType",
        COALESCE(concat_ws(' ', d.prefix, d.first_name, d.middle_name, d.last_name), '') AS "doctorName",
        COALESCE(d.signature, '') AS "doctorSignature",
        COALESCE(d.license_number, '') AS "doctorLicenseNumber",
        CASE
          WHEN LOWER(COALESCE(a.appointment_status, '')) IN ('', 'pending') THEN 'Waiting'
          ELSE a.appointment_status
        END AS status,
        COALESCE(a.age::text, '') AS age,
        COALESCE(a.gender, '') AS gender,
        COALESCE(a.reason_for_visit, '') AS "reasonForVisit",
        COALESCE(a.symptoms, '') AS symptoms,
        COALESCE(a.duration_of_symptoms, '') AS "durationOfSymptoms",
        COALESCE(a.pain_level::text, '') AS "painLevel",
        COALESCE(a.additional_notes, '') AS "additionalNotes",
        COALESCE(to_char(w.birthday, 'YYYY-MM-DD'), '') AS birthday,
        COALESCE(w.civil_status, '') AS "civilStatus",
        COALESCE(a.contact_number, '') AS "contactNumber",
        COALESCE(w.email, '') AS email,
        COALESCE(w.blood_pressure, '') AS "bloodPressure",
        COALESCE(w.temperature::text, '') AS temperature,
        COALESCE(w.oxygen_saturation::text, '') AS "oxygenSaturation",
        COALESCE(w.pulse_rate::text, '') AS "pulseRate",
        COALESCE(w.weight::text, '') AS weight,
        COALESCE(w.height::text, '') AS height,
        COALESCE(w.bmi::text, '') AS bmi
      FROM public.walk_in w
      INNER JOIN appointment a ON a.appointment_id = w.appointment_id
      INNER JOIN doctor d ON d.doctor_id = a.doctor_id
      LEFT JOIN session_tbl s ON s.session_id = a.session_id
      WHERE a.doctor_id = $1
      ORDER BY w.appointment_date DESC, w.created_at DESC`,
      doctor.doctor_id,
    )

    return rows
  } catch (error) {
    console.error("Doctor walk-in query failed:", error)
    return []
  }
}

export default async function Page() {
  const session = await getSession()
  if (!session?.id || normalizeUserRole(session.role) !== "DOCTOR") {
    redirect("/login")
  }

  const walkIns = await getDoctorWalkIns(session.id)

  return (
    <div className="min-h-screen w-full bg-background p-6 text-foreground">
      <DoctorWalkInClient walkIns={walkIns} />
    </div>
  )
}