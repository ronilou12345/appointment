"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  UsersIcon, 
  StethoscopeIcon, 
  ClipboardListIcon, 
  ActivityIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  AlertCircleIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface NurseDashboardProps {
  user: {
    name: string
    email: string
  }
}

export function NurseDashboard({ user }: NurseDashboardProps) {
  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Hello, {user.name.split(" ")[0]}!
            </h1>
            <p className="text-white/80 max-w-md">
              You have 12 patients assigned today and 3 pending medical reports to review. Have a great shift!
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="rounded-full shadow-lg text-indigo-700 hover:text-indigo-800">
              <ClipboardListIcon className="mr-2 size-4" />
              My Tasks
            </Button>
            <Button variant="outline" className="rounded-full bg-white/10 border-white/20 hover:bg-white/20 text-white">
              <StethoscopeIcon className="mr-2 size-4" />
              Patient Intakes
            </Button>
          </div>
        </div>
        {/* Decorative background elements */}
        <div className="absolute -right-8 -top-8 size-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 size-80 rounded-full bg-black/10 blur-3xl pointer-events-none" />
      </section>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Assigned Patients", value: "12", sub: "3 currently waiting", icon: UsersIcon, color: "text-indigo-500", bg: "bg-indigo-50" },
          { label: "Pending Vitals", value: "4", sub: "Requires immediate attention", icon: ActivityIcon, color: "text-rose-500", bg: "bg-rose-50" },
          { label: "Pending Reports", value: "3", sub: "Awaiting final review", icon: ClipboardListIcon, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Shift Progress", value: "65%", sub: "4 hours remaining", icon: ClockIcon, color: "text-emerald-500", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <Card key={i} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <div className={`${stat.bg} p-2 rounded-lg`}>
                  <stat.icon className={`size-4 ${stat.color}`} />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <div className="text-2xl font-bold">{stat.value}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Patient Queue */}
        <Card className="border-none shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Active Patient Queue</CardTitle>
              <CardDescription>Patients currently waiting for triage or care.</CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowRightIcon className="size-4 text-muted-foreground" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              {[
                { name: "John Doe", room: "Room 102", status: "WAITING", time: "10 mins", flag: "critical" },
                { name: "Alice Smith", room: "Waiting Area", status: "TRIAGE", time: "25 mins", flag: "normal" },
                { name: "Robert Johnson", room: "Room 205", status: "OBSERVATION", time: "1 hr", flag: "normal" },
                { name: "Emily Chen", room: "Room 104", status: "WAITING", time: "5 mins", flag: "urgent" },
              ].map((patient, i) => (
                <div key={i} className="flex items-center justify-between space-x-4 rounded-xl border p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold leading-none">{patient.name}</p>
                      {patient.flag === "critical" && <Badge variant="destructive" className="text-[10px] px-1.5 h-4">CRITICAL</Badge>}
                      {patient.flag === "urgent" && <Badge className="bg-amber-500 hover:bg-amber-600 text-[10px] px-1.5 h-4">URGENT</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{patient.room} • Waiting: {patient.time}</p>
                  </div>
                  <Badge variant={patient.status === "WAITING" ? "secondary" : "outline"} className="text-xs">{patient.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tasks & Reminders */}
        <Card className="border-none shadow-sm flex flex-col bg-muted/20">
          <CardHeader>
            <CardTitle>Shift Tasks & Reminders</CardTitle>
            <CardDescription>Your prioritized tasks for the day.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
             <div className="space-y-3">
               {[
                 { title: "Administer meds in Room 102", type: "medication", time: "10:30 AM", urgent: true, done: false },
                 { title: "Review morning lab results", type: "lab", time: "11:00 AM", urgent: false, done: false },
                 { title: "Discharge instructions for Bed 4", type: "general", time: "1:00 PM", urgent: false, done: false },
                 { title: "Restock primary supply cart", type: "inventory", time: "Completed", urgent: false, done: true },
               ].map((task, i) => (
                 <div key={i} className={`flex items-start gap-4 p-3 rounded-lg border ${task.done ? 'bg-muted/50 opacity-60' : 'bg-white shadow-sm'}`}>
                   {task.done ? (
                     <CheckCircle2Icon className="size-5 text-emerald-500 mt-0.5 shrink-0" />
                   ) : task.urgent ? (
                     <AlertCircleIcon className="size-5 text-rose-500 mt-0.5 shrink-0" />
                   ) : (
                     <div className="size-5 rounded-full border-2 border-muted-foreground/30 mt-0.5 shrink-0" />
                   )}
                   <div className="space-y-1 flex-1">
                     <p className={`text-sm font-medium ${task.done ? 'line-through text-muted-foreground' : ''}`}>
                       {task.title}
                     </p>
                     <p className="text-xs text-muted-foreground flex items-center gap-1">
                       <ClockIcon className="size-3" />
                       {task.time}
                     </p>
                   </div>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
