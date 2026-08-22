"use client"

import * as React from "react"
import { DataTable } from "@/components/data-table"
import { columns, type AppointmentRow } from "./columns"
import { PrintAppointmentsButton } from "./print-appointments"

export function AllAppointmentsClient({ appointments }: { appointments: AppointmentRow[] }) {
  const [selectedAppointments, setSelectedAppointments] = React.useState<AppointmentRow[]>([])

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">All Appointments</h1>
          <p className="mt-2 text-muted-foreground">Review upcoming appointments, patient bookings, and appointment status in one place.</p>
        </div>
        <PrintAppointmentsButton selectedAppointments={selectedAppointments} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <DataTable
          columns={columns}
          data={appointments}
          getRowId={(row) => row.id}
          onSelectedRowsChange={setSelectedAppointments}
        />
      </div>
    </>
  )
}
