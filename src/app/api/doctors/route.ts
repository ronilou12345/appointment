import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

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
      },
      orderBy: [{ first_name: "asc" }, { last_name: "asc" }],
    })

    const formattedDoctors = doctors.map((doctor) => ({
      id: doctor.doctor_id,
      name: [doctor.first_name, doctor.middle_name, doctor.last_name].filter(Boolean).join(" "),
      credential: doctor.credentials ?? "MD",
      specialty: doctor.board_certification ?? "General Practice",
      experience: `${doctor.years_of_experience ?? 0} years`,
    }))

    return NextResponse.json({ success: true, doctors: formattedDoctors })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
