"use client"

import { usePathname } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

function PageHeading({ action = false }: { action?: boolean }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 max-w-[65vw]" />
        <Skeleton className="h-4 w-80 max-w-[75vw]" />
      </div>
      {action ? <Skeleton className="h-9 w-28 shrink-0" /> : null}
    </div>
  )
}

function StatCards({ count = 4, className = "" }: { count?: number; className?: string }) {
  const columnsClass = count === 3 ? "xl:grid-cols-3" : "xl:grid-cols-4"

  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${columnsClass} ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="space-y-3 rounded-lg border p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-32 max-w-full" />
        </div>
      ))}
    </div>
  )
}

function TableRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-md border">
      <div className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr] gap-4 border-b px-4 py-3">
        {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-4 w-full" />)}
      </div>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr] items-center gap-4 border-b px-4 py-4 last:border-b-0">
          {Array.from({ length: 4 }, (_, cellIndex) => (
            <Skeleton key={cellIndex} className={`h-4 ${cellIndex === 0 ? "w-4/5" : "w-3/5"}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function BmiRecordsSkeleton() {
  return (
    <main className="min-h-screen w-full bg-background p-6 text-foreground" aria-busy="true" aria-label="Loading BMI records">
      <PageHeading action />
      <div className="overflow-x-auto rounded-md border">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[minmax(150px,1.5fr)_repeat(7,minmax(95px,1fr))_40px] gap-4 border-b px-4 py-3">
            {Array.from({ length: 9 }, (_, index) => <Skeleton key={index} className="h-4 w-4/5" />)}
          </div>
          {Array.from({ length: 7 }, (_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-[minmax(150px,1.5fr)_repeat(7,minmax(95px,1fr))_40px] items-center gap-4 border-b px-4 py-3 last:border-b-0">
              <div className="flex items-center gap-2"><Skeleton className="size-7 shrink-0 rounded-full" /><Skeleton className="h-4 w-24" /></div>
              {Array.from({ length: 7 }, (_, cellIndex) => <Skeleton key={cellIndex} className="h-4 w-12" />)}
              <Skeleton className="size-8 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

function TablePage({ inventory = false, appointments = false }: { inventory?: boolean; appointments?: boolean }) {
  return (
    <main className="min-h-screen w-full p-6" aria-busy="true" aria-label="Loading page content">
      <PageHeading action />
      {inventory ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-24 rounded-lg" />)}
          </div>
          <TableRows rows={7} />
          <div className="my-10 h-px w-full bg-border" />
          <div className="mb-6 flex items-end justify-between gap-4">
            <div className="space-y-2"><Skeleton className="h-8 w-52" /><Skeleton className="h-4 w-72" /></div>
            <Skeleton className="h-9 w-44" />
          </div>
          <StatCards count={3} className="mb-6" />
          <TableRows rows={4} />
        </>
      ) : appointments ? (
        <>
          <StatCards count={3} className="mb-6" />
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <TableRows rows={6} />
            <div className="space-y-4">
              {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-24 rounded-lg" />)}
            </div>
          </div>
        </>
      ) : <TableRows />}
    </main>
  )
}

function ClientDashboard() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 lg:p-8" aria-busy="true" aria-label="Loading client dashboard">
      <section className="flex min-h-56 flex-col justify-between gap-6 rounded-3xl bg-primary/10 p-8 md:flex-row md:items-center">
        <div className="space-y-3"><Skeleton className="h-10 w-72 max-w-[65vw]" /><Skeleton className="h-4 w-80 max-w-[70vw]" /><Skeleton className="h-4 w-96 max-w-[75vw]" /></div>
        <div className="flex gap-3"><Skeleton className="h-10 w-40 rounded-full" /><Skeleton className="h-10 w-36 rounded-full" /></div>
      </section>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-36 rounded-xl" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Skeleton className="h-80 rounded-xl" />
        <div className="space-y-4"><Skeleton className="h-44 rounded-xl" /><Skeleton className="h-28 rounded-xl" /></div>
      </div>
    </main>
  )
}

function DoctorDashboard() {
  return (
    <main className="w-full space-y-6 py-4 md:py-6" aria-busy="true" aria-label="Loading doctor dashboard">
      <div className="grid gap-4 px-4 md:grid-cols-2 xl:grid-cols-4 lg:px-6">
        {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-36 rounded-xl" />)}
      </div>
      <div className="grid gap-6 px-4 lg:grid-cols-[1.5fr_1fr] lg:px-6">
        <Skeleton className="h-[26rem] rounded-xl" />
        <div className="space-y-6"><Skeleton className="h-72 rounded-xl" /><Skeleton className="h-44 rounded-xl" /></div>
      </div>
    </main>
  )
}

function AdminDashboard() {
  return (
    <main className="w-full space-y-6 py-4 md:py-6" aria-busy="true" aria-label="Loading admin dashboard">
      <div className="px-4 lg:px-6"><StatCards count={4} /></div>
      <div className="px-4 lg:px-6"><Skeleton className="h-80 rounded-xl" /></div>
      <div className="space-y-4 px-4 lg:px-6"><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-72" /><TableRows rows={5} /></div>
    </main>
  )
}

function SettingsPage() {
  return (
    <main className="min-h-screen p-6" aria-busy="true" aria-label="Loading account settings">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-3"><Skeleton className="h-4 w-20" /><Skeleton className="h-9 w-48" /><Skeleton className="h-4 w-96 max-w-full" /></div>
        <section className="space-y-6 rounded-xl border p-6">
          <div className="flex items-center gap-4"><Skeleton className="size-20 rounded-full" /><Skeleton className="h-9 w-28" /></div>
          <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, index) => <div key={index} className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-10 w-full" /></div>)}
          </div>
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-6 w-44" />
          <div className="grid gap-5 sm:grid-cols-2">{Array.from({ length: 2 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}</div>
          <Skeleton className="h-10 w-32" />
        </section>
      </div>
    </main>
  )
}

function BookingPage() {
  return (
    <main className="min-h-screen w-full p-6" aria-busy="true" aria-label="Loading appointment booking">
      <PageHeading />
      <div className="mx-auto max-w-5xl space-y-6 rounded-xl border p-6">
        <div className="grid gap-5 sm:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <div key={index} className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-10 w-full" /></div>)}</div>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Skeleton className="h-80 rounded-xl" />
          <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-48 w-full rounded-xl" /><Skeleton className="h-10 w-full" /></div>
        </div>
      </div>
    </main>
  )
}

function SessionPage() {
  return (
    <main className="min-h-screen w-full p-6" aria-busy="true" aria-label="Loading session management">
      <PageHeading action />
      <div className="space-y-6">
        <section className="space-y-5 rounded-xl border p-5">
          <Skeleton className="h-6 w-52" />
          <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}</div>
          <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>
        </section>
        <TableRows rows={5} />
      </div>
    </main>
  )
}

function CalendarPage() {
  return (
    <main className="min-h-screen w-full p-4 sm:p-6" aria-busy="true" aria-label="Loading calendar">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><Skeleton className="h-8 w-52" /><div className="flex gap-2"><Skeleton className="h-9 w-24" /><Skeleton className="h-9 w-28" /></div></div>
      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <section className="rounded-xl border p-4">
          <div className="mb-5 flex items-center justify-between"><Skeleton className="h-7 w-40" /><div className="flex gap-2"><Skeleton className="size-8" /><Skeleton className="size-8" /></div></div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 42 }, (_, index) => <Skeleton key={index} className="h-20 rounded-md sm:h-24" />)}
          </div>
        </section>
        <div className="space-y-4"><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>
      </div>
    </main>
  )
}

function DetailPage({ doctor = false }: { doctor?: boolean }) {
  return (
    <main className="min-h-screen space-y-6 p-6" aria-busy="true" aria-label="Loading record details">
      {doctor ? (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <section className="space-y-5 rounded-3xl border p-6"><Skeleton className="mx-auto size-24 rounded-full" /><Skeleton className="mx-auto h-6 w-40" /><Skeleton className="mx-auto h-4 w-48 max-w-full" /><Skeleton className="h-10 w-full rounded-full" /><Skeleton className="h-64 w-full rounded-xl" /></section>
          <div className="space-y-6"><section className="grid gap-4 rounded-3xl border p-6 sm:grid-cols-2">{Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="h-14 w-full" />)}</section><section className="grid gap-4 rounded-3xl border p-6 sm:grid-cols-2"><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /></section></div>
        </div>
      ) : (
        <>
          <section className="grid gap-8 rounded-3xl border p-6 xl:grid-cols-[320px_1fr]">
            <div className="space-y-5 rounded-3xl border p-6"><div className="flex items-center gap-4"><Skeleton className="size-16 rounded-full" /><div className="space-y-2"><Skeleton className="h-7 w-40" /><Skeleton className="h-4 w-32" /></div></div><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /></div>
            <div className="space-y-6"><Skeleton className="h-12 w-64" /><div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-24 rounded-xl" />)}</div></div>
          </section>
          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]"><section className="space-y-5 rounded-3xl border p-6"><Skeleton className="h-8 w-56" />{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-24 rounded-xl" />)}</section><section className="space-y-5 rounded-3xl border p-6"><Skeleton className="h-8 w-56" />{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-20 rounded-xl" />)}</section></div>
        </>
      )}
    </main>
  )
}

function PatientProfilePage() {
  return (
    <main className="min-h-screen w-full space-y-6 p-6" aria-busy="true" aria-label="Loading patient profile">
      <div className="flex items-start justify-between gap-4"><div className="space-y-2"><Skeleton className="h-8 w-56" /><Skeleton className="h-4 w-80 max-w-full" /></div><Skeleton className="h-5 w-36" /></div>
      <section className="grid gap-6 rounded-3xl border p-6 lg:grid-cols-[280px_1fr]">
        <div className="flex flex-col items-center gap-5 rounded-3xl border p-6"><Skeleton className="size-20 rounded-full" /><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-48 max-w-full" /><Skeleton className="h-6 w-20 rounded-full" /></div>
        <div className="space-y-5">
          {Array.from({ length: 3 }, (_, sectionIndex) => (
            <div key={sectionIndex} className="grid gap-4 rounded-3xl border p-6 sm:grid-cols-2">
              {Array.from({ length: sectionIndex === 2 ? 2 : 4 }, (_, fieldIndex) => <Skeleton key={fieldIndex} className="h-14 w-full" />)}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

function DoctorAppointmentsPage() {
  return (
    <main className="min-h-screen w-full p-6" aria-busy="true" aria-label="Loading doctor appointments">
      <PageHeading />
      <StatCards count={3} className="mb-6" />
      <TableRows rows={7} />
    </main>
  )
}

function ReportPage() {
  return (
    <main className="min-h-screen w-full space-y-6 p-6" aria-busy="true" aria-label="Loading reports">
      <PageHeading />
      <div className="flex gap-2 overflow-hidden"><Skeleton className="h-10 w-32" /><Skeleton className="h-10 w-32" /><Skeleton className="h-10 w-32" /><Skeleton className="h-10 w-32" /></div>
      <StatCards count={4} />
      <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-72 rounded-xl" /><Skeleton className="h-72 rounded-xl" /></div>
      <TableRows rows={5} />
    </main>
  )
}

function resolveVariant(pathname: string) {
  if (pathname.endsWith("/settings")) return "settings"
  if (pathname.endsWith("/calendar")) return "calendar"
  if (pathname.includes("/add-session")) return "session"
  if (pathname.includes("/book-appointment")) return "booking"
  if (pathname === "/admin/dashboard") return "admin-dashboard"
  if (pathname === "/doctor/dashboard" || pathname === "/admin/doctor") return "doctor-dashboard"
  if (pathname === "/client/dashboard" || pathname === "/admin/client") return "client-dashboard"
  if (pathname.endsWith("/inventory")) return "inventory"
  if (pathname.endsWith("/reports")) return "reports"
  if (pathname.includes("/patients/")) return "patient-profile"
  if (pathname.includes("/all-appointments/") || pathname.includes("/appointments/")) return "detail"
  if (pathname.includes("/all-doctors/")) return "profile"
  if (pathname === "/doctor/appointments" || pathname === "/admin/doctor/appointments") return "doctor-appointments"
  if (pathname.endsWith("/appointments")) return pathname === "/admin/client/appointments" ? "client-appointments" : "appointments"
  if (pathname.endsWith("/add-bmi")) return "records"
  if (pathname.endsWith("/all-doctors")) return "doctors"
  return "table"
}

export function RolePageSkeleton() {
  const pathname = usePathname() || ""
  const variant = resolveVariant(pathname)

  if (variant === "client-dashboard") return <ClientDashboard />
  if (variant === "doctor-dashboard") return <DoctorDashboard />
  if (variant === "admin-dashboard") return <AdminDashboard />
  if (variant === "settings") return <SettingsPage />
  if (variant === "booking") return <BookingPage />
  if (variant === "session") return <SessionPage />
  if (variant === "calendar") return <CalendarPage />
  if (variant === "detail") return <DetailPage />
  if (variant === "profile") return <DetailPage doctor />
  if (variant === "patient-profile") return <PatientProfilePage />
  if (variant === "doctor-appointments") return <DoctorAppointmentsPage />
  if (variant === "reports") return <ReportPage />
  if (variant === "inventory") return <TablePage inventory />
  if (variant === "client-appointments") return <TablePage appointments />
  if (variant === "appointments" || variant === "doctors" || variant === "records" || variant === "table") return <TablePage />
  return <TablePage />
}