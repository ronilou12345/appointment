import { Badge } from "@/components/ui/badge"

const records = [
  {
    date: "2024-06-21",
    doctor: "Dr. Sarah Johnson",
    note: "Routine blood pressure check, medication adjusted.",
    prescription: ["Lisinopril 10mg", "Amlodipine 5mg"],
  },
  {
    date: "2024-05-15",
    doctor: "Dr. Michael Chen",
    note: "Follow-up after cardiac screening, heart rate stable.",
    prescription: ["Atorvastatin 20mg"],
  },
  {
    date: "2024-03-09",
    doctor: "Dr. Emma Williams",
    note: "Pediatric wellness visit, immunizations updated.",
    prescription: ["Vitamin D supplement"],
  },
]

export function MedicalRecordsSection() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 rounded-3xl border border-border bg-card p-6">
        <div>
          <h2 className="text-lg font-semibold">Medical Record Summary</h2>
          <p className="text-sm text-muted-foreground">Your past visits, prescriptions, and doctor notes.</p>
        </div>
        <Badge variant="secondary">Latest checkup 3 weeks ago</Badge>
      </div>

      <div className="grid gap-4">
        {records.map((record) => (
          <div key={record.date} className="rounded-3xl border border-border bg-background p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{record.date}</p>
                <h3 className="text-xl font-semibold">{record.doctor}</h3>
              </div>
              <Badge variant="ghost">Follow-up recommended</Badge>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{record.note}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {record.prescription.map((item) => (
                <div key={item} className="rounded-2xl border border-border bg-card px-4 py-3">
                  <p className="text-sm font-medium">Prescription</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
