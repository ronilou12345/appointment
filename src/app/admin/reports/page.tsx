"use client"

import { useState } from "react"
import { CalendarDays, Activity, Stethoscope, Pill, TrendingUp, Users, Clock3 } from "lucide-react"

const reportCards = [
  {
    title: "Appointment Reports",
    subtitle: "View appointment statistics and trends",
    icon: CalendarDays,
    metric: "128",
    hint: "scheduled this month",
    accent: "from-orange-500/15 to-orange-500/5",
  },
  {
    title: "Doctor Performance",
    subtitle: "Analyze doctor availability and ratings",
    icon: Stethoscope,
    metric: "4.8/5",
    hint: "average satisfaction",
    accent: "from-sky-500/15 to-sky-500/5",
  },
  {
    title: "Patient Analytics",
    subtitle: "Track patient demographics and trends",
    icon: Users,
    metric: "82%",
    hint: "return rate",
    accent: "from-emerald-500/15 to-emerald-500/5",
  },
  {
    title: "Medicine Reports",
    subtitle: "Review medicine information",
    icon: Pill,
    metric: "36",
    hint: "items in stock",
    accent: "from-violet-500/15 to-violet-500/5",
  },
]

const highlights = [
  {
    label: "Peak Hours",
    value: "09:00 – 11:00",
    description: "Highest appointment traffic",
  },
  {
    label: "No-show Rate",
    value: "6.2%",
    description: "Improved from last month",
  },
  {
    label: "Average Wait Time",
    value: "14 min",
    description: "Faster than target",
  },
]

export default function Page() {
  const [activeCard, setActiveCard] = useState(reportCards[0].title)

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">Analytics</p>
          <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Monitor clinic performance, appointment trends, and patient insights in one place.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {reportCards.map((card) => {
            const Icon = card.icon
            const isActive = activeCard === card.title

            return (
              <button
                key={card.title}
                type="button"
                onClick={() => setActiveCard(card.title)}
                className={`rounded-2xl border p-5 text-left transition-all ${
                  isActive
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-background/80 hover:border-primary/50 hover:bg-background"
                }`}
              >
                <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${card.accent} p-2`}>
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{card.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{card.subtitle}</p>
                <div className="mt-4 flex items-end justify-between">
                  <span className="text-2xl font-semibold">{card.metric}</span>
                  <span className="text-xs text-muted-foreground">{card.hint}</span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
          <div className="rounded-2xl border border-border bg-background/80 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{activeCard}</h2>
                <p className="text-sm text-muted-foreground">Live summary for the current reporting view</p>
              </div>
              <div className="px-3 py-1 text-sm font-medium text-white">Updated today</div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Performance trend
                </div>
                <p className="text-2xl font-semibold">+12.4%</p>
                <p className="mt-1 text-sm text-muted-foreground">Compared to the previous reporting period</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Clock3 className="h-4 w-4 text-primary" />
                  Average handling time
                </div>
                <p className="text-2xl font-semibold">18 min</p>
                <p className="mt-1 text-sm text-muted-foreground">Optimized for faster patient flow</p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-dashed border-border/70 bg-muted/30 p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Activity className="h-4 w-4 text-primary" />
                Key insight
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {activeCard === "Appointment Reports" && "Appointment demand is strongest mid-morning, and the clinic is trending above target for completed visits."}
                {activeCard === "Doctor Performance" && "Doctor availability remains healthy, with the highest ratings linked to faster follow-ups and clear communication."}
                {activeCard === "Patient Analytics" && "Patient retention is improving, with repeat visitors concentrated in preventive care and chronic follow-up visits."}
                {activeCard === "Medicine Reports" && "Medicine inventory is balanced, with fast-moving items consistently replenished and low-stock warnings under control."}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {highlights.map((item) => (
              <div key={item.label} className="rounded-2xl border border-border bg-background/80 p-4">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-xl font-semibold">{item.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
