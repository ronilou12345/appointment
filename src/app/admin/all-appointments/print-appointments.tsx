"use client"

import { Printer } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { AppointmentRow } from "./columns"

const CLINIC = {
  name: "C2M Family Clinic & Pharmacy",
  tagline: "Doctor ng Bawat Pamilyang Pilipino",
  address: "Poblacion, Sinacaban, Misamis Occidental, Philippines",
  email: "c2mfamilyclinicpharmacy@gmail.com",
  logo: "/logo1.jpg",
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function formatPrintDate(value: string) {
  if (!value) return "—"
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function formatGeneratedAt() {
  return new Date().toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function printStyles() {
  return `
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff !important;
      color: #111827 !important;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      line-height: 1.45;
    }
    .page {
      min-height: 100%;
    }
    .page + .page {
      page-break-before: always;
      break-before: page;
    }
    .letterhead {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-bottom: 12px;
      border-bottom: 3px solid #0f766e;
    }
    .logo {
      width: 72px;
      height: 72px;
      object-fit: contain;
    }
    .clinic h1 {
      margin: 0 0 4px;
      font-size: 22px;
      color: #111827 !important;
    }
    .tagline {
      margin: 0 0 6px;
      font-style: italic;
      color: #0f766e !important;
    }
    .clinic p {
      margin: 0;
      color: #374151 !important;
    }
    .patient-title {
      margin: 16px 0 12px;
    }
    .patient-title p {
      margin: 0 0 4px;
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #0f766e !important;
    }
    .patient-title h2 {
      margin: 0;
      font-size: 20px;
    }
    .section {
      margin-bottom: 14px;
      border: 1px solid #9ca3af;
    }
    .section h3 {
      margin: 0;
      padding: 8px 10px;
      background: #f3f4f6 !important;
      border-bottom: 1px solid #9ca3af;
      font-size: 13px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
    }
    .field {
      padding: 8px 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    .field.full { grid-column: 1 / -1; }
    .label {
      display: block;
      margin-bottom: 2px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #6b7280 !important;
    }
    .value { color: #111827 !important; }
    .footer {
      margin-top: 18px;
      padding-top: 8px;
      border-top: 1px solid #9ca3af;
      color: #6b7280 !important;
      font-size: 10px;
    }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      background: #0f766e;
      color: #ffffff;
    }
    .toolbar p {
      margin: 0;
      font-size: 13px;
    }
    .toolbar-actions {
      display: flex;
      gap: 8px;
    }
    .toolbar button {
      border: 0;
      border-radius: 6px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .print-btn {
      background: #ffffff;
      color: #0f766e;
    }
    .close-btn {
      background: transparent;
      color: #ffffff;
      border: 1px solid #ffffff !important;
    }
    .document {
      padding: 20px;
    }
    @media print {
      .no-print { display: none !important; }
      .document { padding: 0; }
    }
  `
}

function clinicLetterhead() {
  const logoSrc = `${window.location.origin}${CLINIC.logo}`
  return `
    <header class="letterhead">
      <img src="${logoSrc}" alt="${escapeHtml(CLINIC.name)} logo" class="logo" />
      <div class="clinic">
        <h1>${escapeHtml(CLINIC.name)}</h1>
        <p class="tagline">${escapeHtml(CLINIC.tagline)}</p>
        <p>${escapeHtml(CLINIC.address)}</p>
        <p>${escapeHtml(CLINIC.email)}</p>
      </div>
    </header>
  `
}

function field(label: string, value: string | undefined, full = false) {
  return `<div class="field${full ? " full" : ""}"><span class="label">${escapeHtml(label)}</span><span class="value">${escapeHtml(value || "—")}</span></div>`
}

function medicalRecordPage(appointment: AppointmentRow) {
  return `
    <section class="page">
      ${clinicLetterhead()}
      <div class="patient-title">
        <p>Patient medical record</p>
        <h2>${escapeHtml(appointment.patientName)}</h2>
      </div>
      <section class="section">
        <h3>Patient information</h3>
        <div class="grid">
          ${field("Patient name", appointment.patientName)}
          ${field("Email", appointment.patientEmail || "—")}
          ${field("Contact number", appointment.contactNumber)}
          ${field("Age", appointment.age)}
          ${field("Gender", appointment.gender)}
          ${field("Relationship", appointment.relationship)}
        </div>
      </section>
      <section class="section">
        <h3>Appointment details</h3>
        <div class="grid">
          ${field("Doctor", appointment.doctorName)}
          ${field("Appointment type", appointment.appointmentType)}
          ${field("Date", formatPrintDate(appointment.date))}
          ${field("Time", appointment.time || "—")}
          ${field("Status", appointment.status)}
          ${field("Appointment ID", appointment.id)}
          ${field("Reason for visit", appointment.reasonForVisit, true)}
          ${field("Symptoms", appointment.symptoms, true)}
          ${field("Duration of symptoms", appointment.durationOfSymptoms)}
          ${field("Pain level", appointment.painLevel)}
          ${field("Additional notes", appointment.additionalNotes, true)}
        </div>
      </section>
      <section class="section">
        <h3>Vital signs</h3>
        <div class="grid">
          ${field("Heart rate", appointment.heartRate)}
          ${field("Body temperature", appointment.bodyTemperature)}
          ${field("Weight", appointment.weight)}
          ${field("Blood sugar", appointment.bloodSugar)}
        </div>
      </section>
      <section class="section">
        <h3>Doctor notes and medical record</h3>
        <div class="grid">
          ${field("Chief complaints", appointment.chiefComplaints, true)}
          ${field("Physical examination", appointment.physicalExamination, true)}
          ${field("Diagnosis", appointment.diagnosis, true)}
          ${field("Prescription", appointment.prescription, true)}
          ${field("Next follow-up", appointment.nextFollowUp)}
        </div>
      </section>
      <footer class="footer">
        This medical record belongs only to ${escapeHtml(appointment.patientName)}. Computer-generated by ${escapeHtml(CLINIC.name)} on ${escapeHtml(formatGeneratedAt())}.
      </footer>
    </section>
  `
}

function buildDocument(title: string, appointments: AppointmentRow[]) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>${printStyles()}</style>
  </head>
  <body>
    <div class="toolbar no-print">
      <p>Preview medical record — click Print to send it to the printer.</p>
      <div class="toolbar-actions">
        <button type="button" class="close-btn" onclick="window.close()">Close</button>
        <button type="button" class="print-btn" onclick="window.print()">Print</button>
      </div>
    </div>
    <div class="document">
      ${appointments.map((appointment) => medicalRecordPage(appointment)).join("")}
    </div>
  </body>
</html>`
}

function printHtml(title: string, html: string) {
  const preview = window.open("", "_blank", "width=920,height=780")
  if (!preview) {
    toast.error("Allow pop-ups to open the print preview.")
    return
  }

  preview.document.open()
  preview.document.write(html)
  preview.document.close()
  preview.focus()
}

export function printAppointmentList(appointments: AppointmentRow[]) {
  printHtml(
    `${CLINIC.name} — Medical Records`,
    buildDocument(`${CLINIC.name} — Medical Records`, appointments),
  )
}

export function printSingleAppointment(appointment: AppointmentRow) {
  printHtml(
    `${CLINIC.name} — ${appointment.patientName}`,
    buildDocument(`${CLINIC.name} — ${appointment.patientName}`, [appointment]),
  )
}

export function PrintAppointmentsButton({
  selectedAppointments = [],
}: {
  selectedAppointments?: AppointmentRow[]
}) {
  const handlePrint = () => {
    if (selectedAppointments.length === 0) {
      toast.error("Select at least one appointment to print.")
      return
    }

    printAppointmentList(selectedAppointments)
  }

  return (
    <Button
      type="button"
      className="bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
      onClick={handlePrint}
    >
      <Printer data-icon="inline-start" />
      {selectedAppointments.length > 0 ? `Print (${selectedAppointments.length})` : "Print"}
    </Button>
  )
}
