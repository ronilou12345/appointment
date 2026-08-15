"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export type SpecialtyRow = {
  id: string
  name: string
  description: string
  availableDoctors: number
  status: string
}

export const columns: ColumnDef<SpecialtyRow>[] = [
  {
    accessorKey: "name",
    header: "Specialty Name",
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => row.getValue("description") || "—",
  },
  {
    accessorKey: "availableDoctors",
    header: "Available Doctors",
    cell: ({ row }) => <span className="font-semibold">{row.getValue("availableDoctors")}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = String(row.getValue("status") ?? "").trim()
      if (!status) return <span className="text-sm">—</span>

      const statusClass =
        status.toLowerCase() === "inactive"
          ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800"
          : "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"

      return <Badge className={`${statusClass} capitalize`}>{status}</Badge>
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const specialty = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Specialty actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("open-edit-specialty", { detail: specialty }),
                )
              }
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("open-delete-specialty", { detail: specialty }),
                )
              }
              className="text-destructive focus:text-destructive"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
