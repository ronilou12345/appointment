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
  productName: "",
  medicineName: "",
  category: "",
  productUnitType: "pieces",
  quantity: "",
  pieces: "",
  milligram: "",
  productExpiryDate: "",
  expiryDate: "",
  retailPrice: "",
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
  const isProductEditing = medicine?.recordType === "product"
  const fieldId = (name: string) => (isEditing ? `edit-${name}` : name)
  const [loading, setLoading] = React.useState(false)
  const [form, setForm] = React.useState(emptyForm)
  const [activeFormTab, setActiveFormTab] = React.useState<"product" | "medicine">("product")

  React.useEffect(() => {
    if (!open) return
    if (medicine) {
      setActiveFormTab(isProductEditing ? "product" : "medicine")
      setForm({
        productName: isProductEditing ? medicine.name : "",
        medicineName: isProductEditing ? "" : medicine.name,
        category: String(medicine.category ?? ""),
        productUnitType: isProductEditing ? medicine.quantity || "pieces" : "pieces",
        quantity: isProductEditing ? "" : String(medicine.quantity ?? ""),
        pieces: String(medicine.pieces ?? 0),
        milligram: medicine.milligram != null ? String(medicine.milligram) : "",
        productExpiryDate: isProductEditing && medicine.expiryDate !== "N/A" ? medicine.expiryDate : "",
        expiryDate: !isProductEditing && medicine.expiryDate !== "N/A" ? medicine.expiryDate : "",
        retailPrice: Number(medicine.retailPrice ?? 0).toFixed(2),
      })
      return
    }

    setActiveFormTab("product")
    setForm(emptyForm)
  }, [open, medicine, isProductEditing])

  const handleChange = (key: string, value: string) => setForm((s) => ({ ...s, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const isProduct = activeFormTab === "product"

    if (isProduct && !form.productName.trim()) {
      setActiveFormTab("product")
      toast.error("Enter a product name before saving.")
      return
    }
    if (!isProduct && !form.medicineName.trim()) {
      setActiveFormTab("medicine")
      toast.error("Enter a medicine name before saving.")
      return
    }
    if (!isProduct && !form.expiryDate) {
      setActiveFormTab("medicine")
      toast.error("Enter a medicine expiry date before saving.")
      return
    }

    setLoading(true)
    try {
      const payload = {
        id: medicine?.id,
        recordType: isProduct ? "product" : "medicine",
        productName: form.productName.trim(),
        medicineName: form.medicineName,
        category: form.category,
        quantity: isProduct ? form.productUnitType : String(form.quantity ?? "").trim(),
        pieces: Number.parseInt(form.pieces || "0", 10) || 0,
        milligram: form.milligram.trim() || null,
        productExpirationDate: form.productExpiryDate || null,
        expiryDate: form.expiryDate,
        retailPrice: Number(form.retailPrice) || 0,
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

      toast.success(isEditing ? (isProduct ? 'Product updated' : 'Medicine updated') : isProduct ? 'Product added' : 'Medicine added')
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
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
          <DialogHeader className="border-b border-border px-6 py-5">
            <DialogTitle>{isEditing ? (isProductEditing ? "Edit Product" : "Edit Medicine") : "Add Product & Medicine"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? isProductEditing ? "Update product details and stock information." : "Update medicine details and stock information."
                : "Add a product and its medicine details to the inventory system."}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4 px-6 pb-6" onSubmit={handleSubmit}>
            <section className="rounded-lg border border-border bg-muted/15 p-4">
              {!isEditing || isProductEditing ? (
                <div className={`mb-4 grid ${isProductEditing ? "grid-cols-1" : "grid-cols-2"} gap-1 rounded-md bg-muted p-1`} role="tablist" aria-label="Record type">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeFormTab === "product"}
                    onClick={() => setActiveFormTab("product")}
                    className={`h-9 rounded px-3 text-sm font-medium transition-colors ${activeFormTab === "product" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Product
                  </button>
                  {!isProductEditing ? (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeFormTab === "medicine"}
                      onClick={() => setActiveFormTab("medicine")}
                      className={`h-9 rounded px-3 text-sm font-medium transition-colors ${activeFormTab === "medicine" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Medicine
                    </button>
                  ) : null}
                </div>
              ) : null}

              {activeFormTab === "product" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={fieldId("productName")}>Product</Label>
                    <Input
                      id={fieldId("productName")}
                      name="productName"
                      placeholder="Enter product name"
                      required
                      value={form.productName}
                      onChange={(e) => handleChange('productName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={fieldId("milligram")}>Mg/Ml (Optional)</Label>
                    <Input
                      id={fieldId("milligram")}
                      name="milligram"
                      type="text"
                      placeholder="e.g., 500 mg/ml"
                      value={form.milligram}
                      onChange={(e) => handleChange("milligram", e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
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
                  <div className="space-y-2">
                    <Label htmlFor={fieldId("medicineName")}>Medicine Name</Label>
                    <Input
                      id={fieldId("medicineName")}
                      name="medicineName"
                      placeholder="e.g., Amoxicillin 500mg"
                      required={activeFormTab === "medicine" || isEditing}
                      value={form.medicineName}
                      onChange={(e) => handleChange('medicineName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={fieldId("milligram")}>Mg/Ml (Optional)</Label>
                    <Input
                      id={fieldId("milligram")}
                      name="milligram"
                      type="text"
                      placeholder="e.g., 500 mg/ml"
                      value={form.milligram}
                      onChange={(e) => handleChange("milligram", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-lg border border-border bg-muted/15 p-4">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Stock {activeFormTab === "medicine" ? "& expiry" : ""}</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                {activeFormTab === "product" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor={fieldId("pieces")}>Quantity</Label>
                      <Input
                        id={fieldId("pieces")}
                        name="pieces"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        required
                        value={form.pieces}
                        onChange={(e) => handleChange('pieces', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={fieldId("productUnitType")}>Unit Type</Label>
                      <select
                        id={fieldId("productUnitType")}
                        name="productUnitType"
                        value={form.productUnitType}
                        onChange={(e) => handleChange('productUnitType', e.target.value)}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="pieces">Pieces</option>
                        <option value="box">Box</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={fieldId("productExpiryDate")}>Expiry Date <span className="text-muted-foreground">(Optional)</span></Label>
                      <Input
                        id={fieldId("productExpiryDate")}
                        name="productExpiryDate"
                        type="date"
                        value={form.productExpiryDate}
                        onChange={(e) => handleChange('productExpiryDate', e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <>
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
                        type="number"
                        inputMode="numeric"
                        min="0"
                        placeholder="0"
                        value={form.pieces}
                        onChange={(e) => handleChange('pieces', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-1">
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
                  </>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-border bg-muted/15 p-4">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Pricing</h3>
              <div className="grid gap-4 sm:grid-cols-2">
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
            </section>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-border bg-background pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600" type="submit" disabled={loading}>
                {loading ? (isEditing ? 'Saving...' : 'Adding...') : isEditing ? 'Save changes' : activeFormTab === "product" ? 'Add Product' : 'Add Medicine'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
