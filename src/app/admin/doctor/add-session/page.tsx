"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { DataTable } from "@/components/data-table"
import { columns, type SessionRow } from "./columns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Calendar } from "@/components/ui/calendar"
import { Pencil } from "lucide-react"

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

const sanitizeSlotCount = (value: unknown, min = 1) => {
  const parsed = typeof value === "string" ? Number(value.trim()) : Number(value)
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < min) {
    return min
  }
  return parsed
}

const normalizeSessionStatus = (value: unknown) => {
  const requested = typeof value === "string" ? value.trim() : "Active"
  return ["Active", "Inactive", "Cancelled"].includes(requested) ? requested : "Active"
}

const timeStringToMinutes = (value: unknown) => {
  const text = String(value ?? "").trim()
  if (!/^\d{1,2}:\d{2}$/.test(text)) return NaN

  const [hourText, minuteText] = text.split(":")
  const hour = Number(hourText)
  const minute = Number(minuteText)

  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return NaN
  }

  return hour * 60 + minute
}

const timeRangesOverlap = (startA: string, endA: string, startB: string, endB: string) => {
  const startAValue = timeStringToMinutes(startA)
  const endAValue = timeStringToMinutes(endA)
  const startBValue = timeStringToMinutes(startB)
  const endBValue = timeStringToMinutes(endB)

  if (![startAValue, endAValue, startBValue, endBValue].every((value) => Number.isFinite(value))) {
    return false
  }

  if (endAValue <= startAValue || endBValue <= startBValue) {
    return false
  }

  return startAValue < endBValue && startBValue < endAValue
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
      slots: 1,
      status: "Active",
      appointmentTypes: [],
    },
  ])
  const [customValues, setCustomValues] = useState<Record<string, string>>({})
  const [editingDraftCustom, setEditingDraftCustom] = useState<Record<string, string>>({})
  const [editCustomValue, setEditCustomValue] = useState("")
  const [editingEditCustom, setEditingEditCustom] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [calendarOpenFor, setCalendarOpenFor] = useState<string | null>(null)

  const loadSessions = async () => {
    try {
      const response = await fetch("/api/sessions?mine=true")
      const result = await response.json()
      if (response.ok && result.success) {
        setData(result.sessions ?? [])
      } else {
        setData([])
      }
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSessions()
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
        slots: 1,
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
    const nextValue = field === "slots" ? sanitizeSlotCount(value) : value
    setDrafts((d) => d.map((x) => (x.tempId === tempId ? { ...x, [field]: nextValue } : x)))
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

  const getCustomAppointmentEntries = (appointmentTypes: string[] | undefined) =>
    (appointmentTypes ?? []).filter((item) => typeof item === "string" && item.trim() && !appointmentTypeOptions.includes(item) && item !== "Others___")

  const recordCustomAppointmentType = (current: string[] | undefined, nextValue: string, replacing?: string | null) => {
    const trimmed = nextValue.trim()
    if (!trimmed) return current ?? []

    const types = (current ?? []).filter(Boolean)
    const presetItems = types.filter((item) => appointmentTypeOptions.includes(item) && item !== "Others___")
    const existingCustomItems = getCustomAppointmentEntries(types)
    const nextCustomItems = replacing
      ? existingCustomItems.map((item) => (item === replacing ? trimmed : item))
      : [...existingCustomItems.filter((item) => item !== trimmed), trimmed]

    return Array.from(new Set([...presetItems, "Others___", ...nextCustomItems.filter(Boolean)]))
  }

  const addCustomAppointmentType = (tempId: string, value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return

    const replacing = editingDraftCustom[tempId] || null

    setDrafts((d) =>
      d.map((x) => {
        if (x.tempId !== tempId) return x
        return { ...x, appointmentTypes: recordCustomAppointmentType(x.appointmentTypes, trimmed, replacing) }
      }),
    )
    setEditingDraftCustom((prev) => {
      const next = { ...prev }
      delete next[tempId]
      return next
    })
    setCustomValues((prev) => ({ ...prev, [tempId]: "" }))
  }

  const startEditDraftCustomType = (tempId: string, value: string) => {
    setEditingDraftCustom((prev) => ({ ...prev, [tempId]: value }))
    setCustomValues((prev) => ({ ...prev, [tempId]: value }))
  }

  const removeCustomAppointmentType = (tempId: string, value: string) => {
    setDrafts((d) =>
      d.map((x) => {
        if (x.tempId !== tempId) return x
        return { ...x, appointmentTypes: (x.appointmentTypes ?? []).filter((item) => item !== value) }
      }),
    )
    setEditingDraftCustom((prev) => {
      if (prev[tempId] !== value) return prev
      const next = { ...prev }
      delete next[tempId]
      return next
    })
  }

  const getOtherTextValue = (tempId: string) => customValues[tempId] ?? ""

  const addCustomAppointmentTypeToEditSession = () => {
    if (!editSession) return

    const trimmed = editCustomValue.trim()
    if (!trimmed) return

    setEditSession({
      ...editSession,
      appointmentTypes: recordCustomAppointmentType(editSession.appointmentTypes, trimmed, editingEditCustom),
    })
    setEditCustomValue("")
    setEditingEditCustom(null)
  }

  const startEditSessionCustomType = (value: string) => {
    setEditingEditCustom(value)
    setEditCustomValue(value)
  }

  const removeEditSessionCustomType = (value: string) => {
    if (!editSession) return
    setEditSession({
      ...editSession,
      appointmentTypes: (editSession.appointmentTypes ?? []).filter((item) => item !== value),
    })
    if (editingEditCustom === value) {
      setEditingEditCustom(null)
      setEditCustomValue("")
    }
  }

  const resetDrafts = () => {
    setDrafts([
      {
        tempId: "t1",
        date: "",
        startTime: "",
        endTime: "",
        duration: "",
        slots: 1,
        status: "Active",
        appointmentTypes: [],
      },
    ])
    setCustomValues({})
    setEditingDraftCustom({})
    setErrorMessage("")
  }

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetDrafts()
    }
    setOpen(nextOpen)
  }

  const handleCancelAddDialog = () => {
    resetDrafts()
    setErrorMessage("")
    setOpen(false)
  }

  // Edit sheet state
  const [editOpen, setEditOpen] = useState(false)
  const [editSession, setEditSession] = useState<SessionRow | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<SessionRow | null>(null)

  useEffect(() => {
    const onEdit = (e: Event) => {
      const detail = (e as CustomEvent).detail as SessionRow
      if (detail) {
        const customItems = getCustomAppointmentEntries(detail.appointmentTypes)
        const types = detail.appointmentTypes ?? []
        setEditSession({
          ...detail,
          appointmentTypes: customItems.length && !types.includes("Others___") ? [...types, "Others___"] : types,
        })
        setEditCustomValue("")
        setEditingEditCustom(null)
        setEditOpen(true)
      }
    }

    const onDelete = (e: Event) => {
      const detail = (e as CustomEvent).detail as SessionRow
      if (!detail) return
      // open confirmation modal
      setDeleteTarget(detail)
      setDeleteOpen(true)
    }

    window.addEventListener('edit-session', onEdit)
    window.addEventListener('delete-session', onDelete)
    return () => {
      window.removeEventListener('edit-session', onEdit)
      window.removeEventListener('delete-session', onDelete)
    }
  }, [])

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    const id = deleteTarget.id
    // optimistic
    setData((d) => d.filter((s) => s.id !== id))
    setDeleteOpen(false)
    setDeleteTarget(null)

    try {
      const resp = await fetch('/api/sessions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      const result = await resp.json()
      if (!resp.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete')
      }

      await loadSessions()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to delete session')
      // rollback: refetch sessions
      try {
        const r = await fetch('/api/sessions?mine=true')
        const j = await r.json()
        if (r.ok && j.success) setData(j.sessions ?? [])
      } catch {}
    }
  }

  const confirmAdd = async () => {
    const incompleteDrafts = drafts.filter((draft) => {
      const hasDate = Boolean(draft.date?.trim())
      const hasStartTime = Boolean(draft.startTime?.trim())
      const hasEndTime = Boolean(draft.endTime?.trim())
      const hasSlots = sanitizeSlotCount(draft.slots) > 0
      const hasStatus = ["Active", "Inactive", "Cancelled"].includes(String(draft.status ?? "").trim())
      const pendingOther = (customValues[draft.tempId] ?? "").trim()
      const recordedTypes = (draft.appointmentTypes ?? []).filter((item) => item !== "Others___" && Boolean(String(item).trim()))
      const hasAppointmentType = recordedTypes.length > 0 || Boolean(pendingOther)

      return !hasDate || !hasStartTime || !hasEndTime || !hasSlots || !hasStatus || !hasAppointmentType
    })

    if (incompleteDrafts.length > 0) {
      setErrorMessage("Please complete all session fields for each entry before adding. Select date, start time, end time, status, slots, and appointment type before confirming.")
      return
    }

    const seenDraftRanges = new Set<string>()
    const overlappingDrafts = drafts.filter((draft, idx) => {
      if (!draft.date || !draft.startTime || !draft.endTime) return false

      const draftKey = `${draft.date}-${draft.startTime}-${draft.endTime}`
      if (seenDraftRanges.has(draftKey)) return false
      seenDraftRanges.add(draftKey)

      for (const other of drafts.slice(idx + 1)) {
        if (!other.date || !other.startTime || !other.endTime) continue
        if (other.date !== draft.date) continue
        if (timeRangesOverlap(draft.startTime, draft.endTime, other.startTime, other.endTime)) {
          return true
        }
      }

      return false
    })

    if (overlappingDrafts.length > 0) {
      setErrorMessage("You cannot create a session on the same date when the time range overlaps another selected session.")
      return
    }

    const timeConflicts = drafts.filter((draft) => {
      if (!draft.date || !draft.startTime || !draft.endTime) return false

      return data.some((session) => {
        if (session.date !== draft.date) return false
        return timeRangesOverlap(draft.startTime, draft.endTime, session.startTime, session.endTime)
      })
    })

    if (timeConflicts.length > 0) {
      setErrorMessage("This selected time conflicts with an existing session and cannot be created.")
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
      slots: sanitizeSlotCount(d.slots),
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
            slots: sanitizeSlotCount(draft.slots),
            status: normalizeSessionStatus(draft.status),
            appointmentTypes: (() => {
              const pendingOther = (customValues[draft.tempId] ?? "").trim()
              const recorded = pendingOther
                ? recordCustomAppointmentType(draft.appointmentTypes, pendingOther)
                : (draft.appointmentTypes ?? [])
              const visible = recorded.filter((item) => item !== "Others___" && Boolean(String(item).trim()))
              return visible.length ? visible : ["General Consultation"]
            })(),
          })),
        }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save sessions")
      }

      setOpen(false)
      resetDrafts()
      await loadSessions()
      toast.success("Session successfully added")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save sessions")
    }
  }

  const handleEditSave = async () => {
    if (!editSession) return

    const pendingOther = editCustomValue.trim()
    const recordedTypes = pendingOther
      ? recordCustomAppointmentType(editSession.appointmentTypes, pendingOther, editingEditCustom)
      : (editSession.appointmentTypes ?? [])
    const visibleTypes = recordedTypes.filter((item) => item !== "Others___" && Boolean(String(item).trim()))
    const normalizedStatus = normalizeSessionStatus(editSession.status)
    const sessionName = String(visibleTypes[0] ?? "").trim() || "General Consultation"

    try {
      const response = await fetch('/api/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editSession.id,
          date: editSession.date,
          startTime: editSession.startTime,
          endTime: editSession.endTime,
          slots: sanitizeSlotCount(editSession.slots, 0),
          appointmentType: sessionName,
          appointmentTypes: visibleTypes.length ? visibleTypes : [sessionName],
          status: normalizedStatus,
        }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to update')

      setData((current) => current.map((row) => row.id === editSession.id ? {
        ...row,
        date: editSession.date,
        startTime: editSession.startTime,
        endTime: editSession.endTime,
        slots: sanitizeSlotCount(editSession.slots, 0),
        status: normalizedStatus,
        appointmentTypes: visibleTypes.length ? visibleTypes : [sessionName],
      } : row))

      await loadSessions()
      setEditOpen(false)
      setEditSession(null)
      setEditCustomValue("")
      setEditingEditCustom(null)
      toast.success("Session successfully updated")
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update session')
    }
  }

  return (
    <div className="min-h-screen w-full bg-background p-6 text-foreground">
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

      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Multiple Sessions</DialogTitle>
            <DialogDescription>Add one or more sessions below. Use "Add another" to create multiple entries.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-auto py-2">
            {errorMessage ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessage}</div> : null}
            {drafts.map((d) => (
              <div key={d.tempId} className="rounded-lg border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Session</span>
                  <button onClick={() => removeDraft(d.tempId)} className="h-9 px-3 rounded-md bg-red-50 text-red-600 border border-red-100">Remove</button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Select Date</label>
                    <div className="mt-1">
                      <input
                        type="text"
                        readOnly
                        value={d.date}
                        placeholder="Select Date"
                        onClick={() => setCalendarOpenFor(d.tempId)}
                        className="w-full rounded-lg border px-2 py-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm text-muted-foreground">Select Start Time</label>
                      <input type="time" value={d.startTime} onChange={(e) => updateDraft(d.tempId, "startTime", e.target.value)} className="mt-1 w-full rounded-lg border px-2 py-1" />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Select End Time</label>
                      <input type="time" value={d.endTime} onChange={(e) => updateDraft(d.tempId, "endTime", e.target.value)} className="mt-1 w-full rounded-lg border px-2 py-1" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm text-muted-foreground">Status</label>
                      <select value={d.status || "Active"} onChange={(e) => updateDraft(d.tempId, "status", e.target.value)} className="mt-1 w-full rounded-lg border px-2 py-1">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Slots</label>
                      <input type="number" min={1} value={d.slots} onChange={(e) => updateDraft(d.tempId, "slots", Number(e.target.value))} className="mt-1 w-full rounded-lg border px-2 py-1" />
                    </div>
                  </div>

                  <div>
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
                              placeholder={editingDraftCustom[d.tempId] ? "Edit other appointment type" : "Enter other appointment type"}
                              className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addCustomAppointmentType(d.tempId, getOtherTextValue(d.tempId))}
                            >
                              {editingDraftCustom[d.tempId] ? "Update" : "Add"}
                            </Button>
                          </div>
                          {getCustomAppointmentEntries(d.appointmentTypes).map((item) => (
                            <div key={item} className="flex items-center justify-between gap-2 text-sm">
                              <label className="flex min-w-0 items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked
                                  onChange={() => removeCustomAppointmentType(d.tempId, item)}
                                />
                                <span className="truncate">{item}</span>
                              </label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => startEditDraftCustomType(d.tempId, item)}
                              >
                                <Pencil className="mr-1 h-3.5 w-3.5" />
                                Edit
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={addDraft}>Add another</Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelAddDialog}>Cancel</Button>
              <Button onClick={confirmAdd} className="bg-primary">Confirm add</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={editOpen} onOpenChange={(o) => { if (!o) { setEditSession(null); setEditCustomValue(""); setEditingEditCustom(null) }; setEditOpen(o) }}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Edit Session</SheetTitle>
            <SheetDescription>Modify session details and save.</SheetDescription>
          </SheetHeader>

          {editSession ? (
            <div className="space-y-4 p-4">
              <div>
                <label className="text-sm text-muted-foreground">Date</label>
                <input type="date" value={editSession.date} onChange={(e) => setEditSession({ ...editSession, date: e.target.value })} className="mt-1 w-full rounded-lg border px-2 py-1" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm text-muted-foreground">Start</label>
                  <input type="time" value={editSession.startTime} onChange={(e) => setEditSession({ ...editSession, startTime: e.target.value })} className="mt-1 w-full rounded-lg border px-2 py-1" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">End</label>
                  <input type="time" value={editSession.endTime} onChange={(e) => setEditSession({ ...editSession, endTime: e.target.value })} className="mt-1 w-full rounded-lg border px-2 py-1" />
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Status</label>
                <select value={editSession.status || "Active"} onChange={(e) => setEditSession({ ...editSession, status: e.target.value })} className="mt-1 w-full rounded-lg border px-2 py-1">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Slots</label>
                <input type="number" min={0} value={editSession.slots} onChange={(e) => setEditSession({ ...editSession, slots: sanitizeSlotCount(e.target.value, 0) })} className="mt-1 w-full rounded-lg border px-2 py-1" />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Appointment Types</label>
                <div className="mt-1 space-y-2 rounded-lg border px-2 py-2">
                  {appointmentTypeOptions.map((option) => (
                    <label key={option} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={(editSession.appointmentTypes ?? []).includes(option)}
                        onChange={(e) => {
                          const current = editSession.appointmentTypes ?? []
                          const next = e.currentTarget.checked ? [...current, option] : current.filter((it) => it !== option)
                          setEditSession({ ...editSession, appointmentTypes: next })
                        }}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                  {((editSession.appointmentTypes ?? []).includes("Others___") || getCustomAppointmentEntries(editSession.appointmentTypes).length > 0) && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editCustomValue}
                          onChange={(e) => setEditCustomValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              addCustomAppointmentTypeToEditSession()
                            }
                          }}
                          placeholder={editingEditCustom ? "Edit other appointment type" : "Enter other appointment type"}
                          className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addCustomAppointmentTypeToEditSession}
                        >
                          {editingEditCustom ? "Update" : "Add"}
                        </Button>
                      </div>
                      {getCustomAppointmentEntries(editSession.appointmentTypes).map((item) => (
                        <div key={item} className="flex items-center justify-between gap-2 text-sm">
                          <label className="flex min-w-0 items-center gap-2">
                            <input
                              type="checkbox"
                              checked
                              onChange={() => removeEditSessionCustomType(item)}
                            />
                            <span className="truncate">{item}</span>
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => startEditSessionCustomType(item)}
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <SheetFooter>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setEditOpen(false); setEditSession(null); setEditCustomValue(""); setEditingEditCustom(null) }}>Cancel</Button>
                  <Button className="bg-primary" onClick={handleEditSave}>Save changes</Button>
                </div>
              </SheetFooter>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={deleteOpen} onOpenChange={(o) => { if (!o) setDeleteTarget(null); setDeleteOpen(o) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Delete session</DialogTitle>
            <DialogDescription className="text-lg">Are you sure you want to delete this session?</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeleteTarget(null) }}>Cancel</Button>
            <Button className="bg-red-600 text-white" onClick={handleConfirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(calendarOpenFor)} onOpenChange={(open) => !open && setCalendarOpenFor(null)}>
        <DialogContent className="mx-auto w-[calc(100vw-2rem)] max-w-sm p-4">
          <DialogHeader>
            <DialogTitle>Select date</DialogTitle>
            <DialogDescription>Choose a date for this session.</DialogDescription>
          </DialogHeader>
          {calendarOpenFor ? (
            <>
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
              <div className="mt-2 flex justify-end">
                <Button variant="outline" onClick={() => setCalendarOpenFor(null)}>
                  Back
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
