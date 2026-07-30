import Link from "next/link"
import { getDoctorAppointment } from "../data"
import DoctorAppointmentEditor from "@/components/doctor-appointment-editor"

type Props = {
  params: Promise<{ id: string }>
}

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

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-[32px] border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">Patient appointment</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight">{appointment.patientName}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>{appointment.patientGender}</span>
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span>{appointment.patientAge} years</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/doctor/appointments"
                className="inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                Back to my appointments
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[28px] border border-border bg-background p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Date</p>
              <p className="mt-4 text-2xl font-semibold">{appointment.date}</p>
              <p className="mt-1 text-sm text-muted-foreground">{appointment.time}</p>
            </div>
            <div className="rounded-[28px] border border-border bg-background p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Specialty</p>
              <p className="mt-4 text-2xl font-semibold">{appointment.specialty}</p>
              <p className="mt-1 text-sm text-muted-foreground">{appointment.doctorName}</p>
            </div>
            <div className="rounded-[28px] border border-border bg-background p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Status</p>
              <p className="mt-4 text-2xl font-semibold text-foreground">{appointment.status}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[32px] border border-border bg-card p-8 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Patient profile</h2>
                <p className="mt-2 text-sm text-muted-foreground">Review patient history and clinical details before updating the record.</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-border bg-background p-6">
                <p className="text-sm text-muted-foreground">Patient name</p>
                <p className="mt-2 text-base font-semibold">{appointment.patientName}</p>
              </div>
              <div className="rounded-[28px] border border-border bg-background p-6">
                <p className="text-sm text-muted-foreground">Age / Gender</p>
                <p className="mt-2 text-base font-semibold">{appointment.patientAge} / {appointment.patientGender}</p>
              </div>
              <div className="sm:col-span-2 rounded-[28px] border border-border bg-background p-6">
                <p className="text-sm text-muted-foreground">Patient notes</p>
                <p className="mt-2 text-sm leading-7 text-foreground">{appointment.patientNotes}</p>
              </div>
            </div>
          </div>

          <aside className="rounded-[32px] border border-border bg-card p-8 shadow-sm">
            <h2 className="text-2xl font-semibold">Appointment summary</h2>
            <p className="mt-2 text-sm text-muted-foreground">Quick access to the visit details and follow-up plan.</p>

            <div className="mt-6 space-y-4">
              <div className="rounded-[28px] border border-border bg-background p-5">
                <p className="text-sm text-muted-foreground">Patient</p>
                <p className="mt-2 text-base font-semibold">{appointment.patientName}</p>
              </div>
              <div className="rounded-[28px] border border-border bg-background p-5">
                <p className="text-sm text-muted-foreground">Next follow-up</p>
                <p className="mt-2 text-base font-semibold">{appointment.followUp}</p>
              </div>
              <div className="rounded-[28px] border border-border bg-background p-5">
                <p className="text-sm text-muted-foreground">Prescription count</p>
                <p className="mt-2 text-base font-semibold">{appointment.prescription.length} items</p>
              </div>
            </div>
          </aside>
        </div>

        <DoctorAppointmentEditor
          notes={appointment.doctorNotes}
          prescription={appointment.prescription}
          followUp={appointment.followUp}
        />
      </div>
    </div>
  )
}
