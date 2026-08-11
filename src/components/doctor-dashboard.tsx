"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { CalendarDays, ClipboardList, HeartPulse, Stethoscope, Users, CalendarCheck, Activity } from "lucide-react"

type DoctorDashboardProps = {
  todayPatients?: number
  confirmedAppointments?: number
  sessionsCount?: number
  nextAppointments?: Array<{
    id?: string
    time?: string
    date?: string
    name?: string
    status?: string
    appointmentType?: string
    avatar?: string | null
  }>
}

export function DoctorDashboard({
  todayPatients = 0,
  confirmedAppointments = 0,
  sessionsCount = 0,
  nextAppointments = [],
}: DoctorDashboardProps) {
  const formatTime = (time24?: string) => {
    if (!time24) return ""
    const parts = time24.split(":")
    if (parts.length !== 2) return time24
    const hh = Number(parts[0])
    const mm = Number(parts[1])
    const ampm = hh >= 12 ? "PM" : "AM"
    const hour12 = ((hh + 11) % 12) + 1
    return `${hour12}:${String(mm).padStart(2, "0")} ${ampm}`
  }
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-6 py-4 md:py-6">
        <div className="grid gap-4 px-4 md:grid-cols-4 lg:px-6">
          <Card>
            <CardHeader className="flex items-start justify-between gap-4 pb-2">
              <div>
                <CardTitle className="text-sm font-medium">Today’s Patients</CardTitle>
                <CardDescription>Reviewed appointments</CardDescription>
              </div>
              <Users className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{todayPatients}</div>
              <div className="mt-2 flex items-center gap-2 text-xs text-foreground/70">
                <HeartPulse className="size-4" />
                {todayPatients > 0
                  ? `${todayPatients} appointment${todayPatients === 1 ? "" : "s"} today`
                  : "No appointments today"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-start justify-between gap-4 pb-2">
              <div>
                <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                <CardDescription>Confirmed today</CardDescription>
              </div>
              <CalendarDays className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{confirmedAppointments}</div>
              <div className="mt-2 flex items-center gap-2 text-xs text-foreground/70">
                <Activity className="size-4" />
                {confirmedAppointments > 0
                  ? `${confirmedAppointments} confirmed today`
                  : "No confirmed appointments today"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-start justify-between gap-4 pb-2">
              <div>
                <CardTitle className="text-sm font-medium">Sessions</CardTitle>
                <CardDescription>Availability blocks</CardDescription>
              </div>
              <CalendarCheck className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{sessionsCount}</div>
              <div className="mt-2 flex items-center gap-2 text-xs text-foreground/70">
                <Stethoscope className="size-4" />
                {sessionsCount > 0
                  ? `${sessionsCount} active session${sessionsCount === 1 ? "" : "s"} today`
                  : "No active sessions today"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-start justify-between gap-4 pb-2">
              <div>
                <CardTitle className="text-sm font-medium">Files to review</CardTitle>
                <CardDescription>Lab results & notes</CardDescription>
              </div>
              <ClipboardList className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">6</div>
              <div className="mt-2 flex items-center gap-2 text-xs text-foreground/70">
                <span className="rounded-full bg-muted px-2 py-1">3 urgent</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 px-4 lg:grid-cols-[1.5fr_1fr] lg:px-6">
          <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Appointment trend</CardTitle>
                <CardDescription>Estimated patient volume over the last month.</CardDescription>
              </div>
              <Badge variant="secondary">Live</Badge>
            </CardHeader>
            <CardContent>
              <ChartAreaInteractive />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Next appointments</CardTitle>
                <CardDescription>Upcoming consultations in the next 12 hours.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {nextAppointments && nextAppointments.length > 0 ? (
                  nextAppointments.map((item) => (
                    <div
                      key={item.id ?? `${item.date}-${item.time}`}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-border bg-background p-4"
                    >
                      <span className="text-sm font-medium text-foreground">{formatTime(item.time)}</span>
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.appointmentType ?? "General consultation"}</div>
                      </div>
                      <Badge variant={item.status === "Confirmed" ? "default" : "outline"}>{item.status}</Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No upcoming appointments</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top procedures</CardTitle>
                <CardDescription>Most frequent today.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {[
                  { title: "Telehealth", value: "28%" },
                  { title: "General Checkup", value: "22%" },
                  { title: "Follow-up", value: "16%" },
                ].map((item) => (
                  <div key={item.title} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">Most scheduled</p>
                    </div>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
