import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import { normalizeUserRole } from "@/lib/user-role"

type ReportRow = Record<string, string | number | null>

function dateValue(value: Date | string | null | undefined) {
  if (!value) return ""
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

function timeValue(value: Date | string | null | undefined) {
  if (!value) return ""
  if (value instanceof Date) return value.toISOString().slice(11, 16)
  return String(value).slice(0, 5)
}

function monthStart() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

function isThisMonth(createdAt: Date | null, appointmentDate: Date | null) {
  const start = monthStart()
  return Boolean(
    (createdAt && createdAt >= start) ||
    (appointmentDate && appointmentDate >= start),
  )
}

function isExpired(expiryDate: Date | null) {
  if (!expiryDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return expiryDate < today
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.status !== "ACTIVE" || normalizeUserRole(session.role) !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const kind = params.get("kind")
  const filter = params.get("filter") ?? "all"
  const value = params.get("value") ?? ""

  try {
    let rows: ReportRow[] = []

    if (kind === "users" || kind === "clients") {
      const users = await prisma.user.findMany({
        where: kind === "clients" ? { role: "PATIENT" } : undefined,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
      })
      rows = users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: dateValue(user.createdAt),
      }))
    } else if (kind === "doctors") {
      const [doctors, completedRows] = await Promise.all([
        prisma.doctor.findMany({
          orderBy: { doctor_id: "desc" },
          select: {
            doctor_id: true,
            first_name: true,
            middle_name: true,
            last_name: true,
            license_number: true,
            credentials: true,
            specialties: { select: { specialty_name: true } },
            user: { select: { name: true, email: true, status: true } },
            _count: { select: { appointment: true, session_tbl: true } },
          },
        }),
        prisma.appointment.groupBy({
          by: ["doctor_id"],
          where: { appointment_status: { equals: "Completed", mode: "insensitive" } },
          _count: { appointment_id: true },
        }),
      ])
      const completedByDoctor = new Map(completedRows.map((row) => [row.doctor_id, row._count.appointment_id]))
      rows = doctors.map((doctor) => ({
        id: doctor.doctor_id,
        name: doctor.user.name || [doctor.first_name, doctor.middle_name, doctor.last_name].filter(Boolean).join(" "),
        email: doctor.user.email,
        status: doctor.user.status,
        specialty: doctor.specialties?.specialty_name ?? "—",
        credentials: doctor.credentials ?? "—",
        license: doctor.license_number,
        appointments: doctor._count.appointment,
        completed: completedByDoctor.get(doctor.doctor_id) ?? 0,
        sessions: doctor._count.session_tbl,
      }))
      if (filter === "doctor") rows = rows.filter((row) => String(row.id) === value)
    } else if (kind === "appointments") {
      const appointments = await prisma.appointment.findMany({
        orderBy: { appointment_id: "desc" },
        select: {
          appointment_id: true,
          user_id: true,
          doctor_id: true,
          appointment_status: true,
          appointment_type: true,
          appointment_date: true,
          appointment_time: true,
          created_at: true,
          reason_for_visit: true,
          relationship: true,
          age: true,
          gender: true,
          contact_number: true,
          user: { select: { name: true, email: true } },
          doctor: {
            select: {
              first_name: true,
              middle_name: true,
              last_name: true,
              user: { select: { name: true } },
            },
          },
          session_tbl: { select: { appointment_type: true, session_date: true, start_time: true } },
        },
      })

      rows = appointments.map((appointment) => ({
        id: appointment.appointment_id,
        patientId: appointment.user_id,
        doctorId: appointment.doctor_id,
        patient: appointment.user?.name ?? "Unknown patient",
        email: appointment.user?.email ?? "",
        doctor: appointment.doctor?.user?.name || [appointment.doctor?.first_name, appointment.doctor?.middle_name, appointment.doctor?.last_name].filter(Boolean).join(" "),
        status: appointment.appointment_status ?? "Pending",
        type: appointment.appointment_type || appointment.session_tbl?.appointment_type || "General Consultation",
        date: dateValue(appointment.appointment_date ?? appointment.session_tbl?.session_date),
        time: timeValue(appointment.appointment_time ?? appointment.session_tbl?.start_time),
        createdAt: dateValue(appointment.created_at),
        relationship: appointment.relationship ?? "—",
        age: appointment.age,
        gender: appointment.gender ?? "Unspecified",
        contact: appointment.contact_number ?? "—",
        reason: appointment.reason_for_visit ?? "—",
      }))

      if (filter === "this-month") {
        rows = rows.filter((row, index) => isThisMonth(appointments[index]?.created_at ?? null, appointments[index]?.appointment_date ?? null))
      } else if (filter === "completion-rate") {
        rows = rows.filter((row) => String(row.status).toLowerCase() === "completed")
      } else if (filter === "status") {
        rows = rows.filter((row) => String(row.status).trim().toLowerCase() === value.trim().toLowerCase())
      } else if (filter === "type") {
        rows = rows.filter((row) => String(row.type) === value)
      } else if (filter === "hour") {
        rows = rows.filter((row) => String(row.time).slice(0, 2) === value.slice(0, 2))
      } else if (filter === "gender") {
        rows = rows.filter((row) => String(row.gender) === value)
      } else if (filter === "doctor") {
        rows = rows.filter((row) => String(row.doctorId) === value)
      }
    } else if (kind === "patients") {
      const [patients, visitCounts] = await Promise.all([
        prisma.user.findMany({
          where: { role: "PATIENT" },
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true, email: true, status: true, createdAt: true },
        }),
        prisma.appointment.groupBy({ by: ["user_id"], _count: { appointment_id: true } }),
      ])
      const counts = new Map(visitCounts.map((row) => [row.user_id, row._count.appointment_id]))
      rows = patients.map((patient) => ({
        id: patient.id,
        name: patient.name,
        email: patient.email,
        status: patient.status,
        appointments: counts.get(patient.id) ?? 0,
        returning: (counts.get(patient.id) ?? 0) > 1 ? "Yes" : "No",
        createdAt: dateValue(patient.createdAt),
      }))
      if (filter === "returning") rows = rows.filter((row) => Number(row.appointments) > 1)
    } else if (kind === "clinical") {
      const [notes, vitals] = await Promise.all([
        prisma.soap_notes.findMany({
          orderBy: { created_at: "desc" },
          select: {
            soap_id: true,
            chief_complaints: true,
            diagnosis: true,
            created_at: true,
            appointment: {
              select: {
                appointment_id: true,
                user: { select: { name: true } },
                doctor: { select: { user: { select: { name: true } } } },
              },
            },
          },
        }),
        prisma.$queryRawUnsafe<any[]>(
          `SELECT v.vital_id, v.appointment_id, v.user_id, v.weight, v.height, v.heart_rate, v.body_temperature, v.blood_sugar, v.created_at, u.name AS patient_name
           FROM "vital_signs" v
           LEFT JOIN "user" u ON u.id = v.user_id
           ORDER BY v.created_at DESC NULLS LAST`,
        ),
      ])
      rows = [
        ...notes.map((note) => ({
          id: `SOAP-${note.soap_id}`,
          record: "SOAP note",
          patient: note.appointment.user.name,
          doctor: note.appointment.doctor.user.name,
          appointmentId: note.appointment.appointment_id,
          date: dateValue(note.created_at),
          details: note.diagnosis || note.chief_complaints,
        })),
        ...vitals.map((vital) => ({
          id: `VITAL-${vital.vital_id}`,
          record: "Vital signs",
          patient: vital.patient_name ?? "Unknown patient",
          doctor: "—",
          appointmentId: vital.appointment_id,
          date: dateValue(vital.created_at),
          details: `Weight ${vital.weight ?? "—"} kg; height ${vital.height ?? "—"} cm; heart rate ${vital.heart_rate ?? "—"}`,
        })),
      ]
      if (filter === "soap") rows = rows.filter((row) => row.record === "SOAP note")
      else if (filter === "vitals") rows = rows.filter((row) => row.record === "Vital signs")
    } else if (kind === "medicine") {
      const medicines = await prisma.medicine_inventory.findMany({
        where: { NOT: { status: { equals: "Deleted", mode: "insensitive" } } },
        orderBy: { medicine_name: "asc" },
        select: { medicine_id: true, medicine_name: true, category: true, pieces: true, quantity: true, status: true, expiry_date: true, unit_price: true, supplier: true },
      })
      const now = new Date()
      rows = medicines.map((item) => {
        const pieces = item.pieces ?? 0
        const expired = Boolean(item.expiry_date && item.expiry_date < now)
        const stock = pieces <= 0 ? "Out of stock" : pieces <= 20 ? "Low stock" : "In stock"
        return {
          id: item.medicine_id,
          medicine: item.medicine_name,
          category: item.category,
          pieces,
          quantity: item.quantity,
          stock,
          expiry: dateValue(item.expiry_date),
          expired: expired ? "Yes" : "No",
          unitPrice: Number(item.unit_price),
          supplier: item.supplier,
          status: item.status,
        }
      })
      if (filter === "low-stock") rows = rows.filter((row) => row.stock === "Low stock")
      else if (filter === "out-of-stock") rows = rows.filter((row) => row.stock === "Out of stock")
      else if (filter === "in-stock") rows = rows.filter((row) => row.stock === "In stock")
      else if (filter === "expired") rows = rows.filter((row) => row.expired === "Yes")
    } else if (kind === "sessions") {
      const sessions = await prisma.session_tbl.findMany({
        orderBy: [{ session_date: "desc" }, { start_time: "asc" }],
        select: {
          session_id: true,
          session_date: true,
          start_time: true,
          end_time: true,
          slots: true,
          status: true,
          appointment_type: true,
          doctor: {
            select: {
              doctor_id: true,
              user: { select: { name: true } },
            },
          },
        },
      })
      rows = sessions.map((item) => ({
        id: item.session_id,
        doctorId: item.doctor.doctor_id,
        doctor: item.doctor.user.name,
        date: dateValue(item.session_date),
        start: timeValue(item.start_time),
        end: timeValue(item.end_time),
        slots: item.slots,
        status: item.status ?? "Active",
        visitType: item.appointment_type,
      }))
      if (filter === "today") {
        const now = new Date()
        const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-")
        rows = rows.filter((row) => row.date === today)
      }
    } else if (kind === "specialties") {
      const specialties = await prisma.specialties.findMany({
        orderBy: { specialty_name: "asc" },
        select: { specialty_id: true, specialty_name: true, description: true, status: true, _count: { select: { doctor: true } } },
      })
      rows = specialties.map((specialty) => ({
        id: specialty.specialty_id,
        specialty: specialty.specialty_name,
        description: specialty.description ?? "—",
        status: specialty.status ?? "—",
        doctors: specialty._count.doctor,
      }))
    } else {
      return NextResponse.json({ success: false, error: "Unknown report type." }, { status: 400 })
    }

    if (filter === "active") rows = rows.filter((row) => String(row.status).toUpperCase() === "ACTIVE")
    if (filter === "inactive") rows = rows.filter((row) => String(row.status).toUpperCase() === "INACTIVE")

    return NextResponse.json({ success: true, rows, total: rows.length, generatedAt: new Date().toISOString() })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}