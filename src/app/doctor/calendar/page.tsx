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
      user: { select: { name: true } },
    },
  })

  const calendarAppointments: CalendarAppointment[] = appointments.map((appointment) => {
    const appointmentDate = appointment.appointment_date ?? appointment.session_tbl?.session_date
    const appointmentTime = appointment.appointment_time ?? appointment.session_tbl?.start_time

    return {
      id: String(appointment.appointment_id),
      date: appointmentDate?.toISOString().slice(0, 10) ?? "",
      time: appointmentTime?.toISOString().slice(11, 16) ?? "",
      patientName: appointment.user?.name || "Unknown patient",
      status: appointment.appointment_status || "Pending",
    }
  }).filter((appointment) => appointment.date)

  return (
    <div className="min-h-screen bg-background p-4 text-foreground sm:p-6">
      <DoctorCalendar appointments={calendarAppointments} />
    </div>
  )
}