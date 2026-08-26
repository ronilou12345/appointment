"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Textarea } from "@/components/ui/textarea"
import { Check, CheckCircle2, MoreHorizontal, Printer, X } from "lucide-react"
import { toast } from "sonner"
import { formatAppointmentTime } from "@/app/client/appointments/status"
import { printSingleAppointment } from "@/app/admin/all-appointments/print-appointments"
import type { AppointmentRow } from "@/app/admin/all-appointments/columns"

export type DoctorAppointmentRow = {
  id: string
  patientId: string
  patientName: string
  patientEmail?: string
  patientAvatar?: string | null
  patientAge: string
  patientGender: string
  doctorId: string
  doctorName: string
  sessionId?: string
  specialty: string
  date: string
  time: string
  timeValue?: string
  status: string
  reasonForVisit?: string
  relationship?: string
  contactNumber?: string
  symptoms?: string
  durationOfSymptoms?: string
  painLevel?: string
  additionalNotes?: string
  heartRate?: string
  bodyTemperature?: string
  weight?: string
  bloodSugar?: string
  chiefComplaints?: string
  physicalExamination?: string
  diagnosis?: string
  prescription?: string
  nextFollowUp?: string
}

export function toPrintAppointment(row: DoctorAppointmentRow): AppointmentRow {
  return {
    id: row.id,
    patientId: row.patientId,
    patientName: row.patientName,
    patientEmail: row.patientEmail ?? "",
    patientAvatar: row.patientAvatar ?? "",
    doctorName: row.doctorName,
    date: row.date,
    time: row.time,
    status: row.status,
    reasonForVisit: row.reasonForVisit ?? "—",
    appointmentType: row.specialty,
    relationship: row.relationship ?? "—",
    age: row.patientAge,
    gender: row.patientGender,
    contactNumber: row.contactNumber ?? "—",
    symptoms: row.symptoms ?? "No symptoms recorded.",
    durationOfSymptoms: row.durationOfSymptoms ?? "—",
    painLevel: row.painLevel ?? "—",
    additionalNotes: row.additionalNotes ?? "No additional notes.",
    heartRate: row.heartRate ?? "—",
    bodyTemperature: row.bodyTemperature ?? "—",
    weight: row.weight ?? "—",
    bloodSugar: row.bloodSugar ?? "—",
    chiefComplaints: row.chiefComplaints ?? "No chief complaints recorded.",
    physicalExamination: row.physicalExamination ?? "No physical examination recorded.",
    diagnosis: row.diagnosis ?? "No diagnosis recorded.",
    prescription: row.prescription ?? "No prescription recorded.",
    nextFollowUp: row.nextFollowUp ?? "—",
  }
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

function DoctorAppointmentActionsCell({ appointment }: { appointment: DoctorAppointmentRow }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [sessions, setSessions] = useState<SessionOption[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [sessionError, setSessionError] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedSessionId, setSelectedSessionId] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [bookedTimes, setBookedTimes] = useState<string[]>([])
  const [loadingBookedTimes, setLoadingBookedTimes] = useState(false)
  const [error, setError] = useState("")
  const [loadingAction, setLoadingAction] = useState<"" | "Confirm" | "Complete" | "Cancel" | "Reschedule">("")

  const statusValue = appointment.status.toLowerCase()
  const isAwaitingCancellation = statusValue === "awaiting cancellation" || statusValue === "cancel requested"
  const canConfirm = !isAwaitingCancellation && statusValue !== "confirmed" && statusValue !== "completed" && statusValue !== "cancelled" && statusValue !== "canceled"
  const canComplete = !isAwaitingCancellation && statusValue !== "completed" && statusValue !== "cancelled" && statusValue !== "canceled"
  const canCancel =
    statusValue !== "confirmed" &&
    statusValue !== "completed" &&
    statusValue !== "cancelled" &&
    statusValue !== "canceled"

  const resetCancelForm = () => {
    setCancelReason("")
    setSelectedDate("")
    setSelectedSessionId("")
    setSelectedTime("")
    setBookedTimes([])
    setError("")
    setSessionError("")
  }

  useEffect(() => {
    if (!drawerOpen) return

    let cancelled = false
    resetCancelForm()

    const loadSessions = async () => {
      setLoadingSessions(true)
      try {
        const response = await fetch("/api/sessions?mine=true")
        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Unable to load your available times")
        }
        if (!cancelled) {
          setSessions(Array.isArray(result.sessions) ? result.sessions : [])
          setSessionError("")
        }
      } catch (err) {
        if (!cancelled) {
          setSessions([])
          setSessionError(err instanceof Error ? err.message : "Unable to load your available times")
        }
      } finally {
        if (!cancelled) setLoadingSessions(false)
      }
    }

    void loadSessions()
    return () => {
      cancelled = true
    }
  }, [drawerOpen])

  const doctorSessions = useMemo(
    () => sessions.filter((session) => String(session.doctorId) === String(appointment.doctorId) && isActiveSession(session)),
    [appointment.doctorId, sessions],
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
    if (!drawerOpen || !appointment.doctorId || !selectedDate) {
      setBookedTimes([])
      return
    }

    let cancelled = false

    const loadBookedTimes = async () => {
      setLoadingBookedTimes(true)
      try {
        const params = new URLSearchParams({
          doctorId: appointment.doctorId,
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
  }, [appointment.doctorId, appointment.id, drawerOpen, selectedDate])

  const submitAction = async (action: "Confirm" | "Complete" | "Cancel", reason?: string) => {
    setLoadingAction(action)

    try {
      const response = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: Number(appointment.id),
          action,
          ...(reason ? { reasonCancel: reason } : {}),
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to update appointment status")
      }

      const statusLabel = action === "Confirm" ? "confirmed" : action === "Complete" ? "completed" : "cancelled"
      const notificationMessage = result.emailSent && result.smsSent
        ? `${appointment.patientName} has been notified via email and SMS.`
        : result.emailSent
          ? `${appointment.patientName} has been emailed.`
          : result.smsSent
            ? `${appointment.patientName} has been notified via SMS.`
            : ""
      toast.success(
        action === "Cancel"
          ? `Cancellation approved.${notificationMessage ? ` ${notificationMessage}` : ""}`
          : action === "Confirm" && notificationMessage
            ? `Appointment confirmed. ${notificationMessage}`
            : action === "Complete" && notificationMessage
              ? `Appointment completed. ${notificationMessage}`
            : `Appointment ${statusLabel}.${notificationMessage ? ` ${notificationMessage}` : ""}`
      )

      router.refresh()
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
      return false
    } finally {
      setLoadingAction("")
    }
  }

  const handleAction = async (action: "Confirm" | "Complete" | "Cancel") => {
    setMenuOpen(false)

    if (action === "Cancel") {
      if (isAwaitingCancellation) {
        await submitAction("Cancel")
        return
      }

      setDrawerOpen(true)
      return
    }

    await submitAction(action)
  }

  const handleSubmitCancel = async () => {
    const reason = cancelReason.trim()
    if (!reason) {
      const message = "Please provide a reason for cancellation."
      setError(message)
      toast.error(message)
      return
    }

    if (!selectedDate || !selectedSessionId || !selectedTime) {
      const message = "Please select one of your available times."
      setError(message)
      toast.error(message)
      return
    }

    if (bookedTimeSet.has(selectedTime)) {
      const message = "That time is already booked. Please choose another slot."
      setError(message)
      toast.error(message)
      return
    }

    const isSameSlot =
      selectedSessionId === appointment.sessionId &&
      selectedDate === appointment.date &&
      selectedTime === (appointment.timeValue || "")
    if (isSameSlot) {
      const message = "Please choose a different available time from the current appointment."
      setError(message)
      toast.error(message)
      return
    }

    setLoadingAction("Reschedule")
    setError("")

    try {
      const response = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: Number(appointment.id),
          action: "Reschedule",
          sessionId: Number(selectedSessionId),
          appointmentTime: selectedTime,
          reasonCancel: reason,
        }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to reschedule this appointment")
      }

      toast.success(
        result.emailSent
          ? `Appointment moved to the new time. ${appointment.patientName} has been emailed.`
          : "Appointment moved to the new time."
      )
      setDrawerOpen(false)
      resetCancelForm()
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to reschedule this appointment"
      setError(message)
      toast.error(message)
    } finally {
      setLoadingAction("")
    }
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 w-9 p-0">
            <span className="sr-only">Open appointment actions</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem disabled={!canConfirm || loadingAction === "Confirm"} onSelect={() => handleAction("Confirm") }>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Confirm
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!canComplete || loadingAction === "Complete"} onSelect={() => handleAction("Complete") }>
            <Check className="mr-2 h-4 w-4" />
            Complete
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setMenuOpen(false)
              printSingleAppointment(toPrintAppointment(appointment))
            }}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" disabled={!canCancel} onSelect={() => handleAction("Cancel") }>
            <X className="mr-2 h-4 w-4" />
            {isAwaitingCancellation ? "Approve cancel" : "Cancel"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Drawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open)
          if (!open) resetCancelForm()
        }}
        direction="right"
      >
        <DrawerContent className="flex h-full max-h-[calc(100vh-4rem)] flex-col overflow-hidden">
          <DrawerHeader>
            <DrawerTitle>Cancel & Reschedule</DrawerTitle>
            <DrawerDescription>
              Add a reason for cancellation, then choose one of your available times.
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
            <div className="rounded-3xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Current appointment</p>
              <p className="mt-2 text-base font-semibold">{appointment.date} at {appointment.time}</p>
              <p className="mt-1 text-sm text-muted-foreground">{appointment.patientName}</p>
            </div>

            <div className="space-y-3">
              <Label htmlFor={`cancel-reason-${appointment.id}`}>Reason for cancellation</Label>
              <Textarea
                id={`cancel-reason-${appointment.id}`}
                value={cancelReason}
                onChange={(event) => {
                  setCancelReason(event.target.value)
                  setError("")
                }}
                placeholder="Add a brief reason for the cancellation"
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Your available date</Label>
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
                getIndicator={(date) => getDateIndicator(toIsoDate(date))}
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
              <Label>Your available time</Label>
              {loadingSessions ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Loading your available times...
                </div>
              ) : sessionError ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  {sessionError}
                </div>
              ) : !selectedDate ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Select a date to view your available times.
                </div>
              ) : loadingBookedTimes ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Checking booked times...
                </div>
              ) : selectedDateSessions.length === 0 || selectedDateTimeSlots.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No available times on this date.
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

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
            <Button onClick={handleSubmitCancel} disabled={loadingAction === "Reschedule"}>
              {loadingAction === "Reschedule" ? "Submitting..." : "Submit"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export const columns: ColumnDef<DoctorAppointmentRow>[] = [
  {
    accessorKey: "patientName",
    header: "Patient",
    cell: ({ row }) => {
      const appointment = row.original
      return (
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            {appointment.patientAvatar ? (
              <AvatarImage src={appointment.patientAvatar} alt={appointment.patientName} />
            ) : (
              <AvatarFallback>{appointment.patientName.split(" ").slice(0, 2).map((part) => part[0]).join("")}</AvatarFallback>
            )}
          </Avatar>
          <div className="min-w-0 space-y-1">
            <Link href={`/doctor/appointments/${appointment.id}`} className="text-primary hover:underline">
              {String(row.getValue("patientName"))}
            </Link>
            <p className="text-xs text-muted-foreground">
              {appointment.patientAge} yrs · {appointment.patientGender}
            </p>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "specialty",
    header: "Appointment Type",
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
      const normalized = status.toLowerCase()

      let badgeClass = "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:ring-slate-700"

      if (normalized === "confirmed") {
        badgeClass = "bg-blue-100 text-blue-800 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800/60"
      } else if (normalized === "completed") {
        badgeClass = "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/60"
      } else if (normalized === "awaiting cancellation" || normalized === "cancel requested") {
        badgeClass = "bg-amber-100 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/60"
      } else if (normalized === "cancelled" || normalized === "canceled") {
        badgeClass = "bg-rose-100 text-rose-800 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800/60"
      } else if (normalized === "pending") {
        badgeClass = "bg-amber-100 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/60"
      }

      return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass}`}>{status}</span>
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const appointment = row.original
      return <DoctorAppointmentActionsCell appointment={appointment} />
    },
  },
]
