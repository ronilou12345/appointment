"use client"

import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal } from "lucide-react"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { printMedicalCertificate, printSingleAppointment } from "./print-appointments"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type AppointmentRow = {
  id: string
  patientId: string
  patientName: string
  patientEmail: string
  patientAvatar: string
  patientAddress?: string
  doctorName: string
  doctorBoardCertification?: string
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

const formatDateValue = (value: string | null | undefined) => {
  if (!value) return "—"

  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value

  return parsed.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  })
}

function AdminAppointmentActions({ appointment }: { appointment: AppointmentRow }) {
  const [certificateOpen, setCertificateOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/admin/all-appointments/${appointment.id}`}>View details</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => printSingleAppointment(appointment)}>Print</DropdownMenuItem>
          {appointment.status.trim().toLowerCase() === "completed" ? (
            <DropdownMenuItem onClick={() => setCertificateOpen(true)}>Print Medical Certificate</DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={certificateOpen} onOpenChange={setCertificateOpen}>
        <DialogContent className="max-w-4xl overflow-hidden rounded-3xl">
          <DialogHeader>
            <DialogTitle>Medical Certificate</DialogTitle>
            <DialogDescription>Review the certificate layout before sending it to the printer.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[72vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 text-slate-900">
            <div className="mx-auto max-w-3xl bg-white text-[13px] leading-6">
              <div className="flex items-center gap-4 border-b-4 border-teal-700 bg-sky-50 px-5 py-3">
                <img src="/logo1.jpg" alt="C2M Family Clinic" className="h-20 w-20 object-contain" />
                <div>
                  <div className="text-xl font-bold">{appointment.doctorName || "Physician"}</div>
                  <div className="italic text-teal-700">{appointment.doctorBoardCertification || "—"}</div>
                  <div>Poblacion, Sinacaban, Misamis Occidental, Philippines</div>
                  <div>c2mfamilyclinicpharmacy@gmail.com</div>
                </div>
              </div>
              <h2 className="my-6 text-center text-xl font-bold">MEDICAL CERTIFICATE</h2>
              <div className="mb-5">{new Date(`${appointment.date}T00:00:00`).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}</div>
              <div className="grid grid-cols-2 gap-x-16 gap-y-2">
                <div><b>Patient:</b> {appointment.patientName}</div>
                <div><b>Age:</b> {appointment.age || "—"} years old</div>
                <div><b>Address:</b> {appointment.patientAddress || "—"}</div>
                <div><b>Gender:</b> {appointment.gender || "—"}</div>
              </div>
              <div className="mt-10 space-y-6">
                <div><b>Complaints:</b><p className="mt-3">{appointment.chiefComplaints || appointment.reasonForVisit || "—"}</p></div>
                <div><b>Diagnosis:</b><p className="mt-3">1. {appointment.diagnosis || "—"}</p></div>
                <div><b>Remarks:</b><p className="mt-3">{appointment.prescription || "—"}</p></div>
              </div>
              <p className="mx-8 mt-10 text-center">The certificate is issued upon the request of the above patient for whatever purpose it may serve, except for medico-legal reasons.</p>
              <div className="ml-auto mt-8 w-56 text-center text-xs leading-5">_________________________<br />{appointment.doctorName || "Physician"}<br />Physician's Signature<br />PRC No. __________<br />PTR __________</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCertificateOpen(false)}>Close</Button>
            <Button onClick={() => printMedicalCertificate(appointment)}>Print Medical Certificate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
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
    cell: ({ row }) => formatDateValue(String(row.getValue("date") ?? "")),
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
    cell: ({ row }) => <AdminAppointmentActions appointment={row.original} />,
  },
]
