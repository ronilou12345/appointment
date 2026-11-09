import prisma from "@/lib/prisma"
import { ensureWalkInAddressColumn } from "@/lib/walk-in"
import { WalkInRecordsClient, type WalkInRecordRow } from "./walk-in-records-client"

export default async function WalkInRecordsPage() {
  await ensureWalkInAddressColumn()

  const records = await prisma.$queryRaw<WalkInRecordRow[]>`
      SELECT
        w.appointment_id::text AS id,
        w.patient_name AS "patientName",
        COALESCE(w.address, '') AS address,
        COALESCE(w.email, '') AS email,
        COALESCE(a.contact_number, '') AS "contactNumber",
        COALESCE(NULLIF(concat_ws(' ', d.prefix, d.first_name, d.middle_name, d.last_name), ''), NULLIF(w.doctor_name, ''), 'Unassigned') AS "doctorName",
        COALESCE(d.board_certification, '') AS "doctorBoardCertification",
        COALESCE(d.signature, '') AS "doctorSignature",
        COALESCE(a.age::text, '') AS age,
        COALESCE(a.gender, '') AS gender,
        COALESCE(w.civil_status, '') AS "civilStatus",
        COALESCE(to_char(w.birthday, 'YYYY-MM-DD'), '') AS birthday,
        to_char(w.appointment_date, 'YYYY-MM-DD') AS "appointmentDate",
        COALESCE(to_char(a.appointment_time, 'HH24:MI'), to_char(s.start_time, 'HH24:MI'), '') AS "appointmentTime",
        COALESCE(a.appointment_type, s.appointment_type, 'General Consultation') AS "appointmentType",
        COALESCE(a.reason_for_visit, '') AS "reasonForVisit",
        COALESCE(a.symptoms, '') AS symptoms,
        COALESCE(a.duration_of_symptoms, '') AS "durationOfSymptoms",
        COALESCE(a.pain_level::text, '') AS "painLevel",
        COALESCE(a.additional_notes, '') AS "additionalNotes",
        COALESCE(w.blood_pressure, '') AS "bloodPressure",
        COALESCE(w.temperature::text, '') AS temperature,
        COALESCE(w.oxygen_saturation::text, '') AS "oxygenSaturation",
        COALESCE(w.pulse_rate::text, '') AS "pulseRate",
        COALESCE(w.weight::text, '') AS weight,
        COALESCE(w.height::text, '') AS height,
        COALESCE(w.bmi::text, '') AS bmi,
        COALESCE(sn.chief_complaints, '') AS "chiefComplaints",
        COALESCE(sn.diagnosis, '') AS diagnosis,
        COALESCE(sn.prescription, '') AS prescription,
        CASE
          WHEN LOWER(COALESCE(a.appointment_status, '')) IN ('', 'pending') THEN 'Waiting'
          ELSE a.appointment_status
        END AS status
      FROM public.walk_in w
      INNER JOIN public.appointment a ON a.appointment_id = w.appointment_id
      LEFT JOIN public.doctor d ON d.doctor_id = a.doctor_id
      LEFT JOIN public.session_tbl s ON s.session_id = a.session_id
      LEFT JOIN LATERAL (
        SELECT chief_complaints, diagnosis, prescription
        FROM public.soap_notes
        WHERE appointment_id = a.appointment_id
        ORDER BY created_at DESC
        LIMIT 1
      ) sn ON TRUE
      ORDER BY w.appointment_date DESC, w.created_at DESC
    `

  return (
    <div className="min-h-screen w-full bg-background p-6 text-foreground">
      <WalkInRecordsClient records={records} />
    </div>
  )
}
