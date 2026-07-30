"use server"

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
  const email = formData.get("email")?.toString().trim() ?? ""
  const password = formData.get("password")?.toString() ?? ""
  const confirmPassword = formData.get("confirm-password")?.toString() ?? ""

  if (!name || !email || !password || !confirmPassword) {
    return { success: false, error: "Please fill in all fields." }
  }

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters long." }
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match." }
  }

  return {
    success: true,
    error: "",
    user: {
      name,
      email,
      role: "CLIENT",
    },
  }
}

export async function logoutUser() {
  redirect("/login")
}
