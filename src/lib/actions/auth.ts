"use server"

import { randomUUID } from "crypto"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { logActivity } from "@/lib/activity-log"
import { getSession } from "@/lib/auth-utils"
import { issueEmailVerificationToken } from "@/lib/email-verification"
import { sendVerificationEmail } from "@/lib/verification-email"
import { loopbackEquivalent, resolveOrigin } from "@/lib/google-oauth"

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
    return {
      success: false,
      error: "Your account is not active yet. If you just signed up, check your email and click the verification link.",
    }
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
    select: { id: true, status: true },
  })

  if (existing && existing.status !== "INACTIVE") {
    return { success: false, error: "A user with this email already exists." }
  }

  try {
    const userId = existing?.id ?? randomUUID()
    const headerList = await headers()
    const resolvedOrigin = resolveOrigin(headerList, "http://localhost:3000")
    const origin = loopbackEquivalent(resolvedOrigin) ?? resolvedOrigin

    if (existing) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          name,
          password,
          role: "PATIENT",
          status: "INACTIVE",
          updatedAt: new Date(),
        },
      })
    } else {
      await prisma.user.create({
        data: {
          id: userId,
          email,
          name,
          role: "PATIENT",
          status: "INACTIVE",
          designations: null,
          password,
          profile_image: "",
          updatedAt: new Date(),
        },
      })
    }

    const issued = await issueEmailVerificationToken(userId, email)
    const verifyUrl = `${origin}/api/auth/verify-email?token=${issued.token}`
    const emailed = await sendVerificationEmail(email, name, verifyUrl)

    if (!emailed.success) {
      console.warn("Verification email skipped or failed:", emailed)
      return {
        success: false,
        error: "Your account was created, but we could not send the verification email. Please try again in a moment.",
      }
    }

    await logActivity({
      userId,
      action: existing ? "Requested account verification" : "Created account",
      details: `Signed up as a client (${email})`,
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
  const session = await getSession()
  if (session?.id) {
    await logActivity({
      actor: session,
      action: "Signed out",
    })
  }
  redirect("/login")
}
