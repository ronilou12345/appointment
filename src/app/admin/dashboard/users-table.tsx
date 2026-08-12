"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const getStatusClasses = (status?: string) => {
  const normalized = (status ?? "active").toLowerCase()

  switch (normalized) {
    case "active":
      return "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/60"
    case "inactive":
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:ring-slate-700"
    case "suspended":
      return "bg-rose-100 text-rose-800 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800/60"
    default:
      return "bg-amber-100 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/60"
  }
}

const isInitialToken = (value: string) => /^[A-Za-z]\.?$/.test(value.trim())
const normalizeInitial = (value: string) => `${value.trim()[0].toUpperCase()}.`

const formatNameWithMiddleInitial = (name: string) => {
  const parts = name.split(" ").filter(Boolean)
  if (parts.length <= 2) return parts.join(" ")

  const lastName = parts[parts.length - 1]
  const maybeMiddle = parts[parts.length - 2]
  const firstNameParts = parts.slice(0, -2)

  if (isInitialToken(maybeMiddle) && firstNameParts.length > 0) {
    return [firstNameParts.join(" "), normalizeInitial(maybeMiddle), lastName].join(" ")
  }

  const firstName = parts[0]
  const middleInitials = parts
    .slice(1, -1)
    .map((part) => normalizeInitial(part))
    .join(" ")

  return [firstName, middleInitials, lastName].join(" ")
}

type RowType = {
  id: string
  fullname: string
  email: string
  address: string
  role: string
  status: string
  avatar?: string | null
}

const columns: ColumnDef<RowType, any>[] = [
  {
    accessorKey: "fullname",
    header: "Name",
    cell: ({ row }) => {
      const rawName = String(row.getValue("fullname") ?? "")
      const name = formatNameWithMiddleInitial(rawName)
      const email = String(row.original.email ?? "")
      const avatar = row.original.avatar

      return (
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
            <AvatarFallback>
              {(rawName || "").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="font-medium truncate">{name}</span>
            {email ? <span className="text-sm text-muted-foreground truncate">{email}</span> : null}
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
      const label =
        role === "DOCTOR" || role === "NURSE"
          ? "Doctor"
          : role === "ADMIN"
          ? "Admin"
          : role === "STAFF"
          ? "Staff"
          : "Patient"
      const variant =
        role === "ADMIN"
          ? "destructive"
          : role === "DOCTOR" || role === "NURSE"
          ? "secondary"
          : role === "STAFF"
          ? "outline"
          : "default"

      return <Badge variant={variant as any}>{label}</Badge>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = String(row.getValue("status") || "Active")
      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
            status,
          )}`}
        >
          {status}
        </span>
      )
    },
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
            <DropdownMenuItem onSelect={() => (window.location.href = `/admin/manage-users`)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={async () => {
                if (isAdmin) return
                if (!confirm("Delete this user?")) return
                try {
                  const res = await fetch("/api/users", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: user.id }),
                  })
                  const json = await res.json()
                  if (!res.ok || !json.success) throw new Error(json.error || "Unable to delete user")
                  location.reload()
                } catch (err) {
                  alert(err instanceof Error ? err.message : String(err))
                }
              }}
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

export default function UsersTable({ rows }: { rows: RowType[] }) {
  return <DataTable columns={columns} data={rows} />
}
