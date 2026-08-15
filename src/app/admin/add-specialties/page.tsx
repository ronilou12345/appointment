import { columns, SpecialtyRow } from "./columns"
import { AddSpecialtiesContent } from "./content"
import prisma from "@/lib/prisma"

export default async function Page() {
  // Use raw query to avoid relying on generated model accessor names
  const specialties: Array<{
    specialty_id: number
    specialty_name: string
    description: string | null
    available_doctor: number | null
    status: string | null
  }> = await prisma.$queryRaw`
    SELECT specialty_id, specialty_name, description, available_doctor, status
    FROM public.specialties
    ORDER BY specialty_name ASC
  `

  const rows: SpecialtyRow[] = specialties.map((s) => ({
    id: String(s.specialty_id),
    name: s.specialty_name,
    description: s.description ?? "",
    availableDoctors: Number(s.available_doctor ?? 0),
    status: s.status || "Active",
  }))

  return <AddSpecialtiesContent rows={rows} />
}
