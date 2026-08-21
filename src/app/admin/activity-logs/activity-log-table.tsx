"use client"

import * as React from "react"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { ActivityLogRow } from "@/lib/activity-log"
import { formatActivityTimestamp, getActivityLogColumns } from "./columns"

const ROLE_FILTERS = ["All", "Admin", "Doctor", "Client"] as const

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 border-b py-3 last:border-b-0">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground break-words">{value || "—"}</dd>
    </div>
  )
}

export function ActivityLogTable({ rows }: { rows: ActivityLogRow[] }) {
  const [roleFilter, setRoleFilter] = React.useState<(typeof ROLE_FILTERS)[number]>("All")
  const [selected, setSelected] = React.useState<ActivityLogRow | null>(null)

  const filteredRows = React.useMemo(() => {
    if (roleFilter === "All") return rows
    return rows.filter((row) => row.role === roleFilter)
  }, [rows, roleFilter])

  const columns = React.useMemo(() => getActivityLogColumns(setSelected), [])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ROLE_FILTERS.map((role) => (
          <Button
            key={role}
            type="button"
            size="sm"
            variant={roleFilter === role ? "default" : "outline"}
            onClick={() => setRoleFilter(role)}
          >
            {role}
          </Button>
        ))}
      </div>
      <DataTable columns={columns} data={filteredRows} />

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>Activity details</SheetTitle>
            <SheetDescription>Full record for this activity log entry.</SheetDescription>
          </SheetHeader>

          {selected ? (
            <dl className="px-6 py-2">
              <DetailRow label="Date & Time" value={formatActivityTimestamp(selected.createdAt)} />
              <DetailRow label="User" value={selected.userName || "Unknown user"} />
              <DetailRow label="Email" value={selected.userEmail} />
              <DetailRow
                label="Role"
                value={<Badge variant={selected.role === "Admin" ? "destructive" : selected.role === "Doctor" ? "secondary" : "default"}>{selected.role}</Badge>}
              />
              <DetailRow label="Action" value={selected.action} />
              <DetailRow label="Details" value={selected.details || "—"} />
              <DetailRow label="Record type" value={selected.entityType} />
              <DetailRow label="Record ID" value={selected.entityId} />
              <DetailRow label="User ID" value={selected.userId} />
              <DetailRow label="Log ID" value={selected.id} />
            </dl>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
