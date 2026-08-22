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
  ArrowDownRightIcon,
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
import { useRouter } from "next/navigation"

interface PatientDashboardProps {
  user: {
    name: string
    email: string
  }
  nextPending?: {
    id?: string
    status?: string
    title?: string
    date?: string
    time?: string
  } | null
  latestVitals?: {
    heartRate?: number | null
    bodyTemperature?: number | null
    weight?: number | null
    height?: number | null
    bloodSugar?: number | null
  } | null
  healthTrend?: {
    day: string
    bpm: number | null
    temp: number | null
  }[]
}

function formatVitalValue(value?: number | null, digits = 0) {
  if (value == null || Number.isNaN(value)) return "—"
  if (digits === 0) return String(Math.round(value))
  return Number(value).toFixed(digits)
}

function inRange(value: number | null | undefined, min: number, max: number) {
  if (value == null || Number.isNaN(value)) return null
  return value >= min && value <= max
}

function classifyVitalStatus(kind: "heartRate" | "bodyTemperature" | "weight" | "bloodSugar", vitals?: PatientDashboardProps["latestVitals"]) {
  if (!vitals) return null

  if (kind === "heartRate") {
    const normal = inRange(vitals.heartRate, 60, 100)
    if (normal == null) return null
    return { normal, range: "60–100 bpm" }
  }

  if (kind === "bodyTemperature") {
    const normal = inRange(vitals.bodyTemperature, 36.1, 37.5)
    if (normal == null) return null
    return { normal, range: "36.1–37.5 °C" }
  }

  if (kind === "bloodSugar") {
    const normal = inRange(vitals.bloodSugar, 70, 140)
    if (normal == null) return null
    return { normal, range: "70–140 mg/dL" }
  }

  if (vitals.weight == null) return null
  if (vitals.height == null || vitals.height <= 0) {
    return { normal: null, range: "Needs height for BMI" }
  }

  const heightM = vitals.height / 100
  const bmi = vitals.weight / (heightM * heightM)
  return {
    normal: bmi >= 18.5 && bmi <= 24.9,
    range: `BMI ${Math.round(bmi * 10) / 10} · 18.5–24.9`,
  }
}

export function PatientDashboard({ user, nextPending, latestVitals, healthTrend = [] }: PatientDashboardProps) {
  const router = useRouter()
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

  const showPendingAppointmentMessage = (appt?: PatientDashboardProps["nextPending"]) => {
    if (!appt || !appt.status) return "Your health journey is looking great."
    if (String(appt.status).toLowerCase() !== "pending") return "Your health journey is looking great."

    const dateStr = appt.date ? new Date(appt.date) : null
    const weekday = dateStr ? dateStr.toLocaleDateString(undefined, { weekday: "long" }) : ""
    const time = formatTime(appt.time)

    return `Your health journey is looking great. You have an upcoming appointment this ${weekday} at ${time}.`
  }

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
              {showPendingAppointmentMessage(nextPending)}
            </p>
            <p className="max-w-xl text-sm text-primary-foreground/80 leading-6">
              Stay on top of your health with quick and easy access to your appointments, medical records, and personalized care. We're here to support your wellness every step of the way.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="rounded-full shadow-lg" onClick={() => router.push('/client/book-appointment')}>
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
          { label: "Heart Rate", value: formatVitalValue(latestVitals?.heartRate), unit: "bpm", icon: HeartPulseIcon, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30", status: classifyVitalStatus("heartRate", latestVitals) },
          { label: "Body Temp", value: formatVitalValue(latestVitals?.bodyTemperature, 1), unit: "°C", icon: ThermometerIcon, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30", status: classifyVitalStatus("bodyTemperature", latestVitals) },
          { label: "Weight", value: formatVitalValue(latestVitals?.weight, 1), unit: "kg", icon: WeightIcon, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30", status: classifyVitalStatus("weight", latestVitals) },
          { label: "Blood Sugar", value: formatVitalValue(latestVitals?.bloodSugar, 1), unit: "mg/dL", icon: ActivityIcon, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", status: classifyVitalStatus("bloodSugar", latestVitals) },
        ].map((vital) => {
          const isNormal = vital.status?.normal === true
          const isNotNormal = vital.status?.normal === false
          const statusLabel = !vital.status
            ? "No record yet"
            : vital.status.normal == null
              ? vital.status.range
              : isNormal
                ? "Within range"
                : "Out of range"

          return (
          <Card key={vital.label} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
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
              <div className={`mt-4 flex items-center text-xs font-medium ${
                isNormal
                  ? "text-emerald-600 dark:text-emerald-400"
                  : isNotNormal
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted-foreground"
              }`}>
                {isNormal ? <ArrowUpRightIcon className="mr-1 size-3" /> : null}
                {isNotNormal ? <ArrowDownRightIcon className="mr-1 size-3" /> : null}
                <span>{statusLabel}</span>
              </div>
              {vital.status && vital.status.normal != null ? (
                <p className="mt-1 text-[11px] text-muted-foreground">{vital.status.range}</p>
              ) : null}
            </CardContent>
          </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Chart Column */}
        <Card className="lg:col-span-4 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Health Trends</CardTitle>
            <CardDescription>Your heart rate from recorded vitals</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              {healthTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={healthTrend}>
                  <defs>
                    <linearGradient id="colorBpm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.24} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--background))",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="bpm"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorBpm)"
                  />
                </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Record vitals to see your heart rate trend.
                </div>
              )}
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
        </div>
      </div>
    </div>
  )
}
