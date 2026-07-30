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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PlusIcon } from "lucide-react"

export function CreateSpecialtyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <>
      <Button size="sm" className="shadow-md shadow-primary/20" onClick={() => onOpenChange(true)}>
        <PlusIcon className="size-4 mr-2" />
        New
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Specialty</DialogTitle>
            <DialogDescription>
              Create a new medical specialty for doctors.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-6">
            {/* Specialty Name and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="specialtyName">Specialty Name</Label>
                <Input
                  id="specialtyName"
                  name="specialtyName"
                  placeholder="e.g., Cardiology"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue="active">
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category and Available Doctors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category">
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="surgical">Surgical</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="diagnostic">Diagnostic</SelectItem>
                    <SelectItem value="therapeutic">Therapeutic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="availableDoctors">Available Doctors</Label>
                <Input
                  id="availableDoctors"
                  name="availableDoctors"
                  type="number"
                  placeholder="Number of doctors"
                  min="0"
                />
              </div>
            </div>

            {/* Required Certifications */}
            <div className="space-y-2">
              <Label htmlFor="certifications">Required Certifications</Label>
              <Input
                id="certifications"
                name="certifications"
                placeholder="e.g., Board Certified"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the specialty and its focus areas..."
                className="min-h-24"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600">
                Add Specialty
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
