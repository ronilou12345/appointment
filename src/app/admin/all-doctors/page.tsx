import prisma from "@/lib/prisma"
import { columns, DoctorRow } from "./columns"
import { AllDoctorsContent } from "./content"

type DoctorResult = {
  id: string
  name: string
  email: string
  designations: string | null
  status: string | null
  profile_image: string | null
  doctor: {
    board_certification: string | null
  } | null
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
      profile_image: true,
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
      avatar: user.profile_image ?? null,
    }
  })

  return <AllDoctorsContent rows={rows} />
}
