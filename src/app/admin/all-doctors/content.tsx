"use client"

import { useState } from "react"
import { DataTable } from "@/components/data-table"
import { columns, DoctorRow } from "./columns"
import { CreateDoctorDialog } from "@/components/create-doctor-dialog"

export function AllDoctorsContent({ rows }: { rows: DoctorRow[] }) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">All Doctors</h1>
            <p className="mt-2 text-muted-foreground">
              View and manage all doctors in the system. You can check availability, specialty, and profile details here.
            </p>
          </div>
          <div className="flex-shrink-0">
            <CreateDoctorDialog open={dialogOpen} onOpenChange={setDialogOpen} />
          </div>
        </div>
        <DataTable columns={columns} data={rows} />
      </div>
    </div>
  )
}
