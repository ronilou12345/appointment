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
    accessorKey: "totalAmount",
    header: "Total",
    cell: ({ row }) => {
      const total = row.getValue("totalAmount") as number
      return <span className="font-semibold">₱{total.toFixed(2)}</span>
    },
  },
  {
    accessorKey: "soldBy",
    header: "Sold By",
    cell: ({ row }) => row.getValue("soldBy") || "—",
  },
]
