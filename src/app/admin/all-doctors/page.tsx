import prisma from "@/lib/prisma"
import type { user as User } from "@prisma/client"
import { columns, DoctorRow } from "./columns"
import { AllDoctorsContent } from "./content"

type DoctorResult = Pick<User, "id" | "name" | "email" | "employeeNumber" | "designations" | "status">

export default async function Page() {
  const doctors: DoctorResult[] = await prisma.user.findMany({
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

  const rows: DoctorRow[] = doctors.map((user: any) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    employeeNumber: user.employeeNumber ?? "",
    designations: user.designations ? JSON.parse(user.designations).join(", ") : "",
    status: user.status ?? "",
  }))

  return <AllDoctorsContent rows={rows} />
}
