"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export type UserRow = {
  id: string
  name: string
  email?: string
  studentNumber?: string
  employeeNumber?: string
  status?: string
}

export const columns: ColumnDef<UserRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("name")}</div>
    },
  },
  {
    accessorKey: "email",
    header: "Institutional Email",
    cell: ({ row }) => row.getValue("email") || "—",
  },
  {
    accessorKey: "studentNumber",
    header: "Student Number",
    cell: ({ row }) => row.getValue("studentNumber") || "—",
  },
  {
    accessorKey: "employeeNumber",
    header: "Employee Number",
    cell: ({ row }) => row.getValue("employeeNumber") || "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <span className="text-sm">{row.getValue("status") || "—"}</span>,
  },
  {
    id: "apps",
    header: "Apps",
    cell: () => <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-xs">G</span>,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const user = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>User actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
              Copy user ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View profile</DropdownMenuItem>
            <DropdownMenuItem>Deactivate</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
