"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { SearchIcon, MailIcon } from "lucide-react"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    badge?: string | React.ReactNode
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
            >
              <SearchIcon />
              <span>Search</span>
            </SidebarMenuButton>
           
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={[
                    "rounded-lg transition-all duration-200",
                    "hover:bg-accent hover:text-accent-foreground",
                    "data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
                    "active:bg-accent/80",
                    isActive ? "bg-accent/80 text-accent-foreground" : "",
                  ].join(" ")}
                  data-active={isActive}
                >
                  <Link href={item.url} className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.title}</span>
                    {item.badge ? (
                      <span className="ml-auto inline-flex items-center bg-white/70 dark:bg-white/5 px-2 py-0.5 rounded-sm text-green-600 dark:text-green-400 text-xs font-medium shadow-sm">{item.badge}</span>
                    ) : null}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
