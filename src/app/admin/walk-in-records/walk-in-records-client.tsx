"use client"

import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { AppointmentRow } from "@/app/admin/all-appointments/columns"
import { printMedicalCertificate, printSingleAppointment } from "@/app/admin/all-appointments/print-appointments"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Eye, FileText, MoreHorizontal, Printer } from "lucide-react"

export type WalkInRecordRow = {
  id: string
  patientName: string
  address: string
  email: string
  contactNumber: string
  doctorName: string
  appointmentDate: string
  appointmentTime: string
  appointmentType: string
  reasonForVisit: string
  doctorBoardCertification: string
  doctorSignature: string
  age: string
  gender: string
  civilStatus: string
  chiefComplaints: string
  diagnosis: string
  prescription: string
  status: string
}

function formatDate(value: string) {
  if (!value) return "—"
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value || "—"
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })
}

function toAppointmentRow(record: WalkInRecordRow): AppointmentRow {
  return {
    id: record.id,
    patientId: "",
    patientName: record.patientName,
    patientEmail: record.email,
    patientAvatar: "",
    patientAddress: record.address,
    doctorName: record.doctorName,
    doctorBoardCertification: record.doctorBoardCertification,
    doctorSignature: record.doctorSignature,
    date: record.appointmentDate,
    time: formatTime(record.appointmentTime),
    status: record.status,
    reasonForVisit: record.reasonForVisit || "—",
    appointmentType: record.appointmentType,
    relationship: "Walk-in",
    age: record.age || "—",
    gender: record.gender || "—",
    contactNumber: record.contactNumber || "—",
    chiefComplaints: record.chiefComplaints || "—",
    diagnosis: record.diagnosis || "—",
    prescription: record.prescription || "—",
  }
}

function WalkInRecordActions({ record }: { record: WalkInRecordRow }) {
  const [certificateOpen, setCertificateOpen] = useState(false)
  const appointment = toAppointmentRow(record)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open actions for {record.patientName}</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem asChild>
            <Link href={`/admin/walk-in-records/${record.id}`}>
              <Eye className="mr-2 size-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="whitespace-nowrap" onClick={() => printSingleAppointment(appointment)}>
            <Printer className="mr-2 size-4" />
            Print
          </DropdownMenuItem>
          {record.status.trim().toLowerCase() === "completed" ? (
            <DropdownMenuItem className="whitespace-nowrap" onClick={() => setCertificateOpen(true)}>
              <FileText className="mr-2 size-4" />
              Print Medical Certificate
            </DropdownMenuItem>
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
              <div className="mb-5">
                {appointment.date
                  ? new Date(`${appointment.date}T00:00:00`).toLocaleDateString("en-PH", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
              </div>
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
              <p className="mx-8 mt-10 text-center">
                The certificate is issued upon the request of the above patient for whatever purpose it may serve, except for medico-legal reasons.
              </p>
              <div className="ml-auto mt-8 w-56 text-center text-xs leading-5">
                <div className="flex h-12 items-end justify-center">
                  {appointment.doctorSignature?.startsWith("data:image/png;base64,") ? (
                    <img src={appointment.doctorSignature} alt="Doctor signature" className="h-12 w-full max-w-[180px] translate-y-6 object-contain [filter:brightness(0)]" />
                  ) : (
                    <span>_________________________</span>
                  )}
                </div>
                {appointment.doctorName || "Physician"}<br />Physician&apos;s Signature<br />PRC No. __________<br />PTR __________
              </div>
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

const columns: ColumnDef<WalkInRecordRow>[] = [
  {
    accessorKey: "patientName",
    header: "Patient",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="font-medium">{row.original.patientName}</p>
        {row.original.email ? (
          <p className="mt-1 truncate text-xs text-muted-foreground">{row.original.email}</p>
        ) : null}
      </div>
    ),
  },
  { accessorKey: "doctorName", header: "Doctor" },
  {
    id: "appointmentDateTime",
    accessorFn: (row) => `${row.appointmentDate} ${row.appointmentTime}`,
    header: "Date & Time",
    cell: ({ row }) => `${formatDate(row.original.appointmentDate)} · ${formatTime(row.original.appointmentTime)}`,
  },
  { accessorKey: "civilStatus", header: "Civil Status", cell: ({ row }) => row.original.civilStatus || "—" },
  { accessorKey: "address", header: "Address", cell: ({ row }) => row.original.address || "—" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status || "Waiting"
      const isCompleted = status.toLowerCase() === "completed"
      return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${isCompleted ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
          {status}
        </span>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => <WalkInRecordActions record={row.original} />,
  },
]

export function WalkInRecordsClient({ records }: { records: WalkInRecordRow[] }) {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Walk In Records</h1>
          <p className="mt-2 text-muted-foreground">
            View all walk-in registrations, patient contact details, appointment information, and status.
          </p>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={records}
        getRowId={(row) => row.id}
        showRowControls={false}
        dateFilterColumnIds={["appointmentDateTime"]}
      />
    </>
  )
}
