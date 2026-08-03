"use server"

import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"

function normalizeRole(value: string | null) {
  const role = (value ?? "PATIENT").toString().trim().toUpperCase()

  if (role === "ADMIN") return "ADMIN"
  if (role === "DOCTOR") return "NURSE"
  if (role === "STAFF") return "STAFF"
  if (role === "NURSE") return "NURSE"
  return "PATIENT"
}

function normalizeStatus(value: string | null) {
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
  const studentNumber = formData.get("studentNumber")?.toString().trim() ?? ""
  const employeeNumber = formData.get("employeeNumber")?.toString().trim() ?? ""
  const designations = formData.get("designations")?.toString().trim() ?? ""
  const redirectPath = formData.get("redirectPath")?.toString() ?? "/"

  if (!userId || !name || !email) {
    throw new Error("User ID, name, and email are required.")
  }

  const updateData: Record<string, unknown> = {
    name,
    email,
    studentNumber: studentNumber || null,
    employeeNumber: employeeNumber || null,
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
  const studentNumber = formData.get("studentNumber")?.toString().trim() ?? ""
  const employeeNumber = formData.get("employeeNumber")?.toString().trim() ?? ""
  const credentials = formData.get("credentials")?.toString().trim() ?? ""
  const boardCertifications = formData.get("boardCertifications")?.toString().trim() ?? ""
  const prefix = formData.get("prefix")?.toString().trim() ?? ""
  const suffix = formData.get("suffix")?.toString().trim() ?? ""
  const address = formData.get("address")?.toString().trim() ?? ""

  if (!firstName || !lastName || !email || !password) {
    return { success: false, error: "First name, last name, email, and password are required." }
  }

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters long." }
  }

  const fullName = [prefix, firstName, middleName, lastName, suffix]
    .filter(Boolean)
    .join(" ")
    .trim()

  const designationValues = [credentials, boardCertifications]
    .flatMap((value) =>
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    )

  try {
    await prisma.user.create({
      data: {
        id: randomUUID(),
        email,
        name: fullName || email,
        role: normalizeRole(userType),
        status: normalizeStatus(status),
        studentNumber: studentNumber || null,
        employeeNumber: employeeNumber || null,
        employmentType: normalizeRole(userType),
        designations: designationValues.length
          ? JSON.stringify(designationValues)
          : null,
        address: address || null,
        prefix: prefix || null,
        suffix: suffix || null,
        credentials: credentials || null,
        password,
        avatar: "",
        updatedAt: new Date(),
      },
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
