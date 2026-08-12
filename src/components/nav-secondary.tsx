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

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: React.ReactNode
    badge?: string | React.ReactNode
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname()

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)
            const isAddBmi = item.title === "Add BMI"

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  className={[
                    "rounded-lg transition-all duration-200",
                    "hover:bg-accent hover:text-accent-foreground",
                    "data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
                    "active:bg-accent/80",
                    isActive && !isAddBmi ? "bg-accent/80 text-accent-foreground" : "",
                  ].join(" ")}
                  data-active={isAddBmi ? false : isActive}
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
