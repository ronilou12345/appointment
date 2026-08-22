import prisma from "@/lib/prisma"
import { AllAppointmentsClient } from "./all-appointments-client"
import { type AppointmentRow } from "./columns"
import { formatAppointmentTime } from "@/app/client/appointments/status"

async function getAppointments(): Promise<AppointmentRow[]> {
  const appointments = await prisma.appointment.findMany({
    orderBy: { appointment_id: "desc" },
    select: {
      appointment_id: true,
      user_id: true,
      doctor_id: true,
      appointment_status: true,
      session_id: true,
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
          id: true,
          name: true,
          email: true,
          profile_image: true,
        },
      },
      doctor: {
        select: {
          first_name: true,
          middle_name: true,
          last_name: true,
        },
      },
      session_tbl: {
        select: {
          appointment_type: true,
          session_date: true,
          start_time: true,
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
    const doctorName = appointment.doctor
      ? [appointment.doctor.first_name, appointment.doctor.middle_name, appointment.doctor.last_name]
          .filter(Boolean)
          .join(" ")
      : "Unknown Doctor"

    const date = (appointment.appointment_date ?? appointment.session_tbl?.session_date)
      ? (appointment.appointment_date ?? appointment.session_tbl!.session_date).toISOString().split("T")[0]
      : ""

    const timeValue = appointment.appointment_time ?? appointment.session_tbl?.start_time
    const time = timeValue ? formatAppointmentTime(timeValue.toISOString().slice(11, 16)) : ""
    const soap = appointment.soap_notes[0]
    const vitals = appointment.vital_signs[0]

    return {
      id: String(appointment.appointment_id),
      patientId: appointment.user_id,
      patientName,
      patientEmail: appointment.user?.email ?? "",
      patientAvatar: appointment.user?.profile_image ?? "",
      doctorName,
      date,
      time,
      status: appointment.appointment_status ?? "Pending",
      reasonForVisit: appointment.reason_for_visit || "—",
      appointmentType: appointment.appointment_type || appointment.session_tbl?.appointment_type || "General Consultation",
      relationship: appointment.relationship || "—",
      age: appointment.age != null ? String(appointment.age) : "—",
      gender: appointment.gender || "—",
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
  const data = await getAppointments()

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <AllAppointmentsClient appointments={data} />
      </div>
    </div>
  )
}
