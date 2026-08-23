"use server"

import { randomUUID } from "crypto"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { saveProfileImageFile, updateUserProfileImage } from "@/lib/profile-image"
import { logActivity } from "@/lib/activity-log"
import { issueEmailVerificationToken } from "@/lib/email-verification"
import { sendVerificationEmail } from "@/lib/verification-email"
import { loopbackEquivalent, resolveOrigin } from "@/lib/google-oauth"

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
  const currentPassword = formData.get("password")?.toString() ?? ""
  const newPassword = formData.get("newPassword")?.toString() ?? ""
  const designationsRaw = formData.get("designations")
  const profileImage = formData.get("profileImage")?.toString().trim() ?? ""
  const redirectPath = formData.get("redirectPath")?.toString() ?? "/"
  const updateDoctorBackground = formData.get("updateDoctorBackground")?.toString() === "1"

  if (!userId || !name || !email) {
    return { success: false, error: "User ID, name, and email are required." }
  }

  const updateData: Record<string, unknown> = {
    name,
    email,
    updatedAt: new Date(),
  }

  if (designationsRaw !== null) {
    updateData.designations = designationsRaw.toString().trim() || null
  }

  if (newPassword) {
    if (newPassword.length < 8) {
      return { success: false, error: "New password must be at least 8 characters long." }
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    })

    if (!existingUser || existingUser.password !== currentPassword) {
      return { success: false, error: "Current password does not match." }
    }

    updateData.password = newPassword
  }

  if (profileImage.startsWith("data:image/")) {
    const imageUrl = await saveProfileImageFile(userId, profileImage)
    await updateUserProfileImage(userId, imageUrl)
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  })

  if (updateDoctorBackground) {
    const existingDoctor = await prisma.doctor.findUnique({
      where: { user_id: userId },
    })

    if (existingDoctor) {
      const firstName = formData.get("firstName")?.toString().trim() ?? ""
      const middleName = formData.get("middleName")?.toString().trim() ?? ""
      const lastName = formData.get("lastName")?.toString().trim() ?? ""
      const prefix = formData.get("prefix")?.toString().trim() ?? ""
      const suffix = formData.get("suffix")?.toString().trim() ?? ""
      const address = formData.get("address")?.toString().trim() ?? ""
      const credentials = formData.get("credentials")?.toString().trim() ?? ""
      const licenseNumber = formData.get("licenseNumber")?.toString().trim() ?? ""
      const yearsOfExperience = formData.get("yearsOfExperience")?.toString().trim() ?? ""
      const boardCertifications = formData.get("boardCertifications")?.toString().trim() ?? ""

      try {
        await prisma.doctor.update({
          where: { user_id: userId },
          data: {
            first_name: firstName || existingDoctor.first_name,
            middle_name: middleName || null,
            last_name: lastName || existingDoctor.last_name,
            prefix: prefix || null,
            suffix: suffix || null,
            address: address || null,
            credentials: credentials || null,
            license_number: licenseNumber || existingDoctor.license_number,
            years_of_experience: yearsOfExperience
              ? Number.parseInt(yearsOfExperience, 10)
              : existingDoctor.years_of_experience,
            board_certification: boardCertifications || null,
          },
        })
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          (error as { code?: string }).code === "P2002"
        ) {
          return { success: false, error: "A doctor with this license number already exists." }
        }
        throw error
      }
    }
  }

  await logActivity({
    userId,
    action: "Updated profile",
    details: email,
  })

  revalidatePath(redirectPath)
  return { success: true, error: "" }
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

  if (!email) {
    return { success: false, error: "Personal email is required." }
  }

  if (!email.includes("@")) {
    return { success: false, error: "Please enter a valid personal email." }
  }

  if (!firstName) {
    return { success: false, error: "First name is required." }
  }

  if (!lastName) {
    return { success: false, error: "Last name is required." }
  }

  if (!prefix) {
    return { success: false, error: "Prefix is required." }
  }

  if (!address) {
    return { success: false, error: "Address is required." }
  }

  if (!password) {
    return { success: false, error: "Password is required." }
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
    const existingEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingEmail) {
      return { success: false, error: "A user with this email already exists." }
    }

    if (isDoctorAccount) {
      const existingLicense = await prisma.doctor.findUnique({
        where: { license_number: licenseNumber },
        select: { doctor_id: true },
      })

      if (existingLicense) {
        return { success: false, error: "A doctor with this license number already exists." }
      }
    }

    const userId = randomUUID()
    const role = normalizeRole(userType)
    const requestedStatus = normalizeStatus(status)
    const normalizedStatus = requestedStatus === "SUSPENDED" ? "SUSPENDED" : "INACTIVE"
    const displayName = fullName || email

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          email,
          name: displayName,
          role,
          status: normalizedStatus,
          designations: null,
          password,
          profile_image: "",
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

    const headerList = await headers()
    const resolvedOrigin = resolveOrigin(headerList, "http://localhost:3000")
    const origin = loopbackEquivalent(resolvedOrigin) ?? resolvedOrigin
    const issued = await issueEmailVerificationToken(userId, email)
    const verifyUrl = `${origin}/api/auth/verify-email?token=${issued.token}`
    const emailed = await sendVerificationEmail(email, displayName, verifyUrl)

    if (!emailed.success) {
      console.warn("Verification email skipped or failed:", emailed)
    }

    return { success: true, error: "", userId, verificationSent: emailed.success }
  } catch (error: unknown) {
    console.error("createUserAction error:", error)

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as any).code === "P2002"
    ) {
      const target = (error as any).meta?.target
      const fields = Array.isArray(target) ? target.map(String) : [String(target ?? "")]

      if (fields.some((field) => field.includes("license_number"))) {
        return { success: false, error: "A doctor with this license number already exists." }
      }

      return { success: false, error: "A user with this email already exists." }
    }

    const message =
      error instanceof Error ? error.message : JSON.stringify(error)

    return { success: false, error: message || "Unable to create user. Please try again." }
  }
}
