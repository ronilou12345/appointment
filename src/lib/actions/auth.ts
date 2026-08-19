"use server"

import { randomUUID } from "crypto"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"

export async function loginUser(formData: FormData) {
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? ""
  const password = formData.get("password")?.toString() ?? ""

  if (!email || !password) {
    return { success: false, error: "Please enter your email and password." }
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      password: true,
      status: true,
      role: true,
    },
  })

  if (!user) {
    return { success: false, error: "No account found with that email." }
  }

  if (user.password !== password) {
    return { success: false, error: "Invalid password." }
  }

  if (user.status !== "ACTIVE") {
    return { success: false, error: "Your account is not active yet." }
  }

  return { success: true, error: "", role: user.role ?? "PATIENT", userId: user.id }
}

export async function registerUser(formData: FormData) {
  const name = formData.get("name")?.toString().trim() ?? ""
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? ""
  const password = formData.get("password")?.toString() ?? ""
  const confirmPassword = formData.get("confirm-password")?.toString() ?? ""

  if (!name || !email || !password || !confirmPassword) {
    return { success: false, error: "Please fill in all fields." }
  }

  if (!email.includes("@")) {
    return { success: false, error: "Please enter a valid email address." }
  }

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters long." }
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match." }
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (existing) {
    return { success: false, error: "A user with this email already exists." }
  }

  try {
    const userId = randomUUID()

    await prisma.user.create({
      data: {
        id: userId,
        email,
        name,
        role: "PATIENT",
        status: "ACTIVE",
        designations: null,
        password,
        profile_image: "",
        updatedAt: new Date(),
      },
    })

    return { success: true, error: "", userId }
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return { success: false, error: "A user with this email already exists." }
    }

    const message = error instanceof Error ? error.message : String(error)
    return { success: false, error: message }
  }
}

export async function logoutUser() {
  redirect("/login")
}
