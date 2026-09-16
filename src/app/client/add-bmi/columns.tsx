"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, PencilIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type VitalRow = {
  id: string
  userId: string | null
  userName: string
  userAvatar: string
  date: string
  weight: number | null
  height: number | null
  bmi: number | null
  heartRate: number | null
  temp: number | null
  bloodSugar: number | null
}

function formatValue(value: number | null, digits = 1) {
  if (value == null || Number.isNaN(value)) return "—"
  return digits === 0 ? String(Math.round(value)) : Number(value).toFixed(digits)
}

export function getVitalColumns({
  onEdit,
  onDelete,
}: {
  onEdit: (row: VitalRow) => void
  onDelete: (row: VitalRow) => void
}): ColumnDef<VitalRow>[] {
  return [
    {
      accessorKey: "userName",
      header: "Client",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar size="sm" className="size-7">
            {row.original.userAvatar ? <AvatarImage src={row.original.userAvatar} alt={row.original.userName} /> : null}
            <AvatarFallback>{row.original.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="max-w-36 truncate text-sm">{row.original.userName}</span>
        </div>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => <span className="text-sm">{row.original.date || "—"}</span>,
    },
    {
      accessorKey: "weight",
      header: "Weight (kg)",
      cell: ({ row }) => <span className="text-sm">{formatValue(row.original.weight, 1)}</span>,
    },
    {
      accessorKey: "height",
      header: "Height (cm)",
      cell: ({ row }) => <span className="text-sm">{formatValue(row.original.height, 1)}</span>,
    },
    {
      accessorKey: "bmi",
      header: "BMI",
      cell: ({ row }) => <span className="text-sm font-medium">{formatValue(row.original.bmi, 1)}</span>,
    },
    {
      accessorKey: "heartRate",
      header: "Heart Rate",
      cell: ({ row }) => <span className="text-sm">{formatValue(row.original.heartRate, 0)}</span>,
    },
    {
      accessorKey: "temp",
      header: "Body Temp",
      cell: ({ row }) => <span className="text-sm">{formatValue(row.original.temp, 1)}</span>,
    },
    {
      accessorKey: "bloodSugar",
      header: "Blood Sugar",
      cell: ({ row }) => <span className="text-sm">{formatValue(row.original.bloodSugar, 1)}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const vital = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open vitals actions</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Vitals actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(vital)}>
                <PencilIcon className="mr-2 h-4 w-4 text-primary" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(vital)}>
                <Trash2Icon className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
