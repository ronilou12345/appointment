"use client"

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

export function CreateSpecialtyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <>
      <Button size="sm" className="shadow-md shadow-primary/20" onClick={() => onOpenChange(true)}>
        <PlusIcon className="size-4 mr-2" />
        New
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl w-[calc(100vw-1rem)] max-h-[calc(100dvh-1rem)] overflow-y-auto sm:w-[90vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Specialty</DialogTitle>
            <DialogDescription>
              Create a new medical specialty for doctors.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-6">
            <FieldGroup className="grid-cols-1 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="specialtyName">Specialty Name</FieldLabel>
                <Input
                  id="specialtyName"
                  name="specialtyName"
                  placeholder="e.g., Cardiology"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="status">Status</FieldLabel>
                <Select name="status" defaultValue="active">
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
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
              />
            </Field>

            <Field className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600">
                Add
              </Button>
            </Field>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
