"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/data-table"
import { columns, MedicineRow } from "./columns"
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
import { Search, Box, CheckCircle, AlertTriangle, XCircle, ShoppingCart, Plus, Minus, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function InventoryContent({ rows }: { rows: MedicineRow[] }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [cartSearchQuery, setCartSearchQuery] = useState("")
  const [selectedMedicineIds, setSelectedMedicineIds] = useState<Record<string, boolean>>({})
  const [cartItems, setCartItems] = useState<Array<{ id: string; name: string; price: number; quantity: number; image?: string }>>([])

  const filteredRows = rows
  const searchResults = cartSearchQuery.trim()
    ? rows.filter((medicine) =>
        medicine.name.toLowerCase().includes(cartSearchQuery.trim().toLowerCase())
      )
    : []

  const addToCart = (medicineId: string) => {
    const medicine = rows.find(m => m.id === medicineId)
    if (!medicine) return

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === medicineId)
      if (existing) {
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
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === medicineId ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  const toggleSelectedMedicine = (medicineId: string) => {
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

    setCartItems((prev) => {
      const updatedItems = [...prev]

      medicinesToAdd.forEach((medicine) => {
        const existingItem = updatedItems.find((item) => item.id === medicine.id)

        if (existingItem) {
          existingItem.quantity += 1
          return
        }

        updatedItems.push({
          id: medicine.id,
          name: medicine.name,
          price: medicine.price,
          quantity: 1,
          image: medicine.image,
        })
      })

      return updatedItems
    })

    setSelectedMedicineIds({})
    setCartSearchQuery("")
    setCartOpen(true)
  }

  const selectedCount = Object.values(selectedMedicineIds).filter(Boolean).length
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discount = Math.round(subtotal * 0.1 * 100) / 100 // 10% discount
  const total = subtotal - discount

  // Handle add-to-cart event from table column
  useEffect(() => {
    const handleAddToCart = (event: Event) => {
      const customEvent = event as CustomEvent<MedicineRow>
      addToCart(customEvent.detail.id)
    }
    window.addEventListener("add-to-cart", handleAddToCart as EventListener)
    return () => window.removeEventListener("add-to-cart", handleAddToCart as EventListener)
  }, [rows, addToCart])

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-7xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Medicine Inventory</h1>
            <p className="mt-2 text-muted-foreground">
              Manage medical supplies and medicine stock levels. Monitor expiry dates and reorder as needed.
            </p>
          </div>
          <div className="flex flex-shrink-0 gap-3">
            <Button
              variant="outline"
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
                    searchResults.map((medicine) => (
                      <label
                        key={medicine.id}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-border px-2 py-2 hover:bg-accent/50"
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={!!selectedMedicineIds[medicine.id]}
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
                            </div>
                          </div>
                        </div>

                        <span className="text-sm font-medium">₱{medicine.price.toFixed(2)}</span>
                      </label>
                    ))
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

                    return (
                      <div key={item.id} className="flex items-center gap-4 rounded-lg border border-border p-3">
                        <Avatar className="h-16 w-16 flex-shrink-0">
                          {item.image ? <AvatarImage src={item.image} alt={item.name} /> : null}
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">₱{item.price.toFixed(2)}</p>
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
                            className="h-8 w-8 p-0"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
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

              <Button className="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white mt-2">
                Checkout
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
