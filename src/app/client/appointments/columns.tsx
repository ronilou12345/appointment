"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export type ClientAppointmentRow = {
  id: string
  doctorId: string
  doctorName: string
  doctorAvatar?: string
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
      const avatar = appointment.doctorAvatar

      return (
        <Link href={`/client/appointments/${appointment.id}`} className="flex items-center gap-3 text-primary hover:underline">
          <Avatar size="sm">
            {avatar ? <AvatarImage src={avatar} alt={doctorName} /> : <AvatarFallback>{doctorName.split(" ").slice(0, 2).map((part) => part[0]).join("")}</AvatarFallback>}
          </Avatar>
          <span>{doctorName}</span>
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
