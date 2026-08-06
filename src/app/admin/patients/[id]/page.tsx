import prisma from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

type Props = { params: { id: string } }

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
    .join("") || "PT"

const getNameParts = (name: string): NameParts => {
  const parts = name.split(" ").filter(Boolean)
  return {
    firstName: parts[0] ?? "",
    middleInitial:
      parts.length > 2
        ? `${parts
            .slice(1, -1)
            .map((part) => part[0].toUpperCase())
            .join(".")}.`
        : "",
    lastName: parts.length > 1 ? parts[parts.length - 1] : "",
  }
}

const statusVariant = (status?: string | null) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "default"
    case "inactive":
      return "secondary"
    default:
      return "outline"
  }
}

const formatDate = (value?: Date | null) => {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const formatTime = (value?: Date | null) => {
  if (!value) return "—"
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

export default async function PatientProfilePage({ params }: Props) {
  const { id } = params

  if (!id) {
    notFound()
  }

  const patient = await prisma.user.findUnique({
    where: { id },
    include: {
      appointment: {
        orderBy: { created_at: "desc" },
        take: 1,
        include: {
          session_tbl: {
            select: {
              session_date: true,
              start_time: true,
              appointment_type: true,
            },
          },
          doctor: {
            select: {
              first_name: true,
              middle_name: true,
              last_name: true,
            },
          },
        },
      },
    },
  })

  if (!patient) {
    notFound()
  }

  const patientNameParts = getNameParts(patient.name)
  const latestAppointment = patient.appointment?.[0] ?? null
  const latestSession = latestAppointment?.session_tbl
  const doctorName = latestAppointment?.doctor
    ? [latestAppointment.doctor.first_name, latestAppointment.doctor.middle_name, latestAppointment.doctor.last_name]
        .filter(Boolean)
        .join(" ")
    : "—"

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
              Patient profile
            </p>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Patient profile details and appointment history context for this user.
            </p>
          </div>
          <Link href="/admin/all-appointments" className="text-sm font-medium text-primary transition hover:underline">
            Back to all appointments
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="grid gap-6 p-6 lg:grid-cols-[280px_1fr]">
            <div className="rounded-3xl border border-border bg-background p-6 text-center">
              <div className="flex flex-col items-center justify-center gap-5">
                <Avatar size="lg">
                  {patient.avatar ? <AvatarImage src={patient.avatar} alt={patient.name} /> : <AvatarFallback>{getInitials(patient.name)}</AvatarFallback>}
                </Avatar>
                <div>
                  <p className="text-lg font-semibold text-foreground">{patient.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{patient.email || "No email provided"}</p>
                </div>
                <Badge variant={statusVariant(patient.status)} className="capitalize">
                  {patient.status || "Unknown"}
                </Badge>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-border bg-background p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 border-b border-border pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">First name</p>
                    <p className="text-base font-medium text-foreground">{patientNameParts.firstName || "—"}</p>
                  </div>
                  <div className="space-y-2 border-b border-border pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Middle initial</p>
                    <p className="text-base font-medium text-foreground">{patientNameParts.middleInitial || "—"}</p>
                  </div>
                  <div className="space-y-2 border-b border-border pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Last name</p>
                    <p className="text-base font-medium text-foreground">{patientNameParts.lastName || "—"}</p>
                  </div>
                  <div className="space-y-2 border-b border-border pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Latest appointment</p>
                    <p className="text-base font-medium text-foreground">
                      {latestSession ? `${formatDate(latestSession.session_date)} · ${formatTime(latestSession.start_time)}` : "No recent appointment"}
                    </p>
                  </div>
                  <div className="space-y-2 pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Doctor</p>
                    <p className="text-base font-medium text-foreground">{doctorName}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-background p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 border-b border-border pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Gender</p>
                    <p className="text-base font-medium text-foreground">{latestAppointment?.gender || "—"}</p>
                  </div>
                  <div className="space-y-2 border-b border-border pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Age</p>
                    <p className="text-base font-medium text-foreground">{latestAppointment?.age != null ? latestAppointment.age : "—"}</p>
                  </div>
                  <div className="space-y-2 pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Relationship</p>
                    <p className="text-base font-medium text-foreground">{latestAppointment?.relationship || "—"}</p>
                  </div>
                  <div className="space-y-2 pb-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Appointment type</p>
                    <p className="text-base font-medium text-foreground">{latestSession?.appointment_type || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-background p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Reason for visit</p>
                    <p className="mt-3 text-base font-medium text-foreground">{latestAppointment?.reason_for_visit || "No reason recorded."}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Symptoms</p>
                    <p className="mt-3 text-sm leading-7 text-foreground">{latestAppointment?.symptoms || "No symptoms recorded."}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
