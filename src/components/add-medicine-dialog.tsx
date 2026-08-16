"use client"

import { Button } from "@/components/ui/button"
import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PlusIcon, CameraIcon } from "lucide-react"

const MAX_IMAGE_BYTES = 2 * 1024 * 1024

function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."))
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error("Image must be under 2MB."))
      return
    }

    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(new Error("Unable to read the selected image."))
    reader.readAsDataURL(file)
  })
}

export function AddMedicineDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [medicineImage, setMedicineImage] = React.useState("")
  const [form, setForm] = React.useState({
    medicineName: "",
    category: "",
    quantity: "0",
    reorderLevel: "0",
    expiryDate: "",
    price: "0.00",
    supplier: "",
    status: "In Stock",
  })

  const handleChange = (key: string, value: string) => setForm((s) => ({ ...s, [key]: value }))

  function getInitials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "M"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        medicineName: form.medicineName,
        category: form.category,
        quantity: Number.parseInt(form.quantity || "0", 10) || 0,
        reorderLevel: Number.parseInt(form.reorderLevel || "0", 10) || 0,
        expiryDate: form.expiryDate,
        price: Number(form.price) || 0,
        supplier: form.supplier,
        status: form.status,
        medicineImage: medicineImage.startsWith("data:image/") ? medicineImage : "",
      }

      const res = await fetch('/api/medicine-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error || 'Unable to add medicine')

      toast.success('Successfully added')
      onOpenChange(false)
      setMedicineImage("")
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
        New
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Medicine</DialogTitle>
            <DialogDescription>
              Add a new medicine to the inventory system.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Medicine Image Upload */}
            <div className="flex flex-col items-center justify-center gap-4 text-center sm:flex-row sm:justify-center sm:text-left">
              <label htmlFor="medicineImage" className="relative flex cursor-pointer items-center justify-center">
                <Avatar size="lg" className="mx-auto">
                  {medicineImage ? <AvatarImage src={medicineImage} alt={form.medicineName || "Medicine"} /> : null}
                  <AvatarFallback>{getInitials(form.medicineName || "Medicine")}</AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm">
                  <CameraIcon className="size-3.5" />
                </span>
              </label>
              <div className="grid gap-1 place-items-center text-center sm:place-items-start sm:text-left">
                <Label htmlFor="medicineImage" className="text-center sm:text-left">Medicine Image</Label>
                <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, or GIF up to 2MB.</p>
                <Input
                  id="medicineImage"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="h-9 max-w-xs cursor-pointer text-sm"
                  onChange={async (event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    try {
                      const dataUrl = await readImageFile(file)
                      setMedicineImage(dataUrl)
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Unable to use this image.")
                    }
                  }}
                />
              </div>
            </div>

            {/* Medicine Name and Category */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="medicineName">Medicine Name</Label>
                <Input
                  id="medicineName"
                  name="medicineName"
                  placeholder="e.g., Amoxicillin 500mg"
                  required
                  value={form.medicineName}
                  onChange={(e) => handleChange('medicineName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  name="category"
                  placeholder="e.g., Antibiotics"
                  required
                  value={form.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                />
              </div>
            </div>

            {/* Quantity and Reorder Level */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  placeholder="Number of units"
                  min="0"
                  required
                  value={form.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorderLevel">Reorder Level</Label>
                <Input
                  id="reorderLevel"
                  name="reorderLevel"
                  type="number"
                  placeholder="Minimum stock level"
                  min="0"
                  required
                  value={form.reorderLevel}
                  onChange={(e) => handleChange('reorderLevel', e.target.value)}
                />
              </div>
            </div>

            {/* Expiry Date and Unit Price */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  name="expiryDate"
                  type="date"
                  required
                  value={form.expiryDate}
                  onChange={(e) => handleChange('expiryDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Unit Price (₱)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  value={form.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                />
              </div>
            </div>

            {/* Supplier and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  name="supplier"
                  placeholder="e.g., PharmaCare Inc."
                  required
                  value={form.supplier}
                  onChange={(e) => handleChange('supplier', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" value={form.status} onValueChange={(v) => handleChange('status', v)}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In Stock">In Stock</SelectItem>
                    <SelectItem value="Low Stock">Low Stock</SelectItem>
                    <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600" type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Medicine'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
