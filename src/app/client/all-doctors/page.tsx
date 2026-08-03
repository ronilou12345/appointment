import prisma from "@/lib/prisma"
import { DataTable } from "@/components/data-table"
import { columns, DoctorRow } from "./columns"

type DoctorResult = {
  id: string
  name: string
  email: string
  designations: string | null
  status: string | null
  avatar: string | null
}

export default async function ClientAllDoctorsPage() {
  const doctors: DoctorResult[] = await prisma.user.findMany({
    where: { role: "NURSE" },
    select: {
      id: true,
      name: true,
      email: true,
      designations: true,
      status: true,
      avatar: true,
    },
    orderBy: { name: "asc" },
  })

  const rows: DoctorRow[] = doctors.map((user: DoctorResult) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    designations: user.designations ? JSON.parse(user.designations).join(", ") : "",
    status: user.status ?? "",
    avatar: user.avatar ?? null,
  }))

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-foreground">All Doctors</h1>
          <p className="mt-2 text-muted-foreground">
            Browse and select from our qualified doctors.
          </p>
        </div>

        <DataTable columns={columns} data={rows} />
      </div>
    </div>
  )
}
