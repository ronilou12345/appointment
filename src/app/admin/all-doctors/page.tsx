import prisma from "@/lib/prisma"
import { columns, DoctorRow } from "./columns"
import { AllDoctorsContent } from "./content"

type DoctorResult = {
  id: string
  name: string
  email: string
  employeeNumber: string | null
  designations: string | null
  status: string | null
}

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

  const rows: DoctorRow[] = doctors.map((user: DoctorResult) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    employeeNumber: user.employeeNumber ?? "",
    designations: user.designations ? JSON.parse(user.designations).join(", ") : "",
    status: user.status ?? "",
  }))

  return <AllDoctorsContent rows={rows} />
}
