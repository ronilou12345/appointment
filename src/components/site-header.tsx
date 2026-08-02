"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
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
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { logoutUser } from "@/lib/actions/auth"
import { BellIcon, InboxIcon, Settings2Icon, LogOutIcon, SunIcon, MoonIcon, MonitorIcon, CheckIcon } from "lucide-react"

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
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const theme = mounted ? (currentTheme === "system" ? "system" : currentTheme) : "system"

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const breadcrumbs = React.useMemo(() => {
    const segments = pathname.split("/").filter(Boolean)
    const labelMap: Record<string, string> = {
      admin: "Admin",
      client: "Client",
      doctor: "Doctor",
      dashboard: "Dashboard",
      appointments: "Appointments",
      patients: "Patients",
      doctors: "Doctors",
      inventory: "Inventory",
      reports: "Reports",
      users: "Users",
      "manage-users": "Manage Users",
      "add-specialties": "Add Specialties",
      "book-appointment": "Book Appointment",
      "all-appointments": "All Appointments",
      "all-doctors": "All Doctors",
      login: "Login",
      signup: "Sign Up",
    }

    const crumbs = segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`
      const label = labelMap[segment] ?? segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
      return { label, href }
    })

    return [{ label: "Home", href: "/" }, ...crumbs]
  }, [pathname])

  const searchCommands = React.useMemo(
    () => [
      { label: "Admin Dashboard", href: "/admin/dashboard" },
      { label: "Manage Users", href: "/admin/manage-users" },
      { label: "All Appointments", href: "/admin/all-appointments" },
      { label: "Client Dashboard", href: "/client/dashboard" },
      { label: "Doctor Dashboard", href: "/doctor/dashboard" },
      { label: "Book Appointment", href: "/client/book-appointment" },
      { label: "Login", href: "/login" },
      { label: "Sign Up", href: "/signup" },
    ],
    []
  )

  const handleNavigate = React.useCallback(
    (href: string) => {
      setSearchOpen(false)
      router.push(href)
    },
    [router]
  )

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/70 px-4 backdrop-blur-sm transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-3 lg:gap-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 h-6" />
        </div>
        <div className="flex min-w-0 flex-1 items-center">
          <div className="hidden rounded-full border border-border/60 bg-background/80 px-3 py-2 shadow-sm md:flex">
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1
                  return (
                    <React.Fragment key={crumb.href}>
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast ? <BreadcrumbSeparator /> : null}
                    </React.Fragment>
                  )
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <CommandDialog open={searchOpen} onOpenChange={setSearchOpen} title="Search pages" description="Find a page to navigate to.">
            <Command>
              <CommandInput placeholder="Type a page name..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Pages">
                  {searchCommands.map((command) => (
                    <CommandItem
                      key={command.href}
                      value={command.label}
                      onSelect={() => handleNavigate(command.href)}
                    >
                      <span>{command.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </CommandDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Notifications">
                <BellIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-0" align="end" sideOffset={8}>
              <div className="border-b px-4 py-3">
                <Tabs defaultValue="inbox">
                  <TabsList className="gap-2 bg-transparent p-0">
                    <TabsTrigger value="inbox" className="bg-transparent text-white data-[state=active]:bg-transparent data-[state=active]:text-white">
                      Inbox
                    </TabsTrigger>
                    <TabsTrigger value="archive" className="bg-transparent text-white data-[state=active]:bg-transparent data-[state=active]:text-white">
                      Archive
                    </TabsTrigger>
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
