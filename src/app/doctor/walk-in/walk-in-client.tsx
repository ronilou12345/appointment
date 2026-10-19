"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { DoctorAppointmentActionsCell, type DoctorAppointmentRow } from "../appointments/columns"

export type DoctorWalkInRow = {
  id: string
  doctorId: string
  sessionId: string
  patientName: string
  address: string
  appointmentDate: string
  appointmentTime: string
  appointmentType: string
  doctorName: string
  doctorSignature: string
  doctorLicenseNumber: string
  status: string
  age: string
  gender: string
  birthday: string
  civilStatus: string
  contactNumber: string
  reasonForVisit: string
  symptoms: string
  durationOfSymptoms: string
  painLevel: string
  additionalNotes: string
  email: string
  bloodPressure: string
  temperature: string
  oxygenSaturation: string
  pulseRate: string
  weight: string
  height: string
  bmi: string
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

function WalkInActionsCell({ walkIn }: { walkIn: DoctorWalkInRow }) {
  const appointment: DoctorAppointmentRow = {
    id: walkIn.id,
    patientId: "",
    patientName: walkIn.patientName,
    patientEmail: walkIn.email,
    patientAddress: walkIn.address,
    patientAvatar: null,
    patientAge: walkIn.age ? `${walkIn.age} years old` : "—",
    patientGender: walkIn.gender || "—",
    doctorId: walkIn.doctorId,
    doctorName: walkIn.doctorName,
    doctorSignature: walkIn.doctorSignature,
    doctorLicenseNumber: walkIn.doctorLicenseNumber,
    sessionId: walkIn.sessionId,
    specialty: walkIn.appointmentType,
    date: walkIn.appointmentDate,
    time: formatTime(walkIn.appointmentTime),
    timeValue: walkIn.appointmentTime,
    status: walkIn.status,
    reasonForVisit: walkIn.reasonForVisit || "—",
    relationship: "Walk-in",
    contactNumber: walkIn.contactNumber || "—",
    symptoms: walkIn.symptoms || "No symptoms recorded.",
    durationOfSymptoms: walkIn.durationOfSymptoms || "—",
    painLevel: walkIn.painLevel || "—",
    additionalNotes: walkIn.additionalNotes || "No additional notes.",
    heartRate: walkIn.pulseRate || "—",
    bodyTemperature: walkIn.temperature ? `${walkIn.temperature} °C` : "—",
    weight: walkIn.weight ? `${walkIn.weight} kg` : "—",
    bloodSugar: "—",
    chiefComplaints: "No chief complaints recorded.",
    physicalExamination: "No physical examination recorded.",
    diagnosis: "No diagnosis recorded.",
    prescription: "No prescription recorded.",
    nextFollowUp: "—",
  }

  return <DoctorAppointmentActionsCell appointment={appointment} walkInMode />
}

const columns: ColumnDef<DoctorWalkInRow>[] = [
  { accessorKey: "patientName", header: "Patient Name" },
  { accessorKey: "address", header: "Address" },
  { accessorKey: "appointmentType", header: "Appointment Type" },
  {
    id: "appointmentDateTime",
    accessorFn: (row) => `${row.appointmentDate} ${row.appointmentTime}`,
    header: "Date & Time",
    cell: ({ row }) => `${formatDate(row.original.appointmentDate)} · ${formatTime(row.original.appointmentTime)}`,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = String(row.original.status || "Waiting")
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
    cell: ({ row }) => <WalkInActionsCell walkIn={row.original} />,
  },
]

export function DoctorWalkInClient({ walkIns }: { walkIns: DoctorWalkInRow[] }) {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-foreground">Walk In</h1>
        <p className="mt-2 text-muted-foreground">View walk-in patients and their appointment and vital-sign details.</p>
      </div>
      <DataTable columns={columns} data={walkIns} getRowId={(row) => row.id} showRowControls={false} />
    </>
  )
}