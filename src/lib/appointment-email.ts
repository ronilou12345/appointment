import nodemailer, { type Transporter } from "nodemailer"
import { formatAppointmentTime } from "@/app/client/appointments/status"

export type AppointmentEmailDetails = {
  patientName?: string
  doctorName?: string
  date?: string | null
  time?: string | null
  appointmentType?: string | null
  reasonForVisit?: string | null
  cancelReason?: string | null
}

export type AppointmentEmailStatus = "Confirmed" | "Completed" | "Cancelled"

const CLINIC_NAME = "C2M Family Clinic & Pharmacy"

let cachedTransporter: Transporter | null = null

function getTransporter() {
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASSWORD?.trim()

  if (!user || !pass) return null
  if (cachedTransporter) return cachedTransporter

  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com"
  const port = Number(process.env.SMTP_PORT?.trim() || 465)

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    // Port 465 speaks TLS immediately; 587 upgrades through STARTTLS.
    secure: port === 465,
    auth: { user, pass },
  })

  return cachedTransporter
}

function formatDate(value: string | null | undefined) {
  const raw = String(value ?? "").trim()
  if (!raw) return "To be confirmed"

  const parsed = new Date(`${raw}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return raw

  return parsed.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function buildRows(details: AppointmentEmailDetails, status: string) {
  const rows: [string, string][] = [
    ["📅 Date", formatDate(details.date)],
    ["🕒 Time", formatAppointmentTime(details.time) || "To be confirmed"],
    ["👨‍⚕️ Doctor", details.doctorName?.trim() ? `Dr. ${details.doctorName.trim()}` : "To be assigned"],
    ["Appointment type", details.appointmentType?.trim() || "General Consultation"],
    ["Reason for visit", details.reasonForVisit?.trim() || "Not specified"],
    ["Status", status],
  ]

  if (
    (status === "Cancelled" || status === "Cancellation requested" || status === "Rescheduled") &&
    details.cancelReason?.trim()
  ) {
    rows.push(["Reason for cancellation", details.cancelReason.trim()])
  }

  return rows
}

type EmailCopy = {
  subject: string
  heading: string
  intro: string
  status: string
  closing: string[]
}

function buildHtml(patientName: string, details: AppointmentEmailDetails, copy: EmailCopy) {
  const rows = buildRows(details, copy.status)
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:8px 16px 8px 0;color:#64748b;font-size:14px;white-space:nowrap;">${label}</td>
          <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:600;">${value}</td>
        </tr>`
    )
    .join("")

  const closing = copy.closing
    .map(
      (line) =>
        `<p style="margin:16px 0 0;color:#334155;font-size:14px;line-height:22px;">${line}</p>`
    )
    .join("")

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f1f5f9;padding:24px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;">
      <p style="margin:0 0 4px;color:#0f766e;font-size:12px;letter-spacing:2px;text-transform:uppercase;">${CLINIC_NAME}</p>
      <h1 style="margin:0 0 16px;color:#0f172a;font-size:22px;">${copy.heading}</h1>
      <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:24px;">
        Hello, ${patientName}! ${copy.intro}
      </p>
      <p style="margin:0 0 8px;color:#0f172a;font-size:14px;font-weight:700;">Appointment Details:</p>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      ${closing}
      <p style="margin:24px 0 0;color:#64748b;font-size:13px;">— ${CLINIC_NAME}</p>
    </div>
  </body>
</html>`
}

function buildText(patientName: string, details: AppointmentEmailDetails, copy: EmailCopy) {
  const rows = buildRows(details, copy.status)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n")

  return `Hello, ${patientName}!

${copy.intro}

Appointment Details:
${rows}

${copy.closing.join("\n\n")}

— ${CLINIC_NAME}`
}

async function deliver(to: string, details: AppointmentEmailDetails, copy: EmailCopy, greetingName?: string) {
  const transporter = getTransporter()
  if (!transporter) {
    console.warn("SMTP_USER/SMTP_PASSWORD are not configured; skipping appointment email.")
    return { success: false, reason: "missing-credentials" }
  }

  const patientName = greetingName?.trim() || details.patientName?.trim() || "there"

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM?.trim() || `${CLINIC_NAME} <${process.env.SMTP_USER?.trim()}>`,
      to,
      subject: copy.subject,
      text: buildText(patientName, details, copy),
      html: buildHtml(patientName, details, copy),
    })

    return { success: true, reason: "sent" }
  } catch (error) {
    console.error("Appointment email failed:", error)
    return { success: false, reason: "send-failed" }
  }
}

export async function sendAppointmentEmail(to: string | null, details: AppointmentEmailDetails) {
  if (!to?.trim()) return { success: false, reason: "missing-email" }

  return deliver(to.trim(), details, {
    subject: `Appointment request received - ${formatDate(details.date)}`,
    heading: "Appointment request received",
    intro: `Your appointment request at ${CLINIC_NAME} has been received and is currently pending doctor confirmation.`,
    status: "Pending doctor confirmation",
    closing: [
      "Please wait for confirmation. You will receive another message once your appointment has been confirmed.",
      "If you need to cancel or reschedule, kindly let us know in advance.",
      "Please note: Once your appointment has been confirmed, you are no longer allowed to cancel or reschedule it.",
    ],
  })
}

function statusCopy(status: AppointmentEmailStatus, details: AppointmentEmailDetails): EmailCopy {
  const when = formatDate(details.date)

  if (status === "Confirmed") {
    return {
      subject: `Your appointment is confirmed - ${when}`,
      heading: "Appointment confirmed",
      intro: `Your appointment at ${CLINIC_NAME} has been confirmed.`,
      status: "Confirmed",
      closing: [
        "Please arrive 10-15 minutes before your scheduled appointment and bring any necessary medical records or documents.",
        "Thank you, and we look forward to seeing you!",
      ],
    }
  }

  if (status === "Completed") {
    return {
      subject: `Your visit is complete - ${when}`,
      heading: "Appointment completed",
      intro: `Your appointment at ${CLINIC_NAME} has been marked as completed.`,
      status: "Completed",
      closing: [
        "Your visit notes and any prescriptions are available in your patient dashboard.",
        "If you have follow-up questions or need another appointment, you can book one anytime.",
        "Thank you for trusting us with your care!",
      ],
    }
  }

  return {
    subject: `Your appointment was cancelled - ${when}`,
    heading: "Appointment cancelled",
    intro: `Your appointment at ${CLINIC_NAME} has been cancelled.`,
    status: "Cancelled",
    closing: [
      "You can book a new appointment anytime through your patient dashboard.",
      "We apologise for any inconvenience this may cause.",
    ],
  }
}

export async function sendAppointmentStatusEmail(
  to: string | null,
  status: AppointmentEmailStatus,
  details: AppointmentEmailDetails
) {
  if (!to?.trim()) return { success: false, reason: "missing-email" }

  return deliver(to.trim(), details, statusCopy(status, details))
}

export async function sendAppointmentRescheduledEmail(to: string | null, details: AppointmentEmailDetails) {
  if (!to?.trim()) return { success: false, reason: "missing-email" }

  const when = formatDate(details.date)

  return deliver(to.trim(), details, {
    subject: `Your appointment was rescheduled - ${when}`,
    heading: "Appointment rescheduled",
    intro: `Your appointment at ${CLINIC_NAME} has been moved to a new available time.`,
    status: "Rescheduled",
    closing: [
      "Please wait for confirmation of this new schedule. You will receive another message once it has been confirmed.",
      "If the new time does not work for you, kindly let us know so we can arrange another visit.",
    ],
  })
}

export async function sendCancellationRequestEmail(to: string | null, details: AppointmentEmailDetails) {
  if (!to?.trim()) return { success: false, reason: "missing-email" }

  const patientName = details.patientName?.trim() || "A patient"
  const doctorGreeting = details.doctorName?.trim() ? `Dr. ${details.doctorName.trim()}` : "Doctor"
  const when = formatDate(details.date)

  return deliver(
    to.trim(),
    details,
    {
      subject: `Cancellation request from ${patientName} - ${when}`,
      heading: "Cancellation request",
      intro: `${patientName} has requested to cancel this appointment. Please review the request and approve it in your appointments list.`,
      status: "Cancellation requested",
      closing: [
        "The appointment will stay scheduled until you approve this cancellation.",
        "Open your doctor appointments page to approve or keep the visit.",
      ],
    },
    doctorGreeting
  )
}
