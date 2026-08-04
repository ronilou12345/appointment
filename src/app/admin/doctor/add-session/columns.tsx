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

export type SessionRow = {
  id: string
  date: string
  startTime: string
  endTime: string
  duration: string
  slots: number
  status: string
  appointmentTypes: string[]
}

const formatDisplayDate = (value: unknown) => {
  if (value == null || value === "") return "—"

  const text = String(value).trim()
  if (!text) return "—"

  const dateOnlyMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch
    const parsed = new Date(Number(year), Number(month) - 1, Number(day))
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })
  }

  const parsed = new Date(text)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })
  }

  return text
}

const formatDisplayTime = (value: unknown) => {
  if (value == null || value === "") return "—"

  const text = String(value).trim()
  if (!text) return "—"

  const timeMatch = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (timeMatch) {
    const hour = Number(timeMatch[1])
    const minute = Number(timeMatch[2])
    const parsed = new Date()
    parsed.setHours(hour, minute, 0, 0)
    return parsed.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const parsed = new Date(text)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  return text
}

export const columns: ColumnDef<SessionRow>[] = [
  {
    accessorKey: "appointmentTypes",
    header: "Appointment Type",
    cell: ({ row }) => {
      const value = row.getValue("appointmentTypes") as string[] | undefined
      return <span className="text-sm">{value && value.length > 0 ? value.join(", ") : "Not selected"}</span>
    },
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <span className="text-sm">{formatDisplayDate(row.getValue("date"))}</span>,
  },
  {
    accessorKey: "startTime",
    header: "Start",
    cell: ({ row }) => <span className="text-sm">{formatDisplayTime(row.getValue("startTime"))}</span>,
  },
  {
    accessorKey: "endTime",
    header: "End",
    cell: ({ row }) => <span className="text-sm">{formatDisplayTime(row.getValue("endTime"))}</span>,
  },
  {
    accessorKey: "slots",
    header: "Slots",
    cell: ({ row }) => <span className="font-medium">{row.getValue("slots")}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <span className="text-sm">{row.getValue("status")}</span>,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const session = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Session actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('edit-session', { detail: session }))}>Edit session</DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('delete-session', { detail: session }))}>Delete session</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
