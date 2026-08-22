import type { UserRole } from "@/lib/user-role"

export type SearchPage = {
  label: string
  href: string
  keywords: string
}

export type SearchHit = {
  id: string
  group: string
  title: string
  description: string
  href: string
}

const adminPages: SearchPage[] = [
  { label: "Dashboard", href: "/admin/dashboard", keywords: "home overview stats" },
  { label: "All Doctors", href: "/admin/all-doctors", keywords: "physicians staff nurses" },
  { label: "All Appointments", href: "/admin/all-appointments", keywords: "bookings schedule visits" },
  { label: "Add Specialties", href: "/admin/add-specialties", keywords: "services departments" },
  { label: "Manage Users", href: "/admin/manage-users", keywords: "accounts patients doctors staff" },
  { label: "Medicine", href: "/admin/inventory", keywords: "inventory pharmacy stock" },
  { label: "Reports", href: "/admin/reports", keywords: "analytics charts totals" },
  { label: "Activity Logs", href: "/admin/activity-logs", keywords: "audit history actions" },
  { label: "Settings", href: "/admin/settings", keywords: "profile account password" },
]

const doctorPages: SearchPage[] = [
  { label: "Dashboard", href: "/doctor/dashboard", keywords: "home overview" },
  { label: "Add Session", href: "/doctor/add-session", keywords: "schedule availability slots" },
  { label: "My Appointments", href: "/doctor/appointments", keywords: "patients bookings visits" },
  { label: "Settings", href: "/doctor/settings", keywords: "profile account password" },
]

const clientPages: SearchPage[] = [
  { label: "Dashboard", href: "/client/dashboard", keywords: "home overview" },
  { label: "All Doctors", href: "/client/all-doctors", keywords: "physicians specialists" },
  { label: "Book Appointment", href: "/client/book-appointment", keywords: "schedule visit consult" },
  { label: "My Appointments", href: "/client/appointments", keywords: "bookings visits records" },
  { label: "Add Vitals", href: "/client/add-bmi", keywords: "bmi body mass index health vitals" },
  { label: "Settings", href: "/client/settings", keywords: "profile account password" },
]

export function getSearchPages(role: UserRole): SearchPage[] {
  if (role === "ADMIN") return adminPages
  if (role === "DOCTOR") return doctorPages
  return clientPages
}

export function getSearchPlaceholder(role: UserRole) {
  if (role === "ADMIN") return "Search users, appointments, medicine..."
  if (role === "DOCTOR") return "Search your patients, appointments, sessions..."
  return "Search doctors, your appointments, pages..."
}
