"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { columns, type SessionRow } from "./columns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"

const appointmentTypeOptions = [
  "General Consultation",
  "Follow-up Consultation",
  "Medical Certificate",
  "Prescription Refill",
  "Check Up",
  "Others___",
]

type SessionDraft = Omit<SessionRow, "id"> & { tempId: string }

const formatDateValue = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

const parseDateValue = (value: string) => {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export default function AddSessionPage() {
  const [data, setData] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)

  const [open, setOpen] = useState(false)
  const [drafts, setDrafts] = useState<SessionDraft[]>([
    {
      tempId: "t1",
      date: "",
      startTime: "",
      endTime: "",
      duration: "",
      slots: 0,
      status: "Active",
      appointmentTypes: [],
    },
  ])
  const [customValues, setCustomValues] = useState<Record<string, string>>({})
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [calendarOpenFor, setCalendarOpenFor] = useState<string | null>(null)

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const response = await fetch("/api/sessions?mine=true")
        const result = await response.json()
        if (response.ok && result.success) {
          setData(result.sessions ?? [])
        }
      } catch {
        setData([])
      } finally {
        setLoading(false)
      }
    }

    loadSessions()
  }, [])

  const isDateSelectable = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const addDraft = () => {
    const id = `t${Date.now()}`
    setDrafts((prev) => [
      ...prev,
      {
        tempId: id,
        date: "",
        startTime: "",
        endTime: "",
        duration: "",
        slots: 0,
        status: "Active",
        appointmentTypes: [],
      },
    ])
    setCustomValues((prev) => ({ ...prev, [id]: "" }))
  }

  const removeDraft = (tempId: string) => {
    setDrafts((d) => d.filter((x) => x.tempId !== tempId))
  }

  const updateDraft = (tempId: string, field: keyof SessionDraft, value: any) => {
    setDrafts((d) => d.map((x) => (x.tempId === tempId ? { ...x, [field]: value } : x)))
  }

  const toggleAppointmentType = (tempId: string, option: string) => {
    setDrafts((d) =>
      d.map((x) => {
        if (x.tempId !== tempId) return x

        const current = x.appointmentTypes ?? []
        const next = current.includes(option) ? current.filter((item) => item !== option) : [...current, option]

        return { ...x, appointmentTypes: next }
      }),
    )
  }

  const updateOtherAppointmentType = (tempId: string, value: string) => {
    setCustomValues((prev) => ({ ...prev, [tempId]: value }))
  }

  const addCustomAppointmentType = (tempId: string, value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return

    setDrafts((d) =>
      d.map((x) => {
        if (x.tempId !== tempId) return x

        const current = x.appointmentTypes ?? []
        const withoutCustom = current.filter((item) => item !== "__custom__" && item !== trimmed)
        return { ...x, appointmentTypes: [...withoutCustom, trimmed] }
      }),
    )
  }

  const getOtherTextValue = (tempId: string) => customValues[tempId] ?? ""

  const resetDrafts = () => {
    setDrafts([
      {
        tempId: "t1",
        date: "",
        startTime: "",
        endTime: "",
        duration: "",
        slots: 0,
        status: "Active",
        appointmentTypes: [],
      },
    ])
    setCustomValues({})
    setErrorMessage("")
  }

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetDrafts()
    }
    setOpen(nextOpen)
  }

  const confirmAdd = async () => {
    const incompleteDrafts = drafts.filter((draft) => {
      const hasDate = Boolean(draft.date?.trim())
      const hasStartTime = Boolean(draft.startTime?.trim())
      const hasEndTime = Boolean(draft.endTime?.trim())
      const hasSlots = Number(draft.slots) > 0

      return !hasDate || !hasStartTime || !hasEndTime || !hasSlots
    })

    if (incompleteDrafts.length > 0) {
      setErrorMessage("Please complete all session fields for each entry before adding. Date, start time, end time, and slot are required.")
      return
    }

    const existingKeys = new Set(
      data
        .map((session) => `${session.date}-${session.startTime}`)
        .filter(Boolean),
    )

    const seen = new Set<string>()
    const duplicates = drafts.filter((draft) => {
      const key = `${draft.date}-${draft.startTime}`
      if (seen.has(key) || existingKeys.has(key)) return true
      seen.add(key)
      return false
    })

    if (duplicates.length > 0) {
      setErrorMessage("A session with the same date and start time already exists. You can add the same date with a different time.")
      return
    }

    const nextRows: SessionRow[] = drafts.map((d, idx) => ({
      id: `s${data.length + idx + 1}`,
      date: d.date,
      startTime: d.startTime,
      endTime: d.endTime,
      duration: d.duration,
      slots: Number(d.slots),
      status: d.status,
      appointmentTypes: d.appointmentTypes ?? [],
    }))

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessions: drafts.map((draft) => ({
            date: draft.date,
            startTime: draft.startTime,
            endTime: draft.endTime,
            slots: Number(draft.slots),
            appointmentType: (draft.appointmentTypes ?? []).find(Boolean) || "General Consultation",
          })),
        }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save sessions")
      }

      setData((prev) => [...nextRows, ...prev])
      setOpen(false)
      resetDrafts()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save sessions")
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Add Session</h1>
            <p className="mt-2 text-muted-foreground">Create new consultation sessions and set your availability for patients.</p>
          </div>
          <div>
            <Button onClick={() => setOpen(true)} className="bg-primary">Add Session</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {loading ? <div className="text-sm text-muted-foreground">Loading sessions…</div> : <DataTable columns={columns} data={data} />}
        </div>
      </div>

      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Multiple Sessions</DialogTitle>
            <DialogDescription>Add one or more sessions below. Use "Add another" to create multiple entries.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-auto py-2">
            {errorMessage ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessage}</div> : null}
            {drafts.map((d) => (
              <div key={d.tempId} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end p-3 rounded-lg border border-border">
                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground">Date</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      readOnly
                      value={d.date}
                      placeholder="yyyy/mm/dd"
                      onClick={() => setCalendarOpenFor(d.tempId)}
                      className="w-full rounded-lg border px-2 py-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Start</label>
                  <input type="time" value={d.startTime} onChange={(e) => updateDraft(d.tempId, "startTime", e.target.value)} className="mt-1 w-full rounded-lg border px-2 py-1" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">End</label>
                  <input type="time" value={d.endTime} onChange={(e) => updateDraft(d.tempId, "endTime", e.target.value)} className="mt-1 w-full rounded-lg border px-2 py-1" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Slots</label>
                  <input type="number" min={1} value={d.slots} onChange={(e) => updateDraft(d.tempId, "slots", Number(e.target.value))} className="mt-1 w-full rounded-lg border px-2 py-1" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground">Appointment Types</label>
                  <div className="mt-1 space-y-2 rounded-lg border px-2 py-2">
                    {appointmentTypeOptions.map((option) => (
                      <label key={option} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={(d.appointmentTypes ?? []).includes(option)}
                          onChange={() => toggleAppointmentType(d.tempId, option)}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                    {(d.appointmentTypes ?? []).includes("Others___") && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={getOtherTextValue(d.tempId)}
                            onChange={(e) => updateOtherAppointmentType(d.tempId, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                addCustomAppointmentType(d.tempId, e.currentTarget.value)
                              }
                            }}
                            placeholder="Enter other appointment type"
                            className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              addCustomAppointmentType(d.tempId, getOtherTextValue(d.tempId))
                              setCustomValues((prev) => ({ ...prev, [d.tempId]: "" }))
                            }}
                          >
                            Add
                          </Button>
                        </div>
                        {(d.appointmentTypes ?? []).filter((item) => item !== "__custom__" && item !== "Others___").map((item) => (
                          <div key={item} className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked readOnly />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => removeDraft(d.tempId)} className="h-9 px-3 rounded-md bg-red-50 text-red-600 border border-red-100">Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={addDraft}>Add another</Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={confirmAdd} className="bg-primary">Confirm add</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(calendarOpenFor)} onOpenChange={(open) => !open && setCalendarOpenFor(null)}>
        <DialogContent className="mx-auto max-w-sm">
          <DialogHeader>
            <DialogTitle>Select date</DialogTitle>
            <DialogDescription>Choose a date for this session.</DialogDescription>
          </DialogHeader>
          {calendarOpenFor ? (
            <Calendar
              selected={drafts.find((draft) => draft.tempId === calendarOpenFor)?.date ? parseDateValue(drafts.find((draft) => draft.tempId === calendarOpenFor)!.date) : null}
              disabled={isDateSelectable}
              onSelect={(date) => {
                const currentDraft = drafts.find((draft) => draft.tempId === calendarOpenFor)
                if (date && currentDraft && !isDateSelectable(date)) {
                  updateDraft(currentDraft.tempId, "date", formatDateValue(date))
                }
                setCalendarOpenFor(null)
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
