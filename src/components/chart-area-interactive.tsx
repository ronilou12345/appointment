"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

const chartConfig = {
  visitors: {
    label: "Visitors",
    theme: {
      light: "#0ea5e9",
      dark: "#ffffff",
    },
  },
} satisfies ChartConfig

type VisitorData = {
  date: string
  visitors: number
}

type VisitorPeriod = "day" | "week" | "month"

function getTodayDateValue() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const periodLabels: Record<VisitorPeriod, string> = {
  day: "day",
  week: "week",
  month: "month",
}

export function ChartAreaInteractive({ visitorData: suppliedVisitorData }: { visitorData?: VisitorData[] }) {
  const [period, setPeriod] = React.useState<VisitorPeriod>("month")
  const [selectedDate, setSelectedDate] = React.useState(
    () => suppliedVisitorData?.[suppliedVisitorData.length - 1]?.date ?? getTodayDateValue(),
  )
  const [visitorData, setVisitorData] = React.useState<VisitorData[]>(suppliedVisitorData ?? [])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    if (suppliedVisitorData !== undefined) {
      setVisitorData(suppliedVisitorData)
      setLoading(false)
      setError("")
      return
    }

    const controller = new AbortController()

    const loadVisitors = async () => {
      setLoading(true)
      setError("")

      try {
        const params = new URLSearchParams({ date: selectedDate, period })
        const response = await fetch(`/api/admin/dashboard/visitors?${params.toString()}`, {
          signal: controller.signal,
        })
        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Unable to load visitor data")
        }
        setVisitorData(Array.isArray(result.visitors) ? result.visitors : [])
      } catch (fetchError) {
        if (controller.signal.aborted) return
        setVisitorData([])
        setError(fetchError instanceof Error ? fetchError.message : "Unable to load visitor data")
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadVisitors()
    return () => controller.abort()
  }, [period, selectedDate, suppliedVisitorData])

  const visibleData = React.useMemo(() => {
    if (suppliedVisitorData === undefined || !selectedDate) return visitorData

    const anchor = new Date(`${selectedDate}T00:00:00.000Z`)
    if (Number.isNaN(anchor.getTime())) return visitorData
    const start = new Date(anchor)
    let bucketCount = 1
    if (period === "week") {
      start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7))
      bucketCount = 7
    } else if (period === "month") {
      start.setUTCDate(1)
      bucketCount = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate()
    }
    const end = new Date(start)
    end.setUTCDate(end.getUTCDate() + bucketCount)
    const startKey = start.toISOString().slice(0, 10)
    const endKey = end.toISOString().slice(0, 10)
    return visitorData.filter((item) => item.date >= startKey && item.date < endKey)
  }, [period, selectedDate, suppliedVisitorData, visitorData])

  const totalVisitors = visibleData.reduce((total, item) => total + item.visitors, 0)
  const handlePeriodChange = (value: string) => {
    if (value === "day" || value === "week" || value === "month") setPeriod(value)
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total Visitors</CardTitle>
        <CardDescription aria-live="polite">
          {loading
            ? "Loading visitor data..."
            : error
              ? error
              : `${totalVisitors} visitors for the selected ${periodLabels[period]}`}
        </CardDescription>
        <CardAction className="flex flex-wrap items-center justify-end gap-2">
          <input
            type="date"
            aria-label="Select date for visitor data"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          />
          <ToggleGroup
            type="single"
            value={period}
            onValueChange={handlePeriodChange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-3! @[767px]/card:flex"
          >
            <ToggleGroupItem value="day">Day</ToggleGroupItem>
            <ToggleGroupItem value="week">Week</ToggleGroupItem>
            <ToggleGroupItem value="month">Month</ToggleGroupItem>
          </ToggleGroup>
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger
              className="flex w-28 @[767px]/card:hidden"
              size="sm"
              aria-label="Select visitor period"
            >
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {error ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-destructive">{error}</div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <AreaChart data={visibleData} aria-busy={loading}>
              <defs>
                <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-visitors)" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="var(--color-visitors)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="visitors"
                type="natural"
                fill="url(#fillVisitors)"
                stroke="var(--color-visitors)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
