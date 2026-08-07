"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ClientAppointmentActionsProps = {
  currentDate: string
  currentTime: string
}

export default function ClientAppointmentActions({ currentDate, currentTime }: ClientAppointmentActionsProps) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [scheduledDate, setScheduledDate] = useState(currentDate)
  const [scheduledTime, setScheduledTime] = useState(currentTime)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [appointmentStatus, setAppointmentStatus] = useState("Upcoming")
  const [cancelReason, setCancelReason] = useState("")

  const handleReschedule = () => {
    setStatusMessage(`Appointment rescheduled to ${scheduledDate} at ${scheduledTime}.`)
    setAppointmentStatus("Rescheduled")
    setRescheduleOpen(false)
  }

  const handleCancel = () => {
    if (!cancelReason.trim()) {
      setStatusMessage("Please provide a reason for canceling the appointment.")
      return
    }

    setStatusMessage(`Appointment canceled: ${cancelReason}`)
    setAppointmentStatus("Cancelled")
    setCancelOpen(false)
    setCancelReason("")
  }

  return (
    <div className="rounded-[32px] border border-border bg-background p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold">Manage appointment</h3>
          <p className="mt-1 text-sm text-muted-foreground">Reschedule or cancel this booking before your next visit.</p>
        </div>
        <div className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground">
          {appointmentStatus}
        </div>
      </div>

      {statusMessage ? (
        <div className="mt-6 rounded-3xl border border-border bg-card p-4 text-sm text-foreground">
          {statusMessage}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" className="w-full sm:w-auto" onClick={() => setRescheduleOpen(true)}>
          Reschedule
        </Button>
        <Button variant="destructive" className="w-full sm:w-auto" onClick={() => setCancelOpen(true)}>
          Cancel appointment
        </Button>
      </div>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="space-y-6">
          <DialogHeader>
            <DialogTitle>Reschedule appointment</DialogTitle>
            <DialogDescription>Pick a new date and time for your appointment.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-foreground">New date</p>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(event) => setScheduledDate(event.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">New time</p>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(event) => setScheduledTime(event.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setRescheduleOpen(false)}>
              Close
            </Button>
            <Button onClick={handleReschedule}>Confirm reschedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="space-y-6">
          <DialogHeader>
            <DialogTitle>Cancel appointment</DialogTitle>
            <DialogDescription>Provide a reason for the cancellation before confirming.</DialogDescription>
          </DialogHeader>

          <div className="rounded-3xl border border-border bg-card p-5 text-sm text-foreground">
            <p className="font-semibold">Are you sure you want to cancel this appointment?</p>
            <p className="mt-2 text-muted-foreground">Once canceled, you can rebook a new visit from the appointment page.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Reason for cancellation</label>
            <Textarea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Enter a brief reason for the cancellation"
              className="min-h-[120px]"
            />
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>
              Keep appointment
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              Confirm cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
