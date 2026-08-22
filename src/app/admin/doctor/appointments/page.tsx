import { DataTable } from "@/components/data-table"
import { columns, type AppointmentRow } from "@/app/admin/all-appointments/columns"

export default function MyAppointmentsPage() {
  const data: AppointmentRow[] = [
    {
      id: "d1",
      patientId: "p1",
      patientName: "Juan Dela Cruz",
      patientEmail: "juan.delacruz@example.com",
      patientAvatar: "",
      doctorName: "Dr. Sarah Johnson",
      date: new Date().toISOString().split("T")[0],
      time: "09:30",
      status: "Confirmed",
    },
    {
      id: "d2",
      patientId: "p3",
      patientName: "Ana Reyes",
      patientEmail: "ana.reyes@example.com",
      patientAvatar: "",
      doctorName: "Dr. Sarah Johnson",
      date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      time: "13:00",
      status: "Pending",
    },
  ]

  return (
    <div className="min-h-screen w-full bg-background p-6 text-foreground">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-foreground">My Appointments</h1>
        <p className="mt-2 text-muted-foreground">View and manage your scheduled appointments with patients.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="text-sm text-muted-foreground">Today's Appointments</div>
            <div className="mt-2 text-2xl font-semibold">5</div>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="text-sm text-muted-foreground">This Week</div>
            <div className="mt-2 text-2xl font-semibold">18</div>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="text-sm text-muted-foreground">Pending Confirmations</div>
            <div className="mt-2 text-2xl font-semibold text-orange-500">3</div>
          </div>
        </div>

        <DataTable columns={columns} data={data} />
      </div>
    </div>
  )
}
