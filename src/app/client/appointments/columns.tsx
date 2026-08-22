"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { CalendarDays, MoreHorizontal, X } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatAppointmentTime } from "./status"
import { getNameInitials, hasProfileImage } from "@/lib/user-initials"

export type ClientAppointmentRow = {
  id: string
  sessionId?: string
  doctorId: string
  doctorName: string
  doctorAvatar?: string
  doctorEmail: string
  specialty: string
  date: string
  time: string
  timeValue?: string
  status: string
}

type SessionOption = {
  id: string
  doctorId: string
  date: string
  startTime: string
  endTime: string
  slots: number
  status: string
}

type DoctorOption = {
  id: number
  name: string
  email?: string
  avatar?: string
  specialty?: string
}

function DoctorAvatar({ name, avatar, className }: { name: string; avatar?: string; className?: string }) {
  return (
    <Avatar className={className ?? "size-8"}>
      {hasProfileImage(avatar) ? <AvatarImage src={avatar} alt={name} /> : null}
      <AvatarFallback className="bg-primary/10 text-primary text-xs">
        {getNameInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}

function todayIso() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function parseTimeToMinutes(value: string) {
  const match = String(value ?? "").trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function buildTimeSlots(startTime: string, endTime: string, stepMinutes = 20) {
  const start = parseTimeToMinutes(startTime)
  const end = parseTimeToMinutes(endTime)
  if (start === null || end === null || end <= start) return []

  const slots: string[] = []
  for (let minutes = start; minutes < end; minutes += stepMinutes) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    slots.push(`${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`)
  }
  return slots
}

function isSlotInFuture(isoDate: string, time: string) {
  const [year, month, day] = isoDate.split("-").map(Number)
  const [hours, minutes] = time.split(":").map(Number)
  if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) return false
  return new Date(year, month - 1, day, hours, minutes, 0).getTime() > Date.now()
}

function isActiveSession(session: SessionOption) {
  const status = String(session.status ?? "Active").trim().toLowerCase()
  return status !== "inactive" && status !== "cancelled"
}

function AppointmentActionsCell({ appointment }: { appointment: ClientAppointmentRow }) {
  const router = useRouter()
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [doctors, setDoctors] = useState<DoctorOption[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [doctorError, setDoctorError] = useState("")
  const [sessions, setSessions] = useState<SessionOption[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [sessionError, setSessionError] = useState("")
  const [selectedDoctorId, setSelectedDoctorId] = useState(appointment.doctorId)
  const [selectedDate, setSelectedDate] = useState(appointment.date)
  const [selectedSessionId, setSelectedSessionId] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [bookedTimes, setBookedTimes] = useState<string[]>([])
  const [loadingBookedTimes, setLoadingBookedTimes] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const canManageAppointment = ![
    "confirmed",
    "completed",
    "cancelled",
    "canceled",
    "awaiting cancellation",
    "cancel requested",
  ].includes((appointment.status ?? "").toLowerCase())

  const resetRescheduleForm = () => {
    setSelectedDoctorId(appointment.doctorId)
    setSelectedDate(appointment.date)
    setSelectedSessionId("")
    setSelectedTime("")
    setBookedTimes([])
    setError("")
    setSessionError("")
    setDoctorError("")
  }

  useEffect(() => {
    if (!rescheduleOpen) return

    let cancelled = false
    resetRescheduleForm()

    const loadDoctors = async () => {
      setLoadingDoctors(true)
      try {
        const response = await fetch("/api/doctors")
        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Unable to load doctors")
        }
        if (!cancelled) {
          setDoctors(Array.isArray(result.doctors) ? result.doctors : [])
          setDoctorError("")
        }
      } catch (err) {
        if (!cancelled) {
          setDoctors([])
          setDoctorError(err instanceof Error ? err.message : "Unable to load doctors")
        }
      } finally {
        if (!cancelled) setLoadingDoctors(false)
      }
    }

    const loadSessions = async () => {
      setLoadingSessions(true)
      try {
        const response = await fetch("/api/sessions")
        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Unable to load available sessions")
        }
        if (!cancelled) {
          setSessions(Array.isArray(result.sessions) ? result.sessions : [])
          setSessionError("")
        }
      } catch (err) {
        if (!cancelled) {
          setSessions([])
          setSessionError(err instanceof Error ? err.message : "Unable to load available sessions")
        }
      } finally {
        if (!cancelled) setLoadingSessions(false)
      }
    }

    void loadDoctors()
    void loadSessions()
    return () => {
      cancelled = true
    }
  }, [appointment.date, appointment.doctorId, rescheduleOpen])

  const doctorSessions = useMemo(
    () => sessions.filter((session) => String(session.doctorId) === String(selectedDoctorId) && isActiveSession(session)),
    [selectedDoctorId, sessions],
  )

  const availableSessions = useMemo(() => {
    const today = todayIso()

    return doctorSessions
      .filter((session) => {
        if (session.date < today) return false
        if (session.id === appointment.sessionId) return true
        return Number(session.slots ?? 0) > 0
      })
      .sort((left, right) => {
        const dateCompare = left.date.localeCompare(right.date)
        if (dateCompare !== 0) return dateCompare
        return left.startTime.localeCompare(right.startTime)
      })
  }, [appointment.sessionId, doctorSessions])

  const getDateIndicator = (isoDate: string): "available" | "unavailable" | null => {
    const daySessions = doctorSessions.filter((session) => session.date === isoDate)
    if (!daySessions.length) return null

    const hasOpenSlot = daySessions.some((session) => {
      if (Number(session.slots ?? 0) <= 0 && session.id !== appointment.sessionId) return false
      return buildTimeSlots(session.startTime, session.endTime).some((slot) => isSlotInFuture(isoDate, slot))
    })

    return hasOpenSlot ? "available" : "unavailable"
  }

  const getDoctorAvailableDates = (doctorId: number | string) => {
    const today = todayIso()
    return sessions.filter((session) => {
      if (String(session.doctorId) !== String(doctorId) || !isActiveSession(session)) return false
      if (session.date < today) return false
      return Number(session.slots ?? 0) > 0 || session.id === appointment.sessionId
    })
  }

  const selectedDateSessions = useMemo(
    () => availableSessions.filter((session) => session.date === selectedDate),
    [availableSessions, selectedDate],
  )

  const selectedDateTimeSlots = useMemo(() => {
    const slots = new Map<string, SessionOption>()
    for (const session of selectedDateSessions) {
      for (const slot of buildTimeSlots(session.startTime, session.endTime)) {
        if (!slots.has(slot) || Number(session.slots ?? 0) > 0) {
          slots.set(slot, session)
        }
      }
    }
    return Array.from(slots.entries()).sort(([left], [right]) => (parseTimeToMinutes(left) ?? 0) - (parseTimeToMinutes(right) ?? 0))
  }, [selectedDateSessions])

  const selectedCalendarDate = selectedDate ? parseIsoDate(selectedDate) : null
  const bookedTimeSet = useMemo(() => new Set(bookedTimes), [bookedTimes])

  useEffect(() => {
    if (!rescheduleOpen || !selectedDoctorId || !selectedDate) {
      setBookedTimes([])
      return
    }

    let cancelled = false

    const loadBookedTimes = async () => {
      setLoadingBookedTimes(true)
      try {
        const params = new URLSearchParams({
          doctorId: selectedDoctorId,
          date: selectedDate,
          excludeAppointmentId: appointment.id,
        })
        const response = await fetch(`/api/appointments?${params.toString()}`)
        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Unable to check booked times")
        }
        if (!cancelled) {
          setBookedTimes(Array.isArray(result.bookedTimes) ? result.bookedTimes : [])
        }
      } catch {
        if (!cancelled) setBookedTimes([])
      } finally {
        if (!cancelled) setLoadingBookedTimes(false)
      }
    }

    void loadBookedTimes()
    return () => {
      cancelled = true
    }
  }, [appointment.id, rescheduleOpen, selectedDate, selectedDoctorId])

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) {
      setError("Please provide a reason for cancellation.")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: Number(appointment.id), action: "Cancel", reasonCancel: cancelReason.trim() }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to cancel appointment")
      }

      toast.success(
        result.emailSent
          ? "Cancellation request sent to the doctor. Please wait for approval."
          : "Cancellation request submitted. Please wait for the doctor's approval."
      )
      setCancelOpen(false)
      setCancelReason("")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to cancel appointment")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRescheduleSubmit = async () => {
    if (!selectedDoctorId) {
      const message = "Please select a doctor."
      setError(message)
      toast.error(message, { id: "reschedule-session" })
      return
    }

    if (!selectedDate) {
      const message = "Please select a date."
      setError(message)
      toast.error(message, { id: "reschedule-session" })
      return
    }

    if (!selectedSessionId || !selectedTime) {
      const message = "Please select an available session time."
      setError(message)
      toast.error(message, { id: "reschedule-session" })
      return
    }

    if (bookedTimeSet.has(selectedTime)) {
      const message = "That time is already booked. Please choose another slot."
      setError(message)
      toast.error(message, { id: "reschedule-session" })
      return
    }

    const selected = selectedDateSessions.find((session) => session.id === selectedSessionId)
    if (!selected) {
      const message = "Please select a valid session."
      setError(message)
      toast.error(message, { id: "reschedule-session" })
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: Number(appointment.id),
          action: "Reschedule",
          sessionId: Number(selected.id),
          appointmentTime: selectedTime,
        }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to reschedule appointment")
      }

      toast.success("Appointment rescheduled. Awaiting confirmation.")
      setRescheduleOpen(false)
      resetRescheduleForm()
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to reschedule appointment"
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={!canManageAppointment}>
            <span className="sr-only">Open appointment actions</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={!canManageAppointment}
            onSelect={() => {
              if (!canManageAppointment) return
              setCancelOpen(true)
            }}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canManageAppointment}
            onSelect={() => {
              if (!canManageAppointment) return
              setRescheduleOpen(true)
            }}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            Reschedule
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet
        open={rescheduleOpen}
        onOpenChange={(open) => {
          setRescheduleOpen(open)
          if (!open) resetRescheduleForm()
        }}
      >
        <SheetContent side="right" className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Reschedule Appointment</SheetTitle>
            <SheetDescription>
              Select a doctor, pick a date, then choose an available session time.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4 pb-4">
            <div className="rounded-3xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Current appointment</p>
              <p className="mt-2 text-base font-semibold">{appointment.date} at {appointment.time}</p>
              <p className="mt-1 text-sm">{appointment.doctorName}</p>
              <p className="text-sm text-muted-foreground">{appointment.doctorEmail}</p>
            </div>

            <div className="space-y-2">
              <Label>Doctors</Label>
              {loadingDoctors ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Loading doctors...
                </div>
              ) : doctorError ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  {doctorError}
                </div>
              ) : (
                <div className="grid max-h-64 gap-2 overflow-y-auto pr-1">
                  {doctors.map((doctor) => {
                    const isSelected = String(doctor.id) === String(selectedDoctorId)
                    const upcoming = getDoctorAvailableDates(doctor.id)
                    const dateCount = new Set(upcoming.map((session) => session.date)).size

                    return (
                      <button
                        key={doctor.id}
                        type="button"
                        onClick={() => {
                          setSelectedDoctorId(String(doctor.id))
                          setSelectedDate("")
                          setSelectedSessionId("")
                          setSelectedTime("")
                          setError("")
                        }}
                        className={
                          `flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ` +
                          (isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border bg-background hover:border-primary/70")
                        }
                      >
                        <DoctorAvatar name={doctor.name} avatar={doctor.avatar} className="size-11" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{doctor.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{doctor.email || "No email available"}</p>
                          <p className="mt-1 flex items-center gap-1.5 text-xs">
                            <span className={`size-1.5 rounded-full ${dateCount > 0 ? "bg-emerald-500" : "bg-red-400"}`} />
                            <span className={dateCount > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}>
                              {dateCount > 0
                                ? `${dateCount} available session date${dateCount === 1 ? "" : "s"}`
                                : "No upcoming session dates"}
                            </span>
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Calendar
                selected={selectedCalendarDate}
                onSelect={(date) => {
                  if (!date) return
                  setSelectedDate(toIsoDate(date))
                  setSelectedSessionId("")
                  setSelectedTime("")
                  setError("")
                }}
                disabled={(date) => toIsoDate(date) < todayIso()}
                getIndicator={(date) => {
                  if (!selectedDoctorId) return null
                  return getDateIndicator(toIsoDate(date))
                }}
              />
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Available session
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-red-500" />
                  Session full or passed
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Available session and time</Label>
              {!selectedDoctorId ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Select a doctor to see available sessions.
                </div>
              ) : loadingSessions ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Loading available sessions...
                </div>
              ) : sessionError ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  {sessionError}
                </div>
              ) : !selectedDate ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Select a date to view available session times.
                </div>
              ) : loadingBookedTimes ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Checking booked times...
                </div>
              ) : selectedDateSessions.length === 0 || selectedDateTimeSlots.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No available session times for this date.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateSessions.map((session) => (
                    <div key={session.id} className="rounded-2xl border border-border p-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">
                          {formatAppointmentTime(session.startTime)} – {formatAppointmentTime(session.endTime)}
                        </p>
                        <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold">
                          {session.id === appointment.sessionId
                            ? "Current"
                            : `${session.slots} slot${session.slots === 1 ? "" : "s"}`}
                        </span>
                      </div>
                      <div className="grid gap-2">
                        {selectedDateTimeSlots
                          .filter(([, slotSession]) => slotSession.id === session.id)
                          .map(([slot, slotSession]) => {
                            const isSelected = selectedSessionId === slotSession.id && selectedTime === slot
                            const isCurrent =
                              slotSession.id === appointment.sessionId &&
                              selectedDate === appointment.date &&
                              slot === (appointment.timeValue || "")
                            const isBooked = bookedTimeSet.has(slot) && !isCurrent
                            const isPast = !isSlotInFuture(selectedDate, slot)
                            const disabled = isBooked || isPast
                            return (
                              <button
                                key={`${slotSession.id}-${slot}`}
                                type="button"
                                disabled={disabled}
                                onClick={() => {
                                  if (disabled) return
                                  setSelectedSessionId(slotSession.id)
                                  setSelectedTime(slot)
                                  setError("")
                                }}
                                className={
                                  `flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ` +
                                  (isSelected
                                    ? "border-primary bg-primary/10"
                                    : isBooked
                                      ? "cursor-not-allowed border-red-100 bg-red-50 text-red-600"
                                      : isPast
                                        ? "cursor-not-allowed border-border bg-muted/50 text-muted-foreground"
                                        : "border-border bg-background hover:border-primary/70")
                                }
                              >
                                <span>{formatAppointmentTime(slot)}</span>
                                <span className="text-xs font-medium">
                                  {isCurrent
                                    ? "Current"
                                    : isBooked
                                      ? "Booked"
                                      : isPast
                                        ? "Time passed"
                                        : isSelected
                                          ? "Selected"
                                          : ""}
                                </span>
                              </button>
                            )
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={() => setRescheduleOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRescheduleSubmit}
              disabled={submitting || loadingSessions || !selectedDoctorId || !selectedDate || !selectedSessionId || !selectedTime}
            >
              {submitting ? "Saving..." : "Confirm reschedule"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              The doctor will be emailed this request. The appointment stays scheduled until they approve it.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              value={cancelReason}
              onChange={(event) => {
                setCancelReason(event.target.value)
                setError("")
              }}
              placeholder="Reason for cancellation"
              className="min-h-[120px]"
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Close
            </Button>
            <Button onClick={handleCancelSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

const getStatusClasses = (status: string) => {
  const normalized = status?.toLowerCase() ?? "upcoming"

  switch (normalized) {
    case "upcoming":
      return "bg-sky-100 text-sky-800 ring-1 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800/60"
    case "confirmed":
      return "bg-blue-100 text-blue-800 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800/60"
    case "completed":
      return "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/60"
    case "awaiting cancellation":
    case "cancel requested":
      return "bg-amber-100 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/60"
    case "cancelled":
    case "canceled":
      return "bg-rose-100 text-rose-800 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800/60"
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:ring-slate-700"
  }
}

export const columns: ColumnDef<ClientAppointmentRow>[] = [
  {
    accessorKey: "doctorName",
    header: "Doctor",
    cell: ({ row }) => {
      const appointment = row.original
      const doctorName = String(row.getValue("doctorName"))
      return (
        <Link href={`/client/appointments/${appointment.id}`} className="flex items-center gap-3 text-primary hover:underline">
          <DoctorAvatar name={doctorName} avatar={appointment.doctorAvatar} className="size-9" />
          <div>
            <p>{doctorName}</p>
            <p className="text-sm text-muted-foreground">{appointment.doctorEmail}</p>
          </div>
        </Link>
      )
    },
  },
  {
    accessorKey: "specialty",
    header: "Appointment type",
    cell: ({ row }) => row.getValue("specialty"),
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => row.getValue("date"),
  },
  {
    accessorKey: "time",
    header: "Time",
    cell: ({ row }) => row.getValue("time"),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = String(row.getValue("status"))
      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(status)}`}>
          {status}
        </span>
      )
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <AppointmentActionsCell appointment={row.original} />,
  },
]
