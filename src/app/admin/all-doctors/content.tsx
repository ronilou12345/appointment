"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DataTable } from "@/components/data-table"
import { columns, DoctorRow } from "./columns"
import { CreateDoctorDialog } from "@/components/create-doctor-dialog"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const statusOptions = ["Active", "Inactive", "Suspended"]

type EditDoctorForm = {
  name: string
  boardCertification: string
  status: string
}

function EditDoctorSheet({
  open,
  onOpenChange,
  doctor,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  doctor: DoctorRow | null
}) {
  const router = useRouter()
  const [form, setForm] = useState<EditDoctorForm>({
    name: doctor?.name ?? "",
    boardCertification: doctor?.boardCertification ?? "",
    status: doctor?.status ?? "Active",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!doctor) return

    setForm({
      name: doctor.name,
      boardCertification: doctor.boardCertification ?? "",
      status: doctor.status ?? "Active",
    })
    setError("")
  }, [doctor])

  useEffect(() => {
    if (!open) {
      setError("")
    }
  }, [open])

  const handleChange = (field: keyof EditDoctorForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!doctor) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: doctor.id,
          name: form.name,
          status: form.status,
          boardCertifications: form.boardCertification,
        }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Unable to save doctor details.")
      }

      toast.success("Doctor updated successfully")
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save doctor details."
      setError(message)
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
            <SheetTitle>Edit doctor</SheetTitle>
            <SheetDescription>Update this doctor’s profile details.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="doctor-name">Name</Label>
                <Input
                  id="doctor-name"
                  value={form.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="doctor-specialties">Specialties</Label>
                <Input
                  id="doctor-specialties"
                  value={doctor?.specialties ?? ""}
                  disabled
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="doctor-board">Board certificate</Label>
                <Input
                  id="doctor-board"
                  value={form.boardCertification}
                  onChange={(event) => handleChange("boardCertification", event.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="doctor-status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => handleChange("status", value)}
                >
                  <SelectTrigger id="doctor-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {statusOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <SheetFooter className="border-t px-6 py-4">
            <div className="flex w-full justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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

export function AllDoctorsContent({ rows }: { rows: DoctorRow[] }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorRow | null>(null)

  useEffect(() => {
    const openEditDoctor = (event: Event) => {
      const customEvent = event as CustomEvent<DoctorRow>
      setSelectedDoctor(customEvent.detail ?? null)
      setEditOpen(true)
    }

    window.addEventListener("open-edit-doctor", openEditDoctor as EventListener)
    return () => {
      window.removeEventListener("open-edit-doctor", openEditDoctor as EventListener)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">All Doctors</h1>
            <p className="mt-2 text-muted-foreground">
              View and manage all doctors in the system. You can check availability, specialty, and profile details here.
            </p>
          </div>
          <div className="flex-shrink-0">
            <CreateDoctorDialog open={dialogOpen} onOpenChange={setDialogOpen} />
          </div>
        </div>
        <DataTable columns={columns} data={rows} />
      </div>
      <EditDoctorSheet open={editOpen} onOpenChange={setEditOpen} doctor={selectedDoctor} />
    </div>
  )
}
