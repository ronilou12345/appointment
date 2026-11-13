"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"

export type MedicalHistoryEntry = {
  label: string
  value: string
}

export function MedicalHistoryTable({ entries }: { entries: MedicalHistoryEntry[] }) {
  const columns = useMemo<ColumnDef<MedicalHistoryEntry>[]>(
    () => [
      {
        accessorKey: "label",
        header: "History type",
        cell: ({ row }) => <div className="min-w-40 font-medium text-foreground">{row.original.label || "—"}</div>,
      },
      {
        accessorKey: "value",
        header: "Details",
        cell: ({ row }) => <div className="min-w-72 whitespace-pre-wrap text-muted-foreground">{row.original.value || "—"}</div>,
      },
    ],
    [],
  )

  return (
    <DataTable
      columns={columns}
      data={entries}
      getRowId={(entry) => entry.label}
      showRowControls={false}
    />
  )
}
