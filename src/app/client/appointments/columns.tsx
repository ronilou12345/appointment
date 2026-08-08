"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Textarea } from "@/components/ui/textarea"
import { CalendarDays, MoreHorizontal, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type ClientAppointmentRow = {
  id: string
  doctorId: string
  doctorName: string
  doctorAvatar?: string
  doctorEmail: string
  specialty: string
  date: string
  time: string
  status: string
}

function AppointmentActionsCell({ appointment }: { appointment: ClientAppointmentRow }) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState("asap")
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [error, setError] = useState("")

  const canManageAppointment = !["confirmed", "completed", "cancelled", "canceled"].includes(
    (appointment.status ?? "").toLowerCase(),
  )

  const deliveryTimes = [
    {
      value: "asap",
      label: "Standard delivery",
      description: "25–35 min · Driver assigned now",
      badge: "Fastest",
    },
    {
      value: "5-00",
      label: "5:00 PM – 5:15 PM",
      description: "Prep starts at 4:45 PM",
    },
    {
      value: "5-30",
      label: "5:30 PM – 5:45 PM",
      description: "Good if you\'re heading home",
    },
    {
      value: "6-00",
      label: "6:00 PM – 6:15 PM",
      description: "Most popular · High demand",
    },
    {
      value: "6-30",
      label: "6:30 PM – 6:45 PM",
      description: "Last slot before kitchen closes",
    },
  ]

  const handleCancelSubmit = () => {
    if (!cancelReason.trim()) {
      setError("Please provide a reason for cancellation.")
      return
    }

    // TODO: wire this to your cancellation API or action
    console.log(`Cancel appointment ${appointment.id}: ${cancelReason}`)
    setCancelOpen(false)
    setCancelReason("")
    setError("")
  }

  const handleRescheduleSubmit = () => {
    const selected = deliveryTimes.find((time) => time.value === selectedSlot)
    console.log(`Reschedule appointment ${appointment.id} using slot ${selected?.label}`)
    setRescheduleOpen(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={!canManageAppointment}>
            <span className="sr-only">Open appointment actions</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={!canManageAppointment}
            onSelect={() => {
              if (!canManageAppointment) return
              setCancelOpen(true)
            }}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canManageAppointment}
            onSelect={() => {
              if (!canManageAppointment) return
              setRescheduleOpen(true)
            }}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            Reschedule
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Drawer
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        direction="right"
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Reschedule Appointment</DrawerTitle>
            <DrawerDescription>
              Pick an available date and time on the right side.
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-4 px-4 py-4">
            <div className="rounded-3xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Current appointment</p>
              <p className="mt-2 text-base font-semibold">{appointment.date} at {appointment.time}</p>
              <p className="mt-1 text-sm">{appointment.doctorName}</p>
              <p className="text-sm text-muted-foreground">{appointment.doctorEmail}</p>
            </div>

            <div className="grid gap-3">
              {deliveryTimes.map((slot) => {
                const isSelected = slot.value === selectedSlot
                return (
                  <button
                    key={slot.value}
                    type="button"
                    onClick={() => setSelectedSlot(slot.value)}
                    className={
                      `w-full overflow-hidden rounded-3xl border p-4 text-left transition ` +
                      (isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:border-primary/70")
                    }
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-base font-medium">{slot.label}</p>
                      {slot.badge ? (
                        <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold">
                          {slot.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{slot.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
            <Button onClick={handleRescheduleSubmit}>Confirm reschedule</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Please enter the reason for cancelling this appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              value={cancelReason}
              onChange={(event) => {
                setCancelReason(event.target.value)
                setError("")
              }}
              placeholder="Reason for cancellation"
              className="min-h-[120px]"
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Close
            </Button>
            <Button onClick={handleCancelSubmit}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

const getStatusClasses = (status: string) => {
  const normalized = status?.toLowerCase() ?? "upcoming"

  switch (normalized) {
    case "upcoming":
      return "bg-sky-100 text-sky-800 ring-1 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800/60"
    case "confirmed":
      return "bg-blue-100 text-blue-800 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800/60"
    case "completed":
      return "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/60"
    case "cancelled":
    case "canceled":
      return "bg-rose-100 text-rose-800 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800/60"
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:ring-slate-700"
  }
}

export const columns: ColumnDef<ClientAppointmentRow>[] = [
  {
    accessorKey: "doctorName",
    header: "Doctor",
    cell: ({ row }) => {
      const appointment = row.original
      const doctorName = String(row.getValue("doctorName"))
      const avatar = appointment.doctorAvatar

      return (
        <Link href={`/client/appointments/${appointment.id}`} className="flex items-center gap-3 text-primary hover:underline">
          <Avatar size="sm">
            {avatar ? <AvatarImage src={avatar} alt={doctorName} /> : <AvatarFallback>{doctorName.split(" ").slice(0, 2).map((part) => part[0]).join("")}</AvatarFallback>}
          </Avatar>
          <div>
            <p>{doctorName}</p>
            <p className="text-sm text-muted-foreground">{appointment.doctorEmail}</p>
          </div>
        </Link>
      )
    },
  },
  {
    accessorKey: "specialty",
    header: "Appointment type",
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
    cell: ({ row }) => <AppointmentActionsCell appointment={row.original} />,
  },
]
