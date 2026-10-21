import { cookies } from "next/headers"
import prisma from "@/lib/prisma"

export async function getSession() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")?.value

  if (!userId) return null

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        address: true,
        role: true,
        status: true,
        profile_image: true,
      },
    })
    if (!user) return null

    return user
  } catch (error) {
    return null
  }
}
