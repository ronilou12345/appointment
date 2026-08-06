import Link from "next/link"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import prisma from "@/lib/prisma"

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
  return time.toISOString().slice(11, 16)
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
          avatar: true,
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
    },
  })

  if (!appointment) {
    notFound()
  }

  const patientName = appointment.user?.name ?? "Unknown Patient"
  const patientAvatar = appointment.user?.avatar ?? ""
  const patientEmail = appointment.user?.email ?? "—"
  const patientStatus = appointment.user?.status ?? "Unknown"
  const patientAge = appointment.age != null ? String(appointment.age) : "—"
  const patientGender = appointment.gender ?? "—"
  const patientType = appointment.session_tbl?.appointment_type ?? "General Consultation"
  const patientDate = formatDate(appointment.session_tbl?.session_date)
  const patientTime = formatTime(appointment.session_tbl?.start_time)
  const patientRelationship = appointment.relationship ?? "N/A"
  const patientReason = appointment.reason_for_visit ?? "N/A"
  const patientSymptoms = appointment.symptoms ?? "No symptoms recorded."

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
      <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar size="lg">
              {patientAvatar ? <AvatarImage src={patientAvatar} alt={patientFullName} /> : <AvatarFallback>{getInitials(patientName)}</AvatarFallback>}
            </Avatar>
            <div>
              <h1 className="text-3xl font-semibold">{patientFullName || patientName}</h1>
              <p className="text-sm text-muted-foreground">Patient profile</p>
              <p className="mt-1 text-sm text-muted-foreground">{patientEmail}</p>
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
        </div>

        <div className="mt-8 divide-y divide-border rounded-3xl bg-background text-sm text-foreground">
          <div className="px-0 py-4">
            <h2 className="text-2xl font-semibold">Appointment details</h2>
            <p className="mt-2 text-sm text-muted-foreground">Summary of the visit and patient notes.</p>
          </div>

          <div className="px-0 py-4">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Reason for visit</p>
            <p className="mt-3 text-base font-medium">{patientReason}</p>
          </div>

          <div className="px-0 py-4">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Symptoms</p>
            <p className="mt-3 text-sm leading-7 text-foreground">{patientSymptoms}</p>
          </div>

          <div className="px-0 py-4">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Doctor</p>
            <p className="mt-3 text-base font-medium">{doctorName}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
