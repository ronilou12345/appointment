"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/data-table"
import { columns, getExpiryStatus, MedicineRow } from "./columns"
import { salesColumns, MedicineSaleRow } from "./sales-columns"
import { PrintMedicineSalesButton } from "./print-sales"
import { AddMedicineDialog } from "@/components/add-medicine-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Separator } from "@/components/ui/separator"

type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
}

function getDateKey(value: string | Date) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10)
}

function formatSalesDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function getStockInfo(medicine: Pick<MedicineRow, "quantity" | "pieces" | "status" | "reorderLevel">) {
  const stock = medicine.pieces ?? 0
  const outOfStock = stock <= 0
  const lowStock = !outOfStock && stock <= 20
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
  discountPercent,
  total,
  loading,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CartItem[]
  subtotal: number
  discount: number
  discountPercent: number
  total: number
  loading: boolean
  onConfirm: () => void
}) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const [cashReceived, setCashReceived] = useState(0)
  const numericCash = Number.isFinite(cashReceived) ? cashReceived : 0
  const change = Math.max(0, numericCash - total)
  const isPaymentEnough = numericCash >= total

  useEffect(() => {
    if (!open) return
    setCashReceived(0)
  }, [open, total])

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
            <span>Discount ({discountPercent}%)</span>
            <span className="font-semibold text-green-600">-₱{discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-bold">
            <span>Total</span>
            <span>₱{total.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2">
            <Label htmlFor="cash-received" className="text-sm font-medium text-muted-foreground">
              Cash received
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm">₱</span>
              <Input
                id="cash-received"
                type="number"
                min={0}
                step="0.01"
                value={numericCash}
                onChange={(event) => setCashReceived(Number(event.target.value || 0))}
                className="h-9 w-32 text-right"
                aria-label="Cash received from customer"
              />
            </div>
          </div>
          <div className="flex justify-between">
            <span>Change</span>
            <span className={`font-semibold ${isPaymentEnough ? "text-emerald-600" : "text-red-500"}`}>
              ₱{change.toFixed(2)}
            </span>
          </div>
          {!isPaymentEnough && numericCash > 0 ? (
            <p className="text-xs text-red-500">Customer still needs ₱{(total - numericCash).toFixed(2)} more.</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="shadow-md shadow-primary/20"
            onClick={onConfirm}
            disabled={loading || items.length === 0 || !isPaymentEnough}
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
  const [discountInput, setDiscountInput] = useState("")
  const [selectedSaleDate, setSelectedSaleDate] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "in-stock" | "low-stock" | "out-of-stock" | "expired">("all")

  const statusFilterMatches = (medicine: MedicineRow, filter: typeof statusFilter) => {
    const stock = medicine.pieces ?? 0

    switch (filter) {
      case "in-stock":
        return stock > 20
      case "low-stock":
        return stock > 0 && stock <= 20
      case "out-of-stock":
        return stock <= 0
      case "expired":
        return getExpiryStatus(medicine.expiryDate) === "expired"
      case "all":
      default:
        return true
    }
  }

  const filteredRows = statusFilter === "all"
    ? rows
    : rows.filter((medicine) => statusFilterMatches(medicine, statusFilter))

  const statusCounts = {
    total: rows.length,
    inStock: rows.filter((medicine) => (medicine.pieces ?? 0) > 20).length,
    lowStock: rows.filter((medicine) => (medicine.pieces ?? 0) > 0 && (medicine.pieces ?? 0) <= 20).length,
    outOfStock: rows.filter((medicine) => (medicine.pieces ?? 0) <= 0).length,
    expired: rows.filter((medicine) => getExpiryStatus(medicine.expiryDate) === "expired").length,
  }

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
    const stock = medicine?.pieces ?? 0
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
    const stock = medicine?.pieces ?? 0

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
  const parsedDiscount = Number(discountInput)
  const discountPercent = Number.isNaN(parsedDiscount) ? 0 : Math.min(100, Math.max(0, parsedDiscount))
  const discount = Math.round(subtotal * (discountPercent / 100) * 100) / 100
  const total = Math.max(0, subtotal - discount)
  const summaryDate = selectedSaleDate || getDateKey(new Date())
  const selectedDate = new Date(`${summaryDate}T00:00:00`)
  const selectedDayStart = selectedDate ? new Date(selectedDate) : null
  const selectedDayEnd = selectedDate ? new Date(selectedDate) : null
  if (selectedDayEnd) selectedDayEnd.setDate(selectedDayEnd.getDate() + 1)
  const selectedWeekStart = selectedDate ? new Date(selectedDate) : null
  if (selectedWeekStart) {
    const dayOfWeek = selectedWeekStart.getDay()
    selectedWeekStart.setDate(selectedWeekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  }
  const selectedWeekEnd = selectedWeekStart ? new Date(selectedWeekStart) : null
  if (selectedWeekEnd) selectedWeekEnd.setDate(selectedWeekEnd.getDate() + 7)
  const selectedMonthStart = selectedDate ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1) : null
  const selectedMonthEnd = selectedDate ? new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1) : null
  const getSalesTotal = (start: Date | null, end: Date | null) =>
    start && end
      ? sales.reduce((sum, sale) => {
          const saleDate = new Date(sale.saleDate)
          return saleDate >= start && saleDate < end ? sum + sale.totalAmount : sum
        }, 0)
      : 0
  const salesForSelectedDay = getSalesTotal(selectedDayStart, selectedDayEnd)
  const salesForSelectedWeek = getSalesTotal(selectedWeekStart, selectedWeekEnd)
  const salesForSelectedMonth = getSalesTotal(selectedMonthStart, selectedMonthEnd)
  const selectedDateSales = selectedSaleDate
    ? sales.filter((sale) => getDateKey(sale.saleDate) === selectedSaleDate)
    : sales

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
          discountPercent,
        }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to complete checkout")
      }

      toast.success("Checkout complete. Inventory and sales updated.")
      setCartItems([])
      setDiscountInput("")
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
            className="shadow-md shadow-primary/20"
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              key: "all",
              label: "Total Items",
              value: statusCounts.total,
              icon: Box,
              className: "text-foreground/80",
              active: statusFilter === "all",
              onClick: () => setStatusFilter("all"),
            },
            {
              key: "in-stock",
              label: "In Stock",
              value: statusCounts.inStock,
              icon: CheckCircle,
              className: "text-green-500",
              active: statusFilter === "in-stock",
              onClick: () => setStatusFilter("in-stock"),
            },
            {
              key: "low-stock",
              label: "Low Stock",
              value: statusCounts.lowStock,
              icon: AlertTriangle,
              className: "text-orange-500",
              active: statusFilter === "low-stock",
              onClick: () => setStatusFilter("low-stock"),
            },
            {
              key: "out-of-stock",
              label: "Out of Stock",
              value: statusCounts.outOfStock,
              icon: XCircle,
              className: "text-red-500",
              active: statusFilter === "out-of-stock",
              onClick: () => setStatusFilter("out-of-stock"),
            },
            {
              key: "expired",
              label: "Expired Items",
              value: statusCounts.expired,
              icon: AlertTriangle,
              className: "text-rose-500",
              active: statusFilter === "expired",
              onClick: () => setStatusFilter("expired"),
            },
          ].map(({ key, label, value, icon: Icon, className, active, onClick }) => (
            <button
              key={key}
              type="button"
              onClick={onClick}
              className={`rounded-lg border bg-background p-4 text-left transition-colors ${active ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:bg-accent/20"}`}
            >
              <div className="text-sm text-muted-foreground">{label}</div>
              <div className="mt-2 flex items-center gap-3">
                <Icon className={`size-5 ${className}`} />
                <div className={`text-2xl font-semibold ${className}`}>{value}</div>
              </div>
            </button>
          ))}
        </div>

        {statusFilter !== "all" ? (
          <div className="flex items-center justify-between rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
            <span>Showing: {statusFilter.replace("-", " ").replace(/\b\w/g, (char) => char.toUpperCase())}</span>
            <Button variant="ghost" size="sm" onClick={() => setStatusFilter("all")}>
              Clear filter
            </Button>
          </div>
        ) : null}

        {/* Data Table */}
        <DataTable columns={columns} data={filteredRows} />
      </div>

      <Separator className="my-10 h-px w-full bg-border" />

      <div>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-foreground">Medicine Sales</h2>
            <p className="mt-2 text-muted-foreground">
              Medicines sold at checkout. Each checkout line is recorded with quantity, price, and who processed the sale.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-1.5">
              <label htmlFor="sales-date" className="text-sm font-medium text-muted-foreground">
                Select date
              </label>
              <Input
                id="sales-date"
                type="date"
                value={selectedSaleDate}
                onChange={(event) => setSelectedSaleDate(event.target.value)}
                className="h-9 w-[170px] border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <PrintMedicineSalesButton
              sales={selectedDateSales}
              reportLabel={selectedSaleDate ? formatSalesDate(selectedSaleDate) : "All sales"}
            />
          </div>
        </div>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Sales Today", value: salesForSelectedDay, description: "Selected date" },
            { title: "Sales This Week", value: salesForSelectedWeek, description: "Full week containing selected date" },
            { title: "Sales This Month", value: salesForSelectedMonth, description: "Full month containing selected date" },
          ].map((card) => (
            <div key={card.title} className="rounded-lg border border-border bg-background p-4">
              <div className="text-sm text-muted-foreground">{card.title}</div>
              <div className="mt-2 text-2xl font-semibold">₱{card.value.toFixed(2)}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {`${card.description} · ${formatSalesDate(summaryDate)}`}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {selectedSaleDate ? `Sales for ${formatSalesDate(selectedSaleDate)}` : "All sales"}
          </p>
          {selectedSaleDate ? (
            <Button variant="outline" size="sm" onClick={() => setSelectedSaleDate("")}>
              Show all sales
            </Button>
          ) : null}
        </div>
        <div className="mt-3">
          <DataTable columns={salesColumns} data={selectedDateSales} />
        </div>
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
              <div className="flex items-center justify-between gap-3 text-sm">
                <Label htmlFor="cart-discount" className="shrink-0">
                  Discount (%):
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="cart-discount"
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={discountInput}
                    placeholder="%"
                    onChange={(event) => {
                      const raw = event.target.value
                      if (raw === "") {
                        setDiscountInput("")
                        return
                      }
                      const nextValue = Number(raw)
                      if (Number.isNaN(nextValue)) return
                      setDiscountInput(String(Math.min(100, Math.max(0, nextValue))))
                    }}
                    className="h-8 w-20 text-right"
                  />
                  <span className="w-24 text-right font-semibold text-green-600">-₱{discount.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t">
                <span>Total:</span>
                <span>₱{total.toFixed(2)}</span>
              </div>

              <Button
                className="mt-2 w-full shadow-md shadow-primary/20"
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
        discountPercent={discountPercent}
        total={total}
        loading={checkoutLoading}
        onConfirm={confirmCheckout}
      />
    </div>
  )
}
