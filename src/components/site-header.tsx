"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { ThemeCustomizer } from "@/components/theme-customizer"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { logoutUser } from "@/lib/actions/auth"
import { getNameInitials, hasProfileImage } from "@/lib/user-initials"
import type { AppNotification, NotificationType } from "@/lib/notifications"
import {
  BellIcon,
  InboxIcon,
  PaintbrushIcon,
  Settings2Icon,
  LogOutIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  CheckIcon,
  CalendarClockIcon,
  CalendarPlusIcon,
  CheckCircle2Icon,
  CircleCheckBigIcon,
  XCircleIcon,
  RotateCcwIcon,
  CalendarRangeIcon,
  ClipboardListIcon,
} from "lucide-react"

const NOTIFICATION_POLL_MS = 60_000
const READ_HISTORY_LIMIT = 200

const notificationStyles: Record<NotificationType, { icon: React.ReactNode; accent: string }> = {
  upcoming: {
    icon: <CalendarClockIcon className="size-3" />,
    accent: "bg-blue-600 text-white",
  },
  booked: {
    icon: <CalendarPlusIcon className="size-3" />,
    accent: "bg-violet-600 text-white",
  },
  confirmed: {
    icon: <CheckCircle2Icon className="size-3" />,
    accent: "bg-emerald-600 text-white",
  },
  completed: {
    icon: <CircleCheckBigIcon className="size-3" />,
    accent: "bg-slate-600 text-white",
  },
  cancelled: {
    icon: <XCircleIcon className="size-3" />,
    accent: "bg-rose-600 text-white",
  },
  session: {
    icon: <CalendarRangeIcon className="size-3" />,
    accent: "bg-amber-600 text-white",
  },
  soap: {
    icon: <ClipboardListIcon className="size-3" />,
    accent: "bg-teal-600 text-white",
  },
}

function getPersonInitials(name: string) {
  return getNameInitials(name)
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return ""

  const diffSeconds = Math.round((Date.now() - timestamp) / 1000)
  const absSeconds = Math.abs(diffSeconds)

  if (absSeconds < 60) return "Just now"
  if (absSeconds < 3600) {
    const minutes = Math.round(absSeconds / 60)
    return diffSeconds > 0 ? `${minutes}m ago` : `in ${minutes}m`
  }
  if (absSeconds < 86_400) {
    const hours = Math.round(absSeconds / 3600)
    return diffSeconds > 0 ? `${hours}h ago` : `in ${hours}h`
  }

  const days = Math.round(absSeconds / 86_400)
  if (days <= 30) return diffSeconds > 0 ? `${days}d ago` : `in ${days}d`

  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function NotificationRow({
  notification,
  unread,
  onSelect,
  onToggleRead,
}: {
  notification: AppNotification
  unread: boolean
  onSelect: (notification: AppNotification) => void
  onToggleRead: (notification: AppNotification, read: boolean) => void
}) {
  const style = notificationStyles[notification.type] ?? notificationStyles.upcoming

  return (
    <div
      className={`flex items-start gap-2 px-3 py-2 transition-colors hover:bg-muted/60 ${
        unread ? "bg-primary/[0.04]" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(notification)}
        className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
      >
        <span className="relative shrink-0">
          <Avatar className="size-7">
            {notification.personAvatar ? (
              <AvatarImage src={notification.personAvatar} alt={notification.personName} />
            ) : null}
            <AvatarFallback className="text-[10px]">
              {getPersonInitials(notification.personName)}
            </AvatarFallback>
          </Avatar>
          <span
            className={`absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full ring-2 ring-background ${style.accent}`}
          >
            {style.icon}
          </span>
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-semibold leading-tight text-foreground">
              {notification.personName}
            </span>
            {unread ? <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden /> : null}
          </span>
          <span className="mt-px flex flex-wrap items-center gap-x-1 text-[10px] leading-tight text-muted-foreground">
            <span className="font-medium text-foreground/80">{notification.title}</span>
            <span aria-hidden>·</span>
            <span>{notification.personRole}</span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">{formatRelativeTime(notification.createdAt)}</span>
          </span>
          <span className="mt-0.5 line-clamp-2 block text-[11px] leading-snug text-muted-foreground">
            {notification.message}
          </span>
        </span>
      </button>

      <Button
        variant="ghost"
        size="icon"
        className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
        title={unread ? "Mark as read" : "Mark as unread"}
        aria-label={unread ? "Mark as read" : "Mark as unread"}
        onClick={() => onToggleRead(notification, unread)}
      >
        {unread ? <CheckIcon className="size-3.5" /> : <RotateCcwIcon className="size-3.5" />}
      </Button>
    </div>
  )
}

function NotificationEmptyState({ label, showIcon = true }: { label: string; showIcon?: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
      {showIcon ? <InboxIcon className="size-7 text-muted-foreground/50" /> : null}
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function NotificationList({
  notifications,
  unread,
  onSelect,
  onToggleRead,
}: {
  notifications: AppNotification[]
  unread: boolean
  onSelect: (notification: AppNotification) => void
  onToggleRead: (notification: AppNotification, read: boolean) => void
}) {
  return (
    <div className="divide-y">
      {notifications.map((notification) => (
        <NotificationRow
          key={notification.id}
          notification={notification}
          unread={unread}
          onSelect={onSelect}
          onToggleRead={onToggleRead}
        />
      ))}
    </div>
  )
}

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
  const [notifications, setNotifications] = React.useState<AppNotification[]>([])
  const [readIds, setReadIds] = React.useState<string[]>([])
  const [notificationsLoading, setNotificationsLoading] = React.useState(true)
  const [notificationsOpen, setNotificationsOpen] = React.useState(false)

  const readStorageKey = React.useMemo(
    () => `notifications:read:${user.email || "current-user"}`,
    [user.email]
  )

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(readStorageKey)
      const parsed = stored ? JSON.parse(stored) : []
      setReadIds(Array.isArray(parsed) ? parsed.map(String) : [])
    } catch {
      setReadIds([])
    }
  }, [readStorageKey])

  const persistReadIds = React.useCallback(
    (ids: string[]) => {
      const bounded = Array.from(new Set(ids)).slice(-READ_HISTORY_LIMIT)
      setReadIds(bounded)
      try {
        window.localStorage.setItem(readStorageKey, JSON.stringify(bounded))
      } catch {
        // Ignore storage failures (private mode, quota) and keep in-memory state.
      }
    },
    [readStorageKey]
  )

  const loadNotifications = React.useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" })
      const result = await response.json()
      setNotifications(result?.success && Array.isArray(result.notifications) ? result.notifications : [])
    } catch {
      setNotifications([])
    } finally {
      setNotificationsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadNotifications()
    const interval = window.setInterval(loadNotifications, NOTIFICATION_POLL_MS)
    return () => window.clearInterval(interval)
  }, [loadNotifications, pathname])

  const appointmentsHref = React.useMemo(() => {
    const area = pathname.split("/").filter(Boolean)[0]
    if (area === "admin") return "/admin/all-appointments"
    if (area === "doctor") return "/doctor/appointments"
    return "/client/appointments"
  }, [pathname])

  const settingsHref = React.useMemo(() => {
    const area = pathname.split("/").filter(Boolean)[0]
    if (area === "admin") return "/admin/settings"
    if (area === "doctor") return "/doctor/settings"
    return "/client/settings"
  }, [pathname])

  const readIdSet = React.useMemo(() => new Set(readIds), [readIds])
  const unreadNotifications = notifications.filter((notification) => !readIdSet.has(notification.id))
  const readNotifications = notifications.filter((notification) => readIdSet.has(notification.id))

  const markAllAsRead = React.useCallback(() => {
    persistReadIds([...readIds, ...notifications.map((item) => item.id)])
  }, [notifications, persistReadIds, readIds])

  const setNotificationRead = React.useCallback(
    (notification: AppNotification, read: boolean) => {
      persistReadIds(
        read
          ? [...readIds, notification.id]
          : readIds.filter((id) => id !== notification.id)
      )
    },
    [persistReadIds, readIds]
  )

  const openNotification = React.useCallback(
    (notification: AppNotification) => {
      persistReadIds([...readIds, notification.id])
      setNotificationsOpen(false)
      router.push(notification.href)
    },
    [persistReadIds, readIds, router]
  )

  const theme = mounted ? (currentTheme === "system" ? "system" : currentTheme) : "system"

  const breadcrumbs = React.useMemo(() => {
    const segments = pathname.split("/").filter(Boolean)
    const dashboardByArea: Record<string, string> = {
      admin: "/admin/dashboard",
      doctor: "/doctor/dashboard",
      client: "/client/dashboard",
    }
    const homeHref = dashboardByArea[segments[0] ?? ""] ?? "/"
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
      "activity-log": "Activity Logs",
      "activity-logs": "Activity Logs",
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

    return [{ label: "Home", href: homeHref }, ...crumbs]
  }, [pathname])

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
                    <React.Fragment key={`${crumb.href}-${index}`}>
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
          <Popover
            open={notificationsOpen}
            onOpenChange={(open) => {
              setNotificationsOpen(open)
              if (open) loadNotifications()
            }}
          >
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative" aria-label={`Notifications${unreadNotifications.length ? `, ${unreadNotifications.length} unread` : ""}`}>
                <BellIcon />
                {unreadNotifications.length ? (
                  <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-white">
                    {unreadNotifications.length > 9 ? "9+" : unreadNotifications.length}
                  </span>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[min(23rem,calc(100vw-1.5rem))] overflow-hidden p-0"
              align="end"
              sideOffset={8}
            >
              <Tabs defaultValue="inbox" className="flex h-[26rem] flex-col gap-0">
                <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-muted/50 px-4 py-2.5">
                  <TabsList variant="line" className="h-8 w-fit gap-4">
                    <TabsTrigger value="inbox" className="flex-none px-0.5 text-sm font-semibold">
                      Inbox
                      {unreadNotifications.length ? (
                        <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                          {unreadNotifications.length}
                        </Badge>
                      ) : null}
                    </TabsTrigger>
                    <TabsTrigger value="archive" className="flex-none px-0.5 text-sm font-semibold">
                      Archived
                      {readNotifications.length ? (
                        <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                          {readNotifications.length}
                        </Badge>
                      ) : null}
                    </TabsTrigger>
                  </TabsList>
                  {unreadNotifications.length ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 shrink-0 px-2 text-[11px] text-muted-foreground"
                      onClick={markAllAsRead}
                    >
                      Mark all read
                    </Button>
                  ) : null}
                </div>

                <TabsContent value="inbox" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {notificationsLoading ? (
                    <NotificationEmptyState label="Loading notifications..." showIcon={false} />
                  ) : unreadNotifications.length ? (
                    <NotificationList
                      notifications={unreadNotifications}
                      unread
                      onSelect={openNotification}
                      onToggleRead={setNotificationRead}
                    />
                  ) : (
                    <NotificationEmptyState label="No new notifications" />
                  )}
                </TabsContent>

                <TabsContent value="archive" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {readNotifications.length ? (
                    <NotificationList
                      notifications={readNotifications}
                      unread={false}
                      onSelect={openNotification}
                      onToggleRead={setNotificationRead}
                    />
                  ) : (
                    <NotificationEmptyState label="No archived notifications" />
                  )}
                </TabsContent>

                <div className="shrink-0 border-t bg-muted/50 px-2 py-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-full justify-start text-[11px]"
                    onClick={() => {
                      setNotificationsOpen(false)
                      router.push(appointmentsHref)
                    }}
                  >
                    View all appointments
                  </Button>
                </div>
              </Tabs>
            </PopoverContent>
          </Popover>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Customize theme">
                <PaintbrushIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-6" align="end" sideOffset={8}>
              <div className="mb-4 space-y-1">
                <h4 className="font-semibold leading-none text-lg">Customize</h4>
                <p className="text-sm text-muted-foreground">
                  Pick a style and color for your components.
                </p>
              </div>
              <ThemeCustomizer />
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Open user menu"
              >
                <Avatar className="h-8 w-8 rounded-full">
                  {hasProfileImage(user.avatar) ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
                  <AvatarFallback className="bg-primary font-semibold text-primary-foreground">
                    {getNameInitials(user.name)}
                  </AvatarFallback>
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
              <DropdownMenuItem onSelect={() => router.push(settingsHref)}>
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
