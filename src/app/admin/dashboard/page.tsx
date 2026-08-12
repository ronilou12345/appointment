import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import prisma from "@/lib/prisma"
import UsersTable from "./users-table"

export default async function AdminDashboardPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      role: true,
      doctor: {
        select: {
          address: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const rows = users.map((u) => ({
    id: u.id,
    fullname: u.name ?? "",
    email: u.email ?? "",
    address: u.doctor?.address ?? "",
    role: u.role ?? "",
    status: u.status ?? "",
  }))

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
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
