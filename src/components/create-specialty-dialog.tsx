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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"

const defaultFormState = { name: "", description: "", status: "Active" }

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
        <DialogContent className="w-[calc(100vw-1rem)] max-h-[calc(100dvh-1rem)] overflow-y-auto sm:w-[90vw] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Specialty</DialogTitle>
            <DialogDescription>
              Create a new medical specialty for doctors.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <FieldGroup className="grid-cols-1 gap-4">
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
              <Field>
                <FieldLabel htmlFor="status">Status</FieldLabel>
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={(event) => handleChange("status", event.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </Field>
            </FieldGroup>

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
