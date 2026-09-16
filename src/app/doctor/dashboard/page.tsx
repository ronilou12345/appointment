import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import { DoctorDashboard } from "@/components/doctor-dashboard"

type AppointmentTrendPoint = {
  date: string
  visitors: number
}

type TopProcedure = {
  title: string
  value: string
}

async function getDoctorTopProcedures(userId: string): Promise<TopProcedure[]> {
  const doctor = await prisma.doctor.findUnique({
    where: { user_id: userId },
    select: { doctor_id: true },
  })

  if (!doctor) return []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const rows = await prisma.$queryRawUnsafe<Array<{ title: string; count: number }>>(
    `
      SELECT
        s.appointment_type::text AS title,
        COUNT(s.session_id)::int AS count
      FROM "session_tbl" s
      WHERE s.doctor_id = $1
        AND s.session_date = $2::date
      GROUP BY s.appointment_type
      ORDER BY count DESC, s.appointment_type ASC
      LIMIT 3
    `,
    doctor.doctor_id,
    today.toISOString().slice(0, 10),
  )

  const total = rows.reduce((sum, row) => sum + Number(row.count ?? 0), 0)

  return rows.length === 0
    ? []
    : rows.map((row) => ({
        title: row.title ?? "General consultation",
        value: total > 0 ? `${Math.round((Number(row.count) / total) * 100)}%` : "0%",
      }))
}

async function getDoctorAppointmentTrend(userId: string): Promise<AppointmentTrendPoint[]> {
  const doctor = await prisma.doctor.findUnique({
    where: { user_id: userId },
    select: { doctor_id: true },
  })

  if (!doctor) return []

  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - 29)
  start.setHours(0, 0, 0, 0)

  const end = new Date(today)
  end.setHours(23, 59, 59, 999)

  const rows = await prisma.$queryRawUnsafe<Array<{ date: string; visitors: number }>>(
    `
      SELECT
        s.session_date::date AS date,
        COUNT(a.appointment_id)::int AS visitors
      FROM "session_tbl" s
      LEFT JOIN "appointment" a
        ON a.session_id = s.session_id
       AND a.doctor_id = s.doctor_id
      WHERE s.doctor_id = $1
        AND s.session_date >= $2::date
        AND s.session_date <= $3::date
      GROUP BY s.session_date
      ORDER BY s.session_date ASC
    `,
    doctor.doctor_id,
    start.toISOString().slice(0, 10),
    end.toISOString().slice(0, 10),
  )

  return rows.map((row) => ({
    date: row.date,
    visitors: Number(row.visitors ?? 0),
  }))
}

async function getDoctorDashboardCounts(userId: string) {
  const doctor = await prisma.doctor.findUnique({
    where: { user_id: userId },
    select: { doctor_id: true },
  })

  if (!doctor) {
    return {
      todayPatients: 0,
      confirmedAppointments: 0,
      sessionsCount: 0,
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayPatients = await prisma.appointment.count({
    where: {
      doctor_id: doctor.doctor_id,
      session_tbl: {
        is: {
          session_date: today,
        },
      },
    },
  })

  const confirmedAppointments = await prisma.appointment.count({
    where: {
      doctor_id: doctor.doctor_id,
      appointment_status: {
        equals: "Confirmed",
        mode: "insensitive",
      },
      session_tbl: {
        is: {
          session_date: today,
        },
      },
    },
  })

  const sessionsCount = await prisma.session_tbl.count({
    where: {
      doctor_id: doctor.doctor_id,
      session_date: today,
      slots: {
        gt: 0,
      },
    },
  })

  return {
    todayPatients,
    confirmedAppointments,
    sessionsCount,
  }
}

async function getDoctorNextAppointments(userId: string) {
  const doctor = await prisma.doctor.findUnique({
    where: { user_id: userId },
    select: { doctor_id: true },
  })

  if (!doctor) return []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const appointments = await prisma.appointment.findMany({
    where: {
      doctor_id: doctor.doctor_id,
      session_tbl: {
        is: {
          session_date: {
            gte: today,
          },
        },
      },
    },
    orderBy: [
      { session_tbl: { session_date: "asc" } },
      { session_tbl: { start_time: "asc" } },
    ],
    take: 3,
    select: {
      appointment_id: true,
      appointment_status: true,
      user: { select: { name: true, profile_image: true } },
      session_tbl: { select: { session_date: true, start_time: true, appointment_type: true } },
    },
  })

  return appointments.map((appt) => {
    const time = appt.session_tbl?.start_time
      ? appt.session_tbl.start_time.toISOString().slice(11, 16)
      : ""
    const date = appt.session_tbl?.session_date
      ? appt.session_tbl.session_date.toISOString().split("T")[0]
      : ""

    return {
      id: String(appt.appointment_id),
      time,
      date,
      name: appt.user?.name ?? "Unknown Patient",
      status: appt.appointment_status ?? "Pending",
      appointmentType: appt.session_tbl?.appointment_type ?? "General Consultation",
      avatar: appt.user?.profile_image ?? null,
    }
  })
}

export default async function DoctorDashboardPage() {
  const session = await getSession()
  const counts =
    session?.id != null
      ? await getDoctorDashboardCounts(session.id)
      : {
          todayPatients: 0,
          confirmedAppointments: 0,
          sessionsCount: 0,
        }

  const nextAppointments =
    session?.id != null ? await getDoctorNextAppointments(session.id) : []

  const appointmentTrend =
    session?.id != null ? await getDoctorAppointmentTrend(session.id) : []

  const topProcedures =
    session?.id != null ? await getDoctorTopProcedures(session.id) : []

  return (
    <DoctorDashboard
      {...counts}
      nextAppointments={nextAppointments}
      appointmentTrend={appointmentTrend}
      topProcedures={topProcedures}
    />
  )
}
