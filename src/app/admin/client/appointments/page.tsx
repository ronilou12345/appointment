import { DataTable } from "@/components/data-table"
import { columns, type AppointmentRow } from "./columns"
import { MedicalRecordsSection } from "./medical-records"

export default function ClientAppointmentsPage() {
  const data: AppointmentRow[] = [
    {
      id: "c1",
      doctorId: "d1",
      doctorName: "Dr. Sarah Johnson",
      date: new Date().toISOString().split("T")[0],
      time: "09:30 AM",
      type: "Consultation",
      status: "Upcoming",
    },
    {
      id: "c2",
      doctorId: "d2",
      doctorName: "Dr. Michael Chen",
      date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
      time: "02:00 PM",
      type: "Follow-up",
      status: "Completed",
    },
    {
      id: "c3",
      doctorId: "d3",
      doctorName: "Dr. Emma Williams",
      date: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
      time: "11:15 AM",
      type: "Check-up",
      status: "Upcoming",
    },
  ]

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-3xl font-semibold text-foreground">My Appointments</h1>
            <p className="mt-2 text-muted-foreground">
              View your upcoming appointments, review past visits, and access medical records from your doctor.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-border bg-background p-5">
              <p className="text-sm text-muted-foreground">Upcoming Visits</p>
              <p className="mt-2 text-3xl font-semibold">3</p>
            </div>
            <div className="rounded-3xl border border-border bg-background p-5">
              <p className="text-sm text-muted-foreground">Past Visits</p>
              <p className="mt-2 text-3xl font-semibold">12</p>
            </div>
            <div className="rounded-3xl border border-border bg-background p-5">
              <p className="text-sm text-muted-foreground">Prescriptions</p>
              <p className="mt-2 text-3xl font-semibold">5</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Upcoming Appointments</h2>
                <p className="text-sm text-muted-foreground">Manage your schedule and view details before your visit.</p>
              </div>
            </div>
            <DataTable columns={columns} data={data} />
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
              <h2 className="text-2xl font-semibold">Last Visit Summary</h2>
              <p className="mt-2 text-sm text-muted-foreground">Quick summary from your most recent doctor visit.</p>

              <div className="mt-6 space-y-4">
                <div className="rounded-3xl border border-border bg-background p-5">
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="mt-2 text-base font-medium">June 21, 2024</p>
                </div>
                <div className="rounded-3xl border border-border bg-background p-5">
                  <p className="text-sm text-muted-foreground">Doctor</p>
                  <p className="mt-2 text-base font-medium">Dr. Sarah Johnson</p>
                </div>
                <div className="rounded-3xl border border-border bg-background p-5">
                  <p className="text-sm text-muted-foreground">Diagnosis</p>
                  <p className="mt-2 text-base font-medium">Hypertension monitoring</p>
                </div>
                <div className="rounded-3xl border border-border bg-background p-5">
                  <p className="text-sm text-muted-foreground">Prescriptions</p>
                  <ul className="mt-2 space-y-2 text-sm text-foreground">
                    <li>Lisinopril 10mg</li>
                    <li>Amlodipine 5mg</li>
                  </ul>
                </div>
              </div>
            </div>

            <MedicalRecordsSection />
          </div>
        </div>
      </div>
    </div>
  )
}
