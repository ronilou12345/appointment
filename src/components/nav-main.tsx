"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { SearchIcon } from "lucide-react"
import { useAppSearch } from "@/components/app-search"

function SearchShortcut() {
  const [isMac, setIsMac] = React.useState(false)

  React.useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.userAgent))
  }, [])

  if (isMac) {
    return <Kbd className="ml-auto bg-transparent">⌘K</Kbd>
  }

  return (
    <KbdGroup className="ml-auto">
      <Kbd className="bg-transparent">Ctrl</Kbd>
      <Kbd className="bg-transparent">K</Kbd>
    </KbdGroup>
  )
}

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
  const { setOpen } = useAppSearch()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Search"
              onClick={() => setOpen(true)}
              className="min-w-8"
            >
              <SearchIcon />
              <span>Search</span>
              <SearchShortcut />
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
                      <span className="ml-auto text-xs font-medium text-green-600 dark:text-green-400">{item.badge}</span>
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
