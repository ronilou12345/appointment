"use client"

import { useMemo, type ReactNode } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Activity, ClipboardList, Heart, Pill } from "lucide-react"
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
  objectiveVitals?: string | null
  appointmentId?: number | string
}

function SoapDetailCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <section className="min-w-0 border-border p-3 first:pl-0 lg:border-r lg:last:border-r-0 lg:last:pr-0">
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-primary">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 [&>svg]:size-4">
          {icon}
        </span>
        {title}
      </h3>
      {children}
    </section>
  )
}

export function SoapSummaryTable({ notes, appointmentId }: { notes: WalkInSoapNote[]; appointmentId: number }) {
  const columns = useMemo<ColumnDef<WalkInSoapNote>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Recorded",
        cell: ({ row }) => <div className="whitespace-normal break-words">{row.original.createdAt || "—"}</div>,
      },
      {
        accessorKey: "chief_complaints",
        header: "Chief complaints",
        cell: ({ row }) => (
          <div className="whitespace-pre-wrap break-words">{row.original.chief_complaints || "—"}</div>
        ),
      },
      {
        accessorKey: "physical_examination",
        header: "Physical examination",
        cell: ({ row }) => (
          <div className="whitespace-pre-wrap break-words">{row.original.physical_examination || "—"}</div>
        ),
      },
      {
        accessorKey: "diagnosis",
        header: "Diagnosis",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="whitespace-pre-wrap break-words">{row.original.diagnosis || "—"}</div>
        ),
      },
      {
        accessorKey: "prescription",
        header: "Plan",
        cell: ({ row }) => (
          <div className="whitespace-pre-wrap break-words">{row.original.prescription || "—"}</div>
        ),
      },
      {
        accessorKey: "next_follow_up",
        header: "Prescription",
        cell: ({ row }) => (
          <div className="whitespace-pre-wrap break-words">{row.original.next_follow_up || "—"}</div>
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
      tableClassName="table-fixed"
      renderExpandedRow={(note) => {
        const objectiveDetails = [
          ...(note.objectiveVitals?.split("\n").filter(Boolean) ?? []),
          ...(note.physical_examination?.trim() ? [note.physical_examination.trim()] : []),
        ]
        return (
          <div className="grid gap-3 rounded-lg border border-border bg-background p-3 md:grid-cols-2 lg:grid-cols-5">
            <SoapDetailCard icon={<span className="font-semibold">S</span>} title="S – Subjective">
              <p className="whitespace-pre-wrap text-sm">{note.chief_complaints || "—"}</p>
            </SoapDetailCard>
            <SoapDetailCard icon={<Heart />} title="O – Objective">
              {objectiveDetails.length ? (
                <ul className="space-y-1 text-sm">
                  {objectiveDetails.map((detail, index) => (
                    <li key={index} className="whitespace-pre-wrap">{detail}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No objective findings recorded.</p>
              )}
            </SoapDetailCard>
            <SoapDetailCard icon={<Activity />} title="A – Assessment">
              <p className="whitespace-pre-wrap text-sm">{note.diagnosis || "—"}</p>
            </SoapDetailCard>
            <SoapDetailCard icon={<span className="font-semibold">P</span>} title="P – Plan">
              <p className="whitespace-pre-wrap text-sm">{note.prescription || "—"}</p>
              {note.next_follow_up ? (
                <p className="mt-3 border-t border-border pt-2 text-sm">
                  <span className="text-muted-foreground">Next follow-up: </span>
                  <span className="font-medium">{note.next_follow_up}</span>
                </p>
              ) : null}
            </SoapDetailCard>
            <SoapDetailCard icon={<Pill />} title="Prescription">
              <dl className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <dt className="text-muted-foreground">Medication</dt>
                  <dd className="break-words font-medium">{note.next_follow_up || "—"}</dd>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <dt className="text-muted-foreground">Instructions</dt>
                  <dd className="break-words font-medium">{note.prescription || "—"}</dd>
                </div>
              </dl>
            </SoapDetailCard>
          </div>
        )
      }}
    />
  )
}
