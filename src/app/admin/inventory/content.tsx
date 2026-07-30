"use client"

import { useState } from "react"
import { DataTable } from "@/components/data-table"
import { columns, MedicineRow } from "./columns"
import { AddMedicineDialog } from "@/components/add-medicine-dialog"

export function InventoryContent({ rows }: { rows: MedicineRow[] }) {
  const [dialogOpen, setDialogOpen] = useState(false)

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
          <div className="flex-shrink-0">
            <AddMedicineDialog open={dialogOpen} onOpenChange={setDialogOpen} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="text-sm text-muted-foreground">Total Items</div>
              <div className="mt-2 text-2xl font-semibold">{rows.length}</div>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="text-sm text-muted-foreground">In Stock</div>
              <div className="mt-2 text-2xl font-semibold text-green-500">
                {rows.filter(m => m.status === "In Stock").length}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="text-sm text-muted-foreground">Low Stock</div>
              <div className="mt-2 text-2xl font-semibold text-orange-500">
                {rows.filter(m => m.status === "Low Stock").length}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="text-sm text-muted-foreground">Out of Stock</div>
              <div className="mt-2 text-2xl font-semibold text-red-500">
                {rows.filter(m => m.status === "Out of Stock").length}
              </div>
            </div>
          </div>

          {/* Data Table */}
          <DataTable columns={columns} data={rows} />
        </div>
      </div>
    </div>
  )
}
