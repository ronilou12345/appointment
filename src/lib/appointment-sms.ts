import { formatAppointmentTime } from "@/app/client/appointments/status"
import { normalizePhilippineMobile } from "@/lib/phone-utils"

export type AppointmentSmsDetails = {
  patientName?: string
  doctorName?: string
  date?: string | null
  time?: string | null
  appointmentType?: string | null
  cancelReason?: string | null
}

export type AppointmentSmsStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled"

function envValue(name: string) {
  return process.env[name]?.trim().replace(/^["']|["']$/g, "") || ""
}

function formatDate(value: string | null | undefined) {
  const raw = String(value ?? "").trim()
  if (!raw) return "To be confirmed"

  const parsed = new Date(`${raw}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return raw

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function buildMessage(status: AppointmentSmsStatus, details: AppointmentSmsDetails) {
  const patientName = details.patientName?.trim() || "Patient"
  const doctorName = details.doctorName?.trim() ? `Dr. ${details.doctorName.trim()}` : "your doctor"
  const appointmentDate = formatDate(details.date)
  const appointmentTime = formatAppointmentTime(details.time) || "To be confirmed"

  if (status === "Confirmed") {
    return `Hello, ${patientName}!

Your appointment at C2M Family Clinic is CONFIRMED.

Date: ${appointmentDate}
Time: ${appointmentTime}
Doctor: ${doctorName}

Please arrive 10-15 minutes early.

— C2M Family Clinic`
  }

  if (status === "Completed") {
    return `Hello, ${patientName}!

Your appointment with ${doctorName} on ${appointmentDate} has been marked COMPLETED. Thank you for visiting C2M Family Clinic.

— C2M Family Clinic`
  }

  if (status === "Cancelled") {
    const reason = details.cancelReason?.trim()
    return `Hello, ${patientName}!

Your appointment with ${doctorName} on ${appointmentDate} at ${appointmentTime} has been CANCELLED.${reason ? `\nReason: ${reason}` : ""}

Please book again if you still need a visit.

— C2M Family Clinic`
  }

  return `Hello, ${patientName}!

Your appointment request at C2M Family Clinic has been received and is currently pending doctor confirmation.

Date: ${appointmentDate}
Time: ${appointmentTime}
Doctor: ${doctorName}

You will receive another text once your appointment has been confirmed.

— C2M Family Clinic`
}

async function attemptSend(apiKey: string, number: string, message: string, senderName?: string) {
  const payload: Record<string, string> = {
    apikey: apiKey,
    number,
    message,
  }

  if (senderName) {
    payload.sendername = senderName
  }

  const response = await fetch("https://api.semaphore.co/api/v4/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  })

  const responseText = await response.text()

  if (!response.ok) {
    return {
      success: false as const,
      reason: "provider-error",
      status: response.status,
      providerResponse: responseText || "No response body returned",
    }
  }

  return { success: true as const, response: responseText }
}

export async function sendAppointmentSms(
  contactNumber: string | null | undefined,
  details: AppointmentSmsDetails,
  status: AppointmentSmsStatus = "Pending",
) {
  if (!contactNumber) return { success: false as const, reason: "missing-contact-number" }

  const apiKey = envValue("SEMAPHORE_API_KEY")
  if (!apiKey) {
    console.warn("SEMAPHORE_API_KEY is not configured; skipping SMS notification.")
    return { success: false as const, reason: "missing-api-key" }
  }

  const normalizedNumber = normalizePhilippineMobile(contactNumber)
  if (!normalizedNumber) {
    return { success: false as const, reason: "invalid-contact-number" }
  }

  const message = buildMessage(status, details)
  const senderName = envValue("SEMAPHORE_SENDER_NAME")

  try {
    const primaryAttempt = await attemptSend(apiKey, normalizedNumber, message, senderName || undefined)

    if (primaryAttempt.success) {
      return primaryAttempt
    }

    const providerText = String(primaryAttempt.providerResponse || "").toLowerCase()
    const senderRejected =
      Boolean(senderName) &&
      (providerText.includes("sender") ||
        providerText.includes("invalid") ||
        providerText.includes("not allowed") ||
        providerText.includes("rejected"))

    if (senderRejected) {
      console.warn("Semaphore sender rejected; retrying without sendername:", primaryAttempt.providerResponse)
      return await attemptSend(apiKey, normalizedNumber, message)
    }

    return primaryAttempt
  } catch (error) {
    console.error("Semaphore SMS error:", error)
    return { success: false as const, reason: "request-failed" }
  }
}
