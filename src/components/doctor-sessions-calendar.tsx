"use client"

import { useEffect, useMemo, useState } from "react"
import { Calendar } from "@/components/ui/calendar"

export type DoctorProfileSession = {
  id: string
  date: string
  startTime: string
  endTime: string
  availableSlots: number
  appointmentType: string
  status?: string
}

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatTime(value: string) {
  const [hour, minute] = value.split(":").map(Number)
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return value
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })
}

function isActiveSession(session: DoctorProfileSession) {
  return (session.status ?? "Active").trim().toLowerCase() === "active"
}

function hasFutureSlot(session: DoctorProfileSession, now: Date) {
  if (!isActiveSession(session) || session.availableSlots <= 0) return false
  const [year, month, day] = session.date.split("-").map(Number)
  const [startHour, startMinute] = session.startTime.split(":").map(Number)
  const [endHour, endMinute] = session.endTime.split(":").map(Number)
  const start = startHour * 60 + startMinute
  const end = endHour * 60 + endMinute

  for (let minutes = start; minutes < end; minutes += 30) {
    const slotTime = new Date(year, month - 1, day, Math.floor(minutes / 60), minutes % 60)
    if (slotTime > now) return true
  }

  return false
}

export function DoctorAvailabilityIndicator({
  sessions,
  doctorActive,
}: {
  sessions: DoctorProfileSession[]
  doctorActive: boolean
}) {
  const [now, setNow] = useState(() => new Date())
  const todayKey = dateKey(now)
  const availableToday = doctorActive && sessions.some(
    (session) => session.date === todayKey && hasFutureSlot(session, now),
  )

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 10_000)
    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <span
      className={`absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-white ${
        availableToday
          ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.18)] animate-pulse"
          : "bg-slate-400"
      }`}
      title={availableToday ? "Available today" : "Not available today"}
      aria-label={availableToday ? "Available today" : "Not available today"}
    />
  )
}

export function DoctorUpcomingSessionCount({ sessions }: { sessions: DoctorProfileSession[] }) {
  const [now, setNow] = useState(() => new Date())
  const availableSessions = sessions.filter((session) => hasFutureSlot(session, now)).length

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 10_000)
    return () => window.clearInterval(intervalId)
  }, [])

  return <>{availableSessions}</>
}

export function DoctorSessionsCalendar({ sessions }: { sessions: DoctorProfileSession[] }) {
  const [now, setNow] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(() =>
    (sessions.find(isActiveSession) ?? sessions[0])
      ? new Date(`${(sessions.find(isActiveSession) ?? sessions[0]).date}T00:00:00`)
      : new Date(),
  )

  const sessionsByDate = useMemo(() => {
    const grouped = new Map<string, DoctorProfileSession[]>()
    for (const session of sessions) {
      const current = grouped.get(session.date) ?? []
      current.push(session)
      grouped.set(session.date, current)
    }
    return grouped
  }, [sessions])

  const selectedDateKey = selectedDate ? dateKey(selectedDate) : ""
  const selectedSessions = sessionsByDate.get(selectedDateKey) ?? []
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 10_000)
    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <section className="w-full min-w-0 text-left">
      <div className="mb-3">
        <h2 className="text-base font-semibold">Upcoming session calendar</h2>
        <p className="mt-1 text-xs text-muted-foreground">Select a date to view session availability.</p>
      </div>

      <div className="grid min-w-0 gap-4">
        <Calendar
          selected={selectedDate}
          onSelect={setSelectedDate}
          disabled={(date) => date <= today}
          getIndicator={(date) => {
            const dateSessions = sessionsByDate.get(dateKey(date)) ?? []
            if (!dateSessions.length) return null
            const activeSessions = dateSessions.filter(isActiveSession)

            if (activeSessions.length) {
              return activeSessions.some((session) => hasFutureSlot(session, now)) ? "available" : "unavailable"
            }

            if (dateSessions.some((session) => !isActiveSession(session))) return "inactive"
            return "unavailable"
          }}
          getTooltip={(date) => {
            const dateSessions = sessionsByDate.get(dateKey(date)) ?? []
            if (!dateSessions.length) return undefined

            return [
              date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
              ...dateSessions.map((session) => {
                const isActive = isActiveSession(session)
                const dateStart = new Date(date)
                dateStart.setHours(0, 0, 0, 0)
                const availability = !isActive
                  ? `${session.status || "Inactive"} session`
                  : session.availableSlots <= 0
                    ? "Full · no slots available"
                    : !hasFutureSlot(session, now)
                      ? "Time passed · no remaining appointment times"
                      : dateStart <= today
                        ? "Unavailable today · booking must be made one day ahead"
                        : `${session.availableSlots} ${session.availableSlots === 1 ? "slot" : "slots"} available`
                return `${availability}: ${formatTime(session.startTime)}–${formatTime(session.endTime)} · ${session.appointmentType || "General consultation"}`
              }),
            ].join("\n")
          }}
        />

        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-500" />Available</span>
            <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-red-500" />Full</span>
            <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-amber-400" />Inactive</span>
          </div>
          <h3 className="mb-3 font-medium">
            {selectedDate
              ? selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
              : "Select a date"}
          </h3>

          {selectedSessions.length ? (
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {selectedSessions.map((session) => (
                <div key={session.id} className="rounded-md border border-border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{formatTime(session.startTime)}–{formatTime(session.endTime)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{session.appointmentType || "General consultation"}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {!isActiveSession(session) ? (
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Inactive</span>
                      ) : session.availableSlots <= 0 ? (
                        <span className="text-xs font-semibold text-red-600 dark:text-red-300">Full</span>
                      ) : null}
                      <span className="text-xs text-muted-foreground">
                        {!isActiveSession(session)
                          ? "Not available for booking"
                          : session.availableSlots > 0
                            ? `${session.availableSlots} ${session.availableSlots === 1 ? "slot" : "slots"} available`
                            : "No slots available"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
              No upcoming sessions on this date.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}