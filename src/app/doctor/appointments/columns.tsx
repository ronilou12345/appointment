"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export type DoctorAppointmentRow = {
  id: string
  patientId: string
  patientName: string
  patientAge: string
  patientGender: string
  doctorName: string
  specialty: string
  date: string
  time: string
  status: string
}

export const columns: ColumnDef<DoctorAppointmentRow>[] = [
  {
    accessorKey: "patientName",
    header: "Patient",
    cell: ({ row }) => {
      const appointment = row.original
      return (
        <div className="space-y-1">
          <Link href={`/doctor/appointments/${appointment.id}`} className="text-primary hover:underline">
            {String(row.getValue("patientName"))}
          </Link>
          <p className="text-xs text-muted-foreground">
            {appointment.patientAge} yrs · {appointment.patientGender}
          </p>
        </div>
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
      const variant = status === "Confirmed" ? "default" : status === "Pending" ? "secondary" : "outline"
      return <Badge variant={variant}>{status}</Badge>
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const appointment = row.original
      return (
        <Link href={`/doctor/appointments/${appointment.id}`}>
          <Button variant="outline" size="sm">View</Button>
        </Link>
      )
    },
  },
]
