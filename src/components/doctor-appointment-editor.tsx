"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type DoctorAppointmentEditorProps = {
  notes: string
  prescription: string[]
  followUp: string
}

export default function DoctorAppointmentEditor({ notes, prescription, followUp }: DoctorAppointmentEditorProps) {
  const [doctorNotes, setDoctorNotes] = useState(notes)
  const [nextFollowUp, setNextFollowUp] = useState(followUp)
  const [prescriptionItems, setPrescriptionItems] = useState<string[]>(prescription)
  const [newMedicine, setNewMedicine] = useState("")

  const canAddMedicine = newMedicine.trim().length > 0
  const summary = useMemo(() => `${prescriptionItems.length} items`, [prescriptionItems])

  return (
    <div className="rounded-[32px] border border-border bg-card p-8 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Update the patient record with observations, prescriptions, and next follow-up details.</p>
        </div>
        <div className="rounded-full bg-background px-4 py-2 text-sm font-medium text-muted-foreground">
          {summary}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Doctor notes</label>
            <Textarea
              value={doctorNotes}
              onChange={(event) => setDoctorNotes(event.target.value)}
              className="mt-2 h-48"
              placeholder="Write your observations and treatment plan here..."
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Next follow-up</label>
            <Textarea
              value={nextFollowUp}
              onChange={(event) => setNextFollowUp(event.target.value)}
              className="mt-2 h-32"
              placeholder="Enter follow-up instructions and recommended schedule."
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-border bg-background p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Prescriptions</p>
                <p className="mt-1 text-base font-semibold">Current medication plan</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {prescriptionItems.map((item) => (
                <div key={item} className="rounded-2xl border border-border bg-card px-4 py-3">
                  <p className="text-sm font-medium">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <Input
                value={newMedicine}
                onChange={(event) => setNewMedicine(event.target.value)}
                placeholder="Add new medicine"
              />
              <Button
                disabled={!canAddMedicine}
                onClick={() => {
                  if (!newMedicine.trim()) return
                  setPrescriptionItems((previous) => [...previous, newMedicine.trim()])
                  setNewMedicine("")
                }}
                className="w-full"
              >
                Add medicine
              </Button>
            </div>
          </div>

          <div className="rounded-[24px] border border-border bg-background p-4">
            <p className="text-sm font-medium text-muted-foreground">Notes preview</p>
            <div className="mt-3 rounded-2xl border border-border bg-card p-4 text-sm leading-7 text-foreground">
              {doctorNotes || "No notes added yet."}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" className="w-full sm:w-auto" onClick={() => {
          setDoctorNotes(notes)
          setNextFollowUp(followUp)
          setPrescriptionItems(prescription)
          setNewMedicine("")
        }}>
          Reset
        </Button>
        <Button className="w-full sm:w-auto" onClick={() => alert("Appointment details saved.")}>Save changes</Button>
      </div>
    </div>
  )
}
