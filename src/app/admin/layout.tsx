import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { AppSearchProvider } from "@/components/app-search"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getUserByRole, normalizeUserRole } from "@/lib/user-role"
import { getSession } from "@/lib/auth-utils"
import { resolveProfileAvatar } from "@/lib/profile-image"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session || session.status !== "ACTIVE") {
    redirect("/login")
  }

  const role = normalizeUserRole(session.role)
  const user = {
    name: session.name,
    email: session.email,
    role,
    avatar: resolveProfileAvatar(session.id, session.profile_image),
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSearchProvider role={role}>
        <AppSidebar user={user} variant="inset" />
        <SidebarInset>
          <SiteHeader user={user} />
          {children}
        </SidebarInset>
      </AppSearchProvider>
    </SidebarProvider>
  )
}
