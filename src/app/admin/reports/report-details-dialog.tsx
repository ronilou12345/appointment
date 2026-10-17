"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, FileSpreadsheet, Printer, RefreshCw, Search } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ReportRow = Record<string, string | number | null>

export type ReportDetailRequest = {
  kind: "users" | "clients" | "doctors" | "clinical" | "appointments" | "patients" | "medicine" | "sessions" | "specialties"
  title: string
  description: string
  filter?: string
  value?: string
}

function labelFor(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (character) => character.toUpperCase())
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function safeCsvValue(value: unknown) {
  const text = String(value ?? "")
  const safeText = /^[=+@\-]/.test(text) ? `'${text}` : text
  return `"${safeText.replaceAll('"', '""')}"`
}

export function ReportDetailsDialog({
  request,
  onOpenChange,
}: {
  request: ReportDetailRequest | null
  onOpenChange: (open: boolean) => void
}) {
  const [rows, setRows] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!request) {
      setRows([])
      return
    }

    const controller = new AbortController()
    const params = new URLSearchParams({ kind: request.kind })
    if (request.filter) params.set("filter", request.filter)
    if (request.value) params.set("value", request.value)

    setLoading(true)
    setError("")
    setSearch("")
    setStatusFilter("all")

    fetch(`/api/admin/reports/details?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok || !result.success) throw new Error(result.error || "Unable to load report records.")
        setRows(Array.isArray(result.rows) ? result.rows : [])
      })
      .catch((loadError) => {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load report records.")
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [request, reloadKey])

  const columns = useMemo(() => Object.keys(rows[0] ?? {}), [rows])
  const statusOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => String(row.status ?? "")).filter(Boolean))).sort(),
    [rows],
  )
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (statusFilter !== "all" && String(row.status ?? "") !== statusFilter) return false
      if (!query) return true
      return Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(query))
    })
  }, [rows, search, statusFilter])

  const downloadExcelCsv = () => {
    if (!columns.length || !filteredRows.length) return
    const csv = [
      columns.map((column) => safeCsvValue(labelFor(column))).join(","),
      ...filteredRows.map((row) => columns.map((column) => safeCsvValue(row[column])).join(",")),
    ].join("\r\n")
    const link = document.createElement("a")
    link.href = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }))
    link.download = `${request?.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "report"}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const printOrSavePdf = () => {
    if (!request || !columns.length) return
    const preview = window.open("", "_blank", "width=1000,height=760")
    if (!preview) {
      toast.error("Allow pop-ups to print or save this report as PDF.")
      return
    }

    const tableRows = filteredRows.map((row) =>
      `<tr>${columns.map((column) => `<td>${escapeHtml(row[column]) || "—"}</td>`).join("")}</tr>`,
    ).join("")
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(request.title)}</title><style>
      body{font:12px Arial,sans-serif;color:#111;margin:24px}h1{font-size:20px;margin:0 0 6px}p{color:#555;margin:0 0 18px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:7px;text-align:left;vertical-align:top}th{background:#f1f5f9}tr{break-inside:avoid}@media print{body{margin:12mm}button{display:none}}
    </style></head><body><h1>${escapeHtml(request.title)}</h1><p>${escapeHtml(request.description)} · ${filteredRows.length} records</p><table><thead><tr>${columns.map((column) => `<th>${escapeHtml(labelFor(column))}</th>`).join("")}</tr></thead><tbody>${tableRows}</tbody></table><script>window.onload=()=>window.print()</script></body></html>`
    preview.document.open()
    preview.document.write(html)
    preview.document.close()
  }

  return (
    <Dialog open={Boolean(request)} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-6xl flex-col gap-4 overflow-hidden">
        <DialogHeader>
          <DialogTitle>{request?.title ?? "Report details"}</DialogTitle>
          <DialogDescription>{request?.description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search report records"
              className="h-10 pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {statusOptions.length ? (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-40">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statusOptions.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : null}
            <Button type="button" variant="outline" onClick={() => setReloadKey((key) => key + 1)} disabled={loading}>
              <RefreshCw className="mr-2 size-4" />
              Generate Report
            </Button>
            <Button type="button" variant="outline" onClick={printOrSavePdf} disabled={!filteredRows.length}>
              <Printer className="mr-2 size-4" />
              Print / Save PDF
            </Button>
            <Button type="button" variant="outline" onClick={downloadExcelCsv} disabled={!filteredRows.length}>
              <FileSpreadsheet className="mr-2 size-4" />
              <Download className="mr-2 size-4" />
              Excel CSV
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground" aria-live="polite">
          {loading ? "Loading records…" : error || `${filteredRows.length.toLocaleString()} of ${rows.length.toLocaleString()} records`}
        </p>

        <div className="min-h-0 flex-1 overflow-auto rounded-md border">
          {filteredRows.length && columns.length ? (
            <table className="w-full min-w-max text-sm">
              <thead className="sticky top-0 bg-muted text-left">
                <tr>{columns.map((column) => <th key={column} className="whitespace-nowrap px-3 py-2 font-medium">{labelFor(column)}</th>)}</tr>
              </thead>
              <tbody>
                {filteredRows.map((row, index) => (
                  <tr key={`${String(row.id ?? index)}-${index}`} className="border-t">
                    {columns.map((column) => <td key={column} className="max-w-80 px-3 py-2 align-top">{String(row[column] ?? "—")}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : !loading && !error ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No matching records.</div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
