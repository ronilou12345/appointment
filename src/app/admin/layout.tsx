"use client"

import { usePathname } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getUserByRole } from "@/lib/user-role"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  let role: "DOCTOR" | "ADMIN" | "CLIENT" = "CLIENT"
  
  // Determine role based on pathname
  if (
    pathname.includes("/admin/doctor") ||
    pathname.includes("/admin/doctor/add-session") ||
    pathname.includes("/admin/doctor/appointments")
  ) {
    role = "DOCTOR"
  } else if (
    pathname.includes("/admin/dashboard") || 
    pathname.includes("/admin/inventory") || 
    pathname.includes("/admin/reports") ||
    pathname.includes("/admin/all-doctors") ||
    pathname.includes("/admin/all-appointments") ||
    pathname.includes("/admin/add-specialties") ||
    pathname.includes("/admin/manage-users")
  ) {
    role = "ADMIN"
  } else if (
    pathname.includes("/admin/client")
  ) {
    role = "CLIENT"
  }

  const user = getUserByRole(role)

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar user={user} variant="inset" />
      <SidebarInset>
        <SiteHeader user={user} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
