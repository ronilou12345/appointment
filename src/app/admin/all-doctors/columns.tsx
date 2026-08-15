"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import Link from "next/link"

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

export type DoctorRow = {
  id: string
  name: string
  email: string
  specialties?: string
  boardCertification?: string
  designations?: string
  status?: string
  avatar?: string | null
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
            <Link href={`/admin/all-doctors/${doctor.id}`} className="font-medium text-primary hover:underline">
              {name}
            </Link>
            <span className="text-sm text-muted-foreground">{doctor.email}</span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "specialties",
    header: "Specialties",
    cell: ({ row }) => row.getValue("specialties") || "—",
  },
  {
    accessorKey: "boardCertification",
    header: "Board certificate",
    cell: ({ row }) => row.getValue("boardCertification") || "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = String(row.getValue("status") ?? "").trim()
      if (!status) return <span className="text-sm">—</span>

      const statusClass = (() => {
        switch (status.toLowerCase()) {
          case "inactive":
            return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800"
          case "suspended":
            return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800"
          case "active":
          default:
            return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
        }
      })()

      return <Badge className={`${statusClass} capitalize`}>{status}</Badge>
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
            <DropdownMenuItem>View profile</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("open-edit-doctor", { detail: doctor })
                )
              }
            >
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
