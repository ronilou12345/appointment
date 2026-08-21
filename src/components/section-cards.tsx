import Link from "next/link"
import prisma from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUpIcon } from "lucide-react"

export async function SectionCards() {
  const today = new Date()
  const startOfDay = new Date(today)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(today)
  endOfDay.setHours(23, 59, 59, 999)

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const last30Days = new Date(today)
  last30Days.setDate(last30Days.getDate() - 30)

  const [
    appointmentsTotal,
    appointmentsLast30Days,
    appointmentsThisMonth,
    doctorsTotal,
    doctorsActive,
    usersTotal,
    usersActive,
    patientsTotal,
    patientsActive,
    activeSessions,
  ] = await Promise.all([
    prisma.appointment.count(),
    prisma.appointment.count({
      where: {
        OR: [
          { created_at: { gte: last30Days } },
          { appointment_date: { gte: last30Days } },
        ],
      },
    }),
    prisma.appointment.count({
      where: {
        OR: [
          { created_at: { gte: monthStart } },
          { appointment_date: { gte: monthStart } },
        ],
      },
    }),
    prisma.user.count({ where: { role: { in: ["NURSE"] } } }),
    prisma.user.count({ where: { role: { in: ["NURSE"] }, status: "ACTIVE" } }),
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "PATIENT" } }),
    prisma.user.count({ where: { role: "PATIENT", status: "ACTIVE" } }),
    prisma.session_tbl.count({
      where: {
        session_date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    }),
  ])

  const cards = [
    {
      title: "Total Appointments",
      value: appointmentsTotal,
      badge: `${appointmentsThisMonth.toLocaleString()} this month`,
      footer: "Increasing bookings",
      hint: `${appointmentsLast30Days.toLocaleString()} in the last 30 days`,
      href: "/admin/all-appointments",
    },
    {
      title: "Total Doctors",
      value: doctorsTotal,
      badge: `${doctorsActive.toLocaleString()} active`,
      footer: "Staff on roster",
      hint: "Doctors registered in the clinic",
      href: "/admin/all-doctors",
    },
    {
      title: "Total Users",
      value: usersTotal,
      badge: `${usersActive.toLocaleString()} active`,
      footer: "All accounts",
      hint: "Admins, doctors, staff, and patients",
      href: "/admin/manage-users",
    },
    {
      title: "Total Patients",
      value: patientsTotal,
      badge: `${patientsActive.toLocaleString()} active`,
      footer: "Registered patients",
      hint: "Patient accounts in the system",
      href: "/admin/manage-users",
    },
    {
      title: "Active Sessions",
      value: activeSessions,
      badge: "Today",
      footer: "Currently scheduled",
      hint: "Today's consultations",
      href: "/admin/reports",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-5">
      {cards.map((card) => (
        <Link key={card.title} href={card.href} className="block h-full focus-visible:outline-none">
          <Card className="@container/card h-full bg-gradient-to-t from-primary/5 to-card shadow-xs transition-opacity hover:opacity-90 dark:bg-card">
            <CardHeader>
              <CardDescription>{card.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {card.value.toLocaleString()}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <TrendingUpIcon />
                  {card.badge}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {card.footer}{" "}
                <TrendingUpIcon className="size-4" />
              </div>
              <div className="text-muted-foreground">{card.hint}</div>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  )
}
