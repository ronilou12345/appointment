export type ClientAppointmentRecord = {
  id: string
  doctorId: string
  doctorName: string
  specialty: string
  date: string
  time: string
  status: string
  patientName: string
  patientPrefix: string
  patientFirstName: string
  patientMiddleName: string
  patientLastName: string
  patientSuffix: string
  patientCredentials: string
  patientPreferredName: string
  patientHeadline: string
  patientStatus: string
  recordId: string
  externalId: string
  lastCheckup: string
  followUp: string
  notes: string
  prescription: string[]
}

export const clientAppointments: ClientAppointmentRecord[] = [
  {
    id: "a1",
    doctorId: "sarah-johnson",
    doctorName: "Dr. Sarah Johnson",
    specialty: "General Practice",
    date: "2024-07-01",
    time: "09:30 AM",
    status: "Upcoming",
    patientName: "Roni Louvarquez",
    patientPrefix: "N/A",
    patientFirstName: "Roni",
    patientMiddleName: "",
    patientLastName: "Louvarquez",
    patientSuffix: "",
    patientCredentials: "N/A",
    patientPreferredName: "N/A",
    patientHeadline: "N/A",
    patientStatus: "Active",
    recordId: "MR-00124",
    externalId: "N/A",
    lastCheckup: "2024-03-20",
    followUp: "Please schedule a follow-up in 4 weeks for blood pressure review.",
    notes: "Annual checkup with blood pressure review, weight monitoring, and healthy lifestyle guidance.",
    prescription: ["Lisinopril 10mg", "Amlodipine 5mg"],
  },
  {
    id: "a2",
    doctorId: "michael-chen",
    doctorName: "Dr. Michael Chen",
    specialty: "Cardiology",
    date: "2024-06-28",
    time: "02:00 PM",
    status: "Completed",
    patientName: "Roni Louvarquez",
    patientPrefix: "N/A",
    patientFirstName: "Roni",
    patientMiddleName: "",
    patientLastName: "Louvarquez",
    patientSuffix: "",
    patientCredentials: "N/A",
    patientPreferredName: "N/A",
    patientHeadline: "N/A",
    patientStatus: "Active",
    recordId: "MR-00124",
    externalId: "N/A",
    lastCheckup: "2024-02-14",
    followUp: "Continue diet and exercise plan; return in 6 weeks for heart health check.",
    notes: "Follow-up on cholesterol management and exercise plan updates.",
    prescription: ["Atorvastatin 20mg"],
  },
  {
    id: "a3",
    doctorId: "emma-williams",
    doctorName: "Dr. Emma Williams",
    specialty: "Pediatrics",
    date: "2024-07-03",
    time: "11:15 AM",
    status: "Upcoming",
    patientName: "Roni Louvarquez",
    patientPrefix: "N/A",
    patientFirstName: "Roni",
    patientMiddleName: "",
    patientLastName: "Louvarquez",
    patientSuffix: "",
    patientCredentials: "N/A",
    patientPreferredName: "N/A",
    patientHeadline: "N/A",
    patientStatus: "Active",
    recordId: "MR-00124",
    externalId: "N/A",
    lastCheckup: "2024-04-30",
    followUp: "Bring immunization records and growth chart for the next appointment.",
    notes: "Pediatric wellness visit, immunizations review, and growth milestone check.",
    prescription: ["Vitamin D supplement"],
  },
]

export const getClientAppointment = (id: string) =>
  clientAppointments.find((appointment) => appointment.id === id)
