"use server"

import { randomUUID } from "crypto"
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
  const prefix = formData.get("prefix")?.toString().trim() ?? ""
  const suffix = formData.get("suffix")?.toString().trim() ?? ""

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
        designations: credentials
          ? JSON.stringify(
              credentials
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean)
            )
          : null,
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
