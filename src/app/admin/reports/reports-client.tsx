"use client"

import { useMemo, useState } from "react"
import {
  Activity,
  CalendarDays,
  Clock3,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Pill,
  Printer,
  Search,
  Stethoscope,
  TrendingUp,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import type { NamedCount, ReportsData } from "@/lib/reports-data"

const views = [
  {
    key: "appointments",
    title: "Appointment Reports",
    subtitle: "Bookings from clients across all doctors",
    icon: CalendarDays,
    accent: "from-orange-500/15 to-orange-500/5",
  },
  {
    key: "doctors",
    title: "Doctor Performance",
    subtitle: "Doctor load, sessions, and completed visits",
    icon: Stethoscope,
    accent: "from-sky-500/15 to-sky-500/5",
  },
  {
    key: "patients",
    title: "Patient Analytics",
    subtitle: "Client accounts and visit patterns",
    icon: Users,
    accent: "from-emerald-500/15 to-emerald-500/5",
  },
  {
    key: "medicine",
    title: "Medicine Reports",
    subtitle: "Inventory levels from the medicine table",
    icon: Pill,
    accent: "from-violet-500/15 to-violet-500/5",
  },
] as const

const summaryCards = [
  { key: "users", title: "Total Users", subtitle: "All accounts", metricKey: "users" },
  { key: "clients", title: "Clients", subtitle: "Patient accounts", metricKey: "clients" },
  { key: "doctors", title: "Doctors", subtitle: "Doctor accounts", metricKey: "doctors" },
  { key: "clinical", title: "Clinical Records", subtitle: "SOAP + vital sign entries", metricKey: "clinical" },
] as const

function formatNumber(value: number) {
  return value.toLocaleString()
}

function percent(part: number, total: number) {
  if (!total) return "0%"
  return `${Math.round((part / total) * 100)}%`
}

function CountTable({ rows, labelHeader, empty }: { rows: NamedCount[]; labelHeader: string; empty: string }) {
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">{empty}</p>
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">{labelHeader}</th>
            <th className="px-4 py-2 font-medium text-right">Count</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.label}-${index}`} className="border-t border-border/60">
              <td className="px-4 py-2">{row.label || "—"}</td>
              <td className="px-4 py-2 text-right font-medium">{formatNumber(row.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type DetailRow = Record<string, string | number | null | undefined>

function exportCsv(filename: string, rows: DetailRow[]) {
  if (!rows.length) {
    const blob = new Blob(["No records found"], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
    return
  }

  const headers = Object.keys(rows[0])
  const csvLines = [headers.join(",")]

  rows.forEach((row) => {
    const values = headers.map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`)
    csvLines.push(values.join(","))
  })

  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function ReportsClient({ data }: { data: ReportsData }) {
  const [activeKey, setActiveKey] = useState<(typeof views)[number]["key"] | "users" | "clients" | "clinical">("appointments")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  const activeView = views.find((view) => view.key === activeKey) ?? views[0]
  const updatedAt = new Date(data.generatedAt).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

  const summaryMetrics = {
    users: { value: formatNumber(data.users.total), label: "Total users", hint: `${formatNumber(data.users.active)} active` },
    clients: { value: formatNumber(data.users.clients), label: "Clients", hint: "Patient accounts" },
    doctors: { value: formatNumber(data.users.doctors), label: "Doctors", hint: `${formatNumber(data.doctors.active)} active` },
    clinical: { value: formatNumber(data.clinical.soapNotes + data.clinical.vitals), label: "Clinical records", hint: `${formatNumber(data.clinical.vitals)} vitals` },
  }

  const cards = views.map((view) => {
    if (view.key === "appointments") {
      return { ...view, metric: formatNumber(data.appointments.total), hint: `${formatNumber(data.appointments.thisMonth)} this month` }
    }
    if (view.key === "doctors") {
      return { ...view, metric: formatNumber(data.doctors.total), hint: `${formatNumber(data.doctors.active)} active` }
    }
    if (view.key === "patients") {
      return { ...view, metric: formatNumber(data.patients.total), hint: `${percent(data.patients.returning, data.patients.total)} returning` }
    }
    return { ...view, metric: formatNumber(data.medicine.total), hint: `${formatNumber(data.medicine.lowStock)} low stock` }
  })

  const getListRows = useMemo<DetailRow[]>(() => {
    if (activeKey === "users") {
      return data.users.records as DetailRow[]
    }
    if (activeKey === "clients") {
      return data.patients.records as DetailRow[]
    }
    if (activeKey === "clinical") {
      return data.clinical.records as DetailRow[]
    }
    if (activeKey === "appointments") {
      return data.appointments.records as DetailRow[]
    }
    if (activeKey === "doctors") {
      return data.doctors.records as DetailRow[]
    }
    if (activeKey === "patients") {
      return data.patients.records as DetailRow[]
    }
    return data.medicine.records as DetailRow[]
  }, [activeKey, data])

  const filteredRows = useMemo<DetailRow[]>(() => {
    const normalized = search.trim().toLowerCase()

    return getListRows.filter((row) => {
      const searchable = Object.values(row)
        .map((value) => String(value ?? "").toLowerCase())
        .join(" ")

      const matchesSearch = !normalized || searchable.includes(normalized)
      const statusValue = String(row["status"] ?? row["appointment_status"] ?? "").toLowerCase()
      const typeValue = String(row["type"] ?? row["kind"] ?? "").toLowerCase()
      const matchesStatus = statusFilter === "all" || statusValue === statusFilter.toLowerCase()
      const matchesType = typeFilter === "all" || typeValue === typeFilter.toLowerCase()

      return matchesSearch && matchesStatus && matchesType
    })
  }, [getListRows, search, statusFilter, typeFilter])

  const highlights =
    activeKey === "appointments"
      ? [
          { label: "Pending", value: formatNumber(data.appointments.pending), description: "Waiting for doctor confirmation" },
          { label: "Confirmed", value: formatNumber(data.appointments.confirmed), description: "Scheduled visits" },
          { label: "Completed", value: formatNumber(data.appointments.completed), description: "Finished consultations" },
        ]
      : activeKey === "doctors"
        ? [
            { label: "Sessions", value: formatNumber(data.doctors.sessions), description: "All doctor sessions" },
            { label: "Sessions today", value: formatNumber(data.doctors.sessionsToday), description: "Open clinic slots today" },
            { label: "Specialties", value: formatNumber(data.clinical.specialties), description: "From the specialties table" },
          ]
        : activeKey === "patients"
          ? [
              { label: "Active clients", value: formatNumber(data.patients.active), description: "Patient accounts currently active" },
              { label: "Returning clients", value: formatNumber(data.patients.returning), description: "Clients with more than one visit" },
              { label: "SOAP notes", value: formatNumber(data.clinical.soapNotes), description: "Clinical notes saved by doctors" },
            ]
          : activeKey === "medicine"
            ? [
                { label: "In stock", value: formatNumber(data.medicine.inStock), description: "Items with remaining quantity" },
                { label: "Out of stock", value: formatNumber(data.medicine.outOfStock), description: "Quantity is zero" },
                { label: "Expired", value: formatNumber(data.medicine.expired), description: "Past the expiry date" },
              ]
            : [
                { label: "Active accounts", value: formatNumber(data.users.active), description: "Accounts currently active" },
                { label: "Admins", value: formatNumber(data.users.admins), description: "System administrators" },
                { label: "Records", value: formatNumber(data.clinical.soapNotes + data.clinical.vitals), description: "Clinical entries tracked in the database" },
              ]

  const handleGenerateReport = () => {
    toast.success("Report generated. Review the filtered records and export options below.")
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = () => {
    const rows = filteredRows.map((row) => {
      const values = Object.fromEntries(Object.entries(row).map(([key, value]) => [key, String(value ?? "")]))
      return values as DetailRow
    })

    exportCsv(`${activeKey}-report.csv`, rows)
    toast.success("Excel-compatible CSV export generated.")
  }

  const detailTitle =
    activeKey === "users"
      ? "All users"
      : activeKey === "clients"
        ? "Clients"
        : activeKey === "clinical"
          ? "Clinical records"
          : activeKey === "appointments"
            ? "Appointment records"
            : activeKey === "doctors"
              ? "Doctors"
              : activeKey === "patients"
                ? "Patient analytics"
                : "Medicine inventory"

  const detailSubtitle =
    activeKey === "users"
      ? "Complete account data for all user roles"
      : activeKey === "clients"
        ? "Patient records behind the client count"
        : activeKey === "clinical"
          ? "SOAP notes and vital-sign activity"
          : activeKey === "appointments"
            ? "Appointments that drive the totals and completion rate"
            : activeKey === "doctors"
              ? "Doctor performance records and account details"
              : activeKey === "patients"
                ? "Patient demographics and visit history"
                : "Medicine inventory items used for stock reporting"

  return (
    <div className="min-h-screen w-full bg-background p-6 text-foreground">
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">Analytics</p>
          <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Live clinic data from clients, doctors, appointments, sessions, and inventory.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const metric = summaryMetrics[card.metricKey]
            const isActive = activeKey === card.key

            return (
              <button
                key={card.key}
                type="button"
                onClick={() => setActiveKey(card.key)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  isActive ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-background/80 hover:border-primary/50"
                }`}
              >
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="mt-1 text-2xl font-semibold">{metric.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{metric.hint}</p>
              </button>
            )
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon
            const isActive = activeKey === card.key

            return (
              <button
                key={card.key}
                type="button"
                onClick={() => setActiveKey(card.key)}
                className={`rounded-2xl border p-5 text-left transition-all ${
                  isActive
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-background/80 hover:border-primary/50 hover:bg-background"
                }`}
              >
                <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${card.accent} p-2`}>
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{card.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{card.subtitle}</p>
                <div className="mt-4 flex items-end justify-between">
                  <span className="text-2xl font-semibold">{card.metric}</span>
                  <span className="text-xs text-muted-foreground">{card.hint}</span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="rounded-2xl border border-border bg-background/80 p-6">
          <div className="mb-5 flex flex-col gap-4 border-b border-border pb-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold">{detailTitle}</h2>
                <p className="text-sm text-muted-foreground">{detailSubtitle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" onClick={handleGenerateReport} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Generate Report
                </Button>
                <Button type="button" variant="outline" onClick={handlePrint} className="gap-2">
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button type="button" variant="outline" onClick={handleExportExcel} className="gap-2">
                  <Download className="h-4 w-4" />
                  Excel
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                  placeholder="Search records, names, email, status, type, doctor..."
                />
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5">
                <Filter className="size-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="bg-transparent text-sm outline-none"
                >
                  <option value="all">All status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5">
                <CalendarDays className="size-4 text-muted-foreground" />
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="bg-transparent text-sm outline-none"
                >
                  <option value="all">All types</option>
                  <option value="general consultation">General Consultation</option>
                  <option value="follow up">Follow Up</option>
                  <option value="checkup">Checkup</option>
                  <option value="soap">SOAP</option>
                  <option value="vital">Vital</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
            <div className="space-y-4">
              {activeKey === "appointments" ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-border/60 bg-card p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        This month
                      </div>
                      <p className="text-2xl font-semibold">{formatNumber(data.appointments.thisMonth)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">New and scheduled appointments</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Clock3 className="h-4 w-4 text-primary" />
                        Completion rate
                      </div>
                      <p className="text-2xl font-semibold">{percent(data.appointments.completed, data.appointments.total)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{formatNumber(data.appointments.cancelled)} cancelled</p>
                    </div>
                  </div>
                  <CountTable rows={data.appointments.byStatus} labelHeader="Status" empty="No appointment records yet." />
                  <CountTable rows={data.appointments.byType} labelHeader="Visit type" empty="No appointment types recorded yet." />
                </div>
              ) : null}

              {activeKey === "doctors" ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-border/60 bg-card p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Stethoscope className="h-4 w-4 text-primary" />
                        Active doctors
                      </div>
                      <p className="text-2xl font-semibold">{formatNumber(data.doctors.active)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">of {formatNumber(data.doctors.total)} doctor accounts</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        Sessions today
                      </div>
                      <p className="text-2xl font-semibold">{formatNumber(data.doctors.sessionsToday)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{formatNumber(data.doctors.sessions)} sessions overall</p>
                    </div>
                  </div>
                  {data.doctors.performance.length ? (
                    <div className="overflow-hidden rounded-xl border border-border/60">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/40 text-left text-muted-foreground">
                          <tr>
                            <th className="px-4 py-2 font-medium">Doctor</th>
                            <th className="px-4 py-2 font-medium text-right">Appointments</th>
                            <th className="px-4 py-2 font-medium text-right">Completed</th>
                            <th className="px-4 py-2 font-medium text-right">Sessions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.doctors.performance.map((doctor) => (
                            <tr key={doctor.id} className="border-t border-border/60">
                              <td className="px-4 py-2 font-medium">{doctor.name}</td>
                              <td className="px-4 py-2 text-right">{formatNumber(doctor.appointments)}</td>
                              <td className="px-4 py-2 text-right">{formatNumber(doctor.completed)}</td>
                              <td className="px-4 py-2 text-right">{formatNumber(doctor.sessions)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No doctor records yet.</p>
                  )}
                </div>
              ) : null}

              {activeKey === "patients" ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-border/60 bg-card p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Users className="h-4 w-4 text-primary" />
                        Return rate
                      </div>
                      <p className="text-2xl font-semibold">{percent(data.patients.returning, data.patients.total)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{formatNumber(data.patients.returning)} clients booked more than once</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <FileText className="h-4 w-4 text-primary" />
                        Vitals logged
                      </div>
                      <p className="text-2xl font-semibold">{formatNumber(data.clinical.vitals)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">BMI and vital sign records</p>
                    </div>
                  </div>
                  <CountTable rows={data.patients.byGender} labelHeader="Gender" empty="No patient visit demographics yet." />
                </div>
              ) : null}

              {activeKey === "medicine" ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-border/60 bg-card p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Pill className="h-4 w-4 text-primary" />
                        Low stock
                      </div>
                      <p className="text-2xl font-semibold">{formatNumber(data.medicine.lowStock)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">At or below reorder level</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Activity className="h-4 w-4 text-primary" />
                        Stock health
                      </div>
                      <p className="text-2xl font-semibold">{percent(data.medicine.inStock, data.medicine.total)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">Share of items still in stock</p>
                    </div>
                  </div>
                  <CountTable
                    rows={[
                      { label: "In stock", count: data.medicine.inStock },
                      { label: "Low stock", count: data.medicine.lowStock },
                      { label: "Out of stock", count: data.medicine.outOfStock },
                      { label: "Expired", count: data.medicine.expired },
                    ]}
                    labelHeader="Inventory status"
                    empty="No medicine records yet."
                  />
                </div>
              ) : null}

              {activeKey === "users" || activeKey === "clients" || activeKey === "clinical" ? (
                <div className="overflow-hidden rounded-xl border border-border/60">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 font-medium">{activeKey === "clinical" ? "Record" : "Name"}</th>
                        <th className="px-4 py-2 font-medium">{activeKey === "clinical" ? "Patient" : "Email"}</th>
                        <th className="px-4 py-2 font-medium">Status</th>
                        <th className="px-4 py-2 font-medium text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.length ? (
                        filteredRows.map((row, index) => (
                          <tr key={`${activeKey}-${row.id ?? index}`} className="border-t border-border/60">
                            <td className="px-4 py-2 font-medium">
                              {activeKey === "clinical"
                                ? String(row["summary"] ?? row["kind"] ?? "Clinical record")
                                : String(row["name"] ?? row["patient"] ?? "—")}
                            </td>
                            <td className="px-4 py-2">
                              {activeKey === "clinical"
                                ? String(row["patient"] ?? "—")
                                : String(row["email"] ?? row["doctor"] ?? "—")}
                            </td>
                            <td className="px-4 py-2">
                              <span className="inline-flex rounded-full border border-border bg-muted px-2 py-0.5 text-xs capitalize">
                                {String(row["status"] ?? row["kind"] ?? "Active").toLowerCase()}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right text-muted-foreground">
                              {activeKey === "clinical"
                                ? String(row["date"] ?? "—")
                                : String(row["role"] ?? row["type"] ?? "—")}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No records match your search or filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {activeKey === "appointments" || activeKey === "doctors" || activeKey === "patients" || activeKey === "medicine" ? (
                <div className="overflow-hidden rounded-xl border border-border/60">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 font-medium">{activeKey === "medicine" ? "Medicine" : activeKey === "appointments" ? "Patient" : activeKey === "doctors" ? "Doctor" : "Patient"}</th>
                        <th className="px-4 py-2 font-medium">{activeKey === "medicine" ? "Category" : activeKey === "appointments" ? "Doctor" : activeKey === "doctors" ? "Email" : "Gender"}</th>
                        <th className="px-4 py-2 font-medium">{activeKey === "medicine" ? "Stock" : activeKey === "appointments" ? "Status" : activeKey === "doctors" ? "Status" : "Status"}</th>
                        <th className="px-4 py-2 font-medium text-right">{activeKey === "medicine" ? "Expiry" : activeKey === "appointments" ? "Date" : activeKey === "doctors" ? "Sessions" : "Visits"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.length ? (
                        filteredRows.map((row, index) => (
                          <tr key={`${activeKey}-${row.id ?? index}`} className="border-t border-border/60">
                            <td className="px-4 py-2 font-medium">
                              {activeKey === "medicine"
                                ? String(row["name"] ?? "—")
                                : activeKey === "appointments"
                                  ? String(row["patient"] ?? "—")
                                  : activeKey === "doctors"
                                    ? String(row["name"] ?? "—")
                                    : String(row["name"] ?? "—")}
                            </td>
                            <td className="px-4 py-2">
                              {activeKey === "medicine"
                                ? String(row["category"] ?? "—")
                                : activeKey === "appointments"
                                  ? String(row["doctor"] ?? "—")
                                  : activeKey === "doctors"
                                    ? String(row["email"] ?? "—")
                                    : String(row["email"] ?? "—")}
                            </td>
                            <td className="px-4 py-2">
                              <span className="inline-flex rounded-full border border-border bg-muted px-2 py-0.5 text-xs capitalize">
                                {String(row["status"] ?? row["type"] ?? "active").toLowerCase()}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right text-muted-foreground">
                              {activeKey === "medicine"
                                ? String(row["expiryDate"] ?? "—")
                                : activeKey === "appointments"
                                  ? String(row["date"] ?? "—")
                                  : activeKey === "doctors"
                                    ? String(row["createdAt"] ?? "—")
                                    : String(row["createdAt"] ?? "—")}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No records match your search or filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              {highlights.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setSearch(item.label)}
                  className="w-full rounded-2xl border border-border bg-background/80 p-4 text-left transition-colors hover:border-primary/60"
                >
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-xl font-semibold">{item.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </button>
              ))}
              {activeKey === "appointments" && data.appointments.byHour.length ? (
                <div className="rounded-2xl border border-border bg-background/80 p-4">
                  <p className="mb-3 text-sm text-muted-foreground">Busiest hours</p>
                  <CountTable rows={data.appointments.byHour} labelHeader="Hour" empty="No timed appointments yet." />
                </div>
              ) : null}
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  Summary
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {activeKey === "appointments" &&
                    (data.appointments.byHour[0]
                      ? `Peak booking hour is ${data.appointments.byHour[0].label}, with ${data.appointments.byHour[0].count} appointments. ${formatNumber(data.appointments.pending)} visits are still pending.`
                      : "No timed appointments are recorded yet.")}
                  {activeKey === "doctors" &&
                    (data.doctors.performance[0]
                      ? `${data.doctors.performance[0].name} currently has the most appointments (${formatNumber(data.doctors.performance[0].appointments)}).`
                      : "No doctor appointment activity is recorded yet.")}
                  {activeKey === "patients" &&
                    `${formatNumber(data.patients.active)} of ${formatNumber(data.patients.total)} client accounts are active, and ${percent(data.patients.returning, data.patients.total)} have returned for another visit.`}
                  {activeKey === "medicine" &&
                    `${formatNumber(data.medicine.lowStock)} medicines need restocking and ${formatNumber(data.medicine.expired)} have expired.`}
                  {(activeKey === "users" || activeKey === "clients" || activeKey === "clinical") &&
                    `${formatNumber(data.users.total)} total accounts and ${formatNumber(data.clinical.soapNotes + data.clinical.vitals)} clinical records are currently captured in the database.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
