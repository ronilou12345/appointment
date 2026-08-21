"use client"

import { usePathname, useRouter } from "next/navigation"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { logoutUser } from "@/lib/actions/auth"
import {
  EllipsisVerticalIcon,
  CircleUserRoundIcon,
  LogOutIcon,
} from "lucide-react"

function getSettingsHref(pathname: string, role?: string) {
  const area = pathname.split("/").filter(Boolean)[0]
  if (area === "admin" || area === "doctor" || area === "client") {
    return `/${area}/settings`
  }

  switch ((role ?? "").toUpperCase()) {
    case "ADMIN":
      return "/admin/settings"
    case "DOCTOR":
    case "NURSE":
      return "/doctor/settings"
    default:
      return "/client/settings"
  }
}

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
    role?: string
  }
}) {
  const { isMobile } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()
  const settingsHref = getSettingsHref(pathname, user.role)
  const initials = (user.name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "U"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
                <span className="mt-0.5 truncate text-[10px] text-muted-foreground">
                  v1.0.0-beta.3 · © 2026 C2M Clinic
                </span>
              </div>
              <EllipsisVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                  <span className="mt-0.5 truncate text-[10px] text-muted-foreground">
                    v1.0.0-beta.3 · © 2026 C2M Clinic
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push(settingsHref)}>
              <CircleUserRoundIcon />
              Account
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={async () => {
                await logoutUser()
              }}
            >
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
