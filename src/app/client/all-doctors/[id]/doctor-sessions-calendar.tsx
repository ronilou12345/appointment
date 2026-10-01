"use client"

import { useMemo, useState } from "react"
import { Calendar } from "@/components/ui/calendar"

export type DoctorProfileSession = {
  id: string
  date: string
  startTime: string
  endTime: string
  availableSlots: number
  appointmentType: string
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

export function DoctorSessionsCalendar({ sessions }: { sessions: DoctorProfileSession[] }) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(() =>
    sessions[0] ? new Date(`${sessions[0].date}T00:00:00`) : new Date(),
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
  const today = new Date()
  today.setHours(0, 0, 0, 0)

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
          disabled={(date) => date < today}
          getIndicator={(date) => {
            const dateSessions = sessionsByDate.get(dateKey(date)) ?? []
            if (!dateSessions.length) return null
            return dateSessions.some((session) => session.availableSlots > 0) ? "available" : "unavailable"
          }}
        />

        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-500" />Available</span>
            <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-red-500" />Full</span>
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
                      {session.availableSlots <= 0 ? (
                        <span className="text-xs font-semibold text-red-600 dark:text-red-300">Full</span>
                      ) : null}
                      <span className="text-xs text-muted-foreground">
                        {session.availableSlots > 0
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