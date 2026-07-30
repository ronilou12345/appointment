"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export type DoctorRow = {
  id: string
  name: string
  email: string
  employeeNumber?: string
  designations?: string
  status?: string
}

export const columns: ColumnDef<DoctorRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const doctor = row.original
      return (
        <div className="font-medium">
          <Link href={`/client/all-doctors/${doctor.id}`} className="text-primary hover:underline">
            {row.getValue("name")}
          </Link>
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.getValue("email") || "—",
  },
  {
    accessorKey: "employeeNumber",
    header: "Employee #",
    cell: ({ row }) => row.getValue("employeeNumber") || "—",
  },
  {
    accessorKey: "designations",
    header: "Credentials",
    cell: ({ row }) => row.getValue("designations") || "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <span className="text-sm">{row.getValue("status") || "—"}</span>,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const doctor = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Doctor actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(doctor.id)}>
              Copy doctor ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href={`/client/all-doctors/${doctor.id}`}>View profile</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
