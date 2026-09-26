import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import { normalizeUserRole } from "@/lib/user-role"

type VisitorPeriod = "day" | "week" | "month"

function parseDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.status !== "ACTIVE" || normalizeUserRole(session.role) !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const selectedDate = parseDate(params.get("date"))
  const periodValue = params.get("period")
  if (!selectedDate || !["day", "week", "month"].includes(periodValue ?? "")) {
    return NextResponse.json({ success: false, error: "A valid date and period are required" }, { status: 400 })
  }

  const period = periodValue as VisitorPeriod
  const startDate = new Date(selectedDate)
  let bucketCount = 1

  if (period === "week") {
    const daysSinceMonday = (startDate.getUTCDay() + 6) % 7
    startDate.setUTCDate(startDate.getUTCDate() - daysSinceMonday)
    bucketCount = 7
  } else if (period === "month") {
    startDate.setUTCDate(1)
    bucketCount = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + 1, 0)).getUTCDate()
  }

  const endDate = new Date(startDate)
  endDate.setUTCDate(endDate.getUTCDate() + bucketCount)

  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        appointment_date: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: { appointment_date: true },
    })

    const countByDate = new Map<string, number>()
    for (const appointment of appointments) {
      if (!appointment.appointment_date) continue
      const dateKey = toDateKey(appointment.appointment_date)
      countByDate.set(dateKey, (countByDate.get(dateKey) ?? 0) + 1)
    }

    const visitors = Array.from({ length: bucketCount }, (_, index) => {
      const date = new Date(startDate)
      date.setUTCDate(startDate.getUTCDate() + index)
      const dateKey = toDateKey(date)
      return { date: dateKey, visitors: countByDate.get(dateKey) ?? 0 }
    })

    return NextResponse.json({ success: true, visitors })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}