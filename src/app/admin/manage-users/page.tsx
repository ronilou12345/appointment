import prisma from "@/lib/prisma"
import ManageUsersClient from "./manage-users-client"
import { UserRow } from "./columns"

export default async function Page() {
  const users = await prisma.user.findMany({
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

  const rows: UserRow[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    studentNumber: user.studentNumber ?? "",
    employeeNumber: user.employeeNumber ?? "",
    status: user.status ?? "",
  }))

  return <ManageUsersClient users={rows} />
}
