"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export type ClientAppointmentRow = {
  id: string
  doctorId: string
  doctorName: string
  specialty: string
  date: string
  time: string
  status: string
}

export const columns: ColumnDef<ClientAppointmentRow>[] = [
  {
    accessorKey: "doctorName",
    header: "Doctor",
    cell: ({ row }) => {
      const appointment = row.original
      const doctorName = String(row.getValue("doctorName"))
      return (
        <Link href={`/client/appointments/${appointment.id}`} className="text-primary hover:underline">
          {doctorName}
        </Link>
      )
    },
  },
  {
    accessorKey: "specialty",
    header: "Specialty",
    cell: ({ row }) => row.getValue("specialty"),
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
