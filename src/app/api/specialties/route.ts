import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const name = String(body.name ?? "").trim()
    const description = String(body.description ?? "").trim()

    if (!name) return NextResponse.json({ success: false, error: "Missing specialty name" }, { status: 400 })

    const availableDoctors = Number(body.availableDoctors) || 0

    const created = await prisma.$queryRaw`
      INSERT INTO public.specialties (specialty_name, description, available_doctor)
      VALUES (${name}, ${description || null}, ${availableDoctors})
      ON CONFLICT (specialty_name)
      DO UPDATE SET available_doctor = EXCLUDED.available_doctor
      RETURNING specialty_id, specialty_name, description, available_doctor
    `

    return NextResponse.json({ success: true, specialty: created })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const specialties = await prisma.$queryRaw`
      SELECT specialty_name FROM public.specialties ORDER BY specialty_name ASC
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

    if (!id || !name) {
      return NextResponse.json({ success: false, error: "Missing specialty id or name" }, { status: 400 })
    }

    const updated = await prisma.$queryRaw`
      UPDATE public.specialties
      SET specialty_name = ${name}, description = ${description || null}, available_doctor = ${availableDoctors}
      WHERE specialty_id = ${id}
      RETURNING specialty_id, specialty_name, description, available_doctor
    `

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

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
