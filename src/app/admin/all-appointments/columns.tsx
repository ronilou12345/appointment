"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type AppointmentRow = {
  id: string
  patientId: string
  patientName: string
  patientEmail: string
  patientAvatar: string
  doctorName: string
  date: string
  time: string
  status: string
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

export const columns: ColumnDef<AppointmentRow>[] = [
  {
    accessorKey: "patientName",
    header: "Patient",
    cell: ({ row }) => {
      const appointmentId = row.original.id
      const name = String(row.getValue("patientName") ?? "Unknown Patient")
      const email = row.original.patientEmail
      const avatar = row.original.patientAvatar

      return (
        <Link
          href={`/admin/all-appointments/${appointmentId}`}
          className="group flex items-center gap-3 rounded-md px-2 py-1 text-primary transition-colors hover:bg-accent/50 hover:text-primary"
        >
          <Avatar size="sm" className="shrink-0">
            {avatar ? <AvatarImage src={avatar} alt={name} /> : <AvatarFallback>{getInitials(name)}</AvatarFallback>}
          </Avatar>
          <div className="min-w-0">
            <div className="font-medium text-foreground transition-colors group-hover:text-primary">{name}</div>
            {email ? <div className="truncate text-xs text-muted-foreground transition-colors group-hover:text-primary/80">{email}</div> : null}
          </div>
        </Link>
      )
    },
  },
  {
    accessorKey: "doctorName",
    header: "Doctor",
    cell: ({ row }) => row.getValue("doctorName"),
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
    cell: ({ row }) => <span className="text-sm">{row.getValue("status")}</span>,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const appt = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(appt.id)}>Copy ID</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
