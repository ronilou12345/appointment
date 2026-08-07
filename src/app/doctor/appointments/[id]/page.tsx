import Link from "next/link"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import SOAPSheet from "@/components/soap-sheet"

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

  const appointment = await prisma.appointment.findFirst({
    where: {
      appointment_id: appointmentId,
      doctor: { user_id: session.id },
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
      doctor: {
        select: {
          prefix: true,
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
    },
  })

  if (!appointment) {
    notFound()
  }

  const patientName = appointment.user?.name ?? "Unknown patient"
  const initials = getInitials(patientName)
  const doctorName = appointment.doctor
    ? [appointment.doctor.prefix, appointment.doctor.first_name, appointment.doctor.middle_name, appointment.doctor.last_name]
        .filter(Boolean)
        .join(" ")
    : "Doctor"

  const patientAge = appointment.age != null ? String(appointment.age) : "—"
  const patientGender = appointment.gender ?? "—"
  const patientNotes = appointment.reason_for_visit ?? "No patient notes recorded."
  const doctorNotes = appointment.additional_notes ?? "No doctor notes recorded."
  const followUp = appointment.symptoms ?? "No follow-up plan recorded."
  const specialty = appointment.session_tbl?.appointment_type || appointment.reason_for_visit || "General Consultation"
  const date = formatDate(appointment.session_tbl?.session_date)
  const time = formatTime(appointment.session_tbl?.start_time)
  const statusText = appointment.appointment_status ?? "Pending"
  const badgeVariant = getStatusVariant(statusText)
  const prescriptionText = "No prescriptions recorded."

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-[32px] border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[320px_1fr]">
            <div className="rounded-[32px] border border-border bg-muted/60 p-6 sm:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <Avatar size="lg">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Patient appointment</p>
                  <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{patientName}</h1>
                  <p className="mt-2 text-sm text-muted-foreground">{patientGender} • {patientAge} years</p>
                </div>
              </div>

              <div className="mt-8 grid gap-4">
                <div className="rounded-3xl border border-border bg-card p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Appointment ID</p>
                  <p className="mt-2 font-semibold">{appointment.appointment_id}</p>
                </div>
                <div className="rounded-3xl border border-border bg-card p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Patient ID</p>
                  <p className="mt-2 font-semibold">{appointment.user_id}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">Appointment details</p>
                  <h2 className="mt-3 text-4xl font-semibold tracking-tight">{specialty}</h2>
                  <p className="mt-3 text-sm text-muted-foreground">{doctorName}</p>
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
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Prescriptions</p>
                  <p className="mt-2 text-lg font-semibold">{prescriptionText}</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Appointment summary</h2>
            <p className="mt-2 text-sm text-muted-foreground">Quick contact-style details for the booking.</p>
          </div>
          <SOAPSheet />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.8fr] xl:items-start">
          <section className="rounded-[32px] border border-border bg-card p-6 sm:p-8 shadow-sm">
            <div>
              <h2 className="text-2xl font-semibold">Medical information</h2>
              <p className="mt-2 text-sm text-muted-foreground">Vital notes and treatment guidance for this appointment.</p>
            </div>

            <div className="mt-8 grid gap-6">
              <div className="rounded-3xl border border-border bg-muted/50 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Patient notes</p>
                <p className="mt-3 text-base font-semibold leading-7">{patientNotes}</p>
              </div>
              <div className="rounded-3xl border border-border bg-muted/50 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Doctor notes</p>
                <p className="mt-3 text-base font-semibold leading-7">{doctorNotes}</p>
              </div>
              <div className="rounded-3xl border border-border bg-muted/50 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Follow-up plan</p>
                <p className="mt-3 text-base font-semibold leading-7">{followUp}</p>
              </div>
            </div>
          </section>

          <aside className="rounded-[32px] border border-border bg-card p-6 sm:p-8 shadow-sm">
            <div>
              <h2 className="text-2xl font-semibold">Appointment summary</h2>
              <p className="mt-2 text-sm text-muted-foreground">Quick contact-style details for the booking.</p>
            </div>

            <div className="mt-8 grid gap-4">
              <div className="rounded-3xl border border-border bg-muted/50 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Specialty</p>
                <p className="mt-2 text-base font-semibold">{specialty}</p>
              </div>
              <div className="rounded-3xl border border-border bg-muted/50 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Status</p>
                <p className="mt-2 text-base font-semibold">{statusText}</p>
              </div>
              <div className="rounded-3xl border border-border bg-muted/50 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Prescription</p>
                <p className="mt-2 text-base font-semibold">{prescriptionText}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
