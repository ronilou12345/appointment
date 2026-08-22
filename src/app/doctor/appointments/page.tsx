import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth-utils"
import { normalizeUserRole } from "@/lib/user-role"
import { formatAppointmentStatus, formatAppointmentTime } from "@/app/client/appointments/status"
import { DoctorAppointmentsClient } from "./doctor-appointments-client"
import type { DoctorAppointmentRow } from "./columns"

async function getDoctorAppointments(userId: string): Promise<DoctorAppointmentRow[]> {
  const doctor = await prisma.doctor.findUnique({
    where: { user_id: userId },
    select: {
      doctor_id: true,
      prefix: true,
      first_name: true,
      middle_name: true,
      last_name: true,
    },
  })

  if (!doctor) {
    return []
  }

  const doctorName = [doctor.prefix, doctor.first_name, doctor.middle_name, doctor.last_name]
    .filter(Boolean)
    .join(" ")

  const appointments = await prisma.appointment.findMany({
    where: { doctor_id: doctor.doctor_id },
    orderBy: { appointment_id: "desc" },
    select: {
      appointment_id: true,
      session_id: true,
      user_id: true,
      appointment_status: true,
      reason_for_visit: true,
      relationship: true,
      age: true,
      gender: true,
      contact_number: true,
      symptoms: true,
      duration_of_symptoms: true,
      pain_level: true,
      additional_notes: true,
      appointment_type: true,
      appointment_date: true,
      appointment_time: true,
      user: {
        select: {
          name: true,
          email: true,
          profile_image: true,
        },
      },
      session_tbl: {
        select: {
          session_date: true,
          start_time: true,
          appointment_type: true,
        },
      },
      soap_notes: {
        orderBy: { created_at: "desc" },
        take: 1,
        select: {
          chief_complaints: true,
          physical_examination: true,
          diagnosis: true,
          prescription: true,
          next_follow_up: true,
        },
      },
      vital_signs: {
        orderBy: { created_at: "desc" },
        take: 1,
        select: {
          heart_rate: true,
          body_temperature: true,
          weight: true,
          blood_sugar: true,
        },
      },
    },
  })

  return appointments.map((appointment) => {
    const patientName = appointment.user?.name ?? "Unknown Patient"
    const dateValue = appointment.appointment_date ?? appointment.session_tbl?.session_date
    const date = dateValue ? dateValue.toISOString().split("T")[0] : ""
    const timeValue = appointment.appointment_time ?? appointment.session_tbl?.start_time
    const time = timeValue ? timeValue.toISOString().slice(11, 16) : ""
    const specialty = appointment.session_tbl?.appointment_type || appointment.reason_for_visit || "General Consultation"
    const soap = appointment.soap_notes[0]
    const vitals = appointment.vital_signs[0]

    return {
      id: String(appointment.appointment_id),
      patientId: appointment.user_id,
      patientName,
      patientEmail: appointment.user?.email ?? "",
      patientAvatar: appointment.user?.profile_image ?? null,
      patientAge: appointment.age != null ? String(appointment.age) : "—",
      patientGender: appointment.gender ?? "—",
      doctorId: String(doctor.doctor_id),
      doctorName,
      sessionId: appointment.session_id != null ? String(appointment.session_id) : undefined,
      specialty,
      date,
      time: formatAppointmentTime(String(time || "")),
      timeValue: String(time || ""),
      status: formatAppointmentStatus(appointment.appointment_status ?? "Pending"),
      reasonForVisit: appointment.reason_for_visit || "—",
      relationship: appointment.relationship || "—",
      contactNumber: appointment.contact_number || "—",
      symptoms: appointment.symptoms || "No symptoms recorded.",
      durationOfSymptoms: appointment.duration_of_symptoms || "—",
      painLevel: appointment.pain_level != null ? String(appointment.pain_level) : "—",
      additionalNotes: appointment.additional_notes || "No additional notes.",
      heartRate: vitals?.heart_rate != null ? String(vitals.heart_rate) : "—",
      bodyTemperature: vitals?.body_temperature != null ? `${String(vitals.body_temperature)} °C` : "—",
      weight: vitals?.weight != null ? `${String(vitals.weight)} kg` : "—",
      bloodSugar: vitals?.blood_sugar != null ? String(vitals.blood_sugar) : "—",
      chiefComplaints: soap?.chief_complaints || "No chief complaints recorded.",
      physicalExamination: soap?.physical_examination || "No physical examination recorded.",
      diagnosis: soap?.diagnosis || "No diagnosis recorded.",
      prescription: soap?.prescription || "No prescription recorded.",
      nextFollowUp: soap?.next_follow_up || "—",
    }
  })
}

export default async function Page() {
  const session = await getSession()
  const role = normalizeUserRole(session?.role)
  const filteredAppointments =
    role === "DOCTOR" && session?.id
      ? await getDoctorAppointments(session.id)
      : []

  return (
    <div className="min-h-screen w-full bg-background p-6 text-foreground">
      <DoctorAppointmentsClient appointments={filteredAppointments} />
    </div>
  )
}
