import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { logCurrentUserActivity } from "@/lib/activity-log"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = String(body.name ?? "").trim()
    const description = String(body.description ?? "").trim()

    if (!name) return NextResponse.json({ success: false, error: "Missing specialty name" }, { status: 400 })

    const availableDoctors = Number(body.availableDoctors) || 0
    const status = String(body.status ?? "Active").trim() || "Active"

    const created = await prisma.$queryRaw`
      INSERT INTO public.specialties (specialty_name, description, available_doctor, status)
      VALUES (${name}, ${description || null}, ${availableDoctors}, ${status})
      ON CONFLICT (specialty_name)
      DO UPDATE SET available_doctor = EXCLUDED.available_doctor, status = EXCLUDED.status
      RETURNING specialty_id, specialty_name, description, available_doctor, status
    `

    await logCurrentUserActivity("Created specialty", name, { type: "specialty" })

    return NextResponse.json({ success: true, specialty: created })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const specialties = await prisma.$queryRaw`
      SELECT specialty_name
      FROM public.specialties
      WHERE status IS NULL OR LOWER(TRIM(status)) = 'active'
      ORDER BY specialty_name ASC
    `

    const specialtyNames = Array.isArray(specialties)
      ? specialties.map((row) => (row as { specialty_name: string }).specialty_name)
      : []

    return NextResponse.json({ success: true, specialties: specialtyNames })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const id = Number(body.id)
    const name = String(body.name ?? "").trim()
    const description = String(body.description ?? "").trim()
    const availableDoctors = Number(body.availableDoctors) || 0
    const status = String(body.status ?? "Active").trim() || "Active"
    const assignedDoctorIds = Array.isArray(body.assignedDoctorIds)
      ? new Set(body.assignedDoctorIds.map((value: unknown) => String(value)))
      : null

    if (!id || !name) {
      return NextResponse.json({ success: false, error: "Missing specialty id or name" }, { status: 400 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.$queryRaw<Array<{ specialty_name: string; available_doctor: number | null }>>`
        SELECT specialty_name, available_doctor
        FROM public.specialties
        WHERE specialty_id = ${id}
      `
      const previousName = current[0]?.specialty_name
      if (!previousName) return null
      const availableDoctors = body.availableDoctors === undefined
        ? Number(current[0].available_doctor ?? 0)
        : Number(body.availableDoctors) || 0

      if (previousName !== name || assignedDoctorIds) {
        const assignedUsers = await tx.user.findMany({
          where: { designations: { contains: previousName } },
          select: { id: true, designations: true },
        })

        for (const user of assignedUsers) {
          if (!user.designations) continue

          let designations: unknown
          try {
            designations = JSON.parse(user.designations)
          } catch {
            continue
          }

          if (!Array.isArray(designations) || !designations.includes(previousName)) continue

          const nextDesignations = assignedDoctorIds && !assignedDoctorIds.has(user.id)
            ? designations.filter((designation) => designation !== previousName)
            : previousName === name
              ? designations
              : designations.map((designation) => designation === previousName ? name : designation)
          if (JSON.stringify(nextDesignations) === JSON.stringify(designations)) continue

          await tx.user.update({
            where: { id: user.id },
            data: {
              designations: JSON.stringify(nextDesignations),
              updatedAt: new Date(),
            },
          })
        }
      }

      return tx.$queryRaw`
        UPDATE public.specialties
        SET specialty_name = ${name}, description = ${description || null}, available_doctor = ${availableDoctors}, status = ${status}
        WHERE specialty_id = ${id}
        RETURNING specialty_id, specialty_name, description, available_doctor, status
      `
    })

    if (!updated) {
      return NextResponse.json({ success: false, error: "Specialty not found" }, { status: 404 })
    }

    await logCurrentUserActivity("Updated specialty", name, { type: "specialty", id })

    return NextResponse.json({ success: true, specialty: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const id = Number(body.id)

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing specialty id" }, { status: 400 })
    }

    await prisma.$queryRaw`
      DELETE FROM public.specialties
      WHERE specialty_id = ${id}
    `

    await logCurrentUserActivity("Deleted specialty", undefined, { type: "specialty", id })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
