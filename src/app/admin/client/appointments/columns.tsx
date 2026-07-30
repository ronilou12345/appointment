"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export type AppointmentRow = {
  id: string
  doctorId: string
  doctorName: string
  date: string
  time: string
  type: string
  status: string
}

export const columns: ColumnDef<AppointmentRow>[] = [
  {
    accessorKey: "doctorName",
    header: "Doctor",
    cell: ({ row }) => {
      const appointment = row.original
      return (
        <Link href={`/admin/client/appointments/${appointment.id}`} className="text-primary hover:underline">
          {String(row.getValue("doctorName"))}
        </Link>
      )
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => row.getValue("type"),
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => row.getValue("date"),
  },
  {
    accessorKey: "time",
    header: "Time",
    cell: ({ row }) => row.getValue("time"),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = String(row.getValue("status"))
      const variant = status === "Completed" ? "secondary" : status === "Upcoming" ? "default" : "outline"
      return <Badge variant={variant}>{status}</Badge>
    },
  },
]
