import prisma from "@/lib/prisma"
import ManageUsersClient from "./manage-users-client"
import { UserRow } from "./columns"

type UserResult = {
  id: string
  name: string
  email: string
  status: string | null
  avatar: string | null
}

export default async function Page() {
  const users: UserResult[] = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      avatar: true,
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
    avatar: user.avatar ?? null,
  }))

  return <ManageUsersClient users={rows} />
}
