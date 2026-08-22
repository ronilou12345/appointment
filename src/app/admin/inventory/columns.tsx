"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, PencilIcon, ShoppingCart, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
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
  image?: string
}

const getStatusClasses = (status: string) => {
  const normalized = status?.toLowerCase() ?? ""

  switch (normalized) {
    case "in stock":
      return "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/60"
    case "low stock":
      return "bg-amber-100 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/60"
    case "out of stock":
      return "bg-rose-100 text-rose-800 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800/60"
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:ring-slate-700"
  }
}

export const columns: ColumnDef<MedicineRow>[] = [
  {
    id: "image",
    header: "",
    cell: ({ row }) => {
      const image = row.original.image
      const name = row.getValue("name") as string
      const initials = name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "M"

      return (
        <Avatar className="h-10 w-10">
          {image ? <AvatarImage src={image} alt={name} /> : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      )
    },
  },
  {
    accessorKey: "name",
    header: "Medicine Name",
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => row.getValue("category") || "—",
    enableHiding: true,
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
    enableHiding: true,
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
    enableHiding: true,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = String(row.getValue("status") ?? "")
      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(status)}`}>
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
      const outOfStock = medicine.quantity <= 0 || medicine.status === "Out of Stock"
      return (
        <Button
          size="sm"
          variant="outline"
          className="gap-2 text-foreground"
          disabled={outOfStock}
          title={outOfStock ? "Out of stock" : "Add to cart"}
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent("add-to-cart", { detail: medicine })
            )
          }}
        >
          <ShoppingCart className="h-4 w-4" />
          {outOfStock ? "Out of stock" : "Add"}
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
            <DropdownMenuItem
              onClick={() => window.dispatchEvent(new CustomEvent("open-edit-medicine", { detail: medicine }))}
            >
              <PencilIcon className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => window.dispatchEvent(new CustomEvent("open-delete-medicine", { detail: medicine }))}
              className="text-destructive focus:text-destructive"
            >
              <Trash2Icon className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
