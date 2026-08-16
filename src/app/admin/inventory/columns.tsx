"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ShoppingCart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  image?: string
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
