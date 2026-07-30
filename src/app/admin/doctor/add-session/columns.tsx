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
}

export const columns: ColumnDef<SessionRow>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => row.getValue("date"),
  },
  {
    accessorKey: "startTime",
    header: "Start",
    cell: ({ row }) => row.getValue("startTime"),
  },
  {
    accessorKey: "endTime",
    header: "End",
    cell: ({ row }) => row.getValue("endTime"),
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => row.getValue("duration"),
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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(session.id)}>
              Copy session ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Edit session</DropdownMenuItem>
            <DropdownMenuItem>Delete session</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
