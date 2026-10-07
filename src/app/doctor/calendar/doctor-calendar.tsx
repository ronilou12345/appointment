"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CalendarDays, CalendarClock, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export type CalendarAppointment = {
  id: string
  date: string
  time: string
  endTime?: string
  patientName?: string
  patientId?: string
  patientEmail?: string | null
  patientAvatar?: string | null
  status: string
  kind: "appointment" | "session"
  appointmentType?: string
}

type CalendarView = "Day" | "Week" | "Month" | "Year"

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const views: CalendarView[] = ["Day", "Week", "Month", "Year"]

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatPhilippineTime(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return ""

  const clock = new Date(2000, 0, 1, Number(match[1]), Number(match[2]))
  return clock.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true })
}

function addDays(date: Date, count: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + count)
  return next
}

function startOfWeek(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  start.setDate(start.getDate() - start.getDay())
  return start
}

function appointmentTone(status: string) {
  const normalized = status.trim().toLowerCase()
  if (normalized === "completed") return "border-emerald-300/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
  if (normalized === "confirmed") return "border-sky-300/40 bg-sky-500/15 text-sky-800 dark:text-sky-200"
  if (normalized.includes("cancel")) return "border-rose-300/40 bg-rose-500/15 text-rose-800 dark:text-rose-200"
  return "border-primary/25 bg-primary/10 text-foreground"
}

export function DoctorCalendar({ appointments }: { appointments: CalendarAppointment[] }) {
  const [view, setView] = useState<CalendarView>("Month")
  const [cursor, setCursor] = useState(() => new Date())
  const [search, setSearch] = useState("")
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false)
  const todayKey = dateKey(new Date())

  const appointmentsByDate = useMemo(() => {
    const grouped = new Map<string, CalendarAppointment[]>()
    const query = search.trim().toLowerCase()
    for (const appointment of appointments) {
      if (query && appointment.kind !== "appointment") continue
      if (query &&
        !(appointment.patientName ?? "").toLowerCase().includes(query) &&
        !(appointment.patientEmail ?? "").toLowerCase().includes(query)
      ) continue
      const current = grouped.get(appointment.date) ?? []
      current.push(appointment)
      grouped.set(appointment.date, current)
    }
    return grouped
  }, [appointments, search])

  const patientSuggestions = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return []

    const patients = new Map<string, CalendarAppointment>()
    for (const appointment of appointments) {
      if (appointment.kind !== "appointment" || !appointment.patientName) continue
      const matchesName = appointment.patientName.toLowerCase().includes(query)
      const matchesEmail = (appointment.patientEmail ?? "").toLowerCase().includes(query)
      if (!matchesName && !matchesEmail) continue

      const key = appointment.patientId ?? `${appointment.patientName.toLowerCase()}-${appointment.patientEmail ?? ""}`
      if (!patients.has(key)) patients.set(key, appointment)
    }

    return Array.from(patients.values())
      .sort((first, second) => {
        const firstStartsWith = (first.patientName ?? "").toLowerCase().startsWith(query)
        const secondStartsWith = (second.patientName ?? "").toLowerCase().startsWith(query)
        if (firstStartsWith !== secondStartsWith) return firstStartsWith ? -1 : 1
        return (first.patientName ?? "").localeCompare(second.patientName ?? "")
      })
  }, [appointments, search])

  const selectPatient = (patient: CalendarAppointment) => {
    const patientBookings = appointments
      .filter((appointment) =>
        appointment.kind === "appointment" && (
          patient.patientId
            ? appointment.patientId === patient.patientId
            : appointment.patientName === patient.patientName && appointment.patientEmail === patient.patientEmail
        ),
      )
      .sort((first, second) => first.date.localeCompare(second.date) || first.time.localeCompare(second.time))

    if (patientBookings[0]) {
      setCursor(new Date(`${patientBookings[0].date}T00:00:00`))
      setView("Month")
    }
    setSearch(patient.patientName ?? "")
    setShowPatientSuggestions(false)
  }

  const title = view === "Year"
    ? String(cursor.getFullYear())
    : view === "Day"
      ? cursor.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
      : view === "Week"
        ? `${startOfWeek(cursor).toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${addDays(startOfWeek(cursor), 6).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric"})}`
        : cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })

  const moveCursor = (direction: -1 | 1) => {
    setCursor((current) => {
      const next = new Date(current)
      if (view === "Year") next.setFullYear(next.getFullYear() + direction)
      else if (view === "Month") next.setMonth(next.getMonth() + direction, 1)
      else if (view === "Week") next.setDate(next.getDate() + 7 * direction)
      else next.setDate(next.getDate() + direction)
      return next
    })
  }

  const renderAppointments = (day: Date, limit = 3) => {
    const dayAppointments = (appointmentsByDate.get(dateKey(day)) ?? [])
      .filter((appointment) => appointment.kind === "appointment")
    return (
      <div className="mt-2 space-y-1">
        {dayAppointments.slice(0, limit).map((appointment) => (
          <Link
            key={appointment.id}
            href={`/doctor/appointments/${appointment.id}`}
            title={`${appointment.time ? `${formatPhilippineTime(appointment.time)} · ` : ""}${appointment.patientName || "Unknown patient"} · ${appointment.status}`}
            className={`block truncate rounded-sm border px-1.5 py-1 text-left text-xs font-medium transition hover:brightness-95 ${appointmentTone(appointment.status)}`}
          >
            {appointment.time ? <span className="mr-1 opacity-75">{formatPhilippineTime(appointment.time)}</span> : null}
            {appointment.patientName || "Unknown patient"}
          </Link>
        ))}
        {dayAppointments.length > limit ? (
          <p className="px-1 text-[11px] text-muted-foreground">+{dayAppointments.length - limit} more</p>
        ) : null}
      </div>
    )
  }

  const renderMonth = (monthDate: Date, compact = false) => {
    const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
    const gridStart = addDays(first, -first.getDay())
    const cellCount = compact ? 35 : 42
    const days = Array.from({ length: cellCount }, (_, index) => addDays(gridStart, index))
    const monthName = monthDate.toLocaleDateString(undefined, { month: "long" })

    return (
      <div className="min-w-0" key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}>
        {compact ? (
          <button
            type="button"
            onClick={() => { setCursor(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)); setView("Month") }}
            className="mb-2 text-sm font-semibold hover:text-primary"
          >
            {monthName}
          </button>
        ) : null}
        <div className="grid grid-cols-7 border-l border-t border-border/80">
          {weekDays.map((day) => (
            <div key={day} className={`border-b border-r border-border/80 py-2 text-center text-xs text-muted-foreground ${compact ? "" : "sm:text-sm"}`}>
              {compact ? day.slice(0, 1) : day}
            </div>
          ))}
          {days.map((day) => {
            const inMonth = day.getMonth() === monthDate.getMonth()
            const isToday = dateKey(day) === todayKey
            const dayEntries = appointmentsByDate.get(dateKey(day)) ?? []
            const count = dayEntries.length
            const daySessions = dayEntries.filter((entry) => entry.kind === "session")
            const sessionCount = daySessions.length
            const sessionTooltip = sessionCount
              ? [
                  day.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
                  ...daySessions.map((session) =>
                    `${formatPhilippineTime(session.time)}–${formatPhilippineTime(session.endTime ?? "")} · ${session.appointmentType || "General consultation"}`,
                  ),
                ].join("\n")
              : undefined
            return (
              <div
                key={dateKey(day)}
                className={`${compact ? "min-h-12 p-1" : "min-h-24 p-1.5 sm:min-h-28 sm:p-2"} min-w-0 border-b border-r border-border/80 ${inMonth ? "bg-card/70" : "bg-muted/15"} ${isToday ? "bg-primary/[0.07]" : ""}`}
              >
                <div className="flex items-center justify-between gap-1">
                  {sessionCount > 0 ? (
                    <span
                      title={sessionTooltip}
                      aria-label={`${sessionCount} session${sessionCount === 1 ? "" : "s"} on ${dateKey(day)}`}
                    >
                      <CalendarClock className="size-3 text-amber-500" aria-hidden="true" />
                    </span>
                  ) : <span className="size-3" />}
                  <span className={`${compact ? "size-6 text-[11px]" : "size-7 text-xs sm:size-8 sm:text-sm"} flex items-center justify-center rounded-full ${isToday ? "bg-primary font-semibold text-primary-foreground" : inMonth ? "text-foreground" : "text-muted-foreground/50"}`}>
                    {day.getDate()}
                  </span>
                </div>
                {!compact ? renderAppointments(day) : count > 0 ? (
                  <button
                    type="button"
                    aria-label={`${count} appointment${count === 1 ? "" : "s"} on ${dateKey(day)}`}
                    onClick={() => { setCursor(day); setView("Day") }}
                    className="mx-auto mt-1 flex size-2 rounded-full bg-amber-500"
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderWeek = () => {
    const firstDay = startOfWeek(cursor)
    return (
      <div className="grid grid-cols-1 border-l border-t border-border/80 sm:grid-cols-7">
        {Array.from({ length: 7 }, (_, index) => {
          const day = addDays(firstDay, index)
          const dayEntries = appointmentsByDate.get(dateKey(day)) ?? []
          const dayAppointments = dayEntries.filter((appointment) => appointment.kind === "appointment")
          const hasSessions = dayEntries.some((appointment) => appointment.kind === "session")
          return (
            <section key={dateKey(day)} className="min-h-48 border-b border-r border-border/80 bg-card/70 p-2 sm:min-h-[420px]">
              <button type="button" onClick={() => { setCursor(day); setView("Day") }} className="flex w-full items-center justify-between gap-1 pb-2 text-left">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {hasSessions ? <CalendarClock className="size-3 text-amber-500" aria-hidden="true" /> : null}
                  {weekDays[day.getDay()]}
                </span>
                <span className={`flex size-8 items-center justify-center rounded-full text-sm ${dateKey(day) === todayKey ? "bg-primary font-semibold text-primary-foreground" : ""}`}>{day.getDate()}</span>
              </button>
              <div className="space-y-1">
                {dayAppointments.map((appointment) => (
                  <Link key={appointment.id} href={`/doctor/appointments/${appointment.id}`} className={`block rounded-sm border p-2 text-xs ${appointmentTone(appointment.status)}`}>
                    <span className="block font-semibold">{formatPhilippineTime(appointment.time) || "Scheduled"}</span>
                    <span className="mt-1 block break-words">{appointment.patientName || "Unknown patient"}</span>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    )
  }

  const renderDay = () => {
    const dayAppointments = (appointmentsByDate.get(dateKey(cursor)) ?? [])
      .filter((appointment) => appointment.kind === "appointment")
    return dayAppointments.length ? (
      <div className="divide-y divide-border border-y border-border">
        {dayAppointments.map((appointment) => (
          <Link key={appointment.id} href={`/doctor/appointments/${appointment.id}`} className="grid gap-2 py-4 transition hover:bg-muted/30 sm:grid-cols-[100px_1fr_auto] sm:items-center sm:px-3">
            <span className="text-sm font-semibold tabular-nums text-primary">{formatPhilippineTime(appointment.time) || "Time not set"}</span>
            <span className="font-medium">{appointment.patientName || "Unknown patient"}</span>
            <span className={`w-fit rounded-full border px-2.5 py-1 text-xs ${appointmentTone(appointment.status)}`}>{appointment.status}</span>
          </Link>
        ))}
      </div>
    ) : <p className="border-y border-border py-12 text-center text-sm text-muted-foreground">No appointments scheduled for this day.</p>
  }

  return (
    <main className="mx-auto w-full max-w-[1600px]">
      <header className="mb-5 flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary">
            <CalendarDays className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Calendar</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Your patient appointments by date</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-border p-0.5" aria-label="Calendar view">
            {views.map((item) => (
              <button key={item} type="button" aria-pressed={view === item} onClick={() => setView(item)} className={`rounded px-3 py-1.5 text-sm transition ${view === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                {item}
              </button>
            ))}
          </div>
          <div className="relative min-w-40 flex-1 sm:flex-none">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => { setSearch(event.target.value); setShowPatientSuggestions(true) }}
                onFocus={() => setShowPatientSuggestions(true)}
                onBlur={() => setShowPatientSuggestions(false)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setShowPatientSuggestions(false)
                  if (event.key === "Enter" && patientSuggestions[0]) {
                    event.preventDefault()
                    selectPatient(patientSuggestions[0])
                  }
                }}
                placeholder="Find patient"
                aria-label="Search patient appointments"
                aria-expanded={showPatientSuggestions && search.trim().length > 0}
                className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-44"
              />
            </label>
            {showPatientSuggestions && search.trim() ? (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-lg">
                {patientSuggestions.length ? patientSuggestions.map((patient) => (
                  <button
                    key={patient.patientId ?? `${patient.patientName}-${patient.patientEmail}`}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectPatient(patient)}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-accent"
                  >
                    <Avatar className="size-8 shrink-0">
                      {patient.patientAvatar ? <AvatarImage src={patient.patientAvatar} alt="" /> : null}
                      <AvatarFallback className="text-xs">
                        {(patient.patientName ?? "Patient").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{patient.patientName}</span>
                      <span className="block truncate text-xs text-muted-foreground">{patient.patientEmail || "No email available"}</span>
                    </span>
                  </button>
                )) : (
                  <p className="px-2 py-3 text-center text-sm text-muted-foreground">No matching patients</p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold sm:text-2xl">
          {view === "Day" && (appointmentsByDate.get(dateKey(cursor)) ?? []).some((entry) => entry.kind === "session") ? (
            <CalendarClock className="size-4 text-amber-500" aria-label="Scheduled session" />
          ) : null}
          {title}
        </h2>
        <div className="flex items-center gap-1">
          <Button type="button" variant="outline" size="sm" onClick={() => setCursor(new Date())}>Today</Button>
          <Button type="button" variant="outline" size="icon" aria-label="Previous calendar period" onClick={() => moveCursor(-1)}><ChevronLeft className="size-4" /></Button>
          <Button type="button" variant="outline" size="icon" aria-label="Next calendar period" onClick={() => moveCursor(1)}><ChevronRight className="size-4" /></Button>
        </div>
      </div>

      <section className="overflow-hidden rounded-md border border-border bg-card" aria-label={`${view} appointment calendar`}>
        {view === "Month" ? renderMonth(cursor) : null}
        {view === "Week" ? renderWeek() : null}
        {view === "Day" ? <div className="px-4">{renderDay()}</div> : null}
        {view === "Year" ? (
          <div className="grid gap-6 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }, (_, month) => renderMonth(new Date(cursor.getFullYear(), month, 1), true))}
          </div>
        ) : null}
      </section>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-amber-500" />Your sessions</span>
        <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-sky-500" />Confirmed</span>
        <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-primary" />Pending</span>
        <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-500" />Completed</span>
        <span>{appointmentsByDate.size} appointment dates</span>
      </div>
    </main>
  )
}