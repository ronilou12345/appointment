"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  UsersIcon, 
  CreditCardIcon, 
  CalendarCheckIcon, 
  FilePlusIcon,
  ArrowRightIcon,
  SearchIcon,
  CheckCircle2Icon,
  BellIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface StaffDashboardProps {
  user: {
    name: string
    email: string
  }
}

export function StaffDashboard({ user }: StaffDashboardProps) {
  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-600 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Welcome, {user.name.split(" ")[0]}!
            </h1>
            <p className="text-white/80 max-w-md">
              You have 5 new registrations pending review, and 12 appointments scheduled for today.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="rounded-full shadow-lg text-emerald-800 hover:text-emerald-900">
              <FilePlusIcon className="mr-2 size-4" />
              Register Patient
            </Button>
            <Button variant="outline" className="rounded-full bg-white/10 border-white/20 hover:bg-white/20 text-white">
              <SearchIcon className="mr-2 size-4" />
              Find Record
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
          { label: "Today's Appointments", value: "12", sub: "3 arrived", icon: CalendarCheckIcon, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Pending Verifications", value: "5", sub: "Insurance checks needed", icon: UsersIcon, color: "text-orange-500", bg: "bg-orange-50" },
          { label: "Unpaid Billings", value: "8", sub: "Action required today", icon: CreditCardIcon, color: "text-rose-500", bg: "bg-rose-50" },
          { label: "New Alerts", value: "2", sub: "Check notifications", icon: BellIcon, color: "text-amber-500", bg: "bg-amber-50" },
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
        {/* Recent Registrations */}
        <Card className="border-none shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Recent Patient Registrations</CardTitle>
              <CardDescription>Review and verify newly added patients.</CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowRightIcon className="size-4 text-muted-foreground" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              {[
                { name: "Michael Chang", time: "10 mins ago", status: "PENDING", details: "Awaiting ID verification" },
                { name: "Sarah Williams", time: "1 hour ago", status: "VERIFIED", details: "Ready for appointment" },
                { name: "David Miller", time: "2 hours ago", status: "PENDING", details: "Insurance details missing" },
              ].map((patient, i) => (
                <div key={i} className="flex items-center justify-between space-x-4 rounded-xl border p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold leading-none">{patient.name}</p>
                    <p className="text-xs text-muted-foreground">{patient.details} • {patient.time}</p>
                  </div>
                  <Badge variant={patient.status === "PENDING" ? "secondary" : "default"} className="text-xs">{patient.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Items List */}
        <Card className="border-none shadow-sm flex flex-col bg-muted/20">
          <CardHeader>
            <CardTitle>Administrative Tasks</CardTitle>
            <CardDescription>Your prioritized admin to-dos for today.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
             <div className="space-y-3">
               {[
                 { title: "Process payment for John Doe", time: "Immediate", urgent: true, done: false },
                 { title: "Verify insurance for Alice Smith", time: "Due today", urgent: false, done: false },
                 { title: "Send appointment reminders for tomorrow", time: "Due at 3 PM", urgent: false, done: false },
                 { title: "Reconcile yesterday's petty cash", time: "Completed", urgent: false, done: true },
               ].map((task, i) => (
                 <div key={i} className={`flex items-start gap-4 p-3 rounded-lg border ${task.done ? 'bg-muted/50 opacity-60' : 'bg-white shadow-sm'}`}>
                   {task.done ? (
                     <CheckCircle2Icon className="size-5 text-emerald-500 mt-0.5 shrink-0" />
                   ) : (
                     <div className={`size-5 rounded-full border-2 ${task.urgent ? 'border-rose-500 bg-rose-50' : 'border-muted-foreground/30'} mt-0.5 shrink-0`} />
                   )}
                   <div className="space-y-1 flex-1">
                     <p className={`text-sm font-medium ${task.done ? 'line-through text-muted-foreground' : ''}`}>
                       {task.title}
                     </p>
                     <p className="text-xs text-muted-foreground font-medium">
                       Timing: <span className={task.urgent && !task.done ? "text-rose-500" : ""}>{task.time}</span>
                     </p>
                   </div>
                   {!task.done && (
                     <Button variant="ghost" size="sm" className="h-7 text-xs">Review</Button>
                   )}
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
