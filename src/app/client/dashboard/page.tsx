import { PatientDashboard } from "@/components/patient-dashboard"
import { getUserByRole } from "@/lib/user-role"
import { getSession } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"

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

export default async function ClientDashboardPage() {
  const session = await getSession()
  const fallbackUser = getUserByRole("CLIENT")
  const userProp = session
    ? {
        name: session.name,
        email: session.email,
        avatar: session.profile_image ?? fallbackUser.avatar,
      }
    : fallbackUser

  const nextPending = session?.id ? await getNextPendingAppointment(session.id) : null

  const getLatestVitals = async (userId: string | number) => {
    try {
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT weight, height, heart_rate, body_temperature, created_at FROM "vital_signs" WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        String(userId),
      )
      if (!rows?.length) return null
      const r = rows[0]
      return {
        weight: r.weight ?? null,
        height: r.height ?? null,
        heartRate: r.heart_rate ?? null,
        bodyTemperature: r.body_temperature ?? null,
        recordedAt: r.created_at ?? null,
      }
    } catch {
      return null
    }
  }

  const latestVitals = session?.id ? await getLatestVitals(session.id) : null

  return <PatientDashboard user={userProp} nextPending={nextPending} latestVitals={latestVitals} />
}
