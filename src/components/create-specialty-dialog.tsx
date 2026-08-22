"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"

const defaultFormState = { name: "", description: "", status: "Active", availableDoctors: "0" }

export function CreateSpecialtyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [form, setForm] = React.useState(defaultFormState)

  const resetForm = () => setForm(defaultFormState)

  React.useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const handleChange = (key: string, value: string) => setForm((s) => ({ ...s, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        name: form.name,
        description: form.description,
        status: form.status,
        availableDoctors: Number(form.availableDoctors) || 0,
      }

      const res = await fetch('/api/specialties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error || 'Unable to add specialty')
      toast.success('Successfully added')
      onOpenChange(false)
      resetForm()
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button size="sm" className="shadow-md shadow-primary/20" onClick={() => onOpenChange(true)}>
        <PlusIcon className="size-4 mr-2" />
        Add Specialties
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl w-[calc(100vw-1rem)] max-h-[calc(100dvh-1rem)] overflow-y-auto sm:w-[90vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Specialty</DialogTitle>
            <DialogDescription>
              Create a new medical specialty for doctors.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <FieldGroup className="grid-cols-1 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="specialtyName">Specialty Name</FieldLabel>
                <Input
                  id="specialtyName"
                  name="specialtyName"
                  placeholder="e.g., Cardiology"
                  required
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="status">Status</FieldLabel>
                <Select name="status" value={form.status} onValueChange={(v) => handleChange('status', v)}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            <Field>
              <FieldLabel htmlFor="availableDoctors">Available Doctors</FieldLabel>
              <Input
                id="availableDoctors"
                name="availableDoctors"
                type="number"
                placeholder="Number of doctors"
                min="0"
                value={form.availableDoctors}
                onChange={(e) => handleChange('availableDoctors', e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <FieldDescription>
                Provide a short summary of the specialty and its scope.
              </FieldDescription>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the specialty and its focus areas..."
                className="min-h-24"
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </Field>

            <Field className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600" type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add'}
              </Button>
            </Field>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
