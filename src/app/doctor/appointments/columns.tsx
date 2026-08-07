"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Textarea } from "@/components/ui/textarea"
import { Check, CheckCircle2, MoreHorizontal, X } from "lucide-react"

export type DoctorAppointmentRow = {
  id: string
  patientId: string
  patientName: string
  patientAge: string
  patientGender: string
  doctorName: string
  specialty: string
  date: string
  time: string
  status: string
}

function DoctorAppointmentActionsCell({ appointment }: { appointment: DoctorAppointmentRow }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState("10-00")
  const [cancelReason, setCancelReason] = useState("")
  const [loadingAction, setLoadingAction] = useState<"" | "Confirm" | "Complete">("")
  const [error, setError] = useState<string | null>(null)

  const availableSlots = [
    {
      value: "10-00",
      label: "10:00 AM",
      description: `Available with Dr. ${appointment.doctorName}`,
    },
    {
      value: "10-30",
      label: "10:30 AM",
      description: "Next available opening",
    },
    {
      value: "11-00",
      label: "11:00 AM",
      description: "Good for follow-up discussions",
    },
    {
      value: "11-30",
      label: "11:30 AM",
      description: "Available later this morning",
    },
  ]

  const statusValue = appointment.status.toLowerCase()
  const canConfirm = statusValue !== "confirmed" && statusValue !== "completed"
  const canComplete = statusValue !== "completed"
  const canCancel = statusValue !== "completed"

  const handleAction = async (action: "Confirm" | "Complete" | "Cancel") => {
    setMenuOpen(false)
    if (action === "Cancel") {
      setDrawerOpen(true)
      return
    }

    setLoadingAction(action)
    setError(null)

    try {
      const response = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: Number(appointment.id), action }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to update appointment status")
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoadingAction("")
    }
  }

  const handleSubmitCancel = () => {
    console.log(`Cancel appointment ${appointment.id} and reschedule to ${selectedSlot}: ${cancelReason}`)
    setDrawerOpen(false)
    setCancelReason("")
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 w-9 p-0">
            <span className="sr-only">Open appointment actions</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem disabled={!canConfirm || loadingAction === "Confirm"} onSelect={() => handleAction("Confirm") }>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Confirm
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!canComplete || loadingAction === "Complete"} onSelect={() => handleAction("Complete") }>
            <Check className="mr-2 h-4 w-4" />
            Complete
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" disabled={!canCancel} onSelect={() => handleAction("Cancel") }>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
        <DrawerContent className="flex h-full max-h-[calc(100vh-4rem)] flex-col overflow-hidden">
          <DrawerHeader>
            <DrawerTitle>Cancel & Reschedule</DrawerTitle>
            <DrawerDescription>
              Choose a new time and add a reason for the cancellation.
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="rounded-3xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Current appointment</p>
              <p className="mt-2 text-base font-semibold">{appointment.date} at {appointment.time}</p>
              <p className="mt-1 text-sm text-muted-foreground">{appointment.doctorName}</p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">Available times</p>
              <div className="grid gap-3">
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot === slot.value
                  return (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => setSelectedSlot(slot.value)}
                      className={`w-full rounded-3xl border p-4 text-left transition ${
                        isSelected ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/70"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-base font-semibold">{slot.label}</p>
                        {isSelected ? <Badge variant="secondary">Selected</Badge> : null}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{slot.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">Reason for cancellation</p>
              </div>
              <Textarea
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                placeholder="Add a brief reason for the cancellation"
                className="min-h-[128px]"
              />
            </div>
          </div>

          <DrawerFooter>
            <DrawerClose render={<Button variant="outline">Close</Button>} />
            <Button onClick={handleSubmitCancel}>Submit</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export const columns: ColumnDef<DoctorAppointmentRow>[] = [
  {
    accessorKey: "patientName",
    header: "Patient",
    cell: ({ row }) => {
      const appointment = row.original
      return (
        <div className="space-y-1">
          <Link href={`/doctor/appointments/${appointment.id}`} className="text-primary hover:underline">
            {String(row.getValue("patientName"))}
          </Link>
          <p className="text-xs text-muted-foreground">
            {appointment.patientAge} yrs · {appointment.patientGender}
          </p>
        </div>
      )
    },
  },
  {
    accessorKey: "specialty",
    header: "Appointment Type",
    cell: ({ row }) => row.getValue("specialty"),
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => row.getValue("date"),
  },
  {
    accessorKey: "time",
    header: "Time",
    cell: ({ row }) => row.getValue("time"),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = String(row.getValue("status"))
      const variant = status === "Confirmed" ? "default" : status === "Pending" ? "secondary" : "outline"
      return <Badge variant={variant}>{status}</Badge>
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const appointment = row.original
      return <DoctorAppointmentActionsCell appointment={appointment} />
    },
  },
]
