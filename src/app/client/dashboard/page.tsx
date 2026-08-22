import { PatientDashboard } from "@/components/patient-dashboard"
import { getUserByRole } from "@/lib/user-role"
import { getSession } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"
import { ensureVitalSignsColumns, toVitalNumber } from "@/lib/vital-signs"

async function getNextPendingAppointment(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const appt = await prisma.appointment.findFirst({
    where: {
      user_id: userId,
      appointment_status: { equals: "Pending", mode: "insensitive" },
      session_tbl: {
        is: {
          session_date: { gte: today },
        },
      },
    },
    orderBy: [
      { session_tbl: { session_date: "asc" } },
      { session_tbl: { start_time: "asc" } },
    ],
    select: {
      appointment_id: true,
      appointment_status: true,
      session_tbl: {
        select: { session_date: true, start_time: true, appointment_type: true },
      },
    },
  })

  if (!appt) return null

  return {
    id: String(appt.appointment_id),
    status: appt.appointment_status ?? "Pending",
    title: appt.session_tbl?.appointment_type ?? "General Consultation",
    date: appt.session_tbl?.session_date ? appt.session_tbl.session_date.toISOString().split("T")[0] : "",
    time: appt.session_tbl?.start_time ? appt.session_tbl.start_time.toISOString().slice(11, 16) : "",
  }
}

function latestMetric(rows: any[], key: string) {
  for (const row of rows) {
    const value = toVitalNumber(row[key])
    if (value != null) return value
  }
  return null
}

async function getPatientVitals(userId: string) {
  try {
    await ensureVitalSignsColumns()
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT
          v.heart_rate,
          v.body_temperature,
          v.weight,
          v.height,
          v.blood_sugar,
          v.created_at
        FROM "vital_signs" v
        LEFT JOIN "appointment" a ON a.appointment_id = v.appointment_id
        WHERE v.user_id = $1 OR a.user_id = $1
        ORDER BY v.created_at DESC NULLS LAST
        LIMIT 14`,
      userId,
    )

    const latest = {
      heartRate: latestMetric(rows, "heart_rate"),
      bodyTemperature: latestMetric(rows, "body_temperature"),
      weight: latestMetric(rows, "weight"),
      height: latestMetric(rows, "height"),
      bloodSugar: latestMetric(rows, "blood_sugar"),
    }

    const trend = [...rows]
      .reverse()
      .map((row) => {
        const recordedAt = row.created_at ? new Date(row.created_at) : null
        return {
          day: recordedAt && !Number.isNaN(recordedAt.getTime())
            ? recordedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "—",
          bpm: toVitalNumber(row.heart_rate),
          temp: toVitalNumber(row.body_temperature),
        }
      })
      .filter((point) => point.bpm != null)

    return { latest, trend }
  } catch {
    return {
      latest: {
        heartRate: null,
        bodyTemperature: null,
        weight: null,
        height: null,
        bloodSugar: null,
      },
      trend: [],
    }
  }
}

export default async function ClientDashboardPage() {
  const session = await getSession()
  const fallbackUser = getUserByRole("CLIENT")
  const userProp = session
    ? {
        name: session.name,
        email: session.email,
        avatar: session.profile_image ?? "",
      }
    : fallbackUser

  const nextPending = session?.id ? await getNextPendingAppointment(session.id) : null
  const vitals = session?.id
    ? await getPatientVitals(session.id)
    : {
        latest: {
          heartRate: null,
          bodyTemperature: null,
          weight: null,
          height: null,
          bloodSugar: null,
        },
        trend: [],
      }

  return <PatientDashboard user={userProp} nextPending={nextPending} latestVitals={vitals.latest} healthTrend={vitals.trend} />
}
