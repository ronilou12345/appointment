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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusIcon } from "lucide-react"
import { type MedicineRow } from "@/app/admin/inventory/columns"

const emptyForm = {
  medicineName: "",
  category: "",
  quantity: "",
  pieces: "",
  expiryDate: "",
  retailPrice: "0.00",
  price: "0.00",
}

export function AddMedicineDialog({
  open,
  onOpenChange,
  medicine,
  showTrigger = true,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  medicine?: MedicineRow | null
  showTrigger?: boolean
}) {
  const router = useRouter()
  const isEditing = Boolean(medicine?.id)
  const fieldId = (name: string) => (isEditing ? `edit-${name}` : name)
  const [loading, setLoading] = React.useState(false)
  const [form, setForm] = React.useState(emptyForm)

  React.useEffect(() => {
    if (!open) return
    if (medicine) {
      setForm({
        medicineName: medicine.name,
        category: medicine.category,
        quantity: String(medicine.quantity ?? ""),
        pieces: "",
        expiryDate: medicine.expiryDate && medicine.expiryDate !== "N/A" ? medicine.expiryDate : "",
        retailPrice: Number(medicine.price ?? 0).toFixed(2),
        price: "0.00",
      })
      return
    }

    setForm(emptyForm)
  }, [open, medicine])

  const handleChange = (key: string, value: string) => setForm((s) => ({ ...s, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        id: medicine?.id,
        medicineName: form.medicineName,
        category: form.category,
        quantity: String(form.quantity ?? "").trim(),
        pieces: Number.parseInt(form.pieces || "0", 10) || 0,
        expiryDate: form.expiryDate,
        retailPrice: Number(form.retailPrice) || 0,
        price: Number(form.price) || 0,
        medicineImage: medicine?.image ?? "",
      }

      const res = await fetch('/api/medicine-inventory', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()
      if (!res.ok || !result.success) {
        throw new Error(result.error || (isEditing ? 'Unable to update medicine' : 'Unable to add medicine'))
      }

      toast.success(isEditing ? 'Medicine updated' : 'Successfully added')
      onOpenChange(false)
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
      {showTrigger ? (
        <Button size="sm" className="shadow-md shadow-primary/20" onClick={() => onOpenChange(true)}>
          <PlusIcon className="size-4 mr-2" />
          New
        </Button>
      ) : null}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Medicine" : "Add Medicine"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update medicine details and stock information."
                : "Add a new medicine to the inventory system."}
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={fieldId("medicineName")}>Medicine Name</Label>
                <Input
                  id={fieldId("medicineName")}
                  name="medicineName"
                  placeholder="e.g., Amoxicillin 500mg"
                  required
                  value={form.medicineName}
                  onChange={(e) => handleChange('medicineName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={fieldId("category")}>Category <span className="text-muted-foreground">(Optional)</span></Label>
                <Input
                  id={fieldId("category")}
                  name="category"
                  placeholder="e.g., Antibiotics"
                  value={form.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={fieldId("quantity")}>Quantity</Label>
                <Input
                  id={fieldId("quantity")}
                  name="quantity"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter quantity"
                  required
                  value={form.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={fieldId("pieces")}>Pieces</Label>
                <Input
                  id={fieldId("pieces")}
                  name="pieces"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={form.pieces}
                  onChange={(e) => handleChange('pieces', e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={fieldId("expiryDate")}>Expiry Date</Label>
                <Input
                  id={fieldId("expiryDate")}
                  name="expiryDate"
                  type="date"
                  required
                  value={form.expiryDate}
                  onChange={(e) => handleChange('expiryDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={fieldId("retailPrice")}>Retail Price (₱)</Label>
                <Input
                  id={fieldId("retailPrice")}
                  name="retailPrice"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  value={form.retailPrice}
                  onChange={(e) => handleChange('retailPrice', e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={fieldId("price")}>Price (₱)</Label>
                <Input
                  id={fieldId("price")}
                  name="price"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600" type="submit" disabled={loading}>
                {loading ? (isEditing ? 'Saving...' : 'Adding...') : isEditing ? 'Save changes' : 'Add Medicine'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
