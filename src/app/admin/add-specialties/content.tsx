"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/data-table"
import { columns, SpecialtyRow } from "./columns"
import { CreateSpecialtyDialog } from "@/components/create-specialty-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

const statusOptions = ["Active", "Inactive"]

function EditSpecialtySheet({
  open,
  onOpenChange,
  specialty,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  specialty: SpecialtyRow | null
  onSuccess: (message: string) => void
}) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState("")
  const [form, setForm] = React.useState({
    id: "",
    name: "",
    description: "",
    availableDoctors: "0",
    status: "Active",
  })

  React.useEffect(() => {
    if (!specialty) return
    setForm({
      id: specialty.id,
      name: specialty.name,
      description: specialty.description,
      availableDoctors: String(specialty.availableDoctors ?? 0),
      status: specialty.status || "Active",
    })
    setErrorMsg("")
  }, [specialty])

  const handleChange = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.id) return

    setLoading(true)
    setErrorMsg("")

    try {
      const response = await fetch("/api/specialties", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Number(form.id),
          name: form.name,
          description: form.description,
          availableDoctors: Number(form.availableDoctors) || 0,
          status: form.status,
        }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Unable to update specialty")
      }

      toast.success("Specialty updated")
      onSuccess("Specialty updated successfully.")
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setErrorMsg(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-xl sm:max-w-xl">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>Edit Specialty</SheetTitle>
            <SheetDescription>Update specialty details and available doctor count.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            {errorMsg ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive-foreground">
                {errorMsg}
              </div>
            ) : null}

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-specialty-name">Specialty Name</Label>
                <Input
                  id="edit-specialty-name"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-available-doctors">Available Doctors</Label>
                <Input
                  id="edit-available-doctors"
                  type="number"
                  min="0"
                  value={form.availableDoctors}
                  onChange={(e) => handleChange("availableDoctors", e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-specialty-status">Status</Label>
                <Select value={form.status} onValueChange={(value) => handleChange("status", value)}>
                  <SelectTrigger id="edit-specialty-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
            </div>
          </div>

          <SheetFooter className="border-t px-6 py-4">
            <div className="flex w-full justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function DeleteSpecialtyDialog({
  open,
  onOpenChange,
  specialty,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  specialty: SpecialtyRow | null
  onSuccess: (message: string) => void
}) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState("")

  const handleDelete = async () => {
    if (!specialty) return
    setLoading(true)
    setErrorMsg("")

    try {
      const response = await fetch(`/api/specialties`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Number(specialty.id) }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Unable to delete specialty")
      }

      toast.success("Specialty deleted")
      onSuccess("Specialty deleted successfully.")
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setErrorMsg(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-auto max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Delete specialty</DialogTitle>
          <DialogDescription className="text-lg">Are you sure you want to delete this specialty?</DialogDescription>
        </DialogHeader>

        {errorMsg ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive-foreground">
            {errorMsg}
          </div>
        ) : null}

        <DialogFooter>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AddSpecialtiesContent({ rows }: { rows: SpecialtyRow[] }) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [selectedSpecialty, setSelectedSpecialty] = React.useState<SpecialtyRow | null>(null)
  const [successMessage, setSuccessMessage] = React.useState("")

  React.useEffect(() => {
    const openEditSpecialty = (event: Event) => {
      const customEvent = event as CustomEvent<SpecialtyRow>
      setSelectedSpecialty(customEvent.detail)
      setEditOpen(true)
    }

    const openDeleteSpecialty = (event: Event) => {
      const customEvent = event as CustomEvent<SpecialtyRow>
      setSelectedSpecialty(customEvent.detail)
      setDeleteOpen(true)
    }

    window.addEventListener("open-edit-specialty", openEditSpecialty as EventListener)
    window.addEventListener("open-delete-specialty", openDeleteSpecialty as EventListener)
    return () => {
      window.removeEventListener("open-edit-specialty", openEditSpecialty as EventListener)
      window.removeEventListener("open-delete-specialty", openDeleteSpecialty as EventListener)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Specialties</h1>
            <p className="mt-2 text-muted-foreground">
              Manage doctor specialties and categories for the admin portal.
            </p>
            {successMessage ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                {successMessage}
              </div>
            ) : null}
          </div>
          <div className="flex-shrink-0">
            <CreateSpecialtyDialog open={dialogOpen} onOpenChange={setDialogOpen} />
          </div>
        </div>
        <DataTable columns={columns} data={rows} />
      </div>

      <EditSpecialtySheet
        open={editOpen}
        onOpenChange={(open) => setEditOpen(open)}
        specialty={selectedSpecialty}
        onSuccess={(message) => setSuccessMessage(message)}
      />

      <DeleteSpecialtyDialog
        open={deleteOpen}
        onOpenChange={(open) => setDeleteOpen(open)}
        specialty={selectedSpecialty}
        onSuccess={(message) => setSuccessMessage(message)}
      />
    </div>
  )
}
