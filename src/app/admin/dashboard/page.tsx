import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import prisma from "@/lib/prisma"
import { resolveProfileAvatar } from "@/lib/profile-image"
import UsersTable from "./users-table"

export default async function AdminDashboardPage() {
  const chartStart = new Date()
  chartStart.setHours(0, 0, 0, 0)
  chartStart.setDate(chartStart.getDate() - 89)

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      role: true,
      profile_image: true,
      doctor: {
        select: {
          address: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const appointments = await prisma.appointment.findMany({
    where: { appointment_date: { gte: chartStart } },
    select: { appointment_date: true },
  })

  const visitorsByDate = new Map<string, number>()
  for (const appointment of appointments) {
    if (!appointment.appointment_date) continue
    const date = appointment.appointment_date.toISOString().slice(0, 10)
    visitorsByDate.set(date, (visitorsByDate.get(date) ?? 0) + 1)
  }

  const visitorData = Array.from({ length: 90 }, (_, index) => {
    const date = new Date(chartStart)
    date.setDate(chartStart.getDate() + index)
    const dateKey = date.toISOString().slice(0, 10)

    return {
      date: dateKey,
      visitors: visitorsByDate.get(dateKey) ?? 0,
    }
  })

  const rows = users.map((u) => ({
    id: u.id,
    fullname: u.name ?? "",
    email: u.email ?? "",
    address: u.doctor?.address ?? "",
    role: u.role ?? "",
    status: u.status ?? "",
    avatar: resolveProfileAvatar(u.id, u.profile_image) || null,
  }))

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive visitorData={visitorData} />
          </div>
          <div className="px-4 lg:px-6">
            <h2 className="text-lg font-semibold">Users</h2>
            <p className="text-sm text-muted-foreground mb-4">Manage user information and profiles.</p>
            <UsersTable rows={rows} />
          </div>
        </div>
      </div>
    </div>
  )
}
