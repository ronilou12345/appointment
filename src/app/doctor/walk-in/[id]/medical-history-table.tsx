"use client"

import { Fragment, useState, type ReactNode } from "react"
import { ArrowDownUp, ChevronDown, ChevronRight, ClipboardList, Heart, Pill } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export type MedicalHistoryEntry = {
  id: string
  date: string
  patientName: string
  ageGender: string
  doctorName: string
  bmi: string
  bmiCategory: string
  details: string
}

function getHistorySections(details: string) {
  const sections = {
    medicalHistory: [] as { label: string; value: string }[],
    vitalSigns: [] as { label: string; value: string }[],
    prescriptionSummary: [] as { label: string; value: string }[],
  }

  for (const line of details.split("\n").map((value) => value.trim()).filter(Boolean)) {
    if (line === "Vital signs:") continue
    const [rawLabel, ...rawValue] = line.split(":")
    const value = rawValue.join(":").trim()
    if (!rawLabel || !value) continue

    if (rawLabel.startsWith("Medical history — ")) {
      sections.medicalHistory.push({ label: rawLabel.slice("Medical history — ".length), value })
    } else if (rawLabel.startsWith("SOAP — ")) {
      const soapField = rawLabel.slice("SOAP — ".length)
      const historyLabel =
        soapField === "Chief complaints" ? "S (Subjective)" :
        soapField === "Physical examination" ? "O (Objective)" :
        soapField === "Diagnosis" ? "A (Assessment)" :
        soapField === "Plan" ? "P (Plan):" :
        soapField === "Next follow-up" ? "Next follow-up" :
        soapField
      sections.medicalHistory.push({ label: historyLabel, value })
    } else if (rawLabel === "Prescription") {
      sections.prescriptionSummary.push({ label: "Prescription", value })
    } else {
      sections.vitalSigns.push({ label: rawLabel, value })
    }
  }

  for (const key of Object.keys(sections) as (keyof typeof sections)[]) {
    sections[key] = sections[key].filter(
      (row, index, rows) => rows.findIndex((candidate) => candidate.label === row.label && candidate.value === row.value) === index,
    )
  }

  return sections
}

function SortableHeading({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      {children}
      <ArrowDownUp className="size-3.5 text-muted-foreground" aria-hidden="true" />
    </span>
  )
}

export function MedicalHistoryTable({ entries }: { entries: MedicalHistoryEntry[] }) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(() => new Set())

  const toggleRow = (id: string) => {
    setExpandedRows((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!entries.length) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No dated BMI, SOAP, or prescription records are available for this patient.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead><SortableHeading>Date</SortableHeading></TableHead>
            <TableHead><SortableHeading>Patient</SortableHeading></TableHead>
            <TableHead><SortableHeading>Age / Gender</SortableHeading></TableHead>
            <TableHead><SortableHeading>Doctor</SortableHeading></TableHead>
            <TableHead><SortableHeading>BMI</SortableHeading></TableHead>
            <TableHead><SortableHeading>BMI Category</SortableHeading></TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const expanded = expandedRows.has(entry.id)
            const sections = getHistorySections(entry.details || "")
            const displayDate = entry.date || "—"
            return (
              <Fragment key={entry.id}>
                <TableRow
                  aria-expanded={expanded}
                  className="cursor-pointer"
                  onClick={() => toggleRow(entry.id)}
                >
                  <TableCell className="font-medium">
                    <button
                      type="button"
                      className="flex items-center gap-2 text-left"
                      aria-expanded={expanded}
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleRow(entry.id)
                      }}
                    >
                      {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                      {displayDate}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {(entry.patientName || "—")
                          .split(/\s+/)
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase())
                          .join("") || "—"}
                      </span>
                      <span className="font-medium">{entry.patientName || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{entry.ageGender || "—"}</TableCell>
                  <TableCell className="font-medium">{entry.doctorName || "—"}</TableCell>
                  <TableCell>
                    <div className="font-medium">{entry.bmi || "—"}</div>
                    <div className="text-xs text-muted-foreground">{sections.vitalSigns
                      .filter(({ label }) => label === "Height" || label === "Weight")
                      .map(({ value }) => value)
                      .join(" / ")}</div>
                  </TableCell>
                  <TableCell>
                    {entry.bmiCategory && entry.bmiCategory !== "—" ? (
                      <Badge className="border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400" variant="outline">
                        {entry.bmiCategory}
                      </Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {expanded ? <ChevronDown className="ml-auto size-4" /> : <ChevronRight className="ml-auto size-4" />}
                  </TableCell>
                </TableRow>
                {expanded ? (
                  <TableRow className="bg-muted/20 hover:bg-muted/20">
                    <TableCell colSpan={7} className="p-3">
                      <div className="grid gap-3 lg:grid-cols-3">
                        <HistorySection icon={<ClipboardList />} title="Medical History" rows={sections.medicalHistory} />
                        <HistorySection icon={<Heart />} title="Vital Signs" rows={sections.vitalSigns} />
                        <HistorySection icon={<Pill />} title="Prescription Summary" rows={sections.prescriptionSummary} />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function HistorySection({
  icon,
  title,
  rows,
}: {
  icon: ReactNode
  title: string
  rows: { label: string; value: string }[]
}) {
  return (
    <section className="min-w-0 rounded-lg border border-border bg-background p-4">
      <h3 className="mb-4 flex items-center gap-2 font-semibold">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary [&>svg]:size-4">
          {icon}
        </span>
        {title}
      </h3>
      {rows.length ? (
        <dl className="space-y-3">
          {rows.map(({ label, value }, index) => (
            <div key={`${label}-${index}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 text-sm">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="break-words font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">No {title.toLowerCase()} recorded.</p>
      )}
    </section>
  )
}
