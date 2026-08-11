import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import { DoctorDashboard } from "@/components/doctor-dashboard"

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
      user: { select: { name: true, avatar: true } },
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
      avatar: appt.user?.avatar ?? null,
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

  return <DoctorDashboard {...counts} nextAppointments={nextAppointments} />
}
