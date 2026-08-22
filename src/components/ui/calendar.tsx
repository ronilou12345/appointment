"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type CalendarProps = {
  selected?: Date | null
  onSelect?: (date: Date | null) => void
  className?: string
  disabled?: (date: Date) => boolean
  getIndicator?: (date: Date) => "available" | "unavailable" | null
}

export function Calendar({ selected, onSelect, className, disabled, getIndicator }: CalendarProps) {
  const [viewDate, setViewDate] = React.useState(() => selected ?? new Date())

  React.useEffect(() => {
    if (selected) {
      setViewDate(selected)
    }
  }, [selected])

  const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0)
  const firstDay = new Date(startOfMonth)
  firstDay.setDate(1 - ((startOfMonth.getDay() + 6) % 7))

  const days: Date[] = []
  for (let i = 0; i < 42; i += 1) {
    const day = new Date(firstDay)
    day.setDate(firstDay.getDate() + i)
    days.push(day)
  }

  return (
    <div className={cn("rounded-lg border bg-background p-3", className)}>
      <div className="mb-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-medium">
          {viewDate.toLocaleString("en", { month: "long", year: "numeric" })}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isCurrentMonth = day.getMonth() === viewDate.getMonth()
          const isSelected = selected && day.toDateString() === selected.toDateString()
          const isDisabled = disabled ? disabled(day) : false
          const indicator = getIndicator?.(day) ?? null

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect?.(day)}
              className={cn(
                "relative h-9 rounded-md text-sm transition-colors",
                !isCurrentMonth && "text-muted-foreground/50",
                isSelected && "bg-primary text-primary-foreground",
                !isSelected && !isDisabled && "hover:bg-accent",
                isDisabled && "cursor-not-allowed opacity-40"
              )}
            >
              {day.getDate()}
              {indicator ? (
                <span
                  className={cn(
                    "absolute bottom-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full",
                    indicator === "available" ? "bg-emerald-500" : "bg-red-500"
                  )}
                />
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
