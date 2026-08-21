import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getSession } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"
import { resolveProfileAvatar } from "@/lib/profile-image"
import { formatAppointmentStatus, formatAppointmentTime } from "../status"

type Props = {
  params: Promise<{ id: string }>
}

type SoapNote = {
  chief_complaints?: string | null
  physical_examination?: string | null
  diagnosis?: string | null
  prescription?: string | null
  next_follow_up?: string | null
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("")

const soapText = (value: string | null | undefined, empty: string) => {
  const text = String(value ?? "").trim()
  return text || empty
}

async function getLatestSoapNote(appointmentId: number): Promise<SoapNote | null> {
  try {
    const note = await prisma.soap_notes.findFirst({
      where: { appointment_id: appointmentId },
      orderBy: { created_at: "desc" },
    })
    if (note) return note
  } catch {
    // Fall back to a raw query if the Prisma model is unavailable.
  }

  try {
    const rows = await prisma.$queryRawUnsafe<SoapNote[]>(
      `SELECT chief_complaints, physical_examination, diagnosis, prescription, next_follow_up
       FROM soap_notes
       WHERE appointment_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      appointmentId,
    )
    return rows[0] ?? null
  } catch {
    return null
  }
}

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
      to_char(COALESCE(a.appointment_date, s.session_date), 'YYYY-MM-DD') AS date,
      to_char(COALESCE(a.appointment_time, s.start_time), 'HH24:MI') AS time,
      CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
      u.id AS doctor_user_id,
      u.email AS doctor_email,
      u.profile_image AS doctor_profile_image,
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
  const soap = appointment ? await getLatestSoapNote(Number(id)) : null

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
  const doctorAvatar = resolveProfileAvatar(appointment.doctor_user_id, appointment.doctor_profile_image)

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              {doctorAvatar ? (
                <AvatarImage src={doctorAvatar} alt={doctorName} />
              ) : null}
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
                <p className="font-medium">{formatAppointmentTime(String(appointment.time || ""))}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{formatAppointmentStatus(String(appointment.status || "Pending"))}</p>
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
              <p className="mt-2 text-sm text-muted-foreground">
                SOAP notes added by the doctor for this appointment.
              </p>
            </div>

            {soap ? (
              <div className="mt-6 grid gap-6">
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Subjective (Chief Complaints)</p>
                  <div className="min-h-[120px] whitespace-pre-wrap rounded-lg border border-input bg-transparent px-3 py-2 text-sm leading-6">
                    {soapText(soap.chief_complaints, "No chief complaints recorded.")}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Objective (Physical Examination)</p>
                  <div className="min-h-[120px] whitespace-pre-wrap rounded-lg border border-input bg-transparent px-3 py-2 text-sm leading-6">
                    {soapText(soap.physical_examination, "No physical examination recorded.")}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Assessment (Diagnosis)</p>
                  <div className="min-h-[120px] whitespace-pre-wrap rounded-lg border border-input bg-transparent px-3 py-2 text-sm leading-6">
                    {soapText(soap.diagnosis, "No diagnosis recorded.")}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Plan (Prescription)</p>
                  <div className="min-h-[120px] whitespace-pre-wrap rounded-lg border border-input bg-transparent px-3 py-2 text-sm leading-6">
                    {soapText(soap.prescription, "No prescriptions recorded.")}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Next Follow-up</p>
                  <div className="min-h-[100px] whitespace-pre-wrap rounded-lg border border-input bg-transparent px-3 py-2 text-sm leading-6">
                    {soapText(soap.next_follow_up, "No follow-up plan recorded.")}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                The doctor has not added SOAP notes for this appointment yet.
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
