import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { resolveProfileAvatar } from "@/lib/profile-image"

const parseDesignations = (value?: string | null) => {
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean)
    }
    return []
  } catch {
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  }
}

const getDoctorSpecialties = (designations: string[]) => {
  const boardRegex = /board|certificate|certification/i
  const credentialRegex = /^(MD|PhD|DO|RN|RMT|BSN|DDS|RN|NP|DMD|DVM)$/i

  const specialties = (designations || []).filter((designation) => {
    const normalized = String(designation).trim()
    if (!normalized) return false
    if (boardRegex.test(normalized)) return false
    if (credentialRegex.test(normalized)) return false
    return true
  })

  return Array.from(new Set(specialties)).filter(Boolean)
}

const getBoardCertificates = (boardCertification?: string | null) => {
  const boardNames = parseDesignations(boardCertification)
  return Array.from(new Set(boardNames)).filter(Boolean)
}

export async function GET() {
  try {
    const doctors = await prisma.doctor.findMany({
      select: {
        doctor_id: true,
        first_name: true,
        middle_name: true,
        last_name: true,
        credentials: true,
        years_of_experience: true,
        board_certification: true,
        user: {
          select: {
            id: true,
            email: true,
            designations: true,
            profile_image: true,
          },
        },
      },
      orderBy: [{ first_name: "asc" }, { last_name: "asc" }],
    })

    const formattedDoctors = doctors.map((doctor) => {
      const designations = parseDesignations(doctor.user?.designations ?? null)
      const specialties = getDoctorSpecialties(designations)
      const boardCertificates = getBoardCertificates(doctor.board_certification)
      const experienceYears = Number(doctor.years_of_experience ?? 0)

      return {
        id: doctor.doctor_id,
        name: [doctor.first_name, doctor.middle_name, doctor.last_name].filter(Boolean).join(" "),
        credential: doctor.credentials ?? "MD",
        email: doctor.user?.email ?? "",
        avatar: resolveProfileAvatar(doctor.user?.id ?? "", doctor.user?.profile_image),
        specialty: specialties.join(", "),
        specialties,
        boardCertificates,
        experience: experienceYears > 0 ? `${experienceYears} ${experienceYears === 1 ? "year" : "years"}` : "",
        experienceYears,
      }
    })

    return NextResponse.json({ success: true, doctors: formattedDoctors })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
