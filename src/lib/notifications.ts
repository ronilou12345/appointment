import prisma from "@/lib/prisma"
import { formatAppointmentStatus, formatAppointmentTime } from "@/app/client/appointments/status"
import { normalizeUserRole, type UserRole } from "@/lib/user-role"

export type NotificationType =
  | "booked"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "upcoming"
  | "session"
  | "soap"

export type AppNotification = {
  id: string
  type: NotificationType
  title: string
  message: string
  href: string
  appointmentId: number | null
  createdAt: string
  appointmentAt: string | null
  personName: string
  personAvatar: string
  personRole: "Patient" | "Doctor"
}

const UPCOMING_WINDOW_DAYS = 30
const MAX_NOTIFICATIONS = 30

const pad = (value: number) => String(value).padStart(2, "0")

const localDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const dateColumnKey = (value: Date | null | undefined) =>
  value ? value.toISOString().slice(0, 10) : ""

const timeColumnKey = (value: Date | null | undefined) =>
  value ? value.toISOString().slice(11, 16) : ""

const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const formatDatePart = (dateKey: string) => {
  if (!dateKey) return ""

  const parsed = new Date(`${dateKey}T00:00:00`)
  return Number.isNaN(parsed.getTime())
    ? dateKey
    : parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const formatWhen = (dateKey: string, timeKey: string) => {
  if (!dateKey) return "an unscheduled date"

  const datePart = formatDatePart(dateKey)
  const timePart = formatAppointmentTime(timeKey)

  return timePart ? `${datePart} at ${timePart}` : datePart
}

const relativeDayLabel = (dateKey: string, todayKey: string) => {
  if (!dateKey) return "Upcoming appointment"
  if (dateKey === todayKey) return "Appointment today"

  const target = new Date(`${dateKey}T00:00:00`)
  const today = new Date(`${todayKey}T00:00:00`)
  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000)

  if (days === 1) return "Appointment tomorrow"
  if (days > 1) return `Appointment in ${days} days`
  return "Upcoming appointment"
}

// Stored images are either a public path or an inline data URL (read-only filesystem
// fallback). Data URLs are served through an endpoint so they stay out of this payload.
const avatarSrc = (userId: string | undefined, storedImage: string | null | undefined) => {
  const stored = storedImage?.trim()
  if (!stored) return ""
  if (stored.startsWith("data:image/")) return userId ? `/api/profile-image/${userId}` : ""
  return stored
}

const detailHref = (role: UserRole, appointmentId: number) => {
  if (role === "ADMIN") return `/admin/all-appointments/${appointmentId}`
  if (role === "DOCTOR") return `/doctor/appointments/${appointmentId}`
  return `/client/appointments/${appointmentId}`
}

const sessionHref = (role: UserRole) => {
  if (role === "ADMIN") return "/admin/doctor/add-session"
  if (role === "DOCTOR") return "/doctor/add-session"
  return "/client/book-appointment"
}

const truncate = (value: string, limit = 130) =>
  value.length > limit ? `${value.slice(0, limit - 1).trimEnd()}…` : value

const appointmentScope = (role: UserRole, userId: string, doctorId: number | null) => {
  if (role === "ADMIN") return {}
  if (role === "DOCTOR") return { doctor_id: doctorId as number }
  return { user_id: userId }
}

const appointmentSelect = {
  appointment_id: true,
  appointment_status: true,
  appointment_type: true,
  appointment_date: true,
  appointment_time: true,
  reason_for_visit: true,
  reason_cancel: true,
  created_at: true,
  updated_at: true,
  user: { select: { id: true, name: true, email: true, profile_image: true } },
  doctor: {
    select: {
      first_name: true,
      last_name: true,
      user: { select: { id: true, profile_image: true } },
    },
  },
  session_tbl: { select: { session_date: true, start_time: true, appointment_type: true } },
} as const

type AppointmentRecord = {
  appointment_id: number
  appointment_status: string | null
  appointment_type: string | null
  appointment_date: Date | null
  appointment_time: Date | null
  reason_for_visit: string
  reason_cancel: string | null
  created_at: Date | null
  updated_at: Date | null
  user: { id: string; name: string; email: string; profile_image: string | null } | null
  doctor: {
    first_name: string
    last_name: string
    user: { id: string; profile_image: string | null } | null
  } | null
  session_tbl: { session_date: Date; start_time: Date; appointment_type: string } | null
}

const sessionSelect = {
  session_id: true,
  session_date: true,
  start_time: true,
  end_time: true,
  slots: true,
  appointment_type: true,
  status: true,
  created_at: true,
  doctor: {
    select: {
      first_name: true,
      last_name: true,
      user: { select: { id: true, profile_image: true } },
    },
  },
} as const

type SessionRecord = {
  session_id: number
  session_date: Date
  start_time: Date
  end_time: Date
  slots: number
  appointment_type: string
  status: string | null
  created_at: Date | null
  doctor: {
    first_name: string
    last_name: string
    user: { id: string; profile_image: string | null } | null
  } | null
}

type SoapRecord = {
  soap_id: number
  chief_complaints: string
  diagnosis: string
  prescription: string | null
  next_follow_up: string | null
  created_at: Date | null
  appointment: AppointmentRecord
}

type AppointmentView = {
  id: number
  status: string
  patientName: string
  patientAvatar: string
  doctorName: string
  doctorAvatar: string
  visitType: string
  dateKey: string
  timeKey: string
  when: string
  cancelReason: string
  createdAt: Date
  updatedAt: Date
}

const toView = (appointment: AppointmentRecord): AppointmentView => {
  const dateKey = dateColumnKey(appointment.appointment_date ?? appointment.session_tbl?.session_date)
  const timeKey = timeColumnKey(appointment.appointment_time ?? appointment.session_tbl?.start_time)
  const doctorName = [appointment.doctor?.first_name, appointment.doctor?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim()
  const createdAt = appointment.created_at ?? new Date()

  return {
    id: appointment.appointment_id,
    status: formatAppointmentStatus(appointment.appointment_status),
    patientName: appointment.user?.name?.trim() || appointment.user?.email || "A patient",
    patientAvatar: avatarSrc(appointment.user?.id, appointment.user?.profile_image),
    doctorName: doctorName ? `Dr. ${doctorName}` : "the doctor",
    doctorAvatar: avatarSrc(appointment.doctor?.user?.id, appointment.doctor?.user?.profile_image),
    visitType:
      appointment.session_tbl?.appointment_type?.trim() ||
      appointment.appointment_type?.trim() ||
      appointment.reason_for_visit?.trim() ||
      "General Consultation",
    dateKey,
    timeKey,
    when: formatWhen(dateKey, timeKey),
    cancelReason: appointment.reason_cancel?.trim() ?? "",
    createdAt,
    updatedAt: appointment.updated_at ?? createdAt,
  }
}

function personFor(view: AppointmentView, role: UserRole) {
  if (role === "CLIENT") {
    return {
      personName: view.doctorName,
      personAvatar: view.doctorAvatar,
      personRole: "Doctor" as const,
    }
  }

  return {
    personName: view.patientName,
    personAvatar: view.patientAvatar,
    personRole: "Patient" as const,
  }
}

function visitSummary(view: AppointmentView, role: UserRole) {
  if (role === "CLIENT") return `${view.visitType} on ${view.when}`
  if (role === "DOCTOR") return `${view.visitType} on ${view.when}`
  return `${view.visitType} with ${view.doctorName} on ${view.when}`
}

function buildStatusNotification(view: AppointmentView, role: UserRole): AppNotification | null {
  const base = {
    id: `appointment-${view.id}-${view.status.toLowerCase()}`,
    appointmentId: view.id,
    href: detailHref(role, view.id),
    appointmentAt: view.dateKey ? `${view.dateKey}${view.timeKey ? `T${view.timeKey}` : ""}` : null,
    ...personFor(view, role),
  }

  const summary = visitSummary(view, role)

  if (view.status === "Pending") {
    const title =
      role === "CLIENT"
        ? "Booking request sent"
        : role === "DOCTOR"
          ? "Appointment request"
          : "New appointment request"
    const followUp =
      role === "CLIENT"
        ? " Waiting for confirmation."
        : role === "DOCTOR"
          ? " Needs your confirmation."
          : " Awaiting confirmation."

    return {
      ...base,
      type: "booked",
      title,
      message: `${summary}.${followUp}`,
      createdAt: view.createdAt.toISOString(),
    }
  }

  if (view.status === "Awaiting cancellation") {
    return {
      ...base,
      type: "cancelled",
      title: role === "DOCTOR" ? "Cancellation request" : "Cancellation requested",
      message:
        role === "DOCTOR"
          ? `${summary}. Please approve or keep this appointment.`
          : `${summary}. Waiting for the doctor to approve the cancellation.`,
      createdAt: view.updatedAt.toISOString(),
    }
  }

  if (view.status === "Confirmed") {
    return {
      ...base,
      type: "confirmed",
      title: role === "DOCTOR" ? "You confirmed this request" : "Appointment confirmed",
      message: `${summary}.`,
      createdAt: view.updatedAt.toISOString(),
    }
  }

  if (view.status === "Completed") {
    return {
      ...base,
      type: "completed",
      title: role === "DOCTOR" ? "Visit marked completed" : "Appointment completed",
      message: `${summary}.`,
      createdAt: view.updatedAt.toISOString(),
    }
  }

  // Patients and doctors can both cancel, and the actor is not stored, so stay neutral.
  if (view.status === "Cancelled") {
    return {
      ...base,
      type: "cancelled",
      title: "Appointment cancelled",
      message: view.cancelReason ? `${summary}. Reason: ${view.cancelReason}` : `${summary}.`,
      createdAt: view.updatedAt.toISOString(),
    }
  }

  return null
}

function buildUpcomingNotification(
  view: AppointmentView,
  role: UserRole,
  todayKey: string
): AppNotification | null {
  if (view.status !== "Pending" && view.status !== "Confirmed") return null
  if (!view.dateKey || view.dateKey < todayKey) return null

  const awaiting =
    view.status !== "Pending"
      ? ""
      : role === "DOCTOR"
        ? " Needs your confirmation."
        : role === "CLIENT"
          ? " Waiting for confirmation."
          : " Awaiting confirmation."

  return {
    id: `appointment-${view.id}-upcoming-${view.dateKey}`,
    type: "upcoming",
    title: relativeDayLabel(view.dateKey, todayKey),
    message: `${visitSummary(view, role)}.${awaiting}`,
    href: detailHref(role, view.id),
    appointmentId: view.id,
    createdAt: view.updatedAt.toISOString(),
    appointmentAt: `${view.dateKey}${view.timeKey ? `T${view.timeKey}` : ""}`,
    ...personFor(view, role),
  }
}

function buildSessionNotification(session: SessionRecord, role: UserRole): AppNotification | null {
  if ((session.status ?? "Active") !== "Active") return null

  const doctorName = [session.doctor?.first_name, session.doctor?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim()
  const dateKey = dateColumnKey(session.session_date)
  const startKey = timeColumnKey(session.start_time)
  const endKey = timeColumnKey(session.end_time)
  const startTime = formatAppointmentTime(startKey)
  const endTime = formatAppointmentTime(endKey)
  const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : startTime
  const slots = `${session.slots} ${session.slots === 1 ? "slot" : "slots"}`
  const datePart = formatDatePart(dateKey) || "an unscheduled date"
  const schedule = timeRange ? `${datePart} at ${timeRange}` : datePart

  return {
    id: `session-${session.session_id}-created`,
    type: "session",
    title: role === "CLIENT" ? "New session available" : "New session added",
    message:
      role === "CLIENT"
        ? `${session.appointment_type} on ${schedule}. ${slots} open for booking.`
        : `${session.appointment_type} on ${schedule}. ${slots}.`,
    href: sessionHref(role),
    appointmentId: null,
    createdAt: (session.created_at ?? session.session_date).toISOString(),
    appointmentAt: dateKey ? `${dateKey}${startKey ? `T${startKey}` : ""}` : null,
    personName: doctorName ? `Dr. ${doctorName}` : "the doctor",
    personAvatar: avatarSrc(session.doctor?.user?.id, session.doctor?.user?.profile_image),
    personRole: "Doctor",
  }
}

function buildSoapNotification(soap: SoapRecord, role: UserRole): AppNotification | null {
  const view = toView(soap.appointment)
  const diagnosis = soap.diagnosis?.trim()
  const followUp = soap.next_follow_up?.trim()
  const details = [
    diagnosis ? `Diagnosis: ${diagnosis}` : "",
    followUp ? `Follow-up: ${followUp}` : "",
  ]
    .filter(Boolean)
    .join(" · ")

  return {
    id: `soap-${soap.soap_id}`,
    type: "soap",
    title: role === "CLIENT" ? "Visit notes added" : "SOAP notes added",
    message: truncate(details || `Visit notes for ${visitSummary(view, role)}.`),
    href: detailHref(role, view.id),
    appointmentId: view.id,
    createdAt: (soap.created_at ?? view.updatedAt).toISOString(),
    appointmentAt: view.dateKey ? `${view.dateKey}${view.timeKey ? `T${view.timeKey}` : ""}` : null,
    ...personFor(view, role),
  }
}

export async function getNotificationsForUser(userId: string, role?: string | null) {
  const normalizedRole = normalizeUserRole(role)

  // Doctors are notified strictly about their own doctor_id records.
  const doctorId =
    normalizedRole === "DOCTOR"
      ? (
          await prisma.doctor.findUnique({
            where: { user_id: userId },
            select: { doctor_id: true },
          })
        )?.doctor_id ?? null
      : null

  if (normalizedRole === "DOCTOR" && doctorId === null) return []

  const scope = appointmentScope(normalizedRole, userId, doctorId)

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const todayKey = localDateKey(startOfToday)
  const windowEnd = addDays(startOfToday, UPCOMING_WINDOW_DAYS)

  const [recent, upcoming, sessions, soapNotes] = await Promise.all([
    prisma.appointment.findMany({
      where: scope,
      orderBy: { appointment_id: "desc" },
      take: 40,
      select: appointmentSelect,
    }),
    prisma.appointment.findMany({
      where: {
        ...scope,
        OR: [
          { appointment_date: { gte: startOfToday, lte: windowEnd } },
          {
            appointment_date: null,
            session_tbl: { is: { session_date: { gte: startOfToday, lte: windowEnd } } },
          },
        ],
      },
      orderBy: { appointment_id: "desc" },
      take: 40,
      select: appointmentSelect,
    }),
    prisma.session_tbl.findMany({
      where: {
        session_date: { gte: startOfToday, lte: windowEnd },
        ...(normalizedRole === "DOCTOR" ? { doctor_id: doctorId as number } : {}),
      },
      orderBy: { session_id: "desc" },
      take: 20,
      select: sessionSelect,
    }),
    prisma.soap_notes.findMany({
      where: { appointment: scope },
      orderBy: { soap_id: "desc" },
      take: 20,
      select: {
        soap_id: true,
        chief_complaints: true,
        diagnosis: true,
        prescription: true,
        next_follow_up: true,
        created_at: true,
        appointment: { select: appointmentSelect },
      },
    }),
  ])

  const sessionNotifications = (sessions as SessionRecord[])
    .map((session) => buildSessionNotification(session, normalizedRole))
    .filter((notification): notification is AppNotification => notification !== null)

  // A visit can be revised, so only the newest note per appointment is announced.
  const latestSoapPerAppointment = new Map<number, SoapRecord>()
  for (const soap of soapNotes as SoapRecord[]) {
    const appointmentId = soap.appointment.appointment_id
    if (!latestSoapPerAppointment.has(appointmentId)) latestSoapPerAppointment.set(appointmentId, soap)
  }

  const soapNotifications = [...latestSoapPerAppointment.values()]
    .map((soap) => buildSoapNotification(soap, normalizedRole))
    .filter((notification): notification is AppNotification => notification !== null)

  const statusNotifications = [
    ...(recent as AppointmentRecord[])
      .map((appointment) => buildStatusNotification(toView(appointment), normalizedRole))
      .filter((notification): notification is AppNotification => notification !== null),
    ...sessionNotifications,
    ...soapNotifications,
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const upcomingNotifications = (upcoming as AppointmentRecord[])
    .map((appointment) => buildUpcomingNotification(toView(appointment), normalizedRole, todayKey))
    .filter((notification): notification is AppNotification => notification !== null)
    .sort((a, b) => String(a.appointmentAt).localeCompare(String(b.appointmentAt)))

  const seen = new Set<string>()

  return [...upcomingNotifications, ...statusNotifications]
    .filter((notification) => {
      if (seen.has(notification.id)) return false
      seen.add(notification.id)
      return true
    })
    .slice(0, MAX_NOTIFICATIONS)
}
