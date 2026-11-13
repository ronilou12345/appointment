"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import SOAPSheet from "@/components/soap-sheet"

export type WalkInSoapNote = {
  id: string
  chief_complaints: string
  physical_examination: string | null
  diagnosis: string
  prescription: string | null
  next_follow_up: string | null
  createdAt: string
}

export function SoapSummaryTable({ notes, appointmentId }: { notes: WalkInSoapNote[]; appointmentId: number }) {
  const columns = useMemo<ColumnDef<WalkInSoapNote>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Recorded",
      },
      {
        accessorKey: "chief_complaints",
        header: "Chief complaints",
        cell: ({ row }) => (
          <div className="min-w-48 whitespace-pre-wrap">{row.original.chief_complaints || "—"}</div>
        ),
      },
      {
        accessorKey: "physical_examination",
        header: "Physical examination",
        cell: ({ row }) => (
          <div className="min-w-48 whitespace-pre-wrap">{row.original.physical_examination || "—"}</div>
        ),
      },
      {
        accessorKey: "diagnosis",
        header: "Diagnosis",
        cell: ({ row }) => (
          <div className="min-w-48 whitespace-pre-wrap">{row.original.diagnosis || "—"}</div>
        ),
      },
      {
        accessorKey: "prescription",
        header: "Plan",
        cell: ({ row }) => (
          <div className="min-w-48 whitespace-pre-wrap">{row.original.prescription || "—"}</div>
        ),
      },
      {
        accessorKey: "next_follow_up",
        header: "Prescription",
        cell: ({ row }) => (
          <div className="min-w-48 whitespace-pre-wrap">{row.original.next_follow_up || "—"}</div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <SOAPSheet appointmentId={appointmentId} mode="row-edit" note={row.original} />
        ),
      },
    ],
    [appointmentId],
  )

  return (
    <DataTable
      columns={columns}
      data={notes}
      getRowId={(note) => note.id}
      showRowControls={false}
    />
  )
}
