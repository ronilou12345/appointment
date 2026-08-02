"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  avatar?: string | null
}

export const columns: ColumnDef<UserRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const user = row.original
      const name = String(row.getValue("name") ?? "")
      const initials = name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "U"

      return (
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            {user.avatar ? <AvatarImage src={user.avatar} alt={name} /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="font-medium">{name}</span>
            {user.email ? <span className="text-sm text-muted-foreground">{user.email}</span> : null}
          </div>
        </div>
      )
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
