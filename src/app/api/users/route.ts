import { NextRequest, NextResponse } from "next/server"
import { createUserAction } from "@/lib/actions/user"
import prisma from "@/lib/prisma"
import { saveProfileImageFile, updateUserProfileImage } from "@/lib/profile-image"
import { logCurrentUserActivity } from "@/lib/activity-log"

function normalizeRole(value: string | null) {
  const role = (value ?? "PATIENT").toString().trim().toUpperCase()
  if (role === "ADMIN") return "ADMIN"
  if (role === "DOCTOR" || role === "NURSE") return "NURSE"
  if (role === "STAFF") return "STAFF"
  return "PATIENT"
}

function normalizeStatus(value: string | null) {
  const status = (value ?? "ACTIVE").toString().trim().toUpperCase()
  if (status === "SUSPENDED") return "SUSPENDED"
  if (status === "INACTIVE" || status === "APPLICANT") return "INACTIVE"
  return "ACTIVE"
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")?.trim().toUpperCase()

    const users = await prisma.user.findMany({
      where: role ? { role: role as any } : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        designations: true,
        role: true,
        status: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ success: true, users })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const formData = new FormData()
    const allowedFields = [
      "firstName",
      "middleName",
      "lastName",
      "email",
      "password",
      "userType",
      "status",
      "prefix",
      "suffix",
      "credentials",
      "boardCertifications",
      "licenseNumber",
      "yearsofexperience",
      "address",
    ]

    Object.entries(body).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        formData.set(key, String(value ?? ""))
      }
    })

    const result = await createUserAction(formData)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    const profileImage = String(body.profileImage ?? "").trim()
    if (profileImage.startsWith("data:image/") && result.userId) {
      const imageUrl = await saveProfileImageFile(result.userId, profileImage)
      await updateUserProfileImage(result.userId, imageUrl)
    }

    const createdName = [body.firstName, body.middleName, body.lastName].filter(Boolean).join(" ").trim() || body.email
    await logCurrentUserActivity(
      "Created user",
      `${createdName} (${String(body.email ?? "").trim()}) as ${String(body.userType ?? "PATIENT")}`,
      { type: "user", id: result.userId },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = String(body?.id ?? "").trim()

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing user id" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    })

    if (!existingUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const name = String(body?.name ?? existingUser.name).trim()
    const email = String(body?.email ?? existingUser.email).trim().toLowerCase()
    const role = normalizeRole(String(body?.role ?? existingUser.role))
    const status = normalizeStatus(String(body?.status ?? existingUser.status))
    const address = String(body?.address ?? "").trim()
    const prefix = String(body?.prefix ?? "").trim()
    const suffix = String(body?.suffix ?? "").trim()
    const credentials = String(body?.credentials ?? "").trim()
    const licenseNumber = String(body?.licenseNumber ?? "").trim()
    const yearsOfExperience = String(body?.yearsOfExperience ?? "").trim()
    const boardCertifications = String(body?.boardCertifications ?? "").trim()
    const password = String(body?.password ?? "").trim()
    const designationsRaw = body?.designations
    const designations = Array.isArray(designationsRaw)
      ? JSON.stringify(designationsRaw)
      : typeof designationsRaw === "string"
      ? designationsRaw
      : null

    const nameParts = name.split(/\s+/).filter(Boolean)
    const firstName = nameParts[0] ?? ""
    const lastName = nameParts[nameParts.length - 1] ?? ""
    const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : ""

    await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {
        name,
        email,
        role,
        status,
        designations,
        updatedAt: new Date(),
      }

      if (password) {
        updateData.password = password
      }

      await tx.user.update({
        where: { id: userId },
        data: updateData,
      })

      const existingDoctor = await tx.doctor.findUnique({
        where: { user_id: userId },
      })

      const doctorPayload = {
        first_name: firstName || existingDoctor?.first_name || "",
        middle_name: middleName || existingDoctor?.middle_name || null,
        last_name: lastName || existingDoctor?.last_name || "",
        prefix: prefix || existingDoctor?.prefix || null,
        suffix: suffix || existingDoctor?.suffix || null,
        address: address || existingDoctor?.address || null,
        credentials: credentials || existingDoctor?.credentials || null,
        license_number: licenseNumber || existingDoctor?.license_number || "",
        years_of_experience: yearsOfExperience ? Number.parseInt(yearsOfExperience, 10) : existingDoctor?.years_of_experience ?? 0,
        board_certification: boardCertifications || existingDoctor?.board_certification || null,
      }

      if (existingDoctor) {
        await tx.doctor.update({
          where: { user_id: userId },
          data: doctorPayload,
        })
      } else if (role === "NURSE" || licenseNumber || yearsOfExperience || boardCertifications || address || prefix || suffix || credentials) {
        await tx.doctor.create({
          data: {
            user_id: userId,
            ...doctorPayload,
            license_number: licenseNumber || `temp-${userId}`,
          },
        })
      }
    })

    const profileImage = String(body?.profileImage ?? "").trim()
    if (profileImage.startsWith("data:image/")) {
      const imageUrl = await saveProfileImageFile(userId, profileImage)
      await updateUserProfileImage(userId, imageUrl)
    }

    await logCurrentUserActivity("Updated user", `${name} (${email})`, { type: "user", id: userId })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = String(body?.id ?? "").trim()

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing user id" }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, name: true, email: true },
    })
    if (targetUser?.role === 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Cannot delete ADMIN account' }, { status: 403 })
    }

    await prisma.$transaction(async (tx) => {
      // delete doctor record if exists
      await tx.doctor.deleteMany({ where: { user_id: userId } })
      // delete appointments related to user
      await tx.appointment.deleteMany({ where: { user_id: userId } })
      // delete user
      await tx.user.delete({ where: { id: userId } })
    })

    await logCurrentUserActivity(
      "Deleted user",
      `${targetUser?.name ?? "User"} (${targetUser?.email ?? userId})`,
      { type: "user", id: userId },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
