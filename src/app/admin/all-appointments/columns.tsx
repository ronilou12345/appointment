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
import { printSingleAppointment } from "./print-appointments"

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
  reasonForVisit?: string
  appointmentType?: string
  relationship?: string
  age?: string
  gender?: string
  contactNumber?: string
  symptoms?: string
  durationOfSymptoms?: string
  painLevel?: string
  additionalNotes?: string
  heartRate?: string
  bodyTemperature?: string
  weight?: string
  bloodSugar?: string
  chiefComplaints?: string
  physicalExamination?: string
  diagnosis?: string
  prescription?: string
  nextFollowUp?: string
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

const getStatusClasses = (status: string) => {
  const normalized = status?.toLowerCase() ?? "pending"

  switch (normalized) {
    case "pending":
      return "bg-amber-100 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/60"
    case "confirmed":
      return "bg-blue-100 text-blue-800 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800/60"
    case "completed":
      return "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/60"
    case "cancelled":
    case "canceled":
      return "bg-rose-100 text-rose-800 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800/60"
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:ring-slate-700"
  }
}

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
    cell: ({ row }) => {
      const status = String(row.getValue("status") ?? "Pending")

      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(status)}`}>
          {status}
        </span>
      )
    },
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
            <DropdownMenuItem onClick={() => printSingleAppointment(appt)}>Print</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(appt.id)}>Copy ID</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
