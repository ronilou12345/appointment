"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export type MedicineSaleRow = {
  id: string
  medicineName: string
  medicineCategory?: string
  medicineImage?: string
  quantitySold: number
  unitPrice: number
  totalAmount: number
  remaining: number
  saleDate: string
  soldBy: string
  discountPercent?: number
}

function formatSaleDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return {
    date: date.toLocaleDateString("en-PH", {
      timeZone: "Asia/Manila",
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-PH", {
      timeZone: "Asia/Manila",
      hour: "numeric",
      minute: "2-digit",
    }),
  }
}

export const salesColumns: ColumnDef<MedicineSaleRow>[] = [
  {
    accessorKey: "medicineName",
    header: "Medicine Name",
    cell: ({ row }) => {
      const medicineName = row.original.medicineName || "Unknown medicine"
      const initials = medicineName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "M"

      const medicineCategory = row.original.medicineCategory || "Uncategorized"

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 overflow-hidden rounded-full bg-transparent shadow-none ring-0">
            {row.original.medicineImage ? (
              <AvatarImage src={row.original.medicineImage} alt={medicineName} className="object-cover" />
            ) : null}
            <AvatarFallback className="rounded-full bg-muted text-[10px] font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate font-medium text-foreground">{medicineName}</div>
            <div className="text-xs text-muted-foreground">{medicineCategory}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "saleDate",
    header: "Sale Date",
    cell: ({ row }) => {
      const formatted = formatSaleDate(row.original.saleDate)

      if (typeof formatted === "string") {
        return <span className="text-muted-foreground">{formatted}</span>
      }

      return (
        <div className="whitespace-nowrap text-sm">
          <div className="font-medium text-foreground">{formatted.date}</div>
          <div className="mt-1 text-xs text-muted-foreground">{formatted.time}</div>
        </div>
      )
    },
  },
  {
    accessorKey: "quantitySold",
    header: "Qty Sold",
    cell: ({ row }) => {
      const quantity = row.getValue("quantitySold") as number
      return <span className="font-semibold">{quantity}</span>
    },
  },
  {
    accessorKey: "unitPrice",
    header: "Unit Price",
    cell: ({ row }) => {
      const price = row.getValue("unitPrice") as number
      return `₱${price.toFixed(2)}`
    },
  },
  {
    accessorKey: "discountPercent",
    header: "Discount",
    cell: ({ row }) => {
      const percent = Number(row.original.discountPercent ?? 0)
      if (!percent) return <span className="text-muted-foreground">—</span>
      return <span className="font-medium text-green-600">{percent}%</span>
    },
  },
  {
    accessorKey: "totalAmount",
    header: "Total",
    cell: ({ row }) => {
      const total = Number(row.getValue("totalAmount") ?? 0)
      const percent = Number(row.original.discountPercent ?? 0)
      const discountAmount = Math.round(total * (percent / 100) * 100) / 100
      const discountedTotal = Math.max(0, total - discountAmount)

      return (
        <span className="font-semibold">
          ₱{discountedTotal.toFixed(2)}
          {discountAmount > 0 ? (
            <span className="ml-1 font-medium text-green-600">(−₱{discountAmount.toFixed(2)})</span>
          ) : null}
        </span>
      )
    },
  },
  {
    accessorKey: "remaining",
    header: "Remaining",
    cell: ({ row }) => <span className="font-medium">{row.original.remaining}</span>,
  },
  {
    accessorKey: "soldBy",
    header: "Sold By",
    cell: ({ row }) => row.getValue("soldBy") || "—",
  },
]
