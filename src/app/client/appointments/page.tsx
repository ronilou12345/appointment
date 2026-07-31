import { DataTable } from "@/components/data-table"
import { columns, type ClientAppointmentRow } from "./columns"

const appointments: ClientAppointmentRow[] = [
  {
    id: "a1",
    doctorId: "d1",
    doctorName: "Dr. Sarah Johnson",
    specialty: "General Practice",
    date: "2024-07-01",
    time: "09:30 AM",
    status: "Upcoming",
  },
  {
    id: "a2",
    doctorId: "d2",
    doctorName: "Dr. Michael Chen",
    specialty: "Cardiology",
    date: "2024-06-28",
    time: "02:00 PM",
    status: "Completed",
  },
  {
    id: "a3",
    doctorId: "d3",
    doctorName: "Dr. Emma Williams",
    specialty: "Pediatrics",
    date: "2024-07-03",
    time: "11:15 AM",
    status: "Upcoming",
  },
]

export default function Page() {
  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold">My Appointments</h1>
          <p className="mt-2 text-muted-foreground">
            View your appointments with doctors. Click the doctor name to view your medical record and prescription details.
          </p>
        </div>

        <DataTable columns={columns} data={appointments} />
      </div>
    </div>
  )
}
