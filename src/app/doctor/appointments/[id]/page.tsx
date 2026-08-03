import Link from "next/link"
import { getDoctorAppointment } from "../data"
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

export default async function DoctorAppointmentDetailPage({ params }: Props) {
  const { id } = await params
  const appointment = getDoctorAppointment(id)

  if (!appointment) {
    return (
      <div className="min-h-screen bg-background p-6 text-foreground">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-border bg-card p-8 shadow-sm">
          <div className="rounded-[32px] border border-destructive/20 bg-destructive/10 p-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-600">Appointment not found</p>
            <h1 className="mt-4 text-4xl font-semibold">Patient appointment unavailable</h1>
            <p className="mt-4 text-sm text-muted-foreground">
              The selected appointment could not be found. Please return to your schedule and choose another patient.
            </p>
            <Link
              href="/doctor/appointments"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
            >
              Back to my appointments
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const badgeVariant = getStatusVariant(appointment.status)
  const initials = getInitials(appointment.patientName)

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
                  <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{appointment.patientName}</h1>
                  <p className="mt-2 text-sm text-muted-foreground">{appointment.patientGender} • {appointment.patientAge} years</p>
                </div>
              </div>

              <div className="mt-8 grid gap-4">
                <div className="rounded-3xl border border-border bg-card p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Appointment ID</p>
                  <p className="mt-2 font-semibold">{appointment.id}</p>
                </div>
                <div className="rounded-3xl border border-border bg-card p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Patient ID</p>
                  <p className="mt-2 font-semibold">{appointment.patientId}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">Appointment details</p>
                  <h2 className="mt-3 text-4xl font-semibold tracking-tight">{appointment.specialty}</h2>
                  <p className="mt-3 text-sm text-muted-foreground">{appointment.doctorName}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={badgeVariant} className="px-4 py-2 text-sm font-semibold">
                    {appointment.status}
                  </Badge>
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
                  <p className="mt-2 text-lg font-semibold">{appointment.date}</p>
                </div>
                <div className="rounded-3xl border border-border bg-muted/50 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Time</p>
                  <p className="mt-2 text-lg font-semibold">{appointment.time}</p>
                </div>
                <div className="rounded-3xl border border-border bg-muted/50 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Doctor</p>
                  <p className="mt-2 text-lg font-semibold">{appointment.doctorName}</p>
                </div>
                <div className="rounded-3xl border border-border bg-muted/50 p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Prescriptions</p>
                  <p className="mt-2 text-lg font-semibold">{appointment.prescription.length} item{appointment.prescription.length === 1 ? "" : "s"}</p>
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
                <p className="mt-3 text-base font-semibold leading-7">{appointment.patientNotes}</p>
              </div>
              <div className="rounded-3xl border border-border bg-muted/50 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Doctor notes</p>
                <p className="mt-3 text-base font-semibold leading-7">{appointment.doctorNotes}</p>
              </div>
              <div className="rounded-3xl border border-border bg-muted/50 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Follow-up plan</p>
                <p className="mt-3 text-base font-semibold leading-7">{appointment.followUp}</p>
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
                <p className="mt-2 text-base font-semibold">{appointment.specialty}</p>
              </div>
              <div className="rounded-3xl border border-border bg-muted/50 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Status</p>
                <p className="mt-2 text-base font-semibold">{appointment.status}</p>
              </div>
              <div className="rounded-3xl border border-border bg-muted/50 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Prescription</p>
                <p className="mt-2 text-base font-semibold">{appointment.prescription.join(", ")}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
