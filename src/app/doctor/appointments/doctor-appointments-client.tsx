"use client"

import * as React from "react"
import { DataTable } from "@/components/data-table"
import { PrintAppointmentsButton } from "@/app/admin/all-appointments/print-appointments"
import { columns, type DoctorAppointmentRow, toPrintAppointment } from "./columns"

export function DoctorAppointmentsClient({ appointments }: { appointments: DoctorAppointmentRow[] }) {
  const [selectedAppointments, setSelectedAppointments] = React.useState<DoctorAppointmentRow[]>([])

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">My Appointments</h1>
          <p className="mt-2 text-muted-foreground">View patients and open their records to add notes, prescriptions, and next follow-up details.</p>
        </div>
        <PrintAppointmentsButton selectedAppointments={selectedAppointments.map(toPrintAppointment)} />
      </div>

      <DataTable
        columns={columns}
        data={appointments}
        getRowId={(row) => row.id}
        onSelectedRowsChange={setSelectedAppointments}
      />
    </>
  )
}
