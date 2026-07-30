"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  ActivityIcon, 
  CalendarIcon, 
  ClockIcon, 
  FileTextIcon, 
  HeartPulseIcon, 
  ThermometerIcon, 
  WeightIcon,
  ArrowUpRightIcon,
  PlusIcon
} from "lucide-react"
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  CartesianGrid 
} from "recharts"
import { Button } from "@/components/ui/button"

const healthData = [
  { day: "Mon", bpm: 72, temp: 36.6 },
  { day: "Tue", bpm: 75, temp: 36.7 },
  { day: "Wed", bpm: 70, temp: 36.5 },
  { day: "Thu", bpm: 82, temp: 36.8 },
  { day: "Fri", bpm: 74, temp: 36.6 },
  { day: "Sat", bpm: 68, temp: 36.4 },
  { day: "Sun", bpm: 71, temp: 36.5 },
]

interface PatientDashboardProps {
  user: {
    name: string
    email: string
  }
}

export function PatientDashboard({ user }: PatientDashboardProps) {
  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 to-primary p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Welcome back, {user.name.split(" ")[0]}!
            </h1>
            <p className="text-primary-foreground/80 max-w-md">
              Your health journey is looking great. You have an upcoming appointment this Thursday at 10:00 AM.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="rounded-full shadow-lg">
              <CalendarIcon className="mr-2 size-4" />
              Book Appointment
            </Button>
            <Button variant="outline" className="rounded-full bg-white/10 border-white/20 hover:bg-white/20 text-white">
              <FileTextIcon className="mr-2 size-4" />
              View Records
            </Button>
          </div>
        </div>
        {/* Decorative background elements */}
        <div className="absolute -right-8 -top-8 size-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 size-80 rounded-full bg-primary-foreground/10 blur-3xl" />
      </section>

      {/* Vitals Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Heart Rate", value: "72", unit: "bpm", icon: HeartPulseIcon, color: "text-red-500", bg: "bg-red-50" },
          { label: "Body Temp", value: "36.6", unit: "°C", icon: ThermometerIcon, color: "text-orange-500", bg: "bg-orange-50" },
          { label: "Weight", value: "68.5", unit: "kg", icon: WeightIcon, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Blood Sugar", value: "94", unit: "mg/dL", icon: ActivityIcon, color: "text-emerald-500", bg: "bg-emerald-50" },
        ].map((vital, i) => (
          <Card key={i} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">{vital.label}</p>
                <div className={`${vital.bg} p-2 rounded-lg`}>
                  <vital.icon className={`size-4 ${vital.color}`} />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <div className="text-2xl font-bold">{vital.value}</div>
                <div className="text-xs text-muted-foreground font-medium">{vital.unit}</div>
              </div>
              <div className="mt-4 flex items-center text-xs text-emerald-600 font-medium">
                <ArrowUpRightIcon className="mr-1 size-3" />
                Normal Range
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Chart Column */}
        <Card className="lg:col-span-4 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Health Trends</CardTitle>
            <CardDescription>Your heart rate activity over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={healthData}>
                  <defs>
                    <linearGradient id="colorBpm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="bpm" 
                    stroke="var(--primary)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorBpm)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar Column */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <PlusIcon className="size-4" />
                </Button>
            </CardHeader>
            <CardContent className="grid gap-4">
              {[
                { title: "General Checkup", date: "Oct 24, 2026", time: "10:00 AM", doctor: "Dr. Sarah Smith" },
                { title: "Dental Scaling", date: "Nov 02, 2026", time: "02:30 PM", doctor: "Dr. James Wilson" },
              ].map((apt, i) => (
                <div key={i} className="flex items-center space-x-4 rounded-xl border p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ClockIcon className="size-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold leading-none">{apt.title}</p>
                    <p className="text-xs text-muted-foreground">{apt.date} • {apt.time}</p>
                    <p className="text-xs font-medium text-primary mt-1">{apt.doctor}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">Medications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
               {[
                 { name: "Amoxicillin", dose: "500mg, twice daily", remaining: "4 days left" },
                 { name: "Vitamine C", dose: "1000mg, once daily", remaining: "Ongoing" },
               ].map((med, i) => (
                 <div key={i} className="flex justify-between items-center text-sm">
                   <div className="space-y-0.5">
                     <p className="font-semibold">{med.name}</p>
                     <p className="text-xs text-muted-foreground">{med.dose}</p>
                   </div>
                   <div className="text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-1 rounded border shadow-sm">
                     {med.remaining}
                   </div>
                 </div>
               ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
