"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ShoppingCart } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export type MedicineRow = {
  id: string
  name: string
  category: string
  quantity: number
  reorderLevel: number
  expiryDate: string
  price: number
  supplier: string
  status: string
}

export const columns: ColumnDef<MedicineRow>[] = [
  {
    accessorKey: "name",
    header: "Medicine Name",
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => row.getValue("category") || "—",
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => {
      const quantity = row.getValue("quantity") as number
      const reorderLevel = row.original.reorderLevel
      return (
        <span className={`font-semibold ${quantity <= reorderLevel ? "text-orange-500" : ""}`}>
          {quantity}
        </span>
      )
    },
  },
  {
    accessorKey: "reorderLevel",
    header: "Reorder Level",
    cell: ({ row }) => row.getValue("reorderLevel") || "—",
  },
  {
    accessorKey: "expiryDate",
    header: "Expiry Date",
    cell: ({ row }) => row.getValue("expiryDate") || "—",
  },
  {
    accessorKey: "price",
    header: "Unit Price",
    cell: ({ row }) => {
      const price = row.getValue("price") as number
      return `₱${price.toFixed(2)}`
    },
  },
  {
    accessorKey: "supplier",
    header: "Supplier",
    cell: ({ row }) => row.getValue("supplier") || "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <span className={`text-sm px-2 py-1 rounded ${
          status === "In Stock" ? "bg-green-500/20 text-green-700" :
          status === "Low Stock" ? "bg-orange-500/20 text-orange-700" :
          "bg-red-500/20 text-red-700"
        }`}>
          {status}
        </span>
      )
    },
  },
  {
    id: "addToCart",
    header: "",
    cell: ({ row }) => {
      const medicine = row.original
      return (
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent("add-to-cart", { detail: medicine })
            )
          }}
        >
          <ShoppingCart className="h-4 w-4" />
          Add
        </Button>
      )
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const medicine = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Medicine actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(medicine.id)}>
              Copy medicine ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Edit details</DropdownMenuItem>
            <DropdownMenuItem>Reorder stock</DropdownMenuItem>
            <DropdownMenuItem>View history</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
