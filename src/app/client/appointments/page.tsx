import { DataTable } from "@/components/data-table"
import { getSession } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"
import { columns, type ClientAppointmentRow } from "./columns"

const formatAppointmentStatus = (value: string | null) => {
  const normalized = (value ?? "Pending").toLowerCase()
  if (normalized.includes("complete")) return "Completed"
  if (normalized.includes("cancel") || normalized.includes("reject")) return "Cancelled"
  return "Upcoming"
}

export default async function Page() {
  const user = await getSession()

  if (!user?.id) {
    return (
      <div className="min-h-screen bg-background p-6 text-foreground">
        <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-3xl font-semibold">My Appointments</h1>
          <p className="mt-2 text-muted-foreground">Please sign in to view your appointments.</p>
        </div>
      </div>
    )
  }

  const rows = await prisma.$queryRawUnsafe<any[]>(`
    SELECT
      a.appointment_id AS id,
      a.appointment_status AS status,
      COALESCE(a.appointment_type, s.appointment_type) AS specialty,
      to_char(s.session_date, 'YYYY-MM-DD') AS date,
      to_char(s.start_time, 'HH24:MI') AS time,
      CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
      u.email AS doctor_email,
      d.doctor_id AS doctor_id
    FROM "appointment" a
    JOIN "session_tbl" s ON s.session_id = a.session_id
    JOIN "doctor" d ON d.doctor_id = a.doctor_id
    JOIN "user" u ON u.id = d.user_id
    WHERE a.user_id = $1
    ORDER BY s.session_date ASC, s.start_time ASC, a.appointment_id ASC
  `, user.id)

  const appointments: ClientAppointmentRow[] = rows.map((row) => ({
    id: String(row.id),
    doctorId: String(row.doctor_id ?? ""),
    doctorName: String(row.doctor_name || "Doctor"),
    doctorAvatar: "/avatars/shadcn.jpg",
    doctorEmail: String(row.doctor_email || ""),
    specialty: String(row.specialty || "General Consultation"),
    date: String(row.date || ""),
    time: String(row.time || ""),
    status: formatAppointmentStatus(String(row.status || "Pending")),
  }))

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold">My Appointments</h1>
          <p className="mt-2 text-muted-foreground">
            View your appointments with doctors. Click the doctor name to view your medical record and prescription details.
          </p>
        </div>

        {appointments.length ? <DataTable columns={columns} data={appointments} /> : <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">You do not have any appointments yet.</div>}
      </div>
    </div>
  )
}
