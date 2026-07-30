import { DataTable } from "@/components/data-table"
import { columns, type AppointmentRow } from "./columns"

export default function Page() {
  const data: AppointmentRow[] = [
    { id: "a1", patientId: "p1", patientName: "Juan Dela Cruz", doctorName: "Dr. Sarah Johnson", date: new Date().toISOString().split("T")[0], time: "09:30", status: "Confirmed" },
    { id: "a2", patientId: "p2", patientName: "Maria Santos", doctorName: "Dr. Michael Chen", date: new Date(Date.now()+86400000).toISOString().split("T")[0], time: "11:00", status: "Pending" },
  ]

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
