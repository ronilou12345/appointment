import Link from "next/link"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import SOAPSheet from "@/components/soap-sheet"
import ViewCancelReason from "@/components/view-cancel-reason"
import { MedicalHistoryTable, type MedicalHistoryEntry } from "@/app/doctor/walk-in/[id]/medical-history-table"
import { SoapSummaryTable, type WalkInSoapNote } from "@/app/doctor/walk-in/[id]/soap-summary-table"
import { formatAppointmentTime } from "@/app/client/appointments/status"
import { resolveProfileAvatar } from "@/lib/profile-image"

type Props = {
  params: Promise<{ id: string }>
}

const getStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "confirmed":
      return "default"
    case "pending":
      return "secondary"
    case "cancelled":
    case "canceled":
    case "cancel":
    case "declined":
      return "destructive"
    default:
      return "outline"
  }
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("")

const formatDate = (date?: Date | null) => (date ? date.toISOString().split("T")[0] : "—")
const formatTime = (time?: Date | null) => (time ? time.toISOString().slice(11, 16) : "—")

export default async function DoctorAppointmentDetailPage({ params }: Props) {
  const { id } = await params
  const session = await getSession()

  if (!session?.id) {
    notFound()
  }

  const appointmentId = Number(id)
  if (Number.isNaN(appointmentId) || appointmentId <= 0) {
    notFound()
  }

  // Use a parameterized raw query to avoid Prisma date-parsing errors
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT a.*, u.name AS user_name, u.profile_image AS user_profile_image, u.address AS user_address,
             d.prefix AS doctor_prefix, d.first_name AS doctor_first_name, d.middle_name AS doctor_middle_name, d.last_name AS doctor_last_name,
             s.appointment_type AS session_appointment_type,
             to_char(COALESCE(a.appointment_date, s.session_date), 'YYYY-MM-DD') AS appointment_date_text,
             to_char(COALESCE(a.appointment_time, s.start_time), 'HH24:MI') AS appointment_time_text
      FROM "appointment" a
      LEFT JOIN "user" u ON u.id = a.user_id
      LEFT JOIN "doctor" d ON d.doctor_id = a.doctor_id
      LEFT JOIN "session_tbl" s ON s.session_id = a.session_id
      WHERE a.appointment_id = $1 AND d.user_id = $2
      LIMIT 1
    `,
    appointmentId,
    session.id
  )

  const appointment = rows && rows[0]

  if (!appointment) {
    notFound()
  }

  const bookedByName = String(appointment.user_name ?? "Unknown patient")
  const relationship = String(appointment.relationship ?? "").trim()
  const isSomeoneElseAppointment = relationship.toLowerCase().startsWith("someone else")
  const actualPatientName = isSomeoneElseAppointment
    ? relationship.split("—").slice(1).join("—").trim()
    : ""
  const actualPatientDisplayName = isSomeoneElseAppointment ? actualPatientName || "—" : "—"
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
     INNER JOIN public.appointment a ON a.appointment_id = sn.appointment_id
     WHERE a.user_id = $1
       AND (
         ($2::boolean
           AND LOWER(COALESCE(a.relationship, '')) LIKE 'someone else%'
           AND LOWER(TRIM(CASE
             WHEN POSITION('—' IN COALESCE(a.relationship, '')) > 0
               THEN SUBSTRING(a.relationship FROM POSITION('—' IN a.relationship) + 1)
             ELSE ''
           END)) = LOWER(TRIM($3)))
         OR (
           NOT $2::boolean
           AND LOWER(COALESCE(a.relationship, '')) NOT LIKE 'someone else%'
         )
       )
       ORDER BY sn.created_at DESC, sn.soap_id DESC`,
    appointment.user_id,
    isSomeoneElseAppointment,
    actualPatientName,
  )
  const currentAppointmentHasSoap = soapNotes.some(
    (note) => Number(note.appointmentId) === appointmentId,
  )
  const medicalHistoryRows = await prisma.$queryRawUnsafe<MedicalHistoryEntry[]>(
    `WITH history_records AS (
       SELECT
         a.appointment_id,
         COALESCE(v.created_at::date, a.appointment_date, s.session_date) AS record_date,
         COALESCE(v.created_at, a.appointment_date + a.appointment_time, s.session_date + s.start_time, a.appointment_date::timestamp) AS record_timestamp,
         COALESCE(NULLIF(concat_ws(' ', d.prefix, d.first_name, d.middle_name, d.last_name), ''), 'Doctor') AS doctor_name,
         CASE
           WHEN LOWER(COALESCE(a.relationship, '')) LIKE 'someone else%'
             AND POSITION('—' IN COALESCE(a.relationship, '')) > 0
             THEN COALESCE(NULLIF(BTRIM(SUBSTRING(a.relationship FROM POSITION('—' IN a.relationship) + 1)), ''), u.name)
           ELSE COALESCE(u.name, 'Unknown patient')
         END AS patient_name,
         COALESCE(concat_ws(' / ', CASE WHEN a.age IS NOT NULL THEN concat(a.age::text, ' years') END, NULLIF(a.gender, '')), '—') AS age_gender,
         CASE
           WHEN v.weight > 0 AND v.height > 0 THEN ROUND(v.weight / POWER(v.height / 100, 2), 1)::text
           ELSE ''
         END AS bmi,
         CASE
           WHEN v.weight > 0 AND v.height > 0 AND v.weight / POWER(v.height / 100, 2) < 18.5 THEN 'Underweight'
           WHEN v.weight > 0 AND v.height > 0 AND v.weight / POWER(v.height / 100, 2) < 25 THEN 'Normal weight'
           WHEN v.weight > 0 AND v.height > 0 AND v.weight / POWER(v.height / 100, 2) < 30 THEN 'Overweight'
           WHEN v.weight > 0 AND v.height > 0 AND v.weight / POWER(v.height / 100, 2) >= 30 THEN 'Obese'
           ELSE ''
         END AS bmi_category,
         concat_ws(E'\\n',
           NULLIF(concat('Medical history — Chief complaint: ', NULLIF(TRIM(a.reason_for_visit), '')), 'Medical history — Chief complaint: '),
           NULLIF(concat('Medical history — Symptoms: ', NULLIF(TRIM(a.symptoms), '')), 'Medical history — Symptoms: '),
           'Vital signs:',
           concat('BMI: ',
             CASE
               WHEN v.weight > 0 AND v.height > 0
                 THEN ROUND(v.weight / POWER(v.height / 100, 2), 1)::text
               ELSE '—'
             END, ' kg/m²'),
           concat('Weight: ', COALESCE(v.weight::text, '—'), ' kg'),
           concat('Height: ', COALESCE(v.height::text, '—'), ' cm'),
           concat('Blood pressure: ', COALESCE(v.blood_pressure, '—')),
           concat('Heart rate: ', COALESCE(v.heart_rate::text, '—'), ' bpm'),
           concat('Temperature: ', COALESCE(v.body_temperature::text, '—'), ' °C'),
           concat('Oxygen saturation: ', COALESCE(v.oxygen_saturation::text, '—'), '%'),
           concat('Blood sugar: ', COALESCE(v.blood_sugar::text, '—'))
         ) AS details,
         0 AS sort_order
       FROM public.appointment a
       INNER JOIN public.doctor d ON d.doctor_id = a.doctor_id
       INNER JOIN public."user" u ON u.id = a.user_id
       LEFT JOIN public.session_tbl s ON s.session_id = a.session_id
       INNER JOIN public.vital_signs v ON v.appointment_id = a.appointment_id
       WHERE a.user_id = $1
         AND (
           v.weight IS NOT NULL OR v.height IS NOT NULL OR v.blood_pressure IS NOT NULL
           OR v.heart_rate IS NOT NULL OR v.body_temperature IS NOT NULL
           OR v.oxygen_saturation IS NOT NULL OR v.blood_sugar IS NOT NULL
         )
         AND (
           ($2::boolean
             AND LOWER(COALESCE(a.relationship, '')) LIKE 'someone else%'
             AND LOWER(TRIM(CASE
               WHEN POSITION('—' IN COALESCE(a.relationship, '')) > 0
                 THEN SUBSTRING(a.relationship FROM POSITION('—' IN a.relationship) + 1)
               ELSE ''
             END)) = LOWER(TRIM($3)))
           OR (NOT $2::boolean AND LOWER(COALESCE(a.relationship, '')) NOT LIKE 'someone else%')
         )
       UNION ALL
       SELECT
         a.appointment_id,
         COALESCE((sn.created_at + INTERVAL '8 hours')::date, a.appointment_date, s.session_date) AS record_date,
         COALESCE(sn.created_at + INTERVAL '8 hours', a.appointment_date + a.appointment_time, s.session_date + s.start_time, a.appointment_date::timestamp) AS record_timestamp,
         COALESCE(NULLIF(concat_ws(' ', d.prefix, d.first_name, d.middle_name, d.last_name), ''), 'Doctor') AS doctor_name,
         CASE
           WHEN LOWER(COALESCE(a.relationship, '')) LIKE 'someone else%'
             AND POSITION('—' IN COALESCE(a.relationship, '')) > 0
             THEN COALESCE(NULLIF(BTRIM(SUBSTRING(a.relationship FROM POSITION('—' IN a.relationship) + 1)), ''), u.name)
           ELSE COALESCE(u.name, 'Unknown patient')
         END AS patient_name,
         COALESCE(concat_ws(' / ', CASE WHEN a.age IS NOT NULL THEN concat(a.age::text, ' years') END, NULLIF(a.gender, '')), '—') AS age_gender,
         '' AS bmi,
         '' AS bmi_category,
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
       FROM public.appointment a
       INNER JOIN public.doctor d ON d.doctor_id = a.doctor_id
       INNER JOIN public."user" u ON u.id = a.user_id
       LEFT JOIN public.session_tbl s ON s.session_id = a.session_id
       INNER JOIN public.soap_notes sn ON sn.appointment_id = a.appointment_id
       WHERE a.user_id = $1
         AND (
           ($2::boolean
             AND LOWER(COALESCE(a.relationship, '')) LIKE 'someone else%'
             AND LOWER(TRIM(CASE
               WHEN POSITION('—' IN COALESCE(a.relationship, '')) > 0
                 THEN SUBSTRING(a.relationship FROM POSITION('—' IN a.relationship) + 1)
               ELSE ''
             END)) = LOWER(TRIM($3)))
           OR (NOT $2::boolean AND LOWER(COALESCE(a.relationship, '')) NOT LIKE 'someone else%')
         )
     )
     SELECT
       concat(appointment_id::text, '-', record_date::text) AS id,
       to_char(MAX(record_timestamp), 'Mon. DD, YYYY : FMHH12:MI AM') AS date,
       doctor_name AS "doctorName",
       MAX(patient_name) AS "patientName",
       COALESCE(MAX(age_gender), '—') AS "ageGender",
       COALESCE(NULLIF(MAX(bmi), ''), '—') AS bmi,
       COALESCE(NULLIF(MAX(bmi_category), ''), '—') AS "bmiCategory",
       string_agg(details, E'\\n\\n' ORDER BY sort_order) AS details
     FROM history_records
     GROUP BY appointment_id, record_date, doctor_name
     ORDER BY record_date DESC, appointment_id DESC`,
    appointment.user_id,
    isSomeoneElseAppointment,
    actualPatientName,
  )
  const initials = getInitials(bookedByName)
  const patientAvatar = resolveProfileAvatar(appointment.user_id, appointment.user_profile_image)
  const doctorName = [appointment.doctor_prefix, appointment.doctor_first_name, appointment.doctor_middle_name, appointment.doctor_last_name]
    .filter(Boolean)
    .join(" ") || "Doctor"

  const patientAge = appointment.age != null ? `${appointment.age} years old` : "—"
  const patientGender = appointment.gender ?? "—"
  const patientAddress = appointment.user_address || "—"
  const patientNotes = appointment.reason_for_visit ?? "No patient notes recorded."
  const doctorNotes = appointment.additional_notes?.trim() || "-"
  const followUp = appointment.symptoms?.trim() || "-"
  const latestSoapNote = soapNotes[0]
  const prescriptionText = latestSoapNote?.prescription || "-"
  const chiefComplaints = latestSoapNote?.chief_complaints || "-"
  const physicalExamination = latestSoapNote?.physical_examination || "-"
  const diagnosis = latestSoapNote?.diagnosis || "-"
  const followUpNote = latestSoapNote?.next_follow_up || "-"
  const specialty =
    appointment.appointment_type ||
    appointment.session_appointment_type ||
    appointment.reason_for_visit ||
    "General Consultation"
  const date = appointment.appointment_date_text ?? "—"
  const timeText = appointment.appointment_time_text ?? ""
  const time = timeText ? formatAppointmentTime(String(timeText)) : "—"
  const statusText = appointment.appointment_status ?? "Pending"
  const badgeVariant = getStatusVariant(statusText)
  const cancellationReason = appointment.reason_cancel?.trim() || "No cancellation reason recorded."
  const isCancelled = ["cancel requested", "awaiting cancellation", "cancelled", "canceled", "cancel"].includes(
    String(statusText).toLowerCase(),
  )

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-[32px] border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.65fr)]">
            <div className="rounded-3xl border border-border bg-muted/60 p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <Avatar size="lg" className="shrink-0">
                  {patientAvatar ? (
                    <AvatarImage src={patientAvatar} alt={bookedByName} />
                  ) : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Booked by</p>
                  <h1 className="mt-2 break-words text-2xl font-semibold leading-tight sm:text-3xl">{bookedByName}</h1>
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/70 pt-4">
                    <div className="col-span-2 min-w-0">
                      <p className="text-xs text-muted-foreground">Actual patient</p>
                      <p className="mt-1 break-words text-sm font-medium">{actualPatientDisplayName}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Gender</p>
                      <p className="mt-1 break-words text-sm font-medium">{patientGender}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Age</p>
                      <p className="mt-1 break-words text-sm font-medium">{patientAge}</p>
                    </div>
                    <div className="col-span-2 min-w-0">
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="mt-1 break-words text-sm font-medium">{patientAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Status</p>
                  <Badge variant={badgeVariant}>{statusText}</Badge>
                </div>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Cancellation</p>
                  <div className="mt-2 break-words text-sm">
                    {isCancelled ? (
                      <ViewCancelReason reason={cancellationReason} />
                    ) : (
                      <p className="text-muted-foreground">No cancellation recorded.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">Appointment details</p>
                  <h2 className="mt-3 text-4xl font-semibold tracking-tight">{specialty}</h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/doctor/appointments"
                    className="inline-flex items-center justify-center rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
                  >
                    Back
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-border bg-muted/50 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Date</p>
                  <p className="mt-2 text-lg font-semibold">{date}</p>
                </div>
                <div className="rounded-3xl border border-border bg-muted/50 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Time</p>
                  <p className="mt-2 text-lg font-semibold">{time}</p>
                </div>
                <div className="rounded-3xl border border-border bg-muted/50 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Doctor</p>
                  <p className="mt-2 text-lg font-semibold">{doctorName}</p>
                </div>
                <div className="rounded-3xl border border-border bg-muted/50 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Prescription</p>
                  <p className="mt-2 text-lg font-semibold">{prescriptionText}</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Patient Visit Information</h2>
            <p className="mt-2 text-sm text-muted-foreground">Access a comprehensive record of the patient's visit,
             including clinical findings, SOAP notes, diagnosis, treatment, plan, and additional medical notes.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.8fr] xl:items-start">
          <section className="rounded-[32px] border border-border bg-card p-6 sm:p-8 shadow-sm">
            <div>
              <h2 className="text-2xl font-semibold">Medical information</h2>
              <p className="mt-2 text-sm text-muted-foreground">Vital notes and treatment guidance for this appointment.</p>
            </div>

            <div className="mt-8 grid gap-6">
              <div className="rounded-3xl border border-border bg-muted/50 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Reason for visit</p>
                <p className="mt-3 text-base font-semibold leading-7">{patientNotes}</p>
              </div>
              <div className="rounded-3xl border border-border bg-muted/50 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Symptoms</p>
                <p className="mt-3 text-base font-semibold leading-7">{doctorNotes}</p>
              </div>
              <div className="rounded-3xl border border-border bg-muted/50 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Patient Notes</p>
                <p className="mt-3 text-base font-semibold leading-7">{followUp}</p>
              </div>
               <div className="rounded-3xl border border-border bg-muted/50 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Next Follow up</p>
                <p className="mt-3 text-base font-semibold leading-7">{followUpNote}</p>
              </div>
            </div>
          </section>

          <aside className="rounded-[32px] border border-border bg-card p-6 sm:p-8 shadow-sm">
            <div>
              <h2 className="text-2xl font-semibold">Appointment summary</h2>
              <p className="mt-2 text-sm text-muted-foreground">SOAP notes for this visit: Subjective, Objective, Assessment, and Plan.</p>
            </div>

            <div className="mt-8 grid gap-4">
              <div className="rounded-3xl border border-border bg-muted/50 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Chief Complaints</p>
                <p className="mt-2 text-base font-semibold">{chiefComplaints}</p>
              </div>
              <div className="rounded-3xl border border-border bg-muted/50 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Physical Examination</p>
                <p className="mt-2 text-base font-semibold">{physicalExamination}</p>
              </div>
              <div className="rounded-3xl border border-border bg-muted/50 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Diagnosis</p>
                <p className="mt-2 text-base font-semibold">{diagnosis}</p>
              </div>
              <div className="rounded-3xl border border-border bg-muted/50 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Plan</p>
                <p className="mt-2 text-base font-semibold">{prescriptionText}</p>
              </div>
            </div>
          </aside>
        </div>

        <section className="space-y-5 rounded-2xl border border-border bg-background p-5">
          <div>
            <h2 className="text-2xl font-semibold">Medical history</h2>
            <p className="mt-1 text-sm text-muted-foreground">Patient history from previous and current appointments.</p>
          </div>
          <MedicalHistoryTable entries={medicalHistoryRows} />
        </section>

        <section className="space-y-5 rounded-2xl border border-border bg-background p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">SOAP summary</h2>
              <p className="mt-1 text-sm text-muted-foreground">Clinical notes and follow-ups across this patient’s appointments.</p>
            </div>
            <SOAPSheet
              appointmentId={appointment.appointment_id}
              mode="add"
              disabled={String(appointment.appointment_status ?? "").trim().toLowerCase() !== "confirmed" || currentAppointmentHasSoap}
            />
          </div>
          {soapNotes.length ? (
            <SoapSummaryTable notes={soapNotes} appointmentId={appointment.appointment_id} />
          ) : (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No SOAP notes have been added for this appointment yet.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
