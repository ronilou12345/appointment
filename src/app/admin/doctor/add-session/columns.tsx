"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, PencilIcon, Trash2Icon } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
      const visibleTypes = (value ?? []).filter((item) => typeof item === "string" && item.trim() && item !== "Others___")
      return <span className="text-sm">{visibleTypes.length > 0 ? visibleTypes.join(", ") : "Not selected"}</span>
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
    cell: ({ row }) => {
      const slotCount = Number(row.getValue("slots") ?? 0)

      const slotClass = (() => {
        if (slotCount <= 0) {
          return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-950/30 dark:text-slate-300 dark:border-slate-800"
        }

        if (slotCount >= 1 && slotCount <= 5) {
          return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800"
        }

        if (slotCount <= 10) {
          return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800"
        }

        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
      })()

      return <Badge className={`${slotClass} font-medium`}>{slotCount}</Badge>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = String(row.getValue("status") ?? "Active").trim()

      const statusClass = (() => {
        switch (status.toLowerCase()) {
          case "inactive":
            return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800"
          case "cancelled":
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
            <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('edit-session', { detail: session }))}>
              <PencilIcon className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('delete-session', { detail: session }))}>
              <Trash2Icon className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
