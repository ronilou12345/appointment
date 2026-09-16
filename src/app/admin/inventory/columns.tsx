"use client"

import { ColumnDef } from "@tanstack/react-table"
import { AlertTriangle, CheckCircle2, MoreHorizontal, PencilIcon, ShoppingCart, Trash2Icon } from "lucide-react"

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
  quantity: string
  pieces?: number
  reorderLevel: number
  expiryDate: string
  price: number
  retailPrice?: number
  supplier: string
  status: string
  image?: string
}

export function getExpiryStatus(expiryDate: string, now = new Date()) {
  const expiry = new Date(`${expiryDate}T23:59:59`)
  if (Number.isNaN(expiry.getTime()) || expiryDate === "N/A") return "valid" as const
  if (expiry < now) return "expired" as const

  const oneMonthFromNow = new Date(now)
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1)
  return expiry <= oneMonthFromNow ? "near" as const : "valid" as const
}

function formatExpiryDate(expiryDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) return expiryDate || "—"
  const [year, month, day] = expiryDate.split("-")
  return `${month}/${day}/${year}`
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
    cell: ({ row }) => {
      const name = String(row.getValue("name") ?? "")
      const category = String(row.original.category ?? "")

      return (
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{name}</div>
          {category ? <div className="text-xs text-muted-foreground">{category}</div> : null}
        </div>
      )
    },
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => <span className="font-medium">{String(row.getValue("quantity") ?? "") || "—"}</span>,
  },
  {
    accessorKey: "pieces",
    header: "Pieces",
    cell: ({ row }) => <span className="font-medium">{Number(row.original.pieces ?? 0)}</span>,
  },
  {
    accessorKey: "expiryDate",
    header: "Expiry Date",
    cell: ({ row }) => {
      const expiryDate = String(row.getValue("expiryDate") ?? "")
      const expiryStatus = getExpiryStatus(expiryDate)

      return (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span>{formatExpiryDate(expiryDate)}</span>
          {expiryStatus === "near" ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/60"
              title="Expires within one month"
              aria-label="Expires within one month"
            >
              <AlertTriangle className="size-3" />
              Near expiry
            </span>
          ) : expiryStatus === "expired" ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800/60"
              title="Expired"
              aria-label="Expired"
            >
              <AlertTriangle className="size-3" />
              Expired
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/60"
              title="Valid"
              aria-label="Valid"
            >
              <CheckCircle2 className="size-3" />
              Valid
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = Number(row.getValue("price") ?? 0)
      return `₱${price.toFixed(2)}`
    },
  },
  {
    id: "subtotal",
    header: "Sub Total",
    cell: ({ row }) => {
      const pieces = Number(row.original.pieces ?? 0)
      const price = Number(row.original.price ?? 0)
      return `₱${(pieces * price).toFixed(2)}`
    },
  },
  {
    accessorKey: "retailPrice",
    header: "Retail Price",
    cell: ({ row }) => {
      const retailPrice = Number(row.original.retailPrice ?? row.getValue("price") ?? 0)
      return `₱${retailPrice.toFixed(2)}`
    },
  },
  {
    accessorKey: "supplier",
    header: "Supplier",
    cell: ({ row }) => <span className="whitespace-nowrap">{row.original.supplier || "—"}</span>,
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
      const outOfStock = (medicine.pieces ?? 0) <= 0
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
