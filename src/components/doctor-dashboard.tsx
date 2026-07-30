"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { CalendarDays, ClipboardList, HeartPulse, Stethoscope, Users, CalendarCheck, Activity } from "lucide-react"

export function DoctorDashboard() {
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
              <div className="text-3xl font-semibold">12</div>
              <div className="mt-2 flex items-center gap-2 text-xs text-foreground/70">
                <HeartPulse className="size-4" />
                4 new patient check-ins
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
              <div className="text-3xl font-semibold">8</div>
              <div className="mt-2 flex items-center gap-2 text-xs text-foreground/70">
                <Activity className="size-4" />
                2 reschedules pending
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
              <div className="text-3xl font-semibold">5</div>
              <div className="mt-2 flex items-center gap-2 text-xs text-foreground/70">
                <Stethoscope className="size-4" />
                3 open slots left
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
                {[
                  { time: "09:30 AM", name: "Juan Dela Cruz", status: "Confirmed" },
                  { time: "11:00 AM", name: "Maria Santos", status: "Pending" },
                  { time: "01:15 PM", name: "Kevin Tan", status: "Confirmed" },
                ].map((item) => (
                  <div key={item.time} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-border bg-background p-4">
                    <span className="text-sm font-medium text-foreground">{item.time}</span>
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-xs text-muted-foreground">General consultation</div>
                    </div>
                    <Badge variant={item.status === "Confirmed" ? "default" : "outline"}>{item.status}</Badge>
                  </div>
                ))}
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
