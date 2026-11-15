import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import { normalizeUserRole } from "@/lib/user-role"
import { ensureWalkInAddressColumn } from "@/lib/walk-in"
import SOAPSheet from "@/components/soap-sheet"
import { MedicalHistoryTable, type MedicalHistoryEntry } from "./medical-history-table"
import { SoapSummaryTable, type WalkInSoapNote } from "./soap-summary-table"

type Props = {
  params: Promise<{ id: string }>
}

type WalkInDetails = {
  patientName: string
  address: string
  birthday: string
  civilStatus: string
  email: string
  doctorName: string
  appointmentDate: string
  appointmentTime: string
  appointmentType: string
  status: string
  age: string
  gender: string
  contactNumber: string
  bloodPressure: string
  temperature: string
  oxygenSaturation: string
  pulseRate: string
  weight: string
  height: string
  bmi: string
  reasonForVisit: string
  symptoms: string
  additionalNotes: string
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-medium">{value || "—"}</p>
    </div>
  )
}

export default async function DoctorWalkInDetailsPage({ params }: Props) {
  const session = await getSession()
  if (!session?.id || normalizeUserRole(session.role) !== "DOCTOR") {
    redirect("/login")
  }

  const { id } = await params
  const appointmentId = Number(id)
  if (!Number.isInteger(appointmentId) || appointmentId <= 0) notFound()

  await ensureWalkInAddressColumn()
  const rows = await prisma.$queryRawUnsafe<WalkInDetails[]>(
    `SELECT
      w.patient_name AS "patientName",
      COALESCE(w.address, '') AS address,
      COALESCE(to_char(w.birthday, 'YYYY-MM-DD'), '') AS birthday,
      COALESCE(w.civil_status, '') AS "civilStatus",
      COALESCE(w.email, '') AS email,
      concat_ws(' ', d.first_name, d.middle_name, d.last_name) AS "doctorName",
      to_char(w.appointment_date, 'YYYY-MM-DD') AS "appointmentDate",
      COALESCE(to_char(a.appointment_time, 'HH24:MI'), to_char(s.start_time, 'HH24:MI'), '') AS "appointmentTime",
      COALESCE(a.appointment_type, s.appointment_type, 'General Consultation') AS "appointmentType",
      COALESCE(a.appointment_status, 'Pending') AS status,
      COALESCE(a.age::text, '') AS age,
      COALESCE(a.gender, '') AS gender,
      COALESCE(a.contact_number, '') AS "contactNumber",
      COALESCE(w.blood_pressure, '') AS "bloodPressure",
      COALESCE(w.temperature::text, '') AS temperature,
      COALESCE(w.oxygen_saturation::text, '') AS "oxygenSaturation",
      COALESCE(w.pulse_rate::text, '') AS "pulseRate",
      COALESCE(w.weight::text, '') AS weight,
      COALESCE(w.height::text, '') AS height,
      COALESCE(w.bmi::text, '') AS bmi,
      COALESCE(a.reason_for_visit, '') AS "reasonForVisit",
      COALESCE(a.symptoms, '') AS symptoms,
      COALESCE(a.additional_notes, '') AS "additionalNotes"
    FROM public.walk_in w
    INNER JOIN appointment a ON a.appointment_id = w.appointment_id
    INNER JOIN doctor d ON d.doctor_id = a.doctor_id
    LEFT JOIN session_tbl s ON s.session_id = a.session_id
    WHERE w.appointment_id = $1 AND d.user_id = $2
    LIMIT 1`,
    appointmentId,
    session.id,
  )

  const patient = rows[0]
  if (!patient) notFound()

  const soapNotes = await prisma.$queryRawUnsafe<WalkInSoapNote[]>(
    `SELECT
       sn.soap_id::text AS id,
       sn.appointment_id AS "appointmentId",
       sn.chief_complaints,
       sn.physical_examination,
       sn.diagnosis,
       sn.prescription,
       sn.next_follow_up,
       to_char(sn.created_at, 'Mon. DD, YYYY : FMHH12:MI AM') AS "createdAt",
       concat_ws(E'\\n',
         NULLIF(concat('Temperature: ', w.temperature::text, ' °C'), 'Temperature:  °C'),
         NULLIF(concat('Blood pressure: ', NULLIF(w.blood_pressure, '')), 'Blood pressure: '),
         NULLIF(concat('Pulse rate: ', w.pulse_rate::text, ' bpm'), 'Pulse rate:  bpm'),
         NULLIF(concat('Oxygen saturation: ', w.oxygen_saturation::text, '%'), 'Oxygen saturation: %'),
         NULLIF(concat('Weight: ', w.weight::text, ' kg'), 'Weight:  kg'),
         NULLIF(concat('Height: ', w.height::text, ' cm'), 'Height:  cm')
       ) AS "objectiveVitals"
     FROM public.soap_notes sn
     LEFT JOIN public.walk_in w ON w.appointment_id = sn.appointment_id
     WHERE sn.appointment_id = $1
     ORDER BY sn.created_at DESC, sn.soap_id DESC`,
    appointmentId,
  )
  const appointmentHasSoap = soapNotes.some(
    (note) => Number(note.appointmentId) === appointmentId,
  )

  const medicalHistoryRows = await prisma.$queryRawUnsafe<MedicalHistoryEntry[]>(
    `WITH history_records AS (
       SELECT
         w.appointment_id,
         COALESCE(w.created_at::date, w.appointment_date) AS record_date,
         COALESCE(w.created_at, w.appointment_date + a.appointment_time, w.appointment_date::timestamp) AS record_timestamp,
         COALESCE(NULLIF(concat_ws(' ', d.prefix, d.first_name, d.middle_name, d.last_name), ''), 'Doctor') AS doctor_name,
         w.patient_name AS patient_name,
         concat_ws(' / ', CASE WHEN a.age IS NOT NULL THEN concat(a.age::text, ' years') END, NULLIF(a.gender, '')) AS age_gender,
         COALESCE(w.bmi::text, CASE WHEN w.weight > 0 AND w.height > 0 THEN ROUND(w.weight / POWER(w.height / 100, 2), 1)::text END) AS bmi,
         CASE
           WHEN COALESCE(w.bmi, CASE WHEN w.weight > 0 AND w.height > 0 THEN w.weight / POWER(w.height / 100, 2) END) < 18.5 THEN 'Underweight'
           WHEN COALESCE(w.bmi, CASE WHEN w.weight > 0 AND w.height > 0 THEN w.weight / POWER(w.height / 100, 2) END) < 25 THEN 'Normal weight'
           WHEN COALESCE(w.bmi, CASE WHEN w.weight > 0 AND w.height > 0 THEN w.weight / POWER(w.height / 100, 2) END) < 30 THEN 'Overweight'
           WHEN COALESCE(w.bmi, CASE WHEN w.weight > 0 AND w.height > 0 THEN w.weight / POWER(w.height / 100, 2) END) >= 30 THEN 'Obese'
           ELSE ''
         END AS bmi_category,
         concat_ws(E'\\n',
           NULLIF(concat('Medical history — Chief complaint: ', NULLIF(TRIM(a.reason_for_visit), '')), 'Medical history — Chief complaint: '),
           NULLIF(concat('Medical history — Symptoms: ', NULLIF(TRIM(a.symptoms), '')), 'Medical history — Symptoms: '),
           'Vital signs:',
           concat('BMI: ', COALESCE(w.bmi::text, CASE WHEN w.weight > 0 AND w.height > 0 THEN ROUND(w.weight / POWER(w.height / 100, 2), 1)::text END, '—'), ' kg/m²'),
           concat('Weight: ', COALESCE(w.weight::text, '—'), ' kg'),
           concat('Height: ', COALESCE(w.height::text, '—'), ' cm'),
           concat('Blood pressure: ', COALESCE(w.blood_pressure, '—')),
           concat('Temperature: ', COALESCE(w.temperature::text, '—'), ' °C'),
           concat('Oxygen saturation: ', COALESCE(w.oxygen_saturation::text, '—'), '%'),
           concat('Pulse rate: ', COALESCE(w.pulse_rate::text, '—'), ' bpm')
         ) AS details,
         0 AS sort_order
       FROM public.walk_in w
       INNER JOIN appointment a ON a.appointment_id = w.appointment_id
       INNER JOIN doctor d ON d.doctor_id = a.doctor_id
       WHERE d.user_id = $1
         AND (
           w.bmi IS NOT NULL OR w.weight IS NOT NULL OR w.height IS NOT NULL
           OR w.blood_pressure IS NOT NULL OR w.temperature IS NOT NULL
           OR w.oxygen_saturation IS NOT NULL OR w.pulse_rate IS NOT NULL
         )
         AND (
           ($2 <> '' AND LOWER(TRIM(COALESCE(w.email, ''))) = LOWER(TRIM($2)))
           OR ($2 = '' AND LOWER(TRIM(w.patient_name)) = LOWER(TRIM($3)))
         )
       UNION ALL
       SELECT
         a.appointment_id,
         COALESCE(sn.created_at::date, a.appointment_date, s.session_date) AS record_date,
         COALESCE(sn.created_at, a.appointment_date + a.appointment_time, s.session_date + s.start_time, a.appointment_date::timestamp) AS record_timestamp,
         COALESCE(NULLIF(concat_ws(' ', d.prefix, d.first_name, d.middle_name, d.last_name), ''), 'Doctor') AS doctor_name,
         w.patient_name AS patient_name,
         concat_ws(' / ', CASE WHEN a.age IS NOT NULL THEN concat(a.age::text, ' years') END, NULLIF(a.gender, '')) AS age_gender,
         COALESCE(w.bmi::text, CASE WHEN w.weight > 0 AND w.height > 0 THEN ROUND(w.weight / POWER(w.height / 100, 2), 1)::text END) AS bmi,
         CASE
           WHEN COALESCE(w.bmi, CASE WHEN w.weight > 0 AND w.height > 0 THEN w.weight / POWER(w.height / 100, 2) END) < 18.5 THEN 'Underweight'
           WHEN COALESCE(w.bmi, CASE WHEN w.weight > 0 AND w.height > 0 THEN w.weight / POWER(w.height / 100, 2) END) < 25 THEN 'Normal weight'
           WHEN COALESCE(w.bmi, CASE WHEN w.weight > 0 AND w.height > 0 THEN w.weight / POWER(w.height / 100, 2) END) < 30 THEN 'Overweight'
           WHEN COALESCE(w.bmi, CASE WHEN w.weight > 0 AND w.height > 0 THEN w.weight / POWER(w.height / 100, 2) END) >= 30 THEN 'Obese'
           ELSE ''
         END AS bmi_category,
         concat_ws(E'\\n',
           NULLIF(concat('Medical history — Chief complaint: ', NULLIF(TRIM(a.reason_for_visit), '')), 'Medical history — Chief complaint: '),
           NULLIF(concat('Medical history — Symptoms: ', NULLIF(TRIM(a.symptoms), '')), 'Medical history — Symptoms: '),
           NULLIF(concat('SOAP — Chief complaints: ', NULLIF(TRIM(sn.chief_complaints), '')), 'SOAP — Chief complaints: '),
           NULLIF(concat('SOAP — Physical examination: ', NULLIF(TRIM(sn.physical_examination), '')), 'SOAP — Physical examination: '),
           NULLIF(concat('SOAP — Diagnosis: ', NULLIF(TRIM(sn.diagnosis), '')), 'SOAP — Diagnosis: '),
           NULLIF(concat('SOAP — Plan: ', NULLIF(TRIM(sn.prescription), '')), 'SOAP — Plan: '),
           NULLIF(concat('SOAP — Next follow-up: ', NULLIF(TRIM(sn.next_follow_up), '')), 'SOAP — Next follow-up: '),
           NULLIF(concat('Prescription: ', NULLIF(TRIM(sn.prescription), '')), 'Prescription: ')
         ) AS details,
         1 AS sort_order
       FROM public.walk_in w
       INNER JOIN appointment a ON a.appointment_id = w.appointment_id
       INNER JOIN doctor d ON d.doctor_id = a.doctor_id
       LEFT JOIN session_tbl s ON s.session_id = a.session_id
       INNER JOIN public.soap_notes sn ON sn.appointment_id = a.appointment_id
       WHERE d.user_id = $1
         AND (
           ($2 <> '' AND LOWER(TRIM(COALESCE(w.email, ''))) = LOWER(TRIM($2)))
           OR ($2 = '' AND LOWER(TRIM(w.patient_name)) = LOWER(TRIM($3)))
         )
     )
     SELECT
       concat(appointment_id::text, '-', record_date::text) AS id,
       to_char(MAX(record_timestamp), 'Mon. DD, YYYY : FMHH12:MI AM') AS date,
       doctor_name AS "doctorName",
       MAX(patient_name) AS "patientName",
       COALESCE(MAX(age_gender), '—') AS "ageGender",
       COALESCE(MAX(bmi), '—') AS bmi,
       COALESCE(MAX(NULLIF(bmi_category, '')), '—') AS "bmiCategory",
       string_agg(details, E'\\n\\n' ORDER BY sort_order) AS details
     FROM history_records
     GROUP BY appointment_id, record_date, doctor_name
     ORDER BY record_date DESC, appointment_id DESC`,
    session.id,
    patient.email,
    patient.patientName,
  )

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Patient profile</p>
            <h1 className="mt-2 text-3xl font-semibold">{patient.patientName}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{patient.email || "No email provided"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/doctor/walk-in" className="text-sm text-muted-foreground hover:underline">
              Back to walk-ins
            </Link>
          </div>
        </div>

        <section className="mb-8 grid gap-6 rounded-2xl border border-border bg-background p-5 sm:grid-cols-2">
          <DetailField label="Address" value={patient.address} />
          <DetailField label="Birthday" value={patient.birthday} />
          <DetailField label="Age" value={patient.age} />
          <DetailField label="Gender" value={patient.gender} />
          <DetailField label="Civil status" value={patient.civilStatus} />
          <DetailField label="Contact number" value={patient.contactNumber} />
        </section>

        <div className="grid items-stretch gap-8 lg:grid-cols-[1.4fr_0.9fr]">
          <section className="h-full space-y-5 rounded-2xl border border-border bg-background p-5">
            <div>
              <h2 className="text-2xl font-semibold">Appointment details</h2>
              <p className="mt-1 text-sm text-muted-foreground">Clinic visit summary</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <DetailField label="Doctor" value={patient.doctorName} />
              <DetailField label="Appointment type" value={patient.appointmentType} />
              <DetailField label="Date" value={patient.appointmentDate} />
              <DetailField label="Time" value={patient.appointmentTime} />
              <DetailField label="Status" value={patient.status} />
              <DetailField label="Reason for visit" value={patient.reasonForVisit} />
            </div>
            <div className="border-t border-border pt-4">
              <DetailField label="Symptoms" value={patient.symptoms} />
            </div>
            <div className="border-t border-border pt-4">
              <DetailField label="Additional notes" value={patient.additionalNotes} />
            </div>
          </section>

          <aside className="h-full space-y-5 rounded-2xl border border-border bg-background p-5">
            <div>
              <h2 className="text-2xl font-semibold">Vital signs &amp; BMI</h2>
              <p className="mt-1 text-sm text-muted-foreground">Recorded at walk-in registration</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              <DetailField label="Blood pressure" value={patient.bloodPressure} />
              <DetailField label="Temperature (°C)" value={patient.temperature} />
              <DetailField label="O₂ saturation (%)" value={patient.oxygenSaturation} />
              <DetailField label="Pulse rate (bpm)" value={patient.pulseRate} />
              <DetailField label="Weight (kg)" value={patient.weight} />
              <DetailField label="Height (cm)" value={patient.height} />
              <DetailField label="BMI (kg/m²)" value={patient.bmi} />
            </div>
          </aside>
        </div>

        <section className="mt-8 space-y-5 rounded-2xl border border-border bg-background p-5">
          <div>
            <h2 className="text-2xl font-semibold">Medical history</h2>
            <p className="mt-1 text-sm text-muted-foreground">Patient history recorded during consultation</p>
          </div>
          <MedicalHistoryTable entries={medicalHistoryRows} />
        </section>

        <section className="mt-8 space-y-5 rounded-2xl border border-border bg-background p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">SOAP summary</h2>
              <p className="mt-1 text-sm text-muted-foreground">Clinical notes and follow-ups recorded for this visit</p>
            </div>
            <SOAPSheet appointmentId={appointmentId} mode="add" disabled={appointmentHasSoap} />
          </div>
          {soapNotes.length ? (
            <SoapSummaryTable notes={soapNotes} appointmentId={appointmentId} />
          ) : (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No SOAP notes have been added for this visit yet.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}