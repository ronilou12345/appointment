"use server"

import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"

type UserRole = "ADMIN" | "NURSE" | "PATIENT"
type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED"

function normalizeRole(value: string | null): UserRole {
  const role = (value ?? "PATIENT").toString().trim().toUpperCase()

  if (role === "ADMIN") return "ADMIN"
  if (role === "DOCTOR" || role === "NURSE") return "NURSE"
  return "PATIENT"
}

function normalizeStatus(value: string | null): UserStatus {
  const status = (value ?? "ACTIVE").toString().trim().toUpperCase()

  if (status === "SUSPENDED") return "SUSPENDED"
  if (status === "INACTIVE" || status === "APPLICANT") return "INACTIVE"
  return "ACTIVE"
}

export async function updateUserProfileAction(formData: FormData) {
  const userId = formData.get("userId")?.toString().trim()
  const name = formData.get("name")?.toString().trim() ?? ""
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? ""
  const password = formData.get("password")?.toString() ?? ""
  const designations = formData.get("designations")?.toString().trim() ?? ""
  const redirectPath = formData.get("redirectPath")?.toString() ?? "/"

  if (!userId || !name || !email) {
    throw new Error("User ID, name, and email are required.")
  }

  const updateData: Record<string, unknown> = {
    name,
    email,
    designations: designations || null,
    updatedAt: new Date(),
  }

  if (password) {
    updateData.password = password
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  })

  revalidatePath(redirectPath)
  redirect(redirectPath)
}

export async function createUserAction(formData: FormData) {
  const firstName = formData.get("firstName")?.toString().trim() ?? ""
  const middleName = formData.get("middleName")?.toString().trim() ?? ""
  const lastName = formData.get("lastName")?.toString().trim() ?? ""
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? ""
  const password = formData.get("password")?.toString() ?? ""
  const userType = formData.get("userType")?.toString() ?? "PATIENT"
  const status = formData.get("status")?.toString() ?? "ACTIVE"
  const prefix = formData.get("prefix")?.toString().trim() ?? ""
  const suffix = formData.get("suffix")?.toString().trim() ?? ""
  const credentials = formData.get("credentials")?.toString().trim() ?? ""
  const boardCertifications = formData.get("boardCertifications")?.toString().trim() ?? ""
  const licenseNumber = formData.get("licenseNumber")?.toString().trim() ?? ""
  const yearsOfExperience = formData.get("yearsofexperience")?.toString().trim() ?? ""
  const address = formData.get("address")?.toString().trim() ?? ""

  if (!firstName || !lastName || !email || !password) {
    return { success: false, error: "First name, last name, email, and password are required." }
  }

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters long." }
  }

  const normalizedUserType = userType.toUpperCase()
  const isDoctorAccount = normalizedUserType === "DOCTOR" || normalizedUserType === "NURSE"

  if (isDoctorAccount && !licenseNumber) {
    return { success: false, error: "License number is required for doctor accounts." }
  }

  const fullName = [firstName, middleName, lastName]
    .filter(Boolean)
    .join(" ")
    .trim()

  try {
    const userId = randomUUID()
    const role = normalizeRole(userType)
    const normalizedStatus = normalizeStatus(status)

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          email,
          name: fullName || email,
          role,
          status: normalizedStatus,
          designations: null,
          password,
          avatar: "",
          updatedAt: new Date(),
        },
      })

      if (isDoctorAccount) {
        await tx.doctor.create({
          data: {
            user_id: userId,
            first_name: firstName,
            middle_name: middleName || null,
            last_name: lastName,
            prefix: prefix || null,
            suffix: suffix || null,
            address: address || null,
            credentials: credentials || null,
            license_number: licenseNumber,
            years_of_experience: yearsOfExperience ? Number.parseInt(yearsOfExperience, 10) : 0,
            board_certification: boardCertifications || null,
          },
        })
      }
    })

    return { success: true, error: "" }
  } catch (error: unknown) {
    console.error("createUserAction error:", error)

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as any).code === "P2002"
    ) {
      return { success: false, error: "A user with this email already exists." }
    }

    const message =
      error instanceof Error ? error.message : JSON.stringify(error)

    return { success: false, error: message || "Unable to create user. Please try again." }
  }
}
