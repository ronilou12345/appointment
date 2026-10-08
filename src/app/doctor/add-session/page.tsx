import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import { AddSessionManager } from "@/app/admin/doctor/add-session/page"

export default async function Page() {
  const session = await getSession()
  if (!session?.id) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { designations: true },
  })

  let parsedDesignations: unknown
  try {
    parsedDesignations = JSON.parse(user?.designations ?? "[]")
  } catch {
    parsedDesignations = user?.designations ?? ""
  }

  const hasAssignedSpecialty = Array.isArray(parsedDesignations)
    ? parsedDesignations.some((designation) => typeof designation === "string" && designation.trim())
    : String(parsedDesignations).split(",").some((designation) => designation.trim())

  return <AddSessionManager hasAssignedSpecialty={hasAssignedSpecialty} />
}
