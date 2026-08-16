import prisma from "@/lib/prisma"
import { DataTable } from "@/components/data-table"
import { getSession } from "@/lib/auth-utils"
import { normalizeUserRole } from "@/lib/user-role"
import { columns } from "./columns"
import { formatAppointmentTime } from "@/app/client/appointments/status"

async function getDoctorAppointments(userId: string) {
  const doctor = await prisma.doctor.findUnique({
    where: { user_id: userId },
    select: {
      doctor_id: true,
      prefix: true,
      first_name: true,
      middle_name: true,
      last_name: true,
    },
  })

  if (!doctor) {
    return []
  }

  const doctorName = [doctor.prefix, doctor.first_name, doctor.middle_name, doctor.last_name]
    .filter(Boolean)
    .join(" ")

  const appointments = await prisma.appointment.findMany({
    where: { doctor_id: doctor.doctor_id },
    orderBy: { appointment_id: "desc" },
    select: {
      appointment_id: true,
      user_id: true,
      appointment_status: true,
      reason_for_visit: true,
      age: true,
      gender: true,
      appointment_date: true,
      appointment_time: true,
      user: {
        select: {
          name: true,
          profile_image: true,
        },
      },
      session_tbl: {
        select: {
          session_date: true,
          start_time: true,
          appointment_type: true,
        },
      },
    },
  })

  return appointments.map((appointment) => {
    const patientName = appointment.user?.name ?? "Unknown Patient"
    const dateValue = appointment.appointment_date ?? appointment.session_tbl?.session_date
    const date = dateValue ? dateValue.toISOString().split("T")[0] : ""
    const timeValue = appointment.appointment_time ?? appointment.session_tbl?.start_time
    const time = timeValue ? timeValue.toISOString().slice(11, 16) : ""
    const specialty = appointment.session_tbl?.appointment_type || appointment.reason_for_visit || "General Consultation"

    return {
      id: String(appointment.appointment_id),
      patientId: appointment.user_id,
      patientName,
      patientAvatar: appointment.user?.profile_image ?? null,
      patientAge: appointment.age != null ? String(appointment.age) : "—",
      patientGender: appointment.gender ?? "—",
      doctorName,
      specialty,
      date,
      time: formatAppointmentTime(String(time || "")),
      status: appointment.appointment_status ?? "Pending",
    }
  })
}

export default async function Page() {
  const session = await getSession()
  const role = normalizeUserRole(session?.role)
  const filteredAppointments =
    role === "DOCTOR" && session?.id
      ? await getDoctorAppointments(session.id)
      : []

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-foreground">My Appointments</h1>
          <p className="mt-2 text-muted-foreground">View patients and open their records to add notes, prescriptions, and next follow-up details.</p>
        </div>

        <DataTable columns={columns} data={filteredAppointments} />
      </div>
    </div>
  )
}
