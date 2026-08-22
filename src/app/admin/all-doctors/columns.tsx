"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/app/admin/manage-users/columns"
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
    cell: ({ row }) => <StatusBadge status={String(row.getValue("status") || "Active")} />,
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
