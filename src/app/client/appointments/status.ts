export const formatAppointmentStatus = (value: string | null | undefined) => {
  const raw = String(value ?? "").trim()

  if (!raw) return "Pending"

  const normalized = raw.toLowerCase()

  if (normalized === "cancelled" || normalized === "canceled" || normalized === "rejected" || normalized === "declined") {
    return "Cancelled"
  }

  if (normalized === "completed" || normalized === "complete" || normalized === "done") {
    return "Completed"
  }

  if (normalized === "confirmed" || normalized === "approved" || normalized === "accepted" || normalized === "scheduled") {
    return "Confirmed"
  }

  if (normalized === "pending" || normalized === "in progress" || normalized === "in_progress" || normalized === "waiting") {
    return "Pending"
  }

  return raw
}

export const formatAppointmentTime = (value: string | null | undefined) => {
  const raw = String(value ?? "").trim()
  if (!raw) return ""

  const match = raw.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return raw

  const hours = Number(match[1])
  const minutes = match[2]
  const suffix = hours >= 12 ? "PM" : "AM"

  if (hours === 0) return `12:${minutes} AM`
  if (hours === 12) return `12:${minutes} PM`
  if (hours < 12) return `${hours}:${minutes} AM`
  return `${hours - 12}:${minutes} PM`
}
