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

export function normalizeUserStatus(status?: string) {
  const normalized = (status ?? "active").trim().toLowerCase()
  if (normalized === "inactive") return "Inactive"
  if (normalized === "suspended") return "Suspended"
  return "Active"
}

export function getStatusClasses(status?: string) {
  switch (normalizeUserStatus(status)) {
    case "Active":
      return "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/60"
    case "Inactive":
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:ring-slate-700"
    case "Suspended":
      return "bg-rose-100 text-rose-800 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800/60"
    default:
      return "bg-amber-100 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/60"
  }
}

export function getStatusDotClass(status?: string) {
  switch (normalizeUserStatus(status)) {
    case "Active":
      return "bg-emerald-500"
    case "Inactive":
      return "bg-slate-400"
    case "Suspended":
      return "bg-rose-500"
    default:
      return "bg-amber-500"
  }
}

export function StatusBadge({ status }: { status?: string }) {
  const label = normalizeUserStatus(status)

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(label)}`}>
      <span className={`size-1.5 rounded-full ${getStatusDotClass(label)}`} />
      {label}
    </span>
  )
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
    cell: ({ row }) => <StatusBadge status={String(row.getValue("status") || "Active")} />,
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
