import prisma from "@/lib/prisma"
import { DataTable } from "@/components/data-table"
import { columns, DoctorRow } from "../../all-doctors/columns"

type DoctorResult = {
  id: string
  name: string
  email: string
  designations: string | null
  status: string | null
  doctor: {
    board_certification: string | null
  } | null
}

export default async function AllDoctorsPage() {
  const doctors: DoctorResult[] = await prisma.user.findMany({
    where: { role: "NURSE" },
    select: {
      id: true,
      name: true,
      email: true,
      designations: true,
      status: true,
      doctor: {
        select: {
          board_certification: true,
        },
      },
    },
    orderBy: { name: "asc" },
  })

  const rows: DoctorRow[] = doctors.map((user: DoctorResult) => {
    const rawDesignations = user.designations ? JSON.parse(user.designations) : []
    const specialties = Array.isArray(rawDesignations)
      ? Array.from(new Set(rawDesignations)).join(", ")
      : ""

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      specialties,
      boardCertification: user.doctor?.board_certification ?? "",
      designations: specialties,
      status: user.status ?? "",
    }
  })

  return (
    <div className="min-h-screen w-full bg-background p-6 text-foreground">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-foreground">All Doctors</h1>
        <p className="mt-2 text-muted-foreground">
          Browse and select from our qualified doctors. View their specialties, experience, and availability.
        </p>
      </div>

      <DataTable columns={columns} data={rows} />
    </div>
  )
}
