import Link from "next/link"
import { getClientAppointment } from "../data"
import ClientAppointmentActions from "@/components/client-appointment-actions"

type Props = {
  params: Promise<{ id: string }>
}

export default async function AppointmentDetailPage({ params }: Props) {
  const { id } = await params
  const appointment = getClientAppointment(id)

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

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold">{appointment.patientName}</h1>
            <p className="text-sm text-muted-foreground">Patient profile</p>
          </div>
          <Link href="/client/appointments" className="text-sm text-muted-foreground hover:underline">
            Back to appointments
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Doctor</p>
            <p className="font-medium">{appointment.doctorName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Specialty</p>
            <p className="font-medium">{appointment.specialty}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date</p>
            <p className="font-medium">{appointment.date}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Time</p>
            <p className="font-medium">{appointment.time}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium">{appointment.status}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Record ID</p>
            <p className="font-medium">{appointment.recordId}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">External ID</p>
            <p className="font-medium">{appointment.externalId || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Patient Status</p>
            <p className="font-medium">{appointment.patientStatus}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-3xl border border-border bg-background p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-semibold">Appointment details</h2>
              <p className="mt-2 text-sm text-muted-foreground">Summary of the visit and doctor recommendations.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-border bg-card p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Last checkup</p>
                <p className="mt-2 font-semibold">{appointment.lastCheckup}</p>
              </div>
              <div className="rounded-3xl border border-border bg-card p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Next follow-up</p>
                <p className="mt-2 font-semibold">{appointment.followUp}</p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-border bg-card p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Doctor notes</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">Key findings from the appointment.</p>
              <p className="mt-4 text-base font-medium">{appointment.notes}</p>
            </div>

            <div className="mt-6 rounded-3xl border border-border bg-card p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Prescription</p>
              <div className="mt-3 space-y-3">
                {appointment.prescription.map((item) => (
                  <div key={item} className="rounded-2xl border border-border bg-background px-4 py-3">
                    <p className="text-sm font-medium">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-border bg-background p-6">
            <h2 className="text-2xl font-semibold">Patient info</h2>
            <p className="mt-2 text-sm text-muted-foreground">Formatted to match the admin patient detail page.</p>

            <div className="mt-6 grid gap-4">
              <div>
                <p className="text-sm text-muted-foreground">First Name</p>
                <p className="font-medium">{appointment.patientFirstName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Name</p>
                <p className="font-medium">{appointment.patientLastName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Preferred Name</p>
                <p className="font-medium">{appointment.patientPreferredName || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Patient status</p>
                <p className="font-medium">{appointment.patientStatus}</p>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-6">
          <ClientAppointmentActions currentDate={appointment.date} currentTime={appointment.time} />
        </div>
      </div>
    </div>
  )
}
