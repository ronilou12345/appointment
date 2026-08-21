"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import type { ActivityLogRow } from "@/lib/activity-log"

export function formatActivityTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function roleVariant(role: string) {
  if (role === "Admin") return "destructive" as const
  if (role === "Doctor") return "secondary" as const
  return "default" as const
}

export function getActivityLogColumns(
  onViewDetails: (row: ActivityLogRow) => void,
): ColumnDef<ActivityLogRow>[] {
  return [
    {
      accessorKey: "createdAt",
      header: "Date & Time",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {formatActivityTimestamp(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "userName",
      header: "User",
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col">
          <span className="font-medium">{row.original.userName || "Unknown user"}</span>
          {row.original.userEmail ? (
            <span className="truncate text-sm text-muted-foreground">{row.original.userEmail}</span>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => <Badge variant={roleVariant(row.original.role)}>{row.original.role}</Badge>,
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => <span className="font-medium">{row.original.action}</span>,
    },
    {
      accessorKey: "details",
      header: "Details",
      cell: ({ row }) => (
        <button
          type="button"
          className="text-sm font-medium text-primary hover:underline"
          onClick={() => onViewDetails(row.original)}
        >
          View details
        </button>
      ),
    },
  ]
}
