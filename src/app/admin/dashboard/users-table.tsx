"use client"

import * as React from "react"
import { DataTable } from "@/components/data-table"
import { columns, type AppointmentRow } from "@/app/admin/all-appointments/columns"

export default function UsersTable({ rows }: { rows: AppointmentRow[] }) {
  return <DataTable columns={columns} data={rows} />
}
