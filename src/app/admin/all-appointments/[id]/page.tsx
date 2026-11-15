import Link from "next/link"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import prisma from "@/lib/prisma"
import { formatAppointmentTime } from "@/app/client/appointments/status"
import { MedicalHistoryTable, type MedicalHistoryEntry } from "@/app/doctor/walk-in/[id]/medical-history-table"
import { SoapSummaryTable, type WalkInSoapNote } from "@/app/doctor/walk-in/[id]/soap-summary-table"

type Props = { params: Promise<{ id: string }> }

type NameParts = {
  firstName: string
  middleInitial: string
  lastName: string
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("")

const getNameParts = (name: string): NameParts => {
  const parts = name.split(" ").filter(Boolean)
  return {
    firstName: parts[0] ?? "",
    middleInitial:
      parts.length > 2
        ? `${parts.slice(1, -1).map((part) => part[0].toUpperCase()).join(".")}.`
        : "",
    lastName: parts.length > 1 ? parts[parts.length - 1] : "",
  }
}

const formatDate = (date?: Date | null) => {
  if (!date) return "—"
  return date.toISOString().split("T")[0]
}

const formatTime = (time?: Date | null) => {
  if (!time) return "—"
  const timeValue = time.toISOString().slice(11, 16)
  const formattedTime = formatAppointmentTime(timeValue)
  return formattedTime || "—"
}

export default async function AdminAppointmentDetailPage({ params }: Props) {
  const { id } = await params
  const appointmentId = Number(id)

  if (!id || Number.isNaN(appointmentId) || appointmentId <= 0) {
    notFound()
  }

  const appointment = await prisma.appointment.findUnique({
    where: { appointment_id: appointmentId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          address: true,
          profile_image: true,
          status: true,
        },
      },
      doctor: {
        select: {
          first_name: true,
          middle_name: true,
          last_name: true,
        },
      },
      session_tbl: {
        select: {
          appointment_type: true,
          session_date: true,
          start_time: true,
        },
      },
      soap_notes: {
        orderBy: { created_at: "desc" },
        take: 1,
        select: {
          chief_complaints: true,
          physical_examination: true,
          diagnosis: true,
          prescription: true,
          next_follow_up: true,
        },
      },
    },
  })

  if (!appointment) {
    notFound()
  }

  const relationship = String(appointment.relationship ?? "").trim()
  const isSomeoneElseAppointment = relationship.toLowerCase().startsWith("someone else")
  const actualPatientName = isSomeoneElseAppointment
    ? relationship.split("—").slice(1).join("—").trim()
    : ""
  const patientMatchesAppointment = `(
    ($2::boolean
      AND LOWER(COALESCE(a.relationship, '')) LIKE 'someone else%'
      AND LOWER(TRIM(CASE
        WHEN POSITION('—' IN COALESCE(a.relationship, '')) > 0
          THEN SUBSTRING(a.relationship FROM POSITION('—' IN a.relationship) + 1)
        ELSE ''
      END)) = LOWER(TRIM($3)))
    OR (NOT $2::boolean AND LOWER(COALESCE(a.relationship, '')) NOT LIKE 'someone else%')
  )`
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
     WHERE a.user_id = $1 AND ${patientMatchesAppointment}
     ORDER BY sn.created_at DESC, sn.soap_id DESC`,
    appointment.user_id,
    isSomeoneElseAppointment,
    actualPatientName,
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
         AND ${patientMatchesAppointment}
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
           NULLIF(concat('Prescription: ', NULLIF(TRIM(sn.next_follow_up), '')), 'Prescription: ')
         ) AS details,
         1 AS sort_order
       FROM public.appointment a
       INNER JOIN public.doctor d ON d.doctor_id = a.doctor_id
       INNER JOIN public."user" u ON u.id = a.user_id
       LEFT JOIN public.session_tbl s ON s.session_id = a.session_id
       INNER JOIN public.soap_notes sn ON sn.appointment_id = a.appointment_id
       WHERE a.user_id = $1 AND ${patientMatchesAppointment}
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

  const patientName = appointment.user?.name ?? "Unknown Patient"
  const patientAvatar = appointment.user?.profile_image ?? ""
  const patientEmail = appointment.user?.email ?? "—"
  const patientAddress = appointment.user?.address || "—"
  const patientStatus = appointment.user?.status ?? "Unknown"
  const patientAge = appointment.age != null ? String(appointment.age) : "—"
  const patientGender = appointment.gender ?? "—"
  const patientType =
    appointment.appointment_type ||
    appointment.session_tbl?.appointment_type ||
    "General Consultation"
  const patientDate = formatDate(appointment.appointment_date ?? appointment.session_tbl?.session_date)
  const patientTime = formatTime(appointment.appointment_time ?? appointment.session_tbl?.start_time)
  const patientRelationship = appointment.relationship ?? "N/A"
  const patientSymptoms = appointment.symptoms ?? "No symptoms recorded."
  const doctorNotes = appointment.soap_notes[0]

  const doctorName = appointment.doctor
    ? [appointment.doctor.first_name, appointment.doctor.middle_name, appointment.doctor.last_name]
        .filter(Boolean)
        .join(" ")
    : "Unknown Doctor"

  const patientNameParts = getNameParts(patientName)
  const patientFullName = [patientNameParts.firstName, patientNameParts.middleInitial, patientNameParts.lastName]
    .filter(Boolean)
    .join(" ")

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar size="lg">
              {patientAvatar ? <AvatarImage src={patientAvatar} alt={patientFullName} /> : <AvatarFallback>{getInitials(patientName)}</AvatarFallback>}
            </Avatar>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.35em] text-muted-foreground">Patient profile</p>
              <h1 className="text-3xl font-semibold">{patientFullName || patientName}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{patientEmail}</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm font-medium text-foreground">
                <span className={`h-2.5 w-2.5 rounded-full ${patientStatus.toLowerCase() === "active" ? "bg-emerald-500" : patientStatus.toLowerCase() === "inactive" ? "bg-slate-400" : "bg-amber-500"}`} />
                {patientStatus}
              </div>
            </div>
          </div>
          <Link href="/admin/all-appointments" className="text-sm text-muted-foreground hover:underline">
            Back to appointments
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">First name</p>
                <p className="font-medium">{patientNameParts.firstName || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Middle initial</p>
                <p className="font-medium">{patientNameParts.middleInitial || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last name</p>
                <p className="font-medium">{patientNameParts.lastName || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Doctor</p>
                <p className="font-medium">{doctorName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{patientDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">{patientTime}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Appointment type</p>
                <p className="font-medium">{patientType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{appointment.appointment_status ?? "Pending"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium">{patientGender}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="font-medium">{patientAge}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Relationship</p>
                <p className="font-medium">{patientRelationship}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{patientAddress}</p>
              </div>
            </div>

            <div className="divide-y divide-border rounded-3xl bg-background text-sm text-foreground shadow-sm">
              <div className="px-0 py-4">
                <h2 className="text-2xl font-semibold">Appointment details</h2>
                <p className="mt-2 text-sm text-muted-foreground">Clinic visit summary</p>
              </div>

              <div className="px-0 py-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Symptoms</p>
                <p className="mt-3 text-sm leading-7 text-foreground">{patientSymptoms}</p>
              </div>

              <div className="px-0 py-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Additional notes</p>
                <p className="mt-3 text-sm leading-7 text-foreground">{appointment.additional_notes ?? "No additional notes."}</p>
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-border bg-background p-6 text-sm text-foreground shadow-sm">
            <div>
              <h2 className="text-2xl font-semibold">Doctor notes & plan</h2>
              <p className="mt-2 text-sm text-muted-foreground">SOAP summary for the clinician review and treatment plan.</p>
            </div>

            <div className="mt-6 space-y-6">
              <div className="rounded-3xl border border-border bg-muted/50 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Chief Complaints</p>
                <p className="mt-3 text-sm leading-7 text-foreground">{doctorNotes?.chief_complaints || "—"}</p>
              </div>
              <div className="rounded-3xl border border-border bg-muted/50 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Physical Examination</p>
                <p className="mt-3 text-sm leading-7 text-foreground">{doctorNotes?.physical_examination || "—"}</p>
              </div>
              <div className="rounded-3xl border border-border bg-muted/50 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Diagnosis</p>
                <p className="mt-3 text-sm leading-7 text-foreground">{doctorNotes?.diagnosis || "—"}</p>
              </div>
              <div className="rounded-3xl border border-border bg-muted/50 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Plan</p>
                <p className="mt-3 text-sm leading-7 text-foreground">{doctorNotes?.prescription || "—"}</p>
              </div>
              <div className="rounded-3xl border border-border bg-muted/50 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Next Follow-Up</p>
                <p className="mt-3 text-sm leading-7 text-foreground">{doctorNotes?.next_follow_up || "—"}</p>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-8 space-y-6">
          <section className="space-y-5 rounded-2xl border border-border bg-background p-5">
            <div>
              <h2 className="text-2xl font-semibold">Medical history</h2>
              <p className="mt-1 text-sm text-muted-foreground">Patient history from previous and current appointments.</p>
            </div>
            <MedicalHistoryTable entries={medicalHistoryRows} />
          </section>

          <section className="space-y-5 rounded-2xl border border-border bg-background p-5">
            <div>
              <h2 className="text-2xl font-semibold">SOAP summary</h2>
              <p className="mt-1 text-sm text-muted-foreground">Clinical notes and follow-ups across this patient’s appointments.</p>
            </div>
            {soapNotes.length ? (
              <SoapSummaryTable notes={soapNotes} appointmentId={appointment.appointment_id} />
            ) : (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No SOAP notes have been added for this patient yet.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
