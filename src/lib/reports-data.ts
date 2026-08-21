import prisma from "@/lib/prisma"

export type NamedCount = {
  label: string
  count: number
}

export type DoctorPerformance = {
  id: number
  name: string
  appointments: number
  completed: number
  sessions: number
}

export type ReportsData = {
  generatedAt: string
  users: {
    total: number
    clients: number
    doctors: number
    admins: number
    staff: number
    active: number
  }
  appointments: {
    total: number
    thisMonth: number
    pending: number
    confirmed: number
    completed: number
    cancelled: number
    byStatus: NamedCount[]
    byType: NamedCount[]
    byHour: NamedCount[]
  }
  doctors: {
    total: number
    active: number
    sessions: number
    sessionsToday: number
    performance: DoctorPerformance[]
  }
  patients: {
    total: number
    active: number
    returning: number
    byGender: NamedCount[]
  }
  medicine: {
    total: number
    inStock: number
    lowStock: number
    outOfStock: number
    expired: number
  }
  clinical: {
    soapNotes: number
    specialties: number
    vitals: number
  }
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfDay(date = new Date()) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function endOfDay(date = new Date()) {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

function statusCount(rows: Array<{ label: string | null; count: number }>, match: string) {
  return rows
    .filter((row) => String(row.label ?? "Pending").trim().toLowerCase() === match)
    .reduce((sum, row) => sum + row.count, 0)
}

async function safeCount(query: () => Promise<number>) {
  try {
    return await query()
  } catch {
    return 0
  }
}

export async function getReportsData(): Promise<ReportsData> {
  const monthStart = startOfMonth()
  const todayStart = startOfDay()
  const todayEnd = endOfDay()
  const today = new Date()

  const [
    usersByRole,
    usersByStatus,
    appointmentStatus,
    appointmentTypes,
    appointmentsTotal,
    appointmentsThisMonth,
    doctorUsers,
    activeDoctorUsers,
    sessionsTotal,
    sessionsToday,
    doctors,
    completedByDoctor,
    patientsTotal,
    activePatients,
    appointmentsByPatient,
    genderRows,
    medicines,
    specialties,
    soapNotes,
    vitals,
    hourRows,
  ] = await Promise.all([
    prisma.user.groupBy({
      by: ["role"],
      _count: { id: true },
    }),
    prisma.user.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.appointment.groupBy({
      by: ["appointment_status"],
      _count: { appointment_id: true },
    }),
    prisma.appointment.groupBy({
      by: ["appointment_type"],
      _count: { appointment_id: true },
    }),
    prisma.appointment.count(),
    prisma.appointment.count({
      where: {
        OR: [{ created_at: { gte: monthStart } }, { appointment_date: { gte: monthStart } }],
      },
    }),
    prisma.user.count({ where: { role: { in: ["NURSE"] } } }),
    prisma.user.count({ where: { role: { in: ["NURSE"] }, status: "ACTIVE" } }),
    prisma.session_tbl.count(),
    prisma.session_tbl.count({
      where: { session_date: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.doctor.findMany({
      select: {
        doctor_id: true,
        first_name: true,
        last_name: true,
        user: { select: { name: true } },
        _count: { select: { appointment: true, session_tbl: true } },
      },
      orderBy: { appointment: { _count: "desc" } },
      take: 8,
    }),
    prisma.appointment.groupBy({
      by: ["doctor_id"],
      where: { appointment_status: { equals: "Completed", mode: "insensitive" } },
      _count: { appointment_id: true },
    }),
    prisma.user.count({ where: { role: "PATIENT" } }),
    prisma.user.count({ where: { role: "PATIENT", status: "ACTIVE" } }),
    prisma.appointment.groupBy({
      by: ["user_id"],
      _count: { appointment_id: true },
    }),
    prisma.appointment.groupBy({
      by: ["gender"],
      _count: { appointment_id: true },
    }),
    prisma.medicine_inventory.findMany({
      select: {
        quantity: true,
        reorder_level: true,
        expiry_date: true,
      },
    }),
    safeCount(() => prisma.specialties.count()),
    safeCount(() => prisma.soap_notes.count()),
    safeCount(() => prisma.vital_signs.count()),
    prisma.$queryRawUnsafe<Array<{ hour: string | null; count: number }>>(
      `SELECT to_char(appointment_time, 'HH24:00') AS hour, COUNT(*)::int AS count
       FROM "appointment"
       WHERE appointment_time IS NOT NULL
       GROUP BY 1
       ORDER BY count DESC
       LIMIT 6`,
    ).catch(() => []),
  ])

  const roleCount = (role: string) =>
    usersByRole.find((row) => String(row.role) === role)?._count.id ?? 0

  const statusRows = appointmentStatus.map((row) => ({
    label: String(row.appointment_status ?? "Pending"),
    count: row._count.appointment_id,
  }))

  const completedMap = new Map(
    completedByDoctor.map((row) => [row.doctor_id, row._count.appointment_id]),
  )

  const expiredMedicines = medicines.filter((item) => item.expiry_date && item.expiry_date < today).length
  const outOfStock = medicines.filter((item) => item.quantity <= 0).length
  const lowStock = medicines.filter(
    (item) => item.quantity > 0 && item.quantity <= (item.reorder_level ?? 0),
  ).length

  return {
    generatedAt: new Date().toISOString(),
    users: {
      total: usersByRole.reduce((sum, row) => sum + row._count.id, 0),
      clients: roleCount("PATIENT"),
      doctors: roleCount("NURSE"),
      admins: roleCount("ADMIN"),
      staff: roleCount("STAFF"),
      active: usersByStatus.find((row) => String(row.status) === "ACTIVE")?._count.id ?? 0,
    },
    appointments: {
      total: appointmentsTotal,
      thisMonth: appointmentsThisMonth,
      pending: statusCount(statusRows, "pending"),
      confirmed: statusCount(statusRows, "confirmed"),
      completed: statusCount(statusRows, "completed"),
      cancelled: statusCount(statusRows, "cancelled"),
      byStatus: statusRows.sort((a, b) => b.count - a.count),
      byType: appointmentTypes
        .map((row) => ({
          label: String(row.appointment_type ?? "General Consultation"),
          count: row._count.appointment_id,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
      byHour: hourRows.map((row) => ({
        label: String(row.hour ?? "—"),
        count: Number(row.count ?? 0),
      })),
    },
    doctors: {
      total: doctorUsers,
      active: activeDoctorUsers,
      sessions: sessionsTotal,
      sessionsToday,
      performance: doctors.map((doctor) => ({
        id: doctor.doctor_id,
        name:
          doctor.user?.name ||
          [doctor.first_name, doctor.last_name].filter(Boolean).join(" ") ||
          `Doctor #${doctor.doctor_id}`,
        appointments: doctor._count.appointment,
        completed: completedMap.get(doctor.doctor_id) ?? 0,
        sessions: doctor._count.session_tbl,
      })),
    },
    patients: {
      total: patientsTotal,
      active: activePatients,
      returning: appointmentsByPatient.filter((row) => row._count.appointment_id > 1).length,
      byGender: genderRows
        .map((row) => ({
          label: String(row.gender ?? "Unspecified"),
          count: row._count.appointment_id,
        }))
        .sort((a, b) => b.count - a.count),
    },
    medicine: {
      total: medicines.length,
      inStock: medicines.length - outOfStock,
      lowStock,
      outOfStock,
      expired: expiredMedicines,
    },
    clinical: {
      soapNotes,
      specialties,
      vitals,
    },
  }
}
