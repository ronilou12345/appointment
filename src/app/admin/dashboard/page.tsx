import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import prisma from "@/lib/prisma"
import { resolveProfileAvatar } from "@/lib/profile-image"
import { formatAppointmentTime } from "@/app/client/appointments/status"
import type { AppointmentRow } from "@/app/admin/all-appointments/columns"
import UsersTable from "./users-table"

export default async function AdminDashboardPage() {
  const dashboardAppointments = await prisma.appointment.findMany({
    orderBy: { appointment_id: "desc" },
    select: {
      appointment_id: true,
      user_id: true,
      appointment_status: true,
      reason_for_visit: true,
      appointment_type: true,
      appointment_date: true,
      appointment_time: true,
      user: { select: { name: true, email: true, profile_image: true } },
      doctor: { select: { first_name: true, middle_name: true, last_name: true } },
      session_tbl: { select: { appointment_type: true, session_date: true, start_time: true } },
    },
  })

  const rows: AppointmentRow[] = dashboardAppointments.map((appointment) => {
    const dateValue = appointment.appointment_date ?? appointment.session_tbl?.session_date
    const timeValue = appointment.appointment_time ?? appointment.session_tbl?.start_time

    return {
      id: String(appointment.appointment_id),
      patientId: appointment.user_id,
      patientName: appointment.user?.name ?? "Unknown Patient",
      patientEmail: appointment.user?.email ?? "",
      patientAvatar: resolveProfileAvatar(appointment.user_id, appointment.user?.profile_image) || "",
      doctorName: appointment.doctor
        ? [appointment.doctor.first_name, appointment.doctor.middle_name, appointment.doctor.last_name].filter(Boolean).join(" ")
        : "Unknown Doctor",
      date: dateValue ? dateValue.toISOString().split("T")[0] : "",
      time: timeValue ? formatAppointmentTime(timeValue.toISOString().slice(11, 16)) : "",
      status: appointment.appointment_status ?? "Pending",
      reasonForVisit: appointment.reason_for_visit || "—",
      appointmentType: appointment.appointment_type || appointment.session_tbl?.appointment_type || "General Consultation",
    }
  })

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          <div className="px-4 lg:px-6">
            <h2 className="text-lg font-semibold">All Appointments</h2>
            <p className="text-sm text-muted-foreground mb-4">Review all patient appointments.</p>
            <UsersTable rows={rows} />
          </div>
        </div>
      </div>
    </div>
  )
}
