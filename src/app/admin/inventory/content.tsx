"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/data-table"
import { columns, MedicineRow } from "./columns"
import { salesColumns, MedicineSaleRow } from "./sales-columns"
import { AddMedicineDialog } from "@/components/add-medicine-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, Box, CheckCircle, AlertTriangle, XCircle, ShoppingCart, Plus, Minus, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
}

function getStockInfo(medicine: Pick<MedicineRow, "quantity" | "status" | "reorderLevel">) {
  const stock = medicine.quantity ?? 0
  const outOfStock = stock <= 0 || medicine.status === "Out of Stock"
  const lowStock = !outOfStock && (medicine.status === "Low Stock" || stock <= (medicine.reorderLevel ?? 0))
  return { stock, outOfStock, lowStock }
}

function stockUnitLabel(stock: number) {
  return stock === 1 ? "unit" : "units"
}

function CheckoutSummaryDialog({
  open,
  onOpenChange,
  items,
  subtotal,
  discount,
  total,
  loading,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CartItem[]
  subtotal: number
  discount: number
  total: number
  loading: boolean
  onConfirm: () => void
}) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)} className="z-[80]">
      <DialogContent className="mx-auto max-w-lg">
        <DialogHeader>
          <DialogTitle>Checkout summary</DialogTitle>
          <DialogDescription>
            Review {itemCount} {itemCount === 1 ? "item" : "items"} before confirming. Stock will be deducted after checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-72 space-y-3 overflow-y-auto">
          {items.map((item) => {
            const initials = item.name
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase() || "M"
            const lineTotal = item.price * item.quantity

            return (
              <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <Avatar className="h-12 w-12 flex-shrink-0">
                  {item.image ? <AvatarImage src={item.image} alt={item.name} /> : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × ₱{item.price.toFixed(2)}
                  </p>
                </div>
                <p className="text-sm font-semibold">₱{lineTotal.toFixed(2)}</p>
              </div>
            )
          })}
        </div>

        <div className="space-y-2 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold">₱{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount (10%)</span>
            <span className="font-semibold text-green-600">-₱{discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-bold">
            <span>Total</span>
            <span>₱{total.toFixed(2)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="bg-gradient-to-r from-orange-400 to-orange-500 text-white hover:from-orange-500 hover:to-orange-600"
            onClick={onConfirm}
            disabled={loading || items.length === 0}
          >
            {loading ? "Processing..." : "Confirm checkout"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteMedicineDialog({
  open,
  onOpenChange,
  medicine,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  medicine: MedicineRow | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!medicine) return
    setLoading(true)

    try {
      const response = await fetch("/api/medicine-inventory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Number(medicine.id) }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to delete medicine")
      }

      toast.success("Medicine deleted")
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete medicine")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-auto max-w-md">
        <DialogHeader>
          <DialogTitle>Delete medicine</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {medicine?.name ? `"${medicine.name}"` : "this medicine"}? Existing sales records will be kept. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function InventoryContent({ rows, sales }: { rows: MedicineRow[]; sales: MedicineSaleRow[] }) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineRow | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [cartSearchQuery, setCartSearchQuery] = useState("")
  const [selectedMedicineIds, setSelectedMedicineIds] = useState<Record<string, boolean>>({})
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const filteredRows = rows
  const searchResults = cartSearchQuery.trim()
    ? rows.filter((medicine) =>
        medicine.name.toLowerCase().includes(cartSearchQuery.trim().toLowerCase())
      )
    : []

  const addToCart = (medicineId: string) => {
    const medicine = rows.find(m => m.id === medicineId)
    if (!medicine) return

    const { stock, outOfStock, lowStock } = getStockInfo(medicine)
    if (outOfStock) {
      toast.error(`${medicine.name} is out of stock and cannot be added.`)
      return
    }

    const existing = cartItems.find((item) => item.id === medicineId)
    if ((existing?.quantity ?? 0) >= stock) {
      toast.error(`Only ${stock} ${stockUnitLabel(stock)} of ${medicine.name} available.`)
      return
    }

    if (lowStock) {
      toast.warning(`${medicine.name} is low stock. Only ${stock} left.`)
    }

    setCartItems((prev) => {
      const current = prev.find((item) => item.id === medicineId)
      if (current) {
        return prev.map((item) =>
          item.id === medicineId ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { id: medicineId, name: medicine.name, price: medicine.price, quantity: 1, image: medicine.image }]
    })
    setCartOpen(true)
  }

  const removeFromCart = (medicineId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== medicineId))
  }

  const updateQuantity = (medicineId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(medicineId)
      return
    }

    const medicine = rows.find((item) => item.id === medicineId)
    const stock = medicine?.quantity ?? 0
    if (newQuantity > stock) {
      toast.warning(`${medicine?.name ?? "This medicine"} has reached the maximum quantity (${stock}).`)
      return
    }

    setCartItems((prev) =>
      prev.map((item) =>
        item.id === medicineId ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  const increaseCartQuantity = (medicineId: string) => {
    const item = cartItems.find((cartItem) => cartItem.id === medicineId)
    if (!item) return

    const medicine = rows.find((row) => row.id === medicineId)
    const stock = medicine?.quantity ?? 0

    if (item.quantity >= stock) {
      toast.warning(`${medicine?.name ?? item.name} has reached the maximum quantity (${stock}).`)
      return
    }

    updateQuantity(medicineId, item.quantity + 1)
  }

  const toggleSelectedMedicine = (medicineId: string) => {
    const medicine = rows.find((item) => item.id === medicineId)
    if (medicine && getStockInfo(medicine).outOfStock) {
      toast.error(`${medicine.name} is out of stock and cannot be added.`)
      return
    }

    setSelectedMedicineIds((prev) => ({
      ...prev,
      [medicineId]: !prev[medicineId],
    }))
  }

  const addSelectedMedicines = () => {
    const medicinesToAdd = rows.filter((medicine) => selectedMedicineIds[medicine.id])

    if (medicinesToAdd.length === 0) {
      return
    }

    let addedCount = 0
    const nextItems = cartItems.map((item) => ({ ...item }))

    medicinesToAdd.forEach((medicine) => {
      const { stock, outOfStock, lowStock } = getStockInfo(medicine)
      if (outOfStock) {
        toast.error(`${medicine.name} is out of stock and cannot be added.`)
        return
      }

      const existingItem = nextItems.find((item) => item.id === medicine.id)
      if ((existingItem?.quantity ?? 0) >= stock) {
        toast.error(`Only ${stock} ${stockUnitLabel(stock)} of ${medicine.name} available.`)
        return
      }

      if (lowStock) {
        toast.warning(`${medicine.name} is low stock. Only ${stock} left.`)
      }

      addedCount += 1
      if (existingItem) {
        existingItem.quantity += 1
        return
      }

      nextItems.push({
        id: medicine.id,
        name: medicine.name,
        price: medicine.price,
        quantity: 1,
        image: medicine.image,
      })
    })

    if (addedCount === 0) return

    setCartItems(nextItems)
    setSelectedMedicineIds({})
    setCartSearchQuery("")
    setCartOpen(true)
  }

  const selectedCount = Object.values(selectedMedicineIds).filter(Boolean).length
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discount = Math.round(subtotal * 0.1 * 100) / 100 // 10% discount
  const total = subtotal - discount

  const openCheckoutSummary = () => {
    if (cartItems.length === 0) return
    setCartOpen(false)
    setCheckoutOpen(true)
  }

  const handleCheckoutOpenChange = (open: boolean) => {
    if (checkoutLoading) return
    setCheckoutOpen(open)
    if (!open && cartItems.length > 0) {
      setCartOpen(true)
    }
  }

  const confirmCheckout = async () => {
    if (cartItems.length === 0) return
    setCheckoutLoading(true)

    try {
      const response = await fetch("/api/medicine-inventory/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            id: Number(item.id),
            quantity: item.quantity,
          })),
        }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to complete checkout")
      }

      toast.success("Checkout complete. Inventory and sales updated.")
      setCartItems([])
      setCheckoutOpen(false)
      setCartOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to complete checkout")
    } finally {
      setCheckoutLoading(false)
    }
  }

  // Handle add-to-cart event from table column
  useEffect(() => {
    const handleAddToCart = (event: Event) => {
      const customEvent = event as CustomEvent<MedicineRow>
      addToCart(customEvent.detail.id)
    }
    const openEditMedicine = (event: Event) => {
      const customEvent = event as CustomEvent<MedicineRow>
      setSelectedMedicine(customEvent.detail)
      setEditOpen(true)
    }
    const openDeleteMedicine = (event: Event) => {
      const customEvent = event as CustomEvent<MedicineRow>
      setSelectedMedicine(customEvent.detail)
      setDeleteOpen(true)
    }

    window.addEventListener("add-to-cart", handleAddToCart as EventListener)
    window.addEventListener("open-edit-medicine", openEditMedicine as EventListener)
    window.addEventListener("open-delete-medicine", openDeleteMedicine as EventListener)
    return () => {
      window.removeEventListener("add-to-cart", handleAddToCart as EventListener)
      window.removeEventListener("open-edit-medicine", openEditMedicine as EventListener)
      window.removeEventListener("open-delete-medicine", openDeleteMedicine as EventListener)
    }
  }, [rows, addToCart])

  return (
    <div className="min-h-screen w-full bg-background p-6 text-foreground">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Medicine Inventory</h1>
          <p className="mt-2 text-muted-foreground">
            Manage medical supplies and medicine stock levels. Monitor expiry dates and reorder as needed.
          </p>
        </div>
        <div className="flex flex-shrink-0 gap-3">
          <Button
            size="sm"
            className="bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-md shadow-primary/20 hover:from-orange-500 hover:to-orange-600"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="size-4 mr-2" />
            Add to Cart
          </Button>
          <AddMedicineDialog open={dialogOpen} onOpenChange={setDialogOpen} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="text-sm text-muted-foreground">Total Items</div>
            <div className="mt-2 flex items-center gap-3">
              <Box className="size-5 text-foreground/80" />
              <div className="text-2xl font-semibold">{filteredRows.length}</div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="text-sm text-muted-foreground">In Stock</div>
            <div className="mt-2 flex items-center gap-3">
              <CheckCircle className="size-5 text-green-500" />
              <div className="text-2xl font-semibold text-green-500">{filteredRows.filter(m => m.status === "In Stock").length}</div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="text-sm text-muted-foreground">Low Stock</div>
            <div className="mt-2 flex items-center gap-3">
              <AlertTriangle className="size-5 text-orange-500" />
              <div className="text-2xl font-semibold text-orange-500">{filteredRows.filter(m => m.status === "Low Stock").length}</div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="text-sm text-muted-foreground">Out of Stock</div>
            <div className="mt-2 flex items-center gap-3">
              <XCircle className="size-5 text-red-500" />
              <div className="text-2xl font-semibold text-red-500">{filteredRows.filter(m => m.status === "Out of Stock").length}</div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <DataTable columns={columns} data={filteredRows} />
      </div>

      <div className="mt-10">
        <div className="mb-6">
          <h2 className="text-3xl font-semibold text-foreground">Medicine Sales</h2>
          <p className="mt-2 text-muted-foreground">
            Medicines sold at checkout. Each checkout line is recorded with quantity, price, and who processed the sale.
          </p>
        </div>
        <DataTable columns={salesColumns} data={sales} />
      </div>

      {/* Shopping Cart Sheet */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="right" className="w-full max-w-md flex flex-col">
          <SheetHeader className="border-b">
            <SheetTitle>Shopping Cart</SheetTitle>
            <SheetDescription>
              {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in cart
            </SheetDescription>
          </SheetHeader>

          {/* Search medicine to add */}
          <div className="border-b py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search medicine name..."
                value={cartSearchQuery}
                onChange={(e) => setCartSearchQuery(e.target.value)}
                className="pl-10 h-9"
              />
            </div>

            {cartSearchQuery.trim() && (
              <div className="mt-3 overflow-hidden rounded-lg border border-border bg-background">
                <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <span>Available medicines</span>
                  <span>{selectedCount} selected</span>
                </div>

                <div className="max-h-64 space-y-2 overflow-y-auto p-2">
                  {searchResults.length === 0 ? (
                    <p className="px-2 py-3 text-sm text-muted-foreground">No medicine matches found.</p>
                  ) : (
                    searchResults.map((medicine) => {
                      const { stock, outOfStock, lowStock } = getStockInfo(medicine)

                      return (
                      <label
                        key={medicine.id}
                        className={`flex items-center justify-between gap-3 rounded-md border border-border px-2 py-2 ${
                          outOfStock ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-accent/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={!!selectedMedicineIds[medicine.id]}
                            disabled={outOfStock}
                            onCheckedChange={() => toggleSelectedMedicine(medicine.id)}
                            aria-label={`Select ${medicine.name}`}
                          />
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar className="h-9 w-9 flex-shrink-0">
                              {medicine.image ? <AvatarImage src={medicine.image} alt={medicine.name} /> : null}
                              <AvatarFallback>
                                {medicine.name
                                  .split(" ")
                                  .filter(Boolean)
                                  .slice(0, 2)
                                  .map((part) => part[0])
                                  .join("")
                                  .toUpperCase() || "M"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{medicine.name}</p>
                              <p className="text-xs text-muted-foreground">{medicine.category}</p>
                              {outOfStock ? (
                                <p className="text-xs font-medium text-rose-600">Out of stock</p>
                              ) : lowStock ? (
                                <p className="text-xs font-medium text-amber-600">Low stock · {stock} left</p>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <span className="text-sm font-medium">₱{medicine.price.toFixed(2)}</span>
                      </label>
                      )
                    })
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="border-t border-border p-2">
                    <Button
                      className="w-full"
                      disabled={selectedCount === 0}
                      onClick={addSelectedMedicines}
                    >
                      Add selected ({selectedCount})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            {cartItems.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-center text-muted-foreground">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems
                  .filter((item) =>
                    item.name.toLowerCase().includes(cartSearchQuery.toLowerCase())
                  )
                  .map((item) => {
                    const initials = item.name
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase() || "M"
                    const medicine = rows.find((row) => row.id === item.id)
                    const stockInfo = medicine ? getStockInfo(medicine) : { stock: 0, outOfStock: true, lowStock: false }
                    const atMaxQuantity = item.quantity >= stockInfo.stock

                    return (
                      <div key={item.id} className="flex items-center gap-4 rounded-lg border border-border p-3">
                        <Avatar className="h-16 w-16 flex-shrink-0">
                          {item.image ? <AvatarImage src={item.image} alt={item.name} /> : null}
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">₱{item.price.toFixed(2)}</p>
                          {stockInfo.outOfStock ? (
                            <p className="text-xs font-medium text-rose-600">Out of stock</p>
                          ) : stockInfo.lowStock ? (
                            <p className="text-xs font-medium text-amber-600">Low stock · {stockInfo.stock} left</p>
                          ) : null}
                          {atMaxQuantity ? (
                            <p className="text-xs font-medium text-orange-600">Max quantity reached</p>
                          ) : (
                            <p className="text-xs text-muted-foreground">{item.quantity} of {stockInfo.stock} in cart</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className={`h-8 w-8 p-0 ${atMaxQuantity ? "opacity-50" : ""}`}
                            title={atMaxQuantity ? `Maximum of ${stockInfo.stock} reached` : "Increase quantity"}
                            onClick={() => increaseCartQuantity(item.id)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="border-t space-y-3 py-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span className="font-semibold">₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Discount (10%):</span>
                <span className="font-semibold text-green-600">-₱{discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t">
                <span>Total:</span>
                <span>₱{total.toFixed(2)}</span>
              </div>

              <Button
                className="mt-2 w-full bg-gradient-to-r from-orange-400 to-orange-500 text-white hover:from-orange-500 hover:to-orange-600"
                onClick={openCheckoutSummary}
              >
                Checkout
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AddMedicineDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        medicine={selectedMedicine}
        showTrigger={false}
      />
      <DeleteMedicineDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        medicine={selectedMedicine}
      />
      <CheckoutSummaryDialog
        open={checkoutOpen}
        onOpenChange={handleCheckoutOpenChange}
        items={cartItems}
        subtotal={subtotal}
        discount={discount}
        total={total}
        loading={checkoutLoading}
        onConfirm={confirmCheckout}
      />
    </div>
  )
}
