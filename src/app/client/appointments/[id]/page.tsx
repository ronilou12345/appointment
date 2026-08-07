import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getSession } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"

type Props = {
  params: Promise<{ id: string }>
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("")

export default async function AppointmentDetailPage({ params }: Props) {
  const { id } = await params
  const user = await getSession()

  if (!user?.id) {
    return (
      <div className="min-h-screen bg-background p-6 text-foreground">
        <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-card p-8 shadow-sm">
          <p>Please sign in to view this appointment.</p>
        </div>
      </div>
    )
  }

  const rows = await prisma.$queryRawUnsafe<any[]>(`
    SELECT
      a.appointment_id AS id,
      a.appointment_status AS status,
      COALESCE(a.appointment_type, s.appointment_type) AS specialty,
      to_char(s.session_date, 'YYYY-MM-DD') AS date,
      to_char(s.start_time, 'HH24:MI') AS time,
      CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
      u.email AS doctor_email,
      a.reason_for_visit,
      a.relationship,
      a.symptoms,
      a.additional_notes
    FROM "appointment" a
    JOIN "session_tbl" s ON s.session_id = a.session_id
    JOIN "doctor" d ON d.doctor_id = a.doctor_id
    JOIN "user" u ON u.id = d.user_id
    WHERE a.appointment_id = $1 AND a.user_id = $2
    LIMIT 1
  `, Number(id), user.id)

  const appointment = rows[0]

  if (!appointment) {
    return (
      <div className="min-h-screen bg-background p-6 text-foreground">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-border bg-card p-8 shadow-sm">
          <div className="rounded-[32px] border border-destructive/20 bg-destructive/10 p-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-600">Appointment not found</p>
            <h1 className="mt-4 text-4xl font-semibold">We can’t locate this booking</h1>
            <p className="mt-4 text-sm text-muted-foreground">
              The requested appointment does not exist or may have been removed. Please go back and choose another visit.
            </p>
            <Link
              href="/client/appointments"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
            >
              Back to appointments
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const doctorName = String(appointment.doctor_name || "Doctor")

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarFallback>{getInitials(doctorName)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-semibold">{doctorName}</h1>
              <p className="text-sm text-muted-foreground">Doctor profile</p>
            </div>
          </div>
          <Link href="/client/appointments" className="text-sm text-muted-foreground hover:underline">
            Back to appointments
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Doctor</p>
                <p className="font-medium">{doctorName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Appointment Type</p>
                <p className="font-medium">{String(appointment.specialty || "General Consultation")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{String(appointment.date || "")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">{String(appointment.time || "")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{String(appointment.status || "Pending")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Relationship</p>
                <p className="font-medium">{String(appointment.relationship || "N/A")}</p>
              </div>
            </div>

            <div className="divide-y divide-border rounded-3xl bg-background text-sm text-foreground shadow-sm">
              <div className="px-0 py-4">
                <h2 className="text-2xl font-semibold">Appointment details</h2>
                <p className="mt-2 text-sm text-muted-foreground">Clinic Visit Summary</p>
              </div>

              <div className="px-0 py-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Reason for visit</p>
                <p className="mt-3 text-base font-medium">{String(appointment.reason_for_visit || "N/A")}</p>
              </div>

              <div className="px-0 py-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Symptoms</p>
                <p className="mt-3 text-sm leading-7 text-foreground">{String(appointment.symptoms || "No symptoms recorded.")}</p>
              </div>

              <div className="px-0 py-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Additional notes</p>
                <p className="mt-3 text-sm leading-7 text-foreground">{String(appointment.additional_notes || "No additional notes.")}</p>
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-border bg-background p-6 text-sm text-foreground shadow-sm">
            <div>
              <h2 className="text-2xl font-semibold">Doctor notes & plan</h2>
              <p className="mt-2 text-sm text-muted-foreground">SOAP summary for the clinician's review and doctor recommendations.</p>
            </div>

            <div className="mt-6 space-y-6">
              <div className="rounded-3xl border border-border bg-muted/50 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Chief Complaints</p>
                <p className="mt-3 text-sm leading-7 text-foreground">{String(appointment.reason_for_visit || "No subjective details provided.")}</p>
              </div>
              <div className="rounded-3xl border border-border bg-muted/50 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Physical Examination</p>
                <p className="mt-3 text-sm leading-7 text-foreground">{String(appointment.symptoms || "No objective findings recorded.")}</p>
              </div>
              <div className="rounded-3xl border border-border bg-muted/50 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Diagnosis</p>
                <p className="mt-3 text-sm leading-7 text-foreground">{String(appointment.status || "Pending")}</p>
              </div>
              <div className="rounded-3xl border border-border bg-muted/50 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Prescription</p>
                <p className="mt-3 text-sm leading-7 text-foreground">{String(appointment.additional_notes || "No plan provided.")}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
