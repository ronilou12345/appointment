import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"
import { normalizeUserRole } from "@/lib/user-role"
import { getSearchPages, type SearchHit } from "@/lib/search"

const LIMIT = 8

function textFilter(q: string) {
  return { contains: q, mode: "insensitive" as const }
}

function formatDate(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : ""
}

function formatTime(value: Date | null | undefined) {
  return value ? value.toISOString().slice(11, 16) : ""
}

function doctorName(doctor: { prefix?: string | null; first_name?: string | null; last_name?: string | null }) {
  return [doctor.prefix, doctor.first_name, doctor.last_name].filter(Boolean).join(" ") || "Doctor"
}

async function safeSearch(query: () => Promise<SearchHit[]>): Promise<SearchHit[]> {
  try {
    return await query()
  } catch {
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const q = request.nextUrl.searchParams.get("q")?.trim() ?? ""
    const role = normalizeUserRole(session.role)
    const pages = getSearchPages(role).map((page) => ({
      id: `page:${page.href}`,
      group: "Pages",
      title: page.label,
      description: page.href,
      href: page.href,
    }))

    if (q.length < 2) {
      return NextResponse.json({ success: true, role, results: pages })
    }

    const numericId = Number(q)
    const hasNumericId = Number.isInteger(numericId) && numericId > 0
    let results: SearchHit[] = []

    if (role === "ADMIN") {
      const [users, appointments, doctors, medicines, specialties, activityLogs] = await Promise.all([
        safeSearch(async () => {
          const rows = await prisma.user.findMany({
            where: {
              OR: [
                { name: textFilter(q) },
                { email: textFilter(q) },
              ],
            },
            take: LIMIT,
            orderBy: { name: "asc" },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
              doctor: { select: { doctor_id: true } },
            },
          })

          return rows.map((user) => {
            const roleLabel = String(user.role ?? "USER")
            const href =
              user.doctor?.doctor_id
                ? `/admin/all-doctors/${user.doctor.doctor_id}`
                : roleLabel === "PATIENT"
                  ? `/admin/patients/${user.id}`
                  : "/admin/manage-users"

            return {
              id: `user:${user.id}`,
              group: roleLabel === "NURSE" ? "Doctors" : roleLabel === "PATIENT" ? "Patients" : "Users",
              title: user.name,
              description: `${user.email} · ${roleLabel} · ${user.status ?? "ACTIVE"}`,
              href,
            }
          })
        }),
        safeSearch(async () => {
          const rows = await prisma.appointment.findMany({
            where: {
              OR: [
                ...(hasNumericId ? [{ appointment_id: numericId }] : []),
                { reason_for_visit: textFilter(q) },
                { appointment_status: textFilter(q) },
                { appointment_type: textFilter(q) },
                { contact_number: textFilter(q) },
                { user: { name: textFilter(q) } },
                { user: { email: textFilter(q) } },
                { doctor: { first_name: textFilter(q) } },
                { doctor: { last_name: textFilter(q) } },
              ],
            },
            take: LIMIT,
            orderBy: { appointment_id: "desc" },
            select: {
              appointment_id: true,
              appointment_status: true,
              appointment_type: true,
              appointment_date: true,
              user: { select: { name: true } },
              doctor: { select: { prefix: true, first_name: true, last_name: true } },
            },
          })

          return rows.map((row) => ({
            id: `appointment:${row.appointment_id}`,
            group: "Appointments",
            title: `${row.user?.name ?? "Patient"} with ${doctorName(row.doctor)}`,
            description: `${row.appointment_status ?? "Pending"} · ${row.appointment_type ?? "Consultation"} · ${formatDate(row.appointment_date) || "No date"}`,
            href: `/admin/all-appointments/${row.appointment_id}`,
          }))
        }),
        safeSearch(async () => {
          const rows = await prisma.doctor.findMany({
            where: {
              OR: [
                ...(hasNumericId ? [{ doctor_id: numericId }] : []),
                { first_name: textFilter(q) },
                { last_name: textFilter(q) },
                { license_number: textFilter(q) },
                { credentials: textFilter(q) },
                { specialties: { specialty_name: textFilter(q) } },
              ],
            },
            take: LIMIT,
            orderBy: { last_name: "asc" },
            select: {
              doctor_id: true,
              prefix: true,
              first_name: true,
              last_name: true,
              license_number: true,
              specialties: { select: { specialty_name: true } },
            },
          })

          return rows.map((row) => ({
            id: `doctor:${row.doctor_id}`,
            group: "Doctors",
            title: doctorName(row),
            description: [row.specialties?.specialty_name, row.license_number].filter(Boolean).join(" · ") || "Doctor",
            href: `/admin/all-doctors/${row.doctor_id}`,
          }))
        }),
        safeSearch(async () => {
          const rows = await prisma.medicine_inventory.findMany({
            where: {
              OR: [
                { medicine_name: textFilter(q) },
                { category: textFilter(q) },
                { supplier: textFilter(q) },
                { status: textFilter(q) },
              ],
            },
            take: LIMIT,
            orderBy: { medicine_name: "asc" },
            select: {
              medicine_id: true,
              medicine_name: true,
              category: true,
              quantity: true,
              status: true,
            },
          })

          return rows.map((row) => ({
            id: `medicine:${row.medicine_id}`,
            group: "Medicine",
            title: row.medicine_name,
            description: `${row.category} · ${row.quantity} in stock · ${row.status}`,
            href: "/admin/inventory",
          }))
        }),
        safeSearch(async () => {
          const rows = await prisma.specialties.findMany({
            where: {
              OR: [{ specialty_name: textFilter(q) }, { description: textFilter(q) }],
            },
            take: LIMIT,
            orderBy: { specialty_name: "asc" },
            select: {
              specialty_id: true,
              specialty_name: true,
              status: true,
            },
          })

          return rows.map((row) => ({
            id: `specialty:${row.specialty_id}`,
            group: "Specialties",
            title: row.specialty_name,
            description: row.status ? `Status: ${row.status}` : "Clinic specialty",
            href: "/admin/add-specialties",
          }))
        }),
        safeSearch(async () => {
          const rows = await prisma.activity_log.findMany({
            where: {
              OR: [
                { action: textFilter(q) },
                { details: textFilter(q) },
                { user_name: textFilter(q) },
                { user_email: textFilter(q) },
              ],
            },
            take: LIMIT,
            orderBy: { created_at: "desc" },
            select: {
              id: true,
              action: true,
              details: true,
              user_name: true,
            },
          })

          return rows.map((row) => ({
            id: `activity:${row.id.toString()}`,
            group: "Activity Logs",
            title: row.action,
            description: [row.user_name, row.details].filter(Boolean).join(" · ") || "Activity log",
            href: "/admin/activity-logs",
          }))
        }),
      ])

      results = [...users, ...appointments, ...doctors, ...medicines, ...specialties, ...activityLogs]
    }

    if (role === "DOCTOR") {
      const doctor = await prisma.doctor.findUnique({
        where: { user_id: session.id },
        select: { doctor_id: true },
      })

      if (doctor) {
        const [appointments, sessions] = await Promise.all([
          safeSearch(async () => {
            const rows = await prisma.appointment.findMany({
              where: {
                doctor_id: doctor.doctor_id,
                OR: [
                  ...(hasNumericId ? [{ appointment_id: numericId }] : []),
                  { reason_for_visit: textFilter(q) },
                  { appointment_status: textFilter(q) },
                  { appointment_type: textFilter(q) },
                  { user: { name: textFilter(q) } },
                  { user: { email: textFilter(q) } },
                ],
              },
              take: LIMIT,
              orderBy: { appointment_id: "desc" },
              select: {
                appointment_id: true,
                appointment_status: true,
                appointment_type: true,
                appointment_date: true,
                reason_for_visit: true,
                user: { select: { name: true } },
              },
            })

            return rows.map((row) => ({
              id: `appointment:${row.appointment_id}`,
              group: "My Appointments",
              title: row.user?.name ?? "Patient",
              description: `${row.appointment_status ?? "Pending"} · ${row.appointment_type ?? row.reason_for_visit ?? "Consultation"} · ${formatDate(row.appointment_date) || "No date"}`,
              href: `/doctor/appointments/${row.appointment_id}`,
            }))
          }),
          safeSearch(async () => {
            const rows = await prisma.session_tbl.findMany({
              where: {
                doctor_id: doctor.doctor_id,
                OR: [
                  { appointment_type: textFilter(q) },
                  { status: textFilter(q) },
                ],
              },
              take: LIMIT,
              orderBy: { session_date: "desc" },
              select: {
                session_id: true,
                session_date: true,
                start_time: true,
                end_time: true,
                appointment_type: true,
                status: true,
                slots: true,
              },
            })

            return rows.map((row) => ({
              id: `session:${row.session_id}`,
              group: "Sessions",
              title: row.appointment_type || "Consultation session",
              description: `${formatDate(row.session_date)} · ${formatTime(row.start_time)}–${formatTime(row.end_time)} · ${row.slots} slots · ${row.status ?? "Open"}`,
              href: "/doctor/add-session",
            }))
          }),
        ])

        results = [...appointments, ...sessions]
      }
    }

    if (role === "CLIENT") {
      const [appointments, doctors] = await Promise.all([
        safeSearch(async () => {
          const rows = await prisma.appointment.findMany({
            where: {
              user_id: session.id,
              OR: [
                ...(hasNumericId ? [{ appointment_id: numericId }] : []),
                { reason_for_visit: textFilter(q) },
                { appointment_status: textFilter(q) },
                { appointment_type: textFilter(q) },
                { doctor: { first_name: textFilter(q) } },
                { doctor: { last_name: textFilter(q) } },
                { doctor: { specialties: { specialty_name: textFilter(q) } } },
              ],
            },
            take: LIMIT,
            orderBy: { appointment_id: "desc" },
            select: {
              appointment_id: true,
              appointment_status: true,
              appointment_type: true,
              appointment_date: true,
              doctor: {
                select: {
                  prefix: true,
                  first_name: true,
                  last_name: true,
                  specialties: { select: { specialty_name: true } },
                },
              },
            },
          })

          return rows.map((row) => ({
            id: `appointment:${row.appointment_id}`,
            group: "My Appointments",
            title: doctorName(row.doctor),
            description: `${row.appointment_status ?? "Pending"} · ${row.appointment_type ?? row.doctor.specialties?.specialty_name ?? "Consultation"} · ${formatDate(row.appointment_date) || "No date"}`,
            href: `/client/appointments/${row.appointment_id}`,
          }))
        }),
        safeSearch(async () => {
          const rows = await prisma.doctor.findMany({
            where: {
              OR: [
                { first_name: textFilter(q) },
                { last_name: textFilter(q) },
                { credentials: textFilter(q) },
                { specialties: { specialty_name: textFilter(q) } },
              ],
            },
            take: LIMIT,
            orderBy: { last_name: "asc" },
            select: {
              doctor_id: true,
              prefix: true,
              first_name: true,
              last_name: true,
              credentials: true,
              specialties: { select: { specialty_name: true } },
            },
          })

          return rows.map((row) => ({
            id: `doctor:${row.doctor_id}`,
            group: "Doctors",
            title: doctorName(row),
            description: [row.specialties?.specialty_name, row.credentials].filter(Boolean).join(" · ") || "Available doctor",
            href: `/client/all-doctors/${row.doctor_id}`,
          }))
        }),
      ])

      results = [...appointments, ...doctors]
    }

    return NextResponse.json({ success: true, role, results })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
