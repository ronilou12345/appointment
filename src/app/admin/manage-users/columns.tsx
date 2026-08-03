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
  address?: string
  prefix?: string | null
  suffix?: string | null
  credentials?: string | null
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
      const displayName = [user.prefix, name, user.suffix]
        .filter(Boolean)
        .join(" ")
        .trim()
      const credentialText = user.credentials?.trim()
      const nameParts = name.split(" ").filter(Boolean)
      const firstName = nameParts[0] ?? ""
      const lastName = nameParts[nameParts.length - 1] ?? ""
      const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "U"

      return (
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            {user.avatar ? <AvatarImage src={user.avatar} alt={name} /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="font-medium">{displayName || name}</span>
            <div className="flex flex-col gap-0.5">
              {credentialText ? <span className="text-sm text-muted-foreground">{credentialText}</span> : null}
              {user.email ? <span className="text-sm text-muted-foreground">{user.email}</span> : null}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => row.getValue("address") || "—",
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
