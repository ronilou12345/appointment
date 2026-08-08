"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import Link from "next/link"

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

export type DoctorRow = {
  id: string
  name: string
  email: string
  specialties?: string
  status?: string
  avatar?: string | null
}

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

export const columns: ColumnDef<DoctorRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const doctor = row.original
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
            {doctor.avatar ? <AvatarImage src={doctor.avatar} alt={name} /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <Link href={`/client/all-doctors/${doctor.id}`} className="font-medium text-primary hover:underline">
              {name}
            </Link>
            {doctor.email ? <span className="text-sm text-muted-foreground">{doctor.email}</span> : null}
          </div>
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
    accessorKey: "specialties",
    header: "Specialties",
    cell: ({ row }) => row.getValue("specialties") || "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = String(row.getValue("status") || "Active")
      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(status)}`}>
          {status}
        </span>
      )
    },
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
            <DropdownMenuItem>
              <Link href={`/client/all-doctors/${doctor.id}`}>View profile</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
