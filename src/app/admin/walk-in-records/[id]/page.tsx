import Link from "next/link"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { ensureWalkInAddressColumn } from "@/lib/walk-in"
import { MedicalHistoryTable, type MedicalHistoryEntry } from "@/app/doctor/walk-in/[id]/medical-history-table"
import { SoapSummaryTable, type WalkInSoapNote } from "@/app/doctor/walk-in/[id]/soap-summary-table"

type Props = { params: Promise<{ id: string }> }

type WalkInDetail = {
  id: string
  patientName: string
  email: string
  address: string
  contactNumber: string
  birthday: string
  civilStatus: string
  age: string
  gender: string
  doctorName: string
  appointmentDate: string
  appointmentTime: string
  appointmentType: string
  status: string
  reasonForVisit: string
  symptoms: string
  durationOfSymptoms: string
  painLevel: string
  additionalNotes: string
  bloodPressure: string
  temperature: string
  oxygenSaturation: string
  pulseRate: string
  weight: string
  height: string
  bmi: string
  chiefComplaints: string
  physicalExamination: string
  diagnosis: string
  prescription: string
  nextFollowUp: string
}

function DetailItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium whitespace-pre-wrap">{value || "—"}</p>
    </div>
  )
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

function formatDate(value: string) {
  if (!value) return "—"
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
}

function formatTime(value: string) {
  if (!value) return "—"
  const [hours, minutes] = value.split(":").map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })
}

export default async function AdminWalkInDetailPage({ params }: Props) {
  const { id } = await params
  const appointmentId = Number(id)
  if (!id || !Number.isInteger(appointmentId) || appointmentId <= 0) notFound()

  await ensureWalkInAddressColumn()

  const rows = await prisma.$queryRaw<WalkInDetail[]>`
    SELECT
      w.appointment_id::text AS id,
      COALESCE(w.patient_name, '') AS "patientName",
      COALESCE(w.email, '') AS email,
      COALESCE(w.address, '') AS address,
      COALESCE(a.contact_number, '') AS "contactNumber",
      COALESCE(to_char(w.birthday, 'YYYY-MM-DD'), '') AS birthday,
      COALESCE(w.civil_status, '') AS "civilStatus",
      COALESCE(a.age::text, '') AS age,
      COALESCE(a.gender, '') AS gender,
      COALESCE(
        NULLIF(concat_ws(' ', d.prefix, d.first_name, d.middle_name, d.last_name), ''),
        NULLIF(w.doctor_name, ''),
        'Unassigned'
      ) AS "doctorName",
      COALESCE(to_char(w.appointment_date, 'YYYY-MM-DD'), '') AS "appointmentDate",
      COALESCE(to_char(a.appointment_time, 'HH24:MI'), to_char(s.start_time, 'HH24:MI'), '') AS "appointmentTime",
      COALESCE(a.appointment_type, s.appointment_type, 'General Consultation') AS "appointmentType",
      CASE
        WHEN LOWER(COALESCE(a.appointment_status, '')) IN ('', 'pending') THEN 'Waiting'
        ELSE a.appointment_status
      END AS status,
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
      COALESCE(sn.physical_examination, '') AS "physicalExamination",
      COALESCE(sn.diagnosis, '') AS diagnosis,
      COALESCE(sn.prescription, '') AS prescription,
      COALESCE(sn.next_follow_up, '') AS "nextFollowUp"
    FROM public.walk_in w
    INNER JOIN public.appointment a ON a.appointment_id = w.appointment_id
    LEFT JOIN public.doctor d ON d.doctor_id = a.doctor_id
    LEFT JOIN public.session_tbl s ON s.session_id = a.session_id
    LEFT JOIN LATERAL (
      SELECT chief_complaints, physical_examination, diagnosis, prescription, next_follow_up
      FROM public.soap_notes
      WHERE appointment_id = a.appointment_id
      ORDER BY created_at DESC
      LIMIT 1
    ) sn ON TRUE
    WHERE w.appointment_id = ${appointmentId}
    LIMIT 1
  `
  const record = rows[0]
  if (!record) notFound()

  const soapNotes = await prisma.$queryRawUnsafe<WalkInSoapNote[]>(
    `SELECT
       sn.soap_id::text AS id,
       sn.appointment_id AS "appointmentId",
       sn.chief_complaints,
       sn.physical_examination,
       sn.diagnosis,
       sn.prescription,
       sn.next_follow_up,
       to_char(sn.created_at + INTERVAL '8 hours', 'Mon. DD, YYYY : FMHH12:MI AM') AS "createdAt"
     FROM public.soap_notes sn
     WHERE sn.appointment_id = $1
     ORDER BY sn.created_at DESC, sn.soap_id DESC`,
    appointmentId,
  )
  const medicalHistoryRows = await prisma.$queryRawUnsafe<MedicalHistoryEntry[]>(
    `WITH history_records AS (
       SELECT
         w.appointment_id,
         COALESCE(w.created_at::date, w.appointment_date) AS record_date,
         COALESCE(w.created_at, w.appointment_date + a.appointment_time, w.appointment_date::timestamp) AS record_timestamp,
         COALESCE(NULLIF(concat_ws(' ', d.prefix, d.first_name, d.middle_name, d.last_name), ''), NULLIF(w.doctor_name, ''), 'Unassigned') AS doctor_name,
         w.patient_name,
         COALESCE(concat_ws(' / ', CASE WHEN a.age IS NOT NULL THEN concat(a.age::text, ' years') END, NULLIF(a.gender, '')), '—') AS age_gender,
         COALESCE(w.bmi::text, CASE WHEN w.weight > 0 AND w.height > 0 THEN ROUND(w.weight / POWER(w.height / 100, 2), 1)::text END, '') AS bmi,
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
       INNER JOIN public.appointment a ON a.appointment_id = w.appointment_id
       LEFT JOIN public.doctor d ON d.doctor_id = a.doctor_id
       WHERE (
         ($1 <> '' AND LOWER(TRIM(COALESCE(w.email, ''))) = LOWER(TRIM($1)))
         OR ($1 = '' AND LOWER(TRIM(w.patient_name)) = LOWER(TRIM($2)))
       )
         AND (
           w.bmi IS NOT NULL OR w.weight IS NOT NULL OR w.height IS NOT NULL
           OR w.blood_pressure IS NOT NULL OR w.temperature IS NOT NULL
           OR w.oxygen_saturation IS NOT NULL OR w.pulse_rate IS NOT NULL
         )
       UNION ALL
       SELECT
         a.appointment_id,
         COALESCE((sn.created_at + INTERVAL '8 hours')::date, a.appointment_date) AS record_date,
         COALESCE(sn.created_at + INTERVAL '8 hours', a.appointment_date + a.appointment_time, a.appointment_date::timestamp) AS record_timestamp,
         COALESCE(NULLIF(concat_ws(' ', d.prefix, d.first_name, d.middle_name, d.last_name), ''), NULLIF(w.doctor_name, ''), 'Unassigned') AS doctor_name,
         w.patient_name,
         COALESCE(concat_ws(' / ', CASE WHEN a.age IS NOT NULL THEN concat(a.age::text, ' years') END, NULLIF(a.gender, '')), '—') AS age_gender,
         COALESCE(w.bmi::text, CASE WHEN w.weight > 0 AND w.height > 0 THEN ROUND(w.weight / POWER(w.height / 100, 2), 1)::text END, '') AS bmi,
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
           NULLIF(concat('Prescription: ', NULLIF(TRIM(sn.next_follow_up), '')), 'Prescription: ')
         ) AS details,
         1 AS sort_order
       FROM public.walk_in w
       INNER JOIN public.appointment a ON a.appointment_id = w.appointment_id
       LEFT JOIN public.doctor d ON d.doctor_id = a.doctor_id
       INNER JOIN public.soap_notes sn ON sn.appointment_id = a.appointment_id
       WHERE (
         ($1 <> '' AND LOWER(TRIM(COALESCE(w.email, ''))) = LOWER(TRIM($1)))
         OR ($1 = '' AND LOWER(TRIM(w.patient_name)) = LOWER(TRIM($2)))
       )
     )
     SELECT
       concat(appointment_id::text, '-', record_date::text) AS id,
       to_char(MAX(record_timestamp), 'Mon. DD, YYYY : FMHH12:MI AM') AS date,
       doctor_name AS "doctorName",
       MAX(patient_name) AS "patientName",
       COALESCE(MAX(age_gender), '—') AS "ageGender",
       COALESCE(MAX(NULLIF(bmi, '')), '—') AS bmi,
       COALESCE(MAX(NULLIF(bmi_category, '')), '—') AS "bmiCategory",
       string_agg(details, E'\\n\\n' ORDER BY sort_order) AS details
     FROM history_records
     GROUP BY appointment_id, record_date, doctor_name
     ORDER BY record_date DESC, appointment_id DESC`,
    record.email,
    record.patientName,
  )

  const nameParts = record.patientName.trim().split(/\s+/).filter(Boolean)
  const firstName = nameParts[0] ?? ""
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ""
  const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : ""

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
              {initials(record.patientName) || "P"}
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">Walk-in patient</p>
              <h1 className="text-3xl font-semibold">{record.patientName || "Unknown Patient"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{record.email || "No email provided"}</p>
            </div>
          </div>
          <Link href="/admin/walk-in-records" className="text-sm text-muted-foreground hover:underline">
            Back to Walk In Records
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
          <main className="space-y-8">
            <section className="grid grid-cols-1 gap-6 rounded-3xl border border-border bg-background p-6 sm:grid-cols-2">
              <DetailItem label="First name" value={firstName} />
              <DetailItem label="Middle name" value={middleName} />
              <DetailItem label="Last name" value={lastName} />
              <DetailItem label="Phone number" value={record.contactNumber} />
              <DetailItem label="Birthday" value={formatDate(record.birthday)} />
              <DetailItem label="Age" value={record.age ? `${record.age} years old` : ""} />
              <DetailItem label="Sex" value={record.gender} />
              <DetailItem label="Civil status" value={record.civilStatus} />
              <DetailItem label="Address" value={record.address} />
              <DetailItem label="Doctor" value={record.doctorName} />
              <DetailItem label="Consultation date" value={formatDate(record.appointmentDate)} />
              <DetailItem label="Consultation time" value={formatTime(record.appointmentTime)} />
              <DetailItem label="Appointment type" value={record.appointmentType} />
              <DetailItem label="Status" value={record.status} />
            </section>

            <section className="rounded-3xl border border-border bg-background p-6">
              <h2 className="text-2xl font-semibold">Vital signs</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <DetailItem label="Blood pressure" value={record.bloodPressure} />
                <DetailItem label="Temperature (°C)" value={record.temperature} />
                <DetailItem label="O₂ saturation (%)" value={record.oxygenSaturation} />
                <DetailItem label="Pulse rate (bpm)" value={record.pulseRate} />
                <DetailItem label="Weight (kg)" value={record.weight} />
                <DetailItem label="Height (cm)" value={record.height} />
                <DetailItem label="BMI" value={record.bmi} />
              </div>
            </section>
          </main>

          <aside className="h-fit rounded-3xl border border-border bg-background p-6">
            <h2 className="text-2xl font-semibold">Doctor notes & plan</h2>
            <p className="mt-1 text-sm text-muted-foreground">Latest SOAP note for this visit.</p>
            <div className="mt-6 space-y-5">
              <DetailItem label="Chief complaints" value={record.chiefComplaints} />
              <DetailItem label="Physical examination" value={record.physicalExamination} />
              <DetailItem label="Diagnosis" value={record.diagnosis} />
              <DetailItem label="Prescription" value={record.prescription} />
              <DetailItem label="Next follow-up" value={record.nextFollowUp} />
            </div>
          </aside>
        </div>

        <div className="mt-8 space-y-6">
          <section className="space-y-5 rounded-2xl border border-border bg-background p-5">
            <div>
              <h2 className="text-2xl font-semibold">Medical history</h2>
              <p className="mt-1 text-sm text-muted-foreground">Patient history from previous and current walk-in visits.</p>
            </div>
            <MedicalHistoryTable entries={medicalHistoryRows} />
          </section>

          <section className="space-y-5 rounded-2xl border border-border bg-background p-5">
            <div>
              <h2 className="text-2xl font-semibold">SOAP summary</h2>
              <p className="mt-1 text-sm text-muted-foreground">Clinical notes and follow-ups recorded for this visit.</p>
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
    </div>
  )
}
