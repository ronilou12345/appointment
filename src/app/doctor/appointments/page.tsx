import { DataTable } from "@/components/data-table"
import { columns } from "./columns"
import { doctorAppointments } from "./data"

export default function Page() {
  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-foreground">My Appointments</h1>
          <p className="mt-2 text-muted-foreground">View patients and open their records to add notes, prescriptions, and next follow-up details.</p>
        </div>

        <DataTable columns={columns} data={doctorAppointments} />
      </div>
    </div>
  )
}
