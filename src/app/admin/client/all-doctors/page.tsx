import prisma from "@/lib/prisma"
import { DataTable } from "@/components/data-table"
import { columns, DoctorRow } from "../../all-doctors/columns"

export default async function AllDoctorsPage() {
  const doctors = await prisma.user.findMany({
    where: { role: "NURSE" },
    select: {
      id: true,
      name: true,
      email: true,
      employeeNumber: true,
      designations: true,
      status: true,
    },
    orderBy: { name: "asc" },
  })

  const rows: DoctorRow[] = doctors.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    employeeNumber: user.employeeNumber ?? "",
    designations: user.designations ? JSON.parse(user.designations).join(", ") : "",
    status: user.status ?? "",
  }))

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-foreground">All Doctors</h1>
          <p className="mt-2 text-muted-foreground">
            Browse and select from our qualified doctors. View their specialties, experience, and availability.
          </p>
        </div>

        <DataTable columns={columns} data={rows} />
      </div>
    </div>
  )
}
