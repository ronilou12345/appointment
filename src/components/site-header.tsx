"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { logoutUser } from "@/lib/actions/auth"
import { BellIcon, InboxIcon, Settings2Icon, LogOutIcon, PaletteIcon, SunIcon, MoonIcon, MonitorIcon, CheckIcon } from "lucide-react"

export function SiteHeader({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { theme: currentTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const theme = mounted ? (currentTheme === "system" ? "system" : currentTheme) : "system"

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/70 px-4 backdrop-blur-sm transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-3 lg:gap-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 h-6" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Notifications">
                <BellIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-0" align="end" sideOffset={8}>
              <div className="border-b px-4 py-3">
                <Tabs defaultValue="inbox">
                  <TabsList className="gap-2">
                    <TabsTrigger value="inbox">Inbox</TabsTrigger>
                    <TabsTrigger value="archive">Archive</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <Tabs defaultValue="inbox">
                <TabsContent value="inbox">
                  <div className="grid h-40 place-items-center p-4 text-center text-sm text-muted-foreground">
                    <InboxIcon className="size-10 text-muted-foreground/70" />
                    <p className="mt-3">No new notifications</p>
                  </div>
                </TabsContent>
                <TabsContent value="archive">
                  <div className="grid h-40 place-items-center p-4 text-center text-sm text-muted-foreground">
                    <InboxIcon className="size-10 text-muted-foreground/70" />
                    <p className="mt-3">No archived notifications</p>
                  </div>
                </TabsContent>
              </Tabs>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Theme mode">
                {theme === "light" ? <SunIcon /> : theme === "dark" ? <MoonIcon /> : <MonitorIcon />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8}>
              <DropdownMenuLabel>Appearance</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => setTheme("light")}> 
                <SunIcon className="size-4 mr-2" />
                Light
                {theme === "light" && <CheckIcon className="ml-auto size-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTheme("dark")}> 
                <MoonIcon className="size-4 mr-2" />
                Dark
                {theme === "dark" && <CheckIcon className="ml-auto size-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTheme("system")}> 
                <MonitorIcon className="size-4 mr-2" />
                System
                {theme === "system" && <CheckIcon className="ml-auto size-4" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="icon" aria-label="Settings">
            <Settings2Icon />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Open user menu"
              >
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60" align="end" sideOffset={8}>
              <DropdownMenuLabel>
                <div className="grid gap-1 px-2 py-2">
                  <span className="text-sm font-semibold">{user.name}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings2Icon className="size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={async () => {
                  await logoutUser()
                }}
              >
                <LogOutIcon className="size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
