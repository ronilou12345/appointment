import { DataTable } from "@/components/data-table"
import { columns, type ClientAppointmentRow } from "./columns"
import { clientAppointments } from "./data"

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

        <DataTable columns={columns} data={clientAppointments} />
      </div>
    </div>
  )
}
