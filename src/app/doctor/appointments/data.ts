export type DoctorAppointmentRecord = {
  id: string
  patientId: string
  patientName: string
  patientAge: string
  patientGender: string
  patientNotes: string
  doctorName: string
  specialty: string
  date: string
  time: string
  status: string
  doctorNotes: string
  prescription: string[]
  followUp: string
}

export const doctorAppointments: DoctorAppointmentRecord[] = [
  {
    id: "d1",
    patientId: "p1",
    patientName: "Juan Dela Cruz",
    patientAge: "37",
    patientGender: "Male",
    patientNotes: "Patient reports mild chest discomfort and fatigue on exertion.",
    doctorName: "Dr. Sarah Johnson",
    specialty: "Cardiology",
    date: new Date().toISOString().split("T")[0],
    time: "09:30 AM",
    status: "Confirmed",
    doctorNotes: "Review cholesterol levels and update medication after exam.",
    prescription: ["Atorvastatin 20mg", "Aspirin 81mg"],
    followUp: "Return in 6 weeks for follow-up and lab results review.",
  },
  {
    id: "d2",
    patientId: "p3",
    patientName: "Ana Reyes",
    patientAge: "28",
    patientGender: "Female",
    patientNotes: "Patient needs follow-up on migraine management and sleep habits.",
    doctorName: "Dr. Sarah Johnson",
    specialty: "Neurology",
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    time: "01:00 PM",
    status: "Pending",
    doctorNotes: "Evaluate migraine triggers and consider prophylactic therapy.",
    prescription: ["Sumatriptan 50mg"],
    followUp: "Schedule follow-up in 4 weeks to monitor symptom response.",
  },
]

export const getDoctorAppointment = (id: string) =>
  doctorAppointments.find((appointment) => appointment.id === id)
