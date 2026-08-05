"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  role?: string
  licenseNumber?: string
  yearsOfExperience?: string
  boardCertifications?: string
}

export const columns: ColumnDef<UserRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const user = row.original
      const name = String(row.getValue("name") ?? "")
      const nameParts = name.split(" ").filter(Boolean)
      const firstName = nameParts[0] ?? ""
      const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : ""
      const lastName = nameParts[nameParts.length - 1] ?? ""
      const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "U"
      const isDoctorAccount = user.role === "DOCTOR" || user.role === "NURSE"
      const baseDisplayName = [user.prefix, name].filter(Boolean).join(" ").trim()
      const displayName = isDoctorAccount
        ? ["Dr.", firstName, middleName ? `${middleName[0]}.` : "", lastName].filter(Boolean).join(" ").trim()
        : baseDisplayName || name
      const credentialText = isDoctorAccount ? user.credentials?.trim() : undefined

      return (
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            {user.avatar ? <AvatarImage src={user.avatar} alt={name} /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="font-medium">{displayName || name}{credentialText ? `, ${credentialText}` : ""}</span>
            <div className="flex flex-col gap-0.5">
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
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = String(row.getValue("role") ?? "PATIENT").toUpperCase()
      const label = role === "DOCTOR" || role === "NURSE" ? "Doctor" : role === "ADMIN" ? "Admin" : role === "STAFF" ? "Staff" : "Patient"
      const variant = role === "ADMIN" ? "destructive" : role === "DOCTOR" || role === "NURSE" ? "secondary" : role === "STAFF" ? "outline" : "default"

      return <Badge variant={variant as any}>{label}</Badge>
    },
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
      const isAdmin = String(user.role ?? "").toUpperCase() === "ADMIN"
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
            <DropdownMenuItem>View profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent("open-edit-user", { detail: user }))}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={isAdmin}
              onClick={() => window.dispatchEvent(new CustomEvent("open-delete-user", { detail: user }))}
              className={isAdmin ? "opacity-50 cursor-not-allowed" : "text-red-600 focus:text-red-600"}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
