"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { columns, type SessionRow } from "./columns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

type SessionDraft = Omit<SessionRow, "id"> & { tempId: string }

export default function AddSessionPage() {
  const [data, setData] = useState<SessionRow[]>([
    {
      id: "s1",
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "12:00",
      duration: "30m",
      slots: 6,
      status: "Active",
    },
    {
      id: "s2",
      date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      startTime: "13:00",
      endTime: "16:00",
      duration: "30m",
      slots: 6,
      status: "Active",
    },
  ])

  const [open, setOpen] = useState(false)
  const [drafts, setDrafts] = useState<SessionDraft[]>([
    {
      tempId: "t1",
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "12:00",
      duration: "30m",
      slots: 4,
      status: "Active",
    },
  ])

  const addDraft = () => {
    const id = `t${drafts.length + 1}`
    setDrafts((d) => [
      {
        tempId: id,
        date: new Date().toISOString().split("T")[0],
        startTime: "09:00",
        endTime: "12:00",
        duration: "30m",
        slots: 4,
        status: "Active",
      },
      ...d,
    ])
  }

  const removeDraft = (tempId: string) => {
    setDrafts((d) => d.filter((x) => x.tempId !== tempId))
  }

  const updateDraft = (tempId: string, field: keyof SessionDraft, value: any) => {
    setDrafts((d) => d.map((x) => (x.tempId === tempId ? { ...x, [field]: value } : x)))
  }

  const confirmAdd = () => {
    const nextRows: SessionRow[] = drafts.map((d, idx) => ({
      id: `s${data.length + idx + 1}`,
      date: d.date,
      startTime: d.startTime,
      endTime: d.endTime,
      duration: d.duration,
      slots: Number(d.slots),
      status: d.status,
    }))
    setData((prev) => [...nextRows, ...prev])
    setOpen(false)
    // reset drafts
    setDrafts([
      {
        tempId: "t1",
        date: new Date().toISOString().split("T")[0],
        startTime: "09:00",
        endTime: "12:00",
        duration: "30m",
        slots: 4,
        status: "Active",
      },
    ])
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
          <DataTable columns={columns} data={data} />
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Multiple Sessions</DialogTitle>
            <DialogDescription>Add one or more sessions below. Use "Add another" to create multiple entries.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-auto py-2">
            {drafts.map((d) => (
              <div key={d.tempId} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end p-3 rounded-lg border border-border">
                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground">Date</label>
                  <input type="date" value={d.date} onChange={(e) => updateDraft(d.tempId, "date", e.target.value)} className="mt-1 w-full rounded-lg border px-2 py-1" />
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
                  <label className="text-sm text-muted-foreground">Duration</label>
                  <select value={d.duration} onChange={(e) => updateDraft(d.tempId, "duration", e.target.value)} className="mt-1 w-full rounded-lg border px-2 py-1">
                    <option>15m</option>
                    <option>20m</option>
                    <option>30m</option>
                    <option>45m</option>
                    <option>60m</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Slots</label>
                  <input type="number" min={1} value={d.slots} onChange={(e) => updateDraft(d.tempId, "slots", Number(e.target.value))} className="mt-1 w-full rounded-lg border px-2 py-1" />
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
    </div>
  )
}
