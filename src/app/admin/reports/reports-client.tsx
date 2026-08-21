"use client"

import { useState } from "react"
import { CalendarDays, Activity, Stethoscope, Pill, TrendingUp, Users, Clock3, FileText } from "lucide-react"
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

export function ReportsClient({ data }: { data: ReportsData }) {
  const [activeKey, setActiveKey] = useState<(typeof views)[number]["key"]>("appointments")
  const activeView = views.find((view) => view.key === activeKey) ?? views[0]
  const updatedAt = new Date(data.generatedAt).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

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
          : [
              { label: "In stock", value: formatNumber(data.medicine.inStock), description: "Items with remaining quantity" },
              { label: "Out of stock", value: formatNumber(data.medicine.outOfStock), description: "Quantity is zero" },
              { label: "Expired", value: formatNumber(data.medicine.expired), description: "Past the expiry date" },
            ]

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">Analytics</p>
          <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Live clinic data from clients, doctors, appointments, sessions, and inventory.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border bg-background/80 p-4">
            <p className="text-sm text-muted-foreground">Total users</p>
            <p className="mt-1 text-2xl font-semibold">{formatNumber(data.users.total)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatNumber(data.users.active)} active accounts</p>
          </div>
          <div className="rounded-2xl border border-border bg-background/80 p-4">
            <p className="text-sm text-muted-foreground">Clients</p>
            <p className="mt-1 text-2xl font-semibold">{formatNumber(data.users.clients)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Patient role in the user table</p>
          </div>
          <div className="rounded-2xl border border-border bg-background/80 p-4">
            <p className="text-sm text-muted-foreground">Doctors</p>
            <p className="mt-1 text-2xl font-semibold">{formatNumber(data.users.doctors)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatNumber(data.users.admins)} admins · {formatNumber(data.users.staff)} staff</p>
          </div>
          <div className="rounded-2xl border border-border bg-background/80 p-4">
            <p className="text-sm text-muted-foreground">Clinical records</p>
            <p className="mt-1 text-2xl font-semibold">{formatNumber(data.clinical.soapNotes + data.clinical.vitals)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatNumber(data.clinical.vitals)} vitals · {formatNumber(data.clinical.soapNotes)} SOAP notes</p>
          </div>
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

        <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
          <div className="rounded-2xl border border-border bg-background/80 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{activeView.title}</h2>
                <p className="text-sm text-muted-foreground">Live summary from the database</p>
              </div>
              <div className="px-3 py-1 text-sm font-medium text-muted-foreground">Updated {updatedAt}</div>
            </div>

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

            <div className="mt-6 rounded-xl border border-dashed border-border/70 bg-muted/30 p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Activity className="h-4 w-4 text-primary" />
                Key insight
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
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {highlights.map((item) => (
              <div key={item.label} className="rounded-2xl border border-border bg-background/80 p-4">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-xl font-semibold">{item.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
            {activeKey === "appointments" && data.appointments.byHour.length ? (
              <div className="rounded-2xl border border-border bg-background/80 p-4">
                <p className="mb-3 text-sm text-muted-foreground">Busiest hours</p>
                <CountTable rows={data.appointments.byHour} labelHeader="Hour" empty="No timed appointments yet." />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
