"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getUserByRole } from "@/lib/user-role"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const role = "CLIENT"
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
