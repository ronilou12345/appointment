import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import { normalizeUserRole } from "@/lib/user-role"
import { ensureWalkInAddressColumn } from "@/lib/walk-in"
import SOAPSheet from "@/components/soap-sheet"

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

  const soapRows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT soap_id AS id, chief_complaints, physical_examination, diagnosis, prescription, next_follow_up
     FROM public.soap_notes
     WHERE appointment_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    appointmentId,
  )
  const soapNote = soapRows[0]

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
            <SOAPSheet appointmentId={appointmentId} />
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
            <h2 className="text-2xl font-semibold">SOAP summary</h2>
            <p className="mt-1 text-sm text-muted-foreground">Clinical notes recorded for this visit</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <DetailField label="Chief complaints" value={soapNote?.chief_complaints ?? ""} />
            <DetailField label="Physical examination" value={soapNote?.physical_examination ?? ""} />
            <DetailField label="Diagnosis" value={soapNote?.diagnosis ?? ""} />
            <DetailField label="Prescription / plan" value={soapNote?.prescription ?? ""} />
            <DetailField label="Next follow-up" value={soapNote?.next_follow_up ?? ""} />
          </div>
        </section>
      </div>
    </div>
  )
}