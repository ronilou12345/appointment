"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"
import type { VitalRow } from "@/app/client/add-bmi/columns"

const emptyForm = {
  weight: "",
  height: "",
  heartRate: "",
  bodyTemp: "",
  bloodSugar: "",
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function computeBmi(weight: string, height: string) {
  const weightKg = parseOptionalNumber(weight)
  const heightCm = parseOptionalNumber(height)
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return null
  const heightM = heightCm / 100
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10
}

export function AddVitalsDialog({
  open,
  onOpenChange,
  onSaved,
  vital,
  showTrigger = true,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
  vital?: VitalRow | null
  showTrigger?: boolean
}) {
  const [loading, setLoading] = React.useState(false)
  const [form, setForm] = React.useState(emptyForm)
  const isEditing = Boolean(vital?.id)

  React.useEffect(() => {
    if (!open) {
      setForm(emptyForm)
      setLoading(false)
      return
    }

    if (vital) {
      setForm({
        weight: vital.weight != null ? String(vital.weight) : "",
        height: vital.height != null ? String(vital.height) : "",
        heartRate: vital.heartRate != null ? String(vital.heartRate) : "",
        bodyTemp: vital.temp != null ? String(vital.temp) : "",
        bloodSugar: vital.bloodSugar != null ? String(vital.bloodSugar) : "",
      })
      return
    }

    setForm(emptyForm)
  }, [open, vital])

  const bmi = computeBmi(form.weight, form.height)

  const handleChange = (key: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const weight = parseOptionalNumber(form.weight)
    const height = parseOptionalNumber(form.height)
    const heartRate = parseOptionalNumber(form.heartRate)
    const bodyTemperature = parseOptionalNumber(form.bodyTemp)
    const bloodSugar = parseOptionalNumber(form.bloodSugar)

    if (!weight || weight <= 0) {
      toast.error("Please enter a valid weight.")
      return
    }

    if (!height || height <= 0) {
      toast.error("Please enter a valid height.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/vital-signs", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: vital?.id,
          weight,
          height,
          heart_rate: heartRate,
          body_temperature: bodyTemperature,
          blood_sugar: bloodSugar,
        }),
      })

      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error || (isEditing ? "Unable to update vitals" : "Unable to add vitals"))

      toast.success(isEditing ? "Vitals updated" : "Vitals saved")
      onOpenChange(false)
      onSaved?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {showTrigger ? (
        <Button
          size="sm"
          onClick={() => {
            onOpenChange(true)
          }}
          className="shadow-md shadow-primary/20"
        >
          <PlusIcon className="size-4 mr-2" />
          Add
        </Button>
      ) : null}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Vital Signs" : "Add Vital Signs"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update this vitals record."
                : "Record weight, height, heart rate, temperature, and blood sugar."}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <FieldGroup className="grid-cols-1 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="vital-weight">Weight (kg)</FieldLabel>
                <Input
                  id="vital-weight"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  step="0.1"
                  placeholder="e.g., 65.5"
                  required
                  value={form.weight}
                  onChange={(event) => handleChange("weight", event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="vital-height">Height (cm)</FieldLabel>
                <Input
                  id="vital-height"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  step="0.1"
                  placeholder="e.g., 170"
                  required
                  value={form.height}
                  onChange={(event) => handleChange("height", event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="vital-heart-rate">Heart Rate (bpm)</FieldLabel>
                <Input
                  id="vital-heart-rate"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  placeholder="Optional"
                  value={form.heartRate}
                  onChange={(event) => handleChange("heartRate", event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="vital-temp">Body Temperature (°C)</FieldLabel>
                <Input
                  id="vital-temp"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  step="0.1"
                  placeholder="Optional"
                  value={form.bodyTemp}
                  onChange={(event) => handleChange("bodyTemp", event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="vital-blood-sugar">Blood Sugar (mg/dL)</FieldLabel>
                <Input
                  id="vital-blood-sugar"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  step="0.1"
                  placeholder="Optional"
                  value={form.bloodSugar}
                  onChange={(event) => handleChange("bloodSugar", event.target.value)}
                />
              </Field>
            </FieldGroup>

            <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">BMI</p>
              <p className="mt-1 text-lg font-semibold">{bmi ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Calculated from weight and height.</p>
            </div>

            <DialogFooter className="mt-0">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (isEditing ? "Updating..." : "Saving...") : isEditing ? "Save changes" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
