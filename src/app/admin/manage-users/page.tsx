import prisma from "@/lib/prisma"
import ManageUsersClient from "./manage-users-client"
import { UserRow } from "./columns"

type UserResult = {
  id: string
  name: string
  email: string
  status: string | null
  profile_image: string | null
  role: string | null
  designations: string | null
  doctor: {
    address: string | null
    prefix: string | null
    suffix: string | null
    credentials: string | null
    license_number: string | null
    years_of_experience: number | null
    board_certification: string | null
  } | null
}

export default async function Page() {
  const users: UserResult[] = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      profile_image: true,
      role: true,
      designations: true,
      doctor: {
        select: {
          address: true,
          prefix: true,
          suffix: true,
          credentials: true,
          license_number: true,
          years_of_experience: true,
          board_certification: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const rows: UserRow[] = users.map((user: UserResult) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.status ?? "",
    avatar: user.profile_image || null,
    role: user.role ?? "PATIENT",
    address: user.doctor?.address ?? "",
    prefix: user.doctor?.prefix ?? null,
    suffix: user.doctor?.suffix ?? null,
    credentials: user.doctor?.credentials ?? user.designations ?? null,
    licenseNumber: user.doctor?.license_number ?? "",
    yearsOfExperience: user.doctor?.years_of_experience?.toString() ?? "",
    boardCertifications: user.doctor?.board_certification ?? "",
  }))

  return <ManageUsersClient users={rows} />
}
