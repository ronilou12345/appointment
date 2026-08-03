export type UserRole = "ADMIN" | "CLIENT" | "DOCTOR"

export interface AppUser {
  name: string
  email: string
  role: UserRole
  avatar: string
}

const usersByRole: Record<UserRole, AppUser> = {
  ADMIN: {
    name: "Admin User",
    email: "admin@clinic.dev",
    role: "ADMIN",
    avatar: "/avatars/admin.jpg",
  },
  CLIENT: {
    name: "Client User",
    email: "client@clinic.dev",
    role: "CLIENT",
    avatar: "/avatars/client.jpg",
  },
  DOCTOR: {
    name: "Doctor User",
    email: "doctor@clinic.dev",
    role: "DOCTOR",
    avatar: "/avatars/doctor.jpg",
  },
}

export function normalizeUserRole(role?: string | null): UserRole {
  switch ((role ?? "CLIENT").toUpperCase()) {
    case "ADMIN":
      return "ADMIN"
    case "DOCTOR":
    case "NURSE":
      return "DOCTOR"
    case "CLIENT":
    case "PATIENT":
    default:
      return "CLIENT"
  }
}

export function getUserByRole(role?: string | null): AppUser {
  return usersByRole[normalizeUserRole(role)]
}

export function getRoleFromEmail(email: string): UserRole {
  const normalizedEmail = email.toLowerCase()

  if (normalizedEmail.includes("admin")) {
    return "ADMIN"
  }

  if (normalizedEmail.includes("doctor") || normalizedEmail.includes("dr") || normalizedEmail.includes("doc")) {
    return "DOCTOR"
  }

  return "CLIENT"
}

export function getDashboardPath(role?: string | null): string {
  switch (normalizeUserRole(role)) {
    case "ADMIN":
      return "/admin/dashboard"
    case "DOCTOR":
      return "/doctor/dashboard"
    case "CLIENT":
    default:
      return "/client/dashboard"
  }
}
