"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export type WalkInRecordEditorData = {
  id: string
  patientName: string
  address: string
  email: string
  contactNumber: string
  birthday: string
  civilStatus: string
  age: string
  gender: string
  appointmentDate: string
  appointmentTime: string
  appointmentType: string
  reasonForVisit: string
  symptoms: string
  durationOfSymptoms: string
  painLevel: string
  additionalNotes: string
  bloodPressure: string
  temperature: string
  oxygenSaturation: string
  pulseRate: string
  weight: string
  height: string
  bmi: string
}

type WalkInRecordForm = Omit<WalkInRecordEditorData, "id">

const textFields: { name: keyof WalkInRecordForm; label: string; type?: string }[] = [
  { name: "patientName", label: "Patient name" },
  { name: "email", label: "Email", type: "email" },
  { name: "contactNumber", label: "Contact number", type: "tel" },
  { name: "birthday", label: "Birthday", type: "date" },
  { name: "age", label: "Age", type: "number" },
  { name: "gender", label: "Gender" },
  { name: "civilStatus", label: "Civil status" },
  { name: "address", label: "Address" },
  { name: "appointmentType", label: "Appointment type" },
  { name: "appointmentDate", label: "Appointment date", type: "date" },
  { name: "appointmentTime", label: "Appointment time", type: "time" },
  { name: "durationOfSymptoms", label: "Duration of symptoms" },
  { name: "painLevel", label: "Pain level", type: "number" },
  { name: "bloodPressure", label: "Blood pressure" },
  { name: "temperature", label: "Temperature (°C)", type: "number" },
  { name: "oxygenSaturation", label: "Oxygen saturation (%)", type: "number" },
  { name: "pulseRate", label: "Pulse rate (bpm)", type: "number" },
  { name: "weight", label: "Weight (kg)", type: "number" },
  { name: "height", label: "Height (cm)", type: "number" },
  { name: "bmi", label: "BMI", type: "number" },
]

function getForm(record: WalkInRecordEditorData): WalkInRecordForm {
  const { id: _id, ...form } = record
  return form
}

export function WalkInRecordDialogs({
  record,
  editOpen,
  onEditOpenChange,
  deleteOpen,
  onDeleteOpenChange,
}: {
  record: WalkInRecordEditorData
  editOpen: boolean
  onEditOpenChange: (open: boolean) => void
  deleteOpen: boolean
  onDeleteOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [form, setForm] = useState<WalkInRecordForm>(() => getForm(record))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (editOpen) setForm(getForm(record))
  }, [editOpen, record])

  const updateField = (name: keyof WalkInRecordForm, value: string) => {
    setForm((current) => ({ ...current, [name]: value }))
  }

  const save = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/walk-ins/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to update walk-in record.")
      }

      toast.success("Walk-in record updated.")
      onEditOpenChange(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update walk-in record.")
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/walk-ins/${record.id}`, { method: "DELETE" })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to delete walk-in record.")
      }

      toast.success("Walk-in record deleted.")
      onDeleteOpenChange(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete walk-in record.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Dialog open={editOpen} onOpenChange={onEditOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit walk-in record</DialogTitle>
            <DialogDescription>Update the patient, visit, and vital-sign details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            {textFields.map(({ name, label, type }) => (
              <div key={name} className="space-y-2">
                <Label htmlFor={`walk-in-${name}`}>{label}</Label>
                <Input
                  id={`walk-in-${name}`}
                  type={type ?? "text"}
                  min={type === "number" ? 0 : undefined}
                  step={name === "temperature" || name === "weight" || name === "height" || name === "bmi" ? "any" : undefined}
                  value={form[name]}
                  required={name === "patientName"}
                  onChange={(event) => updateField(name, event.target.value)}
                />
              </div>
            ))}
            {([
              ["reasonForVisit", "Reason for visit"],
              ["symptoms", "Symptoms"],
              ["additionalNotes", "Additional notes"],
            ] as const).map(([name, label]) => (
              <div key={name} className="space-y-2 sm:col-span-2">
                <Label htmlFor={`walk-in-${name}`}>{label}</Label>
                <Textarea
                  id={`walk-in-${name}`}
                  value={form[name]}
                  onChange={(event) => updateField(name, event.target.value)}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onEditOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={onDeleteOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete walk-in record?</DialogTitle>
            <DialogDescription>
              This permanently deletes {record.patientName}&apos;s walk-in appointment and its related clinical notes and vital signs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onDeleteOpenChange(false)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={remove} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
