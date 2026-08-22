"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronsUpDown, Columns3, Filter, RefreshCw, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DataTableToolbarProps = {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filterContent?: React.ReactNode
  activeFilterCount?: number
  columnsContent?: React.ReactNode
  onRefresh?: () => void
}

export function DataTableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search",
  filterContent,
  activeFilterCount = 0,
  columnsContent,
  onRefresh,
}: DataTableToolbarProps) {
  const router = useRouter()
  const searchRef = React.useRef<HTMLInputElement>(null)
  const [refreshing, setRefreshing] = React.useState(false)

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "/") {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    onRefresh?.()
    router.refresh()
    window.setTimeout(() => setRefreshing(false), 600)
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-9 bg-background pr-14 pl-8"
          />
          <Kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
            ⌘ /
          </Kbd>
        </div>

        {filterContent ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="h-9 gap-1.5">
                <Filter className="size-4" />
                Filters
                {activeFilterCount > 0 ? (
                  <span className="ml-0.5 inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72">
              {filterContent}
            </PopoverContent>
          </Popover>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {columnsContent ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="h-9 gap-1.5">
                <Columns3 className="size-4" />
                Columns
                <ChevronsUpDown className="size-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {columnsContent}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9"
          aria-label="Refresh"
          onClick={handleRefresh}
        >
          <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
        </Button>
      </div>
    </div>
  )
}
