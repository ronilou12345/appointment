"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { getSearchPages, getSearchPlaceholder, type SearchHit, type SearchPage } from "@/lib/search"
import type { UserRole } from "@/lib/user-role"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarDaysIcon,
  CalendarPlusIcon,
  CalendarRangeIcon,
  ChartBarIcon,
  ClipboardListIcon,
  CornerDownLeftIcon,
  FileChartColumnIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  PillIcon,
  Settings2Icon,
  StethoscopeIcon,
  UserIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

type SearchContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

const SearchContext = React.createContext<SearchContextValue | null>(null)

export function useAppSearch() {
  const context = React.useContext(SearchContext)
  return {
    open: context?.open ?? false,
    setOpen: context?.setOpen ?? (() => {}),
  }
}

function getPageIcon(href: string): LucideIcon {
  if (href.includes("dashboard")) return LayoutDashboardIcon
  if (href.includes("book-appointment")) return CalendarPlusIcon
  if (href.includes("appointment")) return CalendarDaysIcon
  if (href.includes("all-doctors") || href.includes("doctors")) return StethoscopeIcon
  if (href.includes("manage-users")) return UsersIcon
  if (href.includes("specialt")) return StethoscopeIcon
  if (href.includes("inventory")) return PillIcon
  if (href.includes("reports")) return FileChartColumnIcon
  if (href.includes("activity")) return ClipboardListIcon
  if (href.includes("add-session")) return CalendarRangeIcon
  if (href.includes("bmi")) return ChartBarIcon
  if (href.includes("settings")) return Settings2Icon
  return FileTextIcon
}

function getGroupIcon(group: string): LucideIcon {
  switch (group) {
    case "Appointments":
    case "My Appointments":
      return CalendarDaysIcon
    case "Doctors":
      return StethoscopeIcon
    case "Patients":
      return UserIcon
    case "Users":
      return UsersIcon
    case "Medicine":
      return PillIcon
    case "Specialties":
      return StethoscopeIcon
    case "Activity Logs":
      return ClipboardListIcon
    case "Sessions":
      return CalendarRangeIcon
    default:
      return FileTextIcon
  }
}

export function AppSearchProvider({
  role,
  children,
}: {
  role: UserRole
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const pages = React.useMemo(() => getSearchPages(role), [role])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <SearchContext.Provider value={{ open, setOpen }}>
      {children}
      <AppSearchDialog role={role} pages={pages} open={open} onOpenChange={setOpen} />
    </SearchContext.Provider>
  )
}

function AppSearchDialog({
  role,
  pages,
  open,
  onOpenChange,
}: {
  role: UserRole
  pages: SearchPage[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchHit[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!open) {
      setQuery("")
      setResults([])
      setLoading(false)
    }
  }, [open])

  React.useEffect(() => {
    if (!open) return

    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          cache: "no-store",
          signal: controller.signal,
        })
        const data = await response.json()
        setResults(Array.isArray(data?.results) ? data.results : [])
      } catch {
        if (!controller.signal.aborted) setResults([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 250)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [open, query])

  const handleNavigate = React.useCallback(
    (href: string) => {
      onOpenChange(false)
      router.push(href)
    },
    [onOpenChange, router],
  )

  const groupedResults = React.useMemo(() => {
    const groups = new Map<string, SearchHit[]>()
    for (const result of results) {
      const items = groups.get(result.group) ?? []
      items.push(result)
      groups.set(result.group, items)
    }
    return Array.from(groups.entries())
  }, [results])

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description={getSearchPlaceholder(role)}
    >
      <Command>
        <CommandInput
          placeholder={getSearchPlaceholder(role)}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>{loading ? "Searching..." : "No results found."}</CommandEmpty>
          <CommandGroup heading="Pages">
            {pages.map((page) => {
              const Icon = getPageIcon(page.href)
              return (
                <CommandItem
                  key={page.href}
                  value={`${page.label} ${page.keywords}`}
                  onSelect={() => handleNavigate(page.href)}
                >
                  <Icon />
                  <span className="flex min-w-0 flex-col">
                    <span>{page.label}</span>
                    <span className="text-xs text-white/50">{page.href}</span>
                  </span>
                </CommandItem>
              )
            })}
          </CommandGroup>
          {groupedResults.map(([group, items]) => {
            const Icon = getGroupIcon(group)
            return (
              <CommandGroup key={group} heading={group}>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.id} ${item.title} ${item.description} ${item.group}`}
                    onSelect={() => handleNavigate(item.href)}
                  >
                    <Icon />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{item.title}</span>
                      <span className="truncate text-xs text-white/50">{item.description}</span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )
          })}
        </CommandList>
        <div className="flex items-center gap-3 border-t border-white/10 px-3 py-2 text-xs text-white/50">
          <span className="inline-flex items-center gap-1.5">
            <KbdGroup>
              <Kbd>
                <ArrowUpIcon />
              </Kbd>
              <Kbd>
                <ArrowDownIcon />
              </Kbd>
            </KbdGroup>
            <span>Navigate</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>
              <CornerDownLeftIcon />
            </Kbd>
            <span>Open</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>Esc</Kbd>
            <span>Close</span>
          </span>
        </div>
      </Command>
    </CommandDialog>
  )
}
