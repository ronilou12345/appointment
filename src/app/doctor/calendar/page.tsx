import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import { normalizeUserRole } from "@/lib/user-role"
import { DoctorCalendar, type CalendarAppointment } from "./doctor-calendar"

export default async function DoctorCalendarPage() {
  const session = await getSession()
  if (!session?.id || normalizeUserRole(session.role) !== "DOCTOR") {
    redirect("/login")
  }

  const doctor = await prisma.doctor.findUnique({
    where: { user_id: session.id },
    select: { doctor_id: true },
  })

  if (!doctor) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        No doctor profile is linked to this account.
      </div>
    )
  }

  const appointments = await prisma.appointment.findMany({
    where: { doctor_id: doctor.doctor_id },
    orderBy: [
      { appointment_date: "asc" },
      { appointment_time: "asc" },
      { appointment_id: "asc" },
    ],
    select: {
      appointment_id: true,
      appointment_status: true,
      appointment_date: true,
      appointment_time: true,
      session_tbl: {
        select: {
          session_date: true,
          start_time: true,
        },
      },
      user: { select: { id: true, name: true, email: true, profile_image: true } },
    },
  })

  const sessions = await prisma.session_tbl.findMany({
    where: { doctor_id: doctor.doctor_id },
    orderBy: [
      { session_date: "asc" },
      { start_time: "asc" },
      { session_id: "asc" },
    ],
    select: {
      session_id: true,
      session_date: true,
      start_time: true,
      end_time: true,
      appointment_type: true,
      status: true,
    },
  })

  const calendarAppointments: CalendarAppointment[] = [
    ...appointments.map((appointment) => {
    const appointmentDate = appointment.appointment_date ?? appointment.session_tbl?.session_date
    const appointmentTime = appointment.appointment_time ?? appointment.session_tbl?.start_time

    return {
      id: String(appointment.appointment_id),
      date: appointmentDate?.toISOString().slice(0, 10) ?? "",
      time: appointmentTime?.toISOString().slice(11, 16) ?? "",
      patientName: appointment.user?.name || "Unknown patient",
      patientId: appointment.user?.id,
      patientEmail: appointment.user?.email,
      patientAvatar: appointment.user?.profile_image,
      status: appointment.appointment_status || "Pending",
      kind: "appointment" as const,
    }
    }),
    ...sessions.map((session): CalendarAppointment => ({
      id: `session-${session.session_id}`,
      date: session.session_date.toISOString().slice(0, 10),
      time: session.start_time.toISOString().slice(11, 16),
      endTime: session.end_time.toISOString().slice(11, 16),
      patientName: "",
      status: session.status || "Active",
      kind: "session",
      appointmentType: session.appointment_type,
    })),
  ].filter((appointment) => appointment.date)

  return (
    <div className="min-h-screen bg-background p-4 text-foreground sm:p-6">
      <DoctorCalendar appointments={calendarAppointments} />
    </div>
  )
}