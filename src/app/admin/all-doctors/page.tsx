import prisma from "@/lib/prisma"
import { columns, DoctorRow } from "./columns"
import { AllDoctorsContent } from "./content"

type DoctorResult = {
  id: string
  name: string
  email: string
  designations: string | null
  status: string | null
  avatar: string | null
}

export default async function Page() {
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

  return <AllDoctorsContent rows={rows} />
}
