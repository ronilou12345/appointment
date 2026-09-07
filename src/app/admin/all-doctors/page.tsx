import prisma from "@/lib/prisma"
import { columns, DoctorRow } from "./columns"
import { AllDoctorsContent } from "./content"

type DoctorResult = {
  id: string
  name: string
  email: string
  doctor: {
    first_name: string
    middle_name: string | null
    last_name: string
    address: string | null
    board_certification: string | null
  } | null
  designations: string | null
  status: string | null
  profile_image: string | null
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
          first_name: true,
          middle_name: true,
          last_name: true,
          address: true,
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
      firstName: user.doctor?.first_name ?? "",
      middleName: user.doctor?.middle_name ?? "",
      lastName: user.doctor?.last_name ?? "",
      address: user.doctor?.address ?? "",
      specialties,
      boardCertification: user.doctor?.board_certification ?? "",
      designations: specialties,
      status: user.status ?? "",
      avatar: user.profile_image ?? null,
    }
  })

  return <AllDoctorsContent rows={rows} />
}
