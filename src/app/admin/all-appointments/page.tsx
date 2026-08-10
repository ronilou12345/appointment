import prisma from "@/lib/prisma"
import { DataTable } from "@/components/data-table"
import { columns, type AppointmentRow } from "./columns"
import { formatAppointmentTime } from "@/app/client/appointments/status"

async function getAppointments(): Promise<AppointmentRow[]> {
  const appointments = await prisma.appointment.findMany({
    orderBy: { appointment_id: "desc" },
    select: {
      appointment_id: true,
      user_id: true,
      doctor_id: true,
      appointment_status: true,
      session_id: true,
      reason_for_visit: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
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
          session_date: true,
          start_time: true,
        },
      },
    },
  })

  return appointments.map((appointment) => {
    const patientName = appointment.user?.name ?? "Unknown Patient"
    const doctorName = appointment.doctor
      ? [appointment.doctor.first_name, appointment.doctor.middle_name, appointment.doctor.last_name]
          .filter(Boolean)
          .join(" ")
      : "Unknown Doctor"

    const date = appointment.session_tbl?.session_date
      ? appointment.session_tbl.session_date.toISOString().split("T")[0]
      : ""

    const time = appointment.session_tbl?.start_time
      ? formatAppointmentTime(appointment.session_tbl.start_time.toISOString().slice(11, 16))
      : ""

    return {
      id: String(appointment.appointment_id),
      patientId: appointment.user_id,
      patientName,
      patientEmail: appointment.user?.email ?? "",
      patientAvatar: appointment.user?.avatar ?? "",
      doctorName,
      date,
      time,
      status: appointment.appointment_status ?? "Pending",
    }
  })
}

export default async function Page() {
  const data = await getAppointments()

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-foreground">All Appointments</h1>
          <p className="mt-2 text-muted-foreground">Review upcoming appointments, patient bookings, and appointment status in one place.</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <DataTable columns={columns} data={data} />
        </div>
      </div>
    </div>
  )
}
