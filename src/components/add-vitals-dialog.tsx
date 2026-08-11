"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"

export function AddVitalsDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; onSaved?: () => void }) {
  const [loading, setLoading] = React.useState(false)
  const [weight, setWeight] = React.useState<string>("70")
  const [height, setHeight] = React.useState<string>("170")
  const [heartRate, setHeartRate] = React.useState<string>("")
  const [bodyTemp, setBodyTemp] = React.useState<string>("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        weight: weight ? Number(weight) : null,
        height: height ? Number(height) : null,
        heart_rate: heartRate ? Number(heartRate) : null,
        body_temperature: bodyTemp ? Number(bodyTemp) : null,
      }

      const res = await fetch('/api/vital-signs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error || 'Unable to add vitals')

      toast.success('Vitals saved')
      onOpenChange(false)
      if (onSaved) onSaved()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => onOpenChange(true)} className="shadow-md shadow-primary/20">
        <PlusIcon className="size-4 mr-2" />
        Add
      </Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Vital Signs</DialogTitle>
            <DialogDescription>Record weight, height and vital signs.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Weight (kg)</Label>
                <Input value={weight} onChange={(e) => setWeight(e.target.value)} type="number" step="0.1" />
              </div>
              <div>
                <Label>Height (cm)</Label>
                <Input value={height} onChange={(e) => setHeight(e.target.value)} type="number" step="0.1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Heart Rate (bpm)</Label>
                <Input value={heartRate} onChange={(e) => setHeartRate(e.target.value)} type="number" />
              </div>
              <div>
                <Label>Body Temperature (°C)</Label>
                <Input value={bodyTemp} onChange={(e) => setBodyTemp(e.target.value)} type="number" step="0.1" />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
              <Button type="submit" className="bg-primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
