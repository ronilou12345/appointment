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

export type UserRecord = {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdAt: string | null
}

export type AppointmentRecord = {
  id: number
  patient: string
  doctor: string
  type: string
  status: string
  date: string
  time: string
  createdAt: string | null
}

export type ClinicalRecord = {
  id: number
  kind: "soap" | "vital"
  patient: string
  doctor: string
  date: string
  status: string
  summary: string
}

export type MedicineRecord = {
  id: number
  name: string
  category: string
  quantity: number
  expiryDate: string | null
  status: string
  supplier: string
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
    records: UserRecord[]
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
    records: AppointmentRecord[]
  }
  doctors: {
    total: number
    active: number
    sessions: number
    sessionsToday: number
    performance: DoctorPerformance[]
    records: UserRecord[]
  }
  patients: {
    total: number
    active: number
    returning: number
    byGender: NamedCount[]
    records: UserRecord[]
  }
  medicine: {
    total: number
    inStock: number
    lowStock: number
    outOfStock: number
    expired: number
    records: MedicineRecord[]
  }
  clinical: {
    soapNotes: number
    specialties: number
    vitals: number
    records: ClinicalRecord[]
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

function normalizeStatus(value: string | null | undefined) {
  return (value ?? "Pending").toString().trim() || "Pending"
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—"
  return new Date(value).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
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
    userRecords,
    appointmentRecords,
    doctorRecords,
    medicineRecords,
    soapNoteRecords,
    vitalSignRecords,
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
      where: { NOT: { status: { equals: "Deleted", mode: "insensitive" } } },
      select: {
        medicine_id: true,
        medicine_name: true,
        category: true,
        pieces: true,
        expiry_date: true,
        status: true,
        supplier: true,
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
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.appointment.findMany({
      orderBy: [{ created_at: "desc" }],
      include: {
        user: { select: { name: true, email: true } },
        doctor: {
          select: {
            first_name: true,
            last_name: true,
            user: { select: { name: true } },
          },
        },
      },
    }),
    prisma.doctor.findMany({
      include: {
        user: { select: { name: true, status: true, email: true } },
        specialties: { select: { specialty_name: true } },
      },
      orderBy: { created_at: "desc" },
    }),
    prisma.medicine_inventory.findMany({
      where: { NOT: { status: { equals: "Deleted", mode: "insensitive" } } },
      select: {
        medicine_id: true,
        medicine_name: true,
        category: true,
        pieces: true,
        expiry_date: true,
        status: true,
        supplier: true,
      },
      orderBy: { created_at: "desc" },
    }),
    prisma.soap_notes.findMany({
      include: {
        appointment: {
          include: {
            user: { select: { name: true } },
            doctor: { select: { first_name: true, last_name: true, user: { select: { name: true } } } },
          },
        },
      },
      orderBy: { created_at: "desc" },
    }),
    prisma.vital_signs.findMany({
      include: {
        appointment: {
          include: {
            user: { select: { name: true } },
            doctor: { select: { first_name: true, last_name: true, user: { select: { name: true } } } },
          },
        },
      },
      orderBy: { created_at: "desc" },
    }),
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
  const outOfStock = medicines.filter((item) => (item.pieces ?? 0) <= 0).length
  const lowStock = medicines.filter((item) => (item.pieces ?? 0) > 0 && (item.pieces ?? 0) <= 20).length

  const mappedUsers: UserRecord[] = userRecords.map((user) => ({
    id: user.id,
    name: user.name ?? "Unknown user",
    email: user.email ?? "—",
    role: String(user.role ?? "PATIENT"),
    status: String(user.status ?? "ACTIVE"),
    createdAt: user.createdAt ? formatDateTime(user.createdAt) : null,
  }))

  const mappedAppointments: AppointmentRecord[] = appointmentRecords.map((row) => ({
    id: row.appointment_id,
    patient: row.user?.name ?? "Unknown patient",
    doctor: row.doctor?.user?.name || [row.doctor?.first_name, row.doctor?.last_name].filter(Boolean).join(" ") || "Unknown doctor",
    type: row.appointment_type ?? "General Consultation",
    status: normalizeStatus(row.appointment_status),
    date: row.appointment_date ? new Date(row.appointment_date).toLocaleDateString("en-PH", { timeZone: "Asia/Manila" }) : "—",
    time: row.appointment_time ? new Date(`1970-01-01T${new Date(row.appointment_time).toISOString().slice(11, 19)}Z`).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" }) : "—",
    createdAt: row.created_at ? formatDateTime(row.created_at) : null,
  }))

  const mappedDoctorRecords: UserRecord[] = doctorRecords.map((doctor) => ({
    id: doctor.user_id,
    name: doctor.user?.name || [doctor.first_name, doctor.last_name].filter(Boolean).join(" ") || "Unknown doctor",
    email: doctor.user?.email ?? "—",
    role: "NURSE",
    status: String(doctor.user?.status ?? "ACTIVE"),
    createdAt: doctor.created_at ? formatDateTime(doctor.created_at) : null,
  }))

  const mappedMedicineRecords: MedicineRecord[] = medicineRecords.map((item) => ({
    id: item.medicine_id,
    name: item.medicine_name,
    category: item.category,
    quantity: Number(item.pieces ?? 0),
    expiryDate: item.expiry_date ? new Date(item.expiry_date).toISOString() : null,
    status: item.status ?? "Available",
    supplier: item.supplier ?? "—",
  }))

  const mappedClinicalRecords: ClinicalRecord[] = [
    ...soapNoteRecords.map((row) => ({
      id: row.soap_id,
      kind: "soap" as const,
      patient: row.appointment?.user?.name ?? "Unknown patient",
      doctor: row.appointment?.doctor?.user?.name || [row.appointment?.doctor?.first_name, row.appointment?.doctor?.last_name].filter(Boolean).join(" ") || "Unknown doctor",
      date: row.appointment?.appointment_date ? new Date(row.appointment.appointment_date).toLocaleDateString("en-PH", { timeZone: "Asia/Manila" }) : "—",
      status: row.appointment?.appointment_status ?? "Pending",
      summary: row.diagnosis || row.chief_complaints || "SOAP note",
    })),
    ...vitalSignRecords.map((row) => ({
      id: row.vital_id,
      kind: "vital" as const,
      patient: row.appointment?.user?.name ?? "Unknown patient",
      doctor: row.appointment?.doctor?.user?.name || [row.appointment?.doctor?.first_name, row.appointment?.doctor?.last_name].filter(Boolean).join(" ") || "Unknown doctor",
      date: row.appointment?.appointment_date ? new Date(row.appointment.appointment_date).toLocaleDateString("en-PH", { timeZone: "Asia/Manila" }) : "—",
      status: row.appointment?.appointment_status ?? "Pending",
      summary: `Vitals: ${row.heart_rate ?? "—"} bpm, ${row.body_temperature ?? "—"}°C`,
    })),
  ]

  return {
    generatedAt: new Date().toISOString(),
    users: {
      total: usersByRole.reduce((sum, row) => sum + row._count.id, 0),
      clients: roleCount("PATIENT"),
      doctors: roleCount("NURSE"),
      admins: roleCount("ADMIN"),
      staff: roleCount("STAFF"),
      active: usersByStatus.find((row) => String(row.status) === "ACTIVE")?._count.id ?? 0,
      records: mappedUsers,
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
      records: mappedAppointments,
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
      records: mappedDoctorRecords,
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
      records: mappedUsers.filter((user) => user.role === "PATIENT"),
    },
    medicine: {
      total: medicines.length,
      inStock: medicines.length - outOfStock,
      lowStock,
      outOfStock,
      expired: expiredMedicines,
      records: mappedMedicineRecords,
    },
    clinical: {
      soapNotes,
      specialties,
      vitals,
      records: mappedClinicalRecords,
    },
  }
}
