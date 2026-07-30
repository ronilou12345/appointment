import prisma from "@/lib/prisma"
import ManageUsersClient from "./manage-users-client"
import { UserRow } from "./columns"

type UserResult = {
  id: string
  name: string
  email: string
  studentNumber: string | null
  employeeNumber: string | null
  status: string | null
}

export default async function Page() {
  const users: UserResult[] = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      studentNumber: true,
      employeeNumber: true,
      status: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const rows: UserRow[] = users.map((user: UserResult) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    studentNumber: user.studentNumber ?? "",
    employeeNumber: user.employeeNumber ?? "",
    status: user.status ?? "",
  }))

  return <ManageUsersClient users={rows} />
}
