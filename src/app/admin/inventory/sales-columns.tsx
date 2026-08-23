"use client"

import { ColumnDef } from "@tanstack/react-table"

export type MedicineSaleRow = {
  id: string
  medicineName: string
  quantitySold: number
  unitPrice: number
  totalAmount: number
  saleDate: string
  soldBy: string
  discountPercent?: number
}

function formatSaleDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export const salesColumns: ColumnDef<MedicineSaleRow>[] = [
  {
    accessorKey: "saleDate",
    header: "Sale Date",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm text-muted-foreground">
        {formatSaleDate(row.original.saleDate)}
      </span>
    ),
  },
  {
    accessorKey: "medicineName",
    header: "Medicine",
    cell: ({ row }) => <div className="font-medium">{row.getValue("medicineName")}</div>,
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
    accessorKey: "soldBy",
    header: "Sold By",
    cell: ({ row }) => row.getValue("soldBy") || "—",
  },
]
