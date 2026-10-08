import { columns, SpecialtyRow } from "./columns"
import { AddSpecialtiesContent } from "./content"
import prisma from "@/lib/prisma"

export default async function Page() {
  const [specialties, assignedDoctors] = await Promise.all([
    prisma.$queryRaw<Array<{
      specialty_id: number
      specialty_name: string
      description: string | null
      available_doctor: number | null
      status: string | null
    }>>`
      SELECT specialty_id, specialty_name, description, available_doctor, status
      FROM public.specialties
      ORDER BY specialty_name ASC
    `,
    prisma.user.findMany({
      where: { role: "NURSE" },
      select: { id: true, name: true, profile_image: true, designations: true },
      orderBy: { name: "asc" },
    }),
  ])

  const doctorsBySpecialty = new Map<string, Array<{ id: string; name: string; avatar: string | null }>>()
  for (const doctor of assignedDoctors) {
    if (!doctor.designations) continue

    let designations: unknown
    try {
      designations = JSON.parse(doctor.designations)
    } catch {
      continue
    }

    if (!Array.isArray(designations)) continue
    for (const designation of designations) {
      if (typeof designation !== "string") continue
      const key = designation.trim().toLowerCase()
      const assigned = doctorsBySpecialty.get(key) ?? []
      assigned.push({ id: doctor.id, name: doctor.name, avatar: doctor.profile_image })
      doctorsBySpecialty.set(key, assigned)
    }
  }

  const rows: SpecialtyRow[] = specialties.map((s) => ({
    id: String(s.specialty_id),
    name: s.specialty_name,
    description: s.description ?? "",
    availableDoctors: Number(s.available_doctor ?? 0),
    assignedDoctors: doctorsBySpecialty.get(s.specialty_name.trim().toLowerCase()) ?? [],
    status: s.status || "Active",
  }))

  return <AddSpecialtiesContent rows={rows} />
}
