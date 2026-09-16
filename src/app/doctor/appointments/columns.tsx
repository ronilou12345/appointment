"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Textarea } from "@/components/ui/textarea"
import { Check, CheckCircle2, MoreHorizontal, Printer, X } from "lucide-react"
import { toast } from "sonner"
import { formatAppointmentTime } from "@/app/client/appointments/status"
import { printSingleAppointment } from "@/app/admin/all-appointments/print-appointments"
import type { AppointmentRow } from "@/app/admin/all-appointments/columns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

export type DoctorAppointmentRow = {
  id: string
  patientId: string
  patientName: string
  patientEmail?: string
  patientAvatar?: string | null
  patientAge: string
  patientGender: string
  doctorId: string
  doctorName: string
  sessionId?: string
  specialty: string
  date: string
  time: string
  timeValue?: string
  status: string
  reasonForVisit?: string
  relationship?: string
  contactNumber?: string
  symptoms?: string
  durationOfSymptoms?: string
  painLevel?: string
  additionalNotes?: string
  heartRate?: string
  bodyTemperature?: string
  weight?: string
  bloodSugar?: string
  chiefComplaints?: string
  physicalExamination?: string
  diagnosis?: string
  prescription?: string
  nextFollowUp?: string
}

export function toPrintAppointment(row: DoctorAppointmentRow): AppointmentRow {
  return {
    id: row.id,
    patientId: row.patientId,
    patientName: row.patientName,
    patientEmail: row.patientEmail ?? "",
    patientAvatar: row.patientAvatar ?? "",
    doctorName: row.doctorName,
    date: row.date,
    time: row.time,
    status: row.status,
    reasonForVisit: row.reasonForVisit ?? "—",
    appointmentType: row.specialty,
    relationship: row.relationship ?? "—",
    age: row.patientAge,
    gender: row.patientGender,
    contactNumber: row.contactNumber ?? "—",
    symptoms: row.symptoms ?? "No symptoms recorded.",
    durationOfSymptoms: row.durationOfSymptoms ?? "—",
    painLevel: row.painLevel ?? "—",
    additionalNotes: row.additionalNotes ?? "No additional notes.",
    heartRate: row.heartRate ?? "—",
    bodyTemperature: row.bodyTemperature ?? "—",
    weight: row.weight ?? "—",
    bloodSugar: row.bloodSugar ?? "—",
    chiefComplaints: row.chiefComplaints ?? "No chief complaints recorded.",
    physicalExamination: row.physicalExamination ?? "No physical examination recorded.",
    diagnosis: row.diagnosis ?? "No diagnosis recorded.",
    prescription: row.prescription ?? "No prescription recorded.",
    nextFollowUp: row.nextFollowUp ?? "—",
  }
}

type SessionOption = {
  id: string
  doctorId: string
  date: string
  startTime: string
  endTime: string
  slots: number
  status: string
}

function todayIso() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function parseTimeToMinutes(value: string) {
  const match = String(value ?? "").trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function buildTimeSlots(startTime: string, endTime: string, stepMinutes = 20) {
  const start = parseTimeToMinutes(startTime)
  const end = parseTimeToMinutes(endTime)
  if (start === null || end === null || end <= start) return []

  const slots: string[] = []
  for (let minutes = start; minutes < end; minutes += stepMinutes) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    slots.push(`${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`)
  }
  return slots
}
function isSlotInFuture(isoDate: string, time: string) {
  const [year, month, day] = isoDate.split("-").map(Number)
  const [hours, minutes] = time.split(":").map(Number)
  if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) return false
  return new Date(year, month - 1, day, hours, minutes, 0).getTime() > Date.now()
}

function isActiveSession(session: SessionOption) {
  const status = String(session.status ?? "Active").trim().toLowerCase()
  return status !== "inactive" && status !== "cancelled"
}

function DoctorAppointmentActionsCell({ appointment }: { appointment: DoctorAppointmentRow }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [labDialogOpen, setLabDialogOpen] = useState(false)
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false)
  const [prescriptionText, setPrescriptionText] = useState("")
  const [selectedLabTests, setSelectedLabTests] = useState<Record<string, boolean>>({})
  const [labTextFields, setLabTextFields] = useState<Record<string, string>>({})
  const [cancelReason, setCancelReason] = useState("")
  const [sessions, setSessions] = useState<SessionOption[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [sessionError, setSessionError] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedSessionId, setSelectedSessionId] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [bookedTimes, setBookedTimes] = useState<string[]>([])
  const [loadingBookedTimes, setLoadingBookedTimes] = useState(false)
  const [error, setError] = useState("")
  const [loadingAction, setLoadingAction] = useState<"" | "Confirm" | "Complete" | "Cancel" | "Reschedule">("")

  const statusValue = appointment.status.toLowerCase()
  const isAwaitingCancellation = statusValue === "awaiting cancellation" || statusValue === "cancel requested"
  const canConfirm = !isAwaitingCancellation && statusValue !== "confirmed" && statusValue !== "completed" && statusValue !== "cancelled" && statusValue !== "canceled"
  const canComplete = !isAwaitingCancellation && statusValue !== "completed" && statusValue !== "cancelled" && statusValue !== "canceled"
  const canCancel = statusValue !== "confirmed" && statusValue !== "completed" && statusValue !== "cancelled" && statusValue !== "canceled"

  const renderLabCheckbox = (id: string, label: string) => {
    const checked = Boolean(selectedLabTests[id])
    return (
      <button
        type="button"
        aria-pressed={checked}
        onClick={() => setSelectedLabTests((current) => ({ ...current, [id]: !current[id] }))}
        className="inline-flex min-h-5 items-start gap-1 text-left text-slate-900"
      >
        <span aria-hidden className="inline-flex h-4 w-4 shrink-0 items-center justify-center border border-black bg-white text-[13px] font-bold leading-none text-black">
          {checked ? "✓" : ""}
        </span>
        <span className="whitespace-pre-line">{label}</span>
      </button>
    )
  }

  const renderLabTextField = (id: string, className = "min-w-40") => (
    <input
      aria-label={id}
      value={labTextFields[id] ?? ""}
      onChange={(event) => setLabTextFields((current) => ({ ...current, [id]: event.target.value }))}
      className={`h-5 border-0 border-b border-slate-500 bg-transparent px-0 text-[11px] text-slate-900 outline-none focus:border-slate-900 focus:ring-0 ${className}`}
    />
  )

  const resetCancelForm = () => {
    setCancelReason("")
    setSelectedDate("")
    setSelectedSessionId("")
    setSelectedTime("")
    setBookedTimes([])
    setError("")
    setSessionError("")
  }

  useEffect(() => {
    if (!drawerOpen) return

    let cancelled = false
    resetCancelForm()

    const loadSessions = async () => {
      setLoadingSessions(true)
      try {
        const response = await fetch("/api/sessions?mine=true")
        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Unable to load your available times")
        }
        if (!cancelled) {
          setSessions(Array.isArray(result.sessions) ? result.sessions : [])
          setSessionError("")
        }
      } catch (err) {
        if (!cancelled) {
          setSessions([])
          setSessionError(err instanceof Error ? err.message : "Unable to load your available times")
        }
      } finally {
        if (!cancelled) setLoadingSessions(false)
      }
    }

    void loadSessions()
    return () => {
      cancelled = true
    }
      }, [drawerOpen])

  const doctorSessions = useMemo(
    () => sessions.filter((session) => String(session.doctorId) === String(appointment.doctorId) && isActiveSession(session)),
    [appointment.doctorId, sessions],
  )

  const availableSessions = useMemo(() => {
    const today = todayIso()

    return doctorSessions
      .filter((session) => {
        if (session.date < today) return false
        if (session.id === appointment.sessionId) return true
        return Number(session.slots ?? 0) > 0
      })
      .sort((left, right) => {
        const dateCompare = left.date.localeCompare(right.date)
        if (dateCompare !== 0) return dateCompare
        return left.startTime.localeCompare(right.startTime)
      })
  }, [appointment.sessionId, doctorSessions])

  const getDateIndicator = (isoDate: string): "available" | "unavailable" | null => {
    const daySessions = doctorSessions.filter((session) => session.date === isoDate)
    if (!daySessions.length) return null

    const hasOpenSlot = daySessions.some((session) => {
      if (Number(session.slots ?? 0) <= 0 && session.id !== appointment.sessionId) return false
      return buildTimeSlots(session.startTime, session.endTime).some((slot) => isSlotInFuture(isoDate, slot))
    })

    return hasOpenSlot ? "available" : "unavailable"
  }

  const selectedDateSessions = useMemo(
    () => availableSessions.filter((session) => session.date === selectedDate),
    [availableSessions, selectedDate],
  )

  const selectedDateTimeSlots = useMemo(() => {
    const slots = new Map<string, SessionOption>()
    for (const session of selectedDateSessions) {
      for (const slot of buildTimeSlots(session.startTime, session.endTime)) {
        if (!slots.has(slot) || Number(session.slots ?? 0) > 0) {
          slots.set(slot, session)
        }
      }
    }
    return Array.from(slots.entries()).sort(([left], [right]) => (parseTimeToMinutes(left) ?? 0) - (parseTimeToMinutes(right) ?? 0))
  }, [selectedDateSessions])

  const selectedCalendarDate = selectedDate ? parseIsoDate(selectedDate) : null
  const bookedTimeSet = useMemo(() => new Set(bookedTimes), [bookedTimes])

  useEffect(() => {
    if (!drawerOpen || !appointment.doctorId || !selectedDate) {
      setBookedTimes([])
      return
    }

    let cancelled = false

    const loadBookedTimes = async () => {
      setLoadingBookedTimes(true)
      try {
        const params = new URLSearchParams({
          doctorId: appointment.doctorId,
          date: selectedDate,
          excludeAppointmentId: appointment.id,
        })
        const response = await fetch(`/api/appointments?${params.toString()}`)
        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Unable to check booked times")
        }
        if (!cancelled) {
          setBookedTimes(Array.isArray(result.bookedTimes) ? result.bookedTimes : [])
        }
      } catch {
        if (!cancelled) setBookedTimes([])
      } finally {
        if (!cancelled) setLoadingBookedTimes(false)
      }
    }

    void loadBookedTimes()
    return () => {
      cancelled = true
    }
  }, [appointment.doctorId, appointment.id, drawerOpen, selectedDate])

  const submitAction = async (action: "Confirm" | "Complete" | "Cancel", reason?: string) => {
    setLoadingAction(action)

    try {
      const response = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: Number(appointment.id),
          action,
          ...(reason ? { reasonCancel: reason } : {}),
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to update appointment status")
      }

      const statusLabel = action === "Confirm" ? "confirmed" : action === "Complete" ? "completed" : "cancelled"
      const notificationMessage = result.emailSent && result.smsSent
        ? `${appointment.patientName} has been notified via email and SMS.`
        : result.emailSent
          ? `${appointment.patientName} has been emailed.`
          : result.smsSent
            ? `${appointment.patientName} has been notified via SMS.`
            : ""
      toast.success(
        action === "Cancel"
          ? `Cancellation approved.${notificationMessage ? ` ${notificationMessage}` : ""}`
          : action === "Confirm" && notificationMessage
            ? `Appointment confirmed. ${notificationMessage}`
            : action === "Complete" && notificationMessage
              ? `Appointment completed. ${notificationMessage}`
            : `Appointment ${statusLabel}.${notificationMessage ? ` ${notificationMessage}` : ""}`
      )

      router.refresh()
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
      return false
    } finally {
      setLoadingAction("")
    }
  }

  const handleAction = async (action: "Confirm" | "Complete" | "Cancel") => {
    setMenuOpen(false)

    if (action === "Cancel") {
      if (isAwaitingCancellation) {
        await submitAction("Cancel")
        return
      }

      setDrawerOpen(true)
      return
    }

    await submitAction(action)
  }

  const handleSubmitCancel = async () => {
    const reason = cancelReason.trim()
    if (!reason) {
      const message = "Please provide a reason for cancellation."
      setError(message)
      toast.error(message)
      return
    }

    if (!selectedDate || !selectedSessionId || !selectedTime) {
      const message = "Please select one of your available times."
      setError(message)
      toast.error(message)
      return
    }

    if (bookedTimeSet.has(selectedTime)) {
      const message = "That time is already booked. Please choose another slot."
      setError(message)
      toast.error(message)
      return
    }

    const isSameSlot =
      selectedSessionId === appointment.sessionId &&
      selectedDate === appointment.date &&
      selectedTime === (appointment.timeValue || "")
    if (isSameSlot) {
      const message = "Please choose a different available time from the current appointment."
      setError(message)
      toast.error(message)
      return
    }

    setLoadingAction("Reschedule")
    setError("")

    try {
      const response = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: Number(appointment.id),
          action: "Reschedule",
          sessionId: Number(selectedSessionId),
          appointmentTime: selectedTime,
          reasonCancel: reason,
        }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to reschedule this appointment")
      }

      toast.success(
        result.emailSent
          ? `Appointment moved to the new time. ${appointment.patientName} has been emailed.`
          : "Appointment moved to the new time."
      )
      setDrawerOpen(false)
      resetCancelForm()
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to reschedule this appointment"
      setError(message)
      toast.error(message)
    } finally {
      setLoadingAction("")
    }
  }

  const openLabDialog = () => {
    setMenuOpen(false)
    setLabDialogOpen(true)
  }

  const openPrescriptionDialog = () => {
    setMenuOpen(false)
    setPrescriptionText(appointment.prescription && appointment.prescription !== "No prescription recorded." ? appointment.prescription : "")
    setPrescriptionDialogOpen(true)
  }

  const printPrescription = () => {
    const prescription = escapeHtml(prescriptionText.trim())
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Prescription</title><style>
      @page{size:A4 portrait;margin:14mm}*{box-sizing:border-box}body{margin:0;font:14px Arial,sans-serif;color:#171717}.rx-page{min-height:260mm;border:1px solid #ddd;padding:22px 28px;position:relative}.patient{display:grid;grid-template-columns:1fr 100px 100px;gap:20px}.line{border-bottom:1px solid #777;min-height:25px}.rx-mark{font-family:Georgia,serif;font-size:88px;font-weight:bold;line-height:1;margin-top:32px}.prescription{min-height:145mm;white-space:pre-wrap;line-height:1.6;padding:12px 8px}.footer{position:absolute;right:28px;bottom:24px;width:270px;line-height:2}.footer-line{border-bottom:1px solid #777;display:inline-block;min-width:160px}.rx-page b{font-weight:600}
    </style></head><body><main class="rx-page"><div class="patient"><div class="line">Patient's Name: <b>${escapeHtml(appointment.patientName || "")}</b></div><div class="line">Age: <b>${escapeHtml(appointment.patientAge || "")}</b></div><div class="line">Sex: <b>${escapeHtml(appointment.patientGender || "")}</b></div></div><div class="line" style="margin-top:14px">Date: <b>${escapeHtml(appointment.date || todayIso())}</b></div><div class="rx-mark">Rx</div><div class="prescription">${prescription}</div><div class="footer">Lic. No.: <span class="footer-line"></span><br/>PTR No.: <span class="footer-line"></span></div></main></body></html>`
    const preview = window.open("", "_blank", "width=900,height=760")
    if (!preview) {
      toast.error("Allow pop-ups to open the prescription print preview.")
      return
    }
    preview.document.open()
    preview.document.write(html)
    preview.document.close()
    let printStarted = false
    const openPrinterDialog = () => {
      if (printStarted || preview.closed) return
      printStarted = true
      preview.focus()
      preview.print()
    }
    preview.onload = openPrinterDialog
    preview.onafterprint = () => preview.close()
    window.setTimeout(openPrinterDialog, 300)
  }

  const printLabRequest = () => {
    const patient = appointment.patientName || "Patient"
    const age = appointment.patientAge || "—"
    const sex = appointment.patientGender || "—"
    const date = appointment.date || todayIso()
    const field = (id: string) => escapeHtml(labTextFields[id] || "")
    const printBox = (id: string, label: string) => `<span class="item"><i class="box">${selectedLabTests[id] ? "✓" : ""}</i>${label}</span>`

    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>Laboratory Request Form</title><style>
      @page{size:A4 portrait;margin:10mm}*{box-sizing:border-box}body{margin:0;font:11px Arial,sans-serif;color:#171717}.lab-wrap{border:1px solid #d7d7d7}.lab-top{display:flex;justify-content:space-between;align-items:center;background:#101a2d;color:#fff;min-height:92px;padding:14px 22px}.brand{font-size:31px;font-weight:900;color:#d51d28;letter-spacing:-2px}.brand small{display:block;font-size:8px;letter-spacing:0;color:#fff}.title{text-align:right;font-size:25px;font-weight:900;line-height:1.05;text-transform:uppercase}.content{padding:24px 28px}.patient{display:grid;grid-template-columns:1fr 100px 100px;gap:18px}.address{display:grid;grid-template-columns:1fr 190px;gap:18px;margin:9px 0}.line{border-bottom:1px solid #777;min-height:21px}.section{margin-top:10px;page-break-inside:avoid}.section-title{font-size:13px;margin-bottom:6px}.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:4px 18px}.grid5{display:grid;grid-template-columns:repeat(5,1fr);gap:4px 18px}.radio-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 20px}.heart{display:flex;gap:64px}.item{display:flex;gap:5px;line-height:1.1;min-height:19px}.box{width:15px;height:15px;border:1px solid #777;display:inline-flex;align-items:center;justify-content:center;flex:0 0 15px;font-size:13px;font-weight:bold;line-height:1;color:#000}.fast{display:flex;gap:35px;margin:3px 0 8px 93px}.write{display:inline-block;min-width:190px;border-bottom:1px solid #777}.contrast-options{display:inline-flex;gap:8px;white-space:nowrap}.signature{display:grid;grid-template-columns:1fr 190px;margin-top:18px;text-align:center}.return{border:1px solid #333;font-size:16px;font-weight:bold;margin-top:18px;padding:9px 12px}@media print{.lab-wrap{border:0}}
    </style></head><body><div class="lab-wrap"><div class="lab-top"><div class="brand">RiteMed<small>Right Medicine. Priced Right.</small></div><div class="title">Laboratory<br/>Request Form</div></div><div class="content">
      <div class="patient"><div class="line">Patient: <b>${escapeHtml(patient)}</b></div><div class="line">Age: <b>${escapeHtml(age)}</b></div><div class="line">Sex: <b>${escapeHtml(sex)}</b></div></div><div class="address"><div class="line">Address: <b>—</b></div><div class="line">Date: <b>${escapeHtml(date)}</b></div></div>
      <div class="section"><div class="section-title">LABS:</div><div class="fast">${printBox("fasting", "Fasting 10 hrs")}${printBox("non-fasting", "Non-Fasting")}</div><div class="grid4">${["Sodium (NA)","HbA1c","FBS","Urinalysis","Potassium (K)","Total Bili","CBC","Fecalysis","BUN","Direct Bili","ALT","Albumin","Creatinine","Ind Bili","AST","Phosphorus","Microalbumin/Creatinine Ratio","Calcium","ALK Phos","Fasting Lipid Profile","75 gm OGTT"].map((item) => printBox(item, item)).join("")}</div><div class="item" style="margin-top:8px">${printBox("24-hour-urine", `24-hour urine collection for <span class="write">${field("24-hour-urine")}</span>`)}</div></div>
      <div class="section"><div class="section-title">HEART STATION</div><div class="heart">${printBox("12-lead-ecg", "12 Lead ECG")}${printBox("2d-echo", "2D Echo")}</div></div><div class="section"><div class="section-title">NUCLEAR MEDICINE</div><div class="grid5">${["TSH","FT4","FT3","Testosterone","Prolactin","Thyroglobulin (Tg)","Tg Antibodies (TgAb)"].map((item) => printBox(item, item)).join("")}${printBox("Thyroid Peroxidase\nAntibodies (TPOAb)", "Thyroid Peroxidase<br/>Antibodies (TPOAb)")}${["Cortisol","Estradiol"].map((item) => printBox(item, item)).join("")}</div></div>
      <div class="section"><div class="section-title">RADIOLOGY</div><div class="radio-grid">${printBox("chest-xray", "CHEST X-RAY PA/Lat")}<div>${printBox("xray", `X-RAY <span class="write">${field("xray")}</span>`)}</div><div>${printBox("ultrasound", `ULTRASOUND OF <span class="write">${field("ultrasound")}</span>`)}</div><span></span><div>${printBox("ct-scan", `CT SCAN <span class="write">${field("ct-scan")}</span> <span class="contrast-options"><span>with contrast</span><span>without contrast</span></span>`)}</div><span></span><div>${printBox("mri", `MRI <span class="write">${field("mri")}</span> <span class="contrast-options"><span>with contrast</span><span>without contrast</span></span>`)}</div></div></div><div class="section">OTHER LABS <span class="write" style="width:78%">${field("other-labs")}</span><br/><br/>DIAGNOSIS <span class="write" style="width:78%">${field("diagnosis")}</span></div><div class="signature"><div></div><div>_________________________<br/><b>${escapeHtml(appointment.doctorName || "—")}</b><br/>Lic. No. __________<br/><br/>PTR NO. __________<br/>LICENSE NO.: ________</div></div><div class="return">RETURN APPOINTMENT: ${field("return-appointment")}</div></div></div></body></html>`

    const preview = window.open("", "_blank", "width=960,height=760")
    if (!preview) {
      toast.error("Allow pop-ups to open the laboratory request print preview.")
      return
    }

    preview.document.open()
    preview.document.write(html)
    preview.document.close()

    let printStarted = false
    const openPrinterDialog = () => {
      if (printStarted || preview.closed) return
      printStarted = true
      preview.focus()
      preview.print()
    }

    preview.onload = openPrinterDialog
    preview.onafterprint = () => preview.close()
    window.setTimeout(openPrinterDialog, 300)
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 w-9 p-0">
            <span className="sr-only">Open appointment actions</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem disabled={!canConfirm || loadingAction === "Confirm"} onSelect={() => handleAction("Confirm") }>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Confirm
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!canComplete || loadingAction === "Complete"} onSelect={() => handleAction("Complete") }>
            <Check className="mr-2 h-4 w-4" />
            Complete
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setMenuOpen(false)
              printSingleAppointment(toPrintAppointment(appointment))
            }}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={openLabDialog}>
            <Printer className="mr-2 h-4 w-4" />
            Laboratory Request Form
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={openPrescriptionDialog}>
            <Printer className="mr-2 h-4 w-4" />
            Print Prescription
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" disabled={!canCancel} onSelect={() => handleAction("Cancel") }>
            <X className="mr-2 h-4 w-4" />
            {isAwaitingCancellation ? "Approve cancel" : "Cancel"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={labDialogOpen} onOpenChange={setLabDialogOpen}>
        <DialogContent className="max-w-4xl overflow-hidden rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold uppercase tracking-tight text-foreground">Laboratory Request Form</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Generate the laboratory request form for the selected appointment.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[75vh] overflow-y-auto rounded-2xl border border-border bg-white p-4 text-slate-900">
            <div className="border border-slate-300">
              <div className="flex min-h-20 items-center justify-between bg-[#101a2d] px-5 py-4 text-white">
                <div className="text-3xl font-black tracking-[-0.08em] text-red-500">RiteMed<span className="ml-1 block text-[9px] font-normal tracking-normal text-white">Right Medicine. Priced Right.</span></div>
                <div className="text-right text-xl font-black uppercase leading-none">Laboratory<br />Request Form</div>
              </div>
              <div className="lab-request-form space-y-3 p-5 text-[11px] text-slate-900 [&_label]:text-slate-900 [&_strong]:text-slate-950">
                <style>{`
                  .lab-request-form input[type="checkbox"] {
                    appearance: none !important;
                    pointer-events: auto !important;
                    position: relative;
                    z-index: 1;
                    cursor: pointer;
                    width: 16px;
                    height: 16px;
                    margin: 1px 0 0;
                    flex: 0 0 16px;
                    border: 1px solid #000 !important;
                    border-radius: 0;
                    background: #fff !important;
                    accent-color: transparent;
                  }
                  .lab-request-form input[type="checkbox"]:checked {
                    background-color: #fff !important;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3 8l3 3 7-7' fill='none' stroke='%23000' stroke-width='2'/%3E%3C/svg%3E");
                    background-position: center;
                    background-repeat: no-repeat;
                    background-size: 13px 13px;
                  }
                  .lab-request-form label {
                    cursor: pointer;
                  }
                `}</style>
                <div className="grid grid-cols-[1fr_90px_90px] gap-4">
                  <div className="border-b border-slate-500 pb-1">Patient: <strong>{appointment.patientName || "—"}</strong></div>
                  <div className="border-b border-slate-500 pb-1">Age: <strong>{appointment.patientAge || "—"}</strong></div>
                  <div className="border-b border-slate-500 pb-1">Sex: <strong>{appointment.patientGender || "—"}</strong></div>
                </div>
                <div className="grid grid-cols-[1fr_180px] gap-4">
                  <div className="border-b border-slate-500 pb-1">Address: <strong>—</strong></div>
                  <div className="border-b border-slate-500 pb-1">Date: <strong>{appointment.date || "—"}</strong></div>
                </div>

                <div>
                  <div className="mb-1 font-medium">LABS:</div>
                  <div className="mb-2 ml-20 flex gap-8">{renderLabCheckbox("fasting", "Fasting 10 hrs")}{renderLabCheckbox("non-fasting", "Non-Fasting")}</div>
                  <div className="grid grid-cols-4 gap-x-4 gap-y-1">
                    {["Sodium (NA)", "HbA1c", "FBS", "Urinalysis", "Potassium (K)", "Total Bili", "CBC", "Fecalysis", "BUN", "Direct Bili", "ALT", "Albumin", "Creatinine", "Ind Bili", "AST", "Phosphorus", "Microalbumin/Creatinine Ratio", "Calcium", "ALK Phos", "Fasting Lipid Profile", "75 gm OGTT"].map((item) => renderLabCheckbox(item, item))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">{renderLabCheckbox("24-hour-urine", "24-hour urine collection for")}{renderLabTextField("24-hour-urine", "min-w-48")}</div>
                </div>
                <div><div className="mb-1 font-medium">HEART STATION</div><div className="flex gap-16">{renderLabCheckbox("12-lead-ecg", "12 Lead ECG")}{renderLabCheckbox("2d-echo", "2D Echo")}</div></div>
                <div><div className="mb-1 font-medium">NUCLEAR MEDICINE</div><div className="grid grid-cols-5 gap-x-4 gap-y-1">{["TSH", "FT4", "FT3", "Testosterone", "Prolactin", "Thyroglobulin (Tg)", "Tg Antibodies (TgAb)", "Thyroid Peroxidase\nAntibodies (TPOAb)", "Cortisol", "Estradiol"].map((item) => renderLabCheckbox(item, item))}</div></div>
                <div>
                  <div className="mb-1 font-medium">RADIOLOGY</div>
                  <div className="grid grid-cols-2 gap-x-5 gap-y-2">
                    {renderLabCheckbox("chest-xray", "CHEST X-RAY PA/Lat")}
                    <div className="flex items-end gap-1">{renderLabCheckbox("xray", "X-RAY")}{renderLabTextField("xray", "min-w-40")}</div>
                    <div className="flex items-end gap-1">{renderLabCheckbox("ultrasound", "ULTRASOUND OF")}{renderLabTextField("ultrasound", "min-w-32")}</div>
                    <span />
                    <div className="flex flex-wrap items-end gap-1">{renderLabCheckbox("ct-scan", "CT SCAN")}{renderLabTextField("ct-scan", "min-w-28")}<span>with contrast</span><span>without contrast</span></div>
                    <span />
                    <div className="flex flex-wrap items-end gap-1">{renderLabCheckbox("mri", "MRI")}{renderLabTextField("mri", "min-w-28")}<span>with contrast</span><span>without contrast</span></div>
                  </div>
                </div>
                <div className="space-y-2"><div className="flex items-end gap-2">OTHER LABS {renderLabTextField("other-labs", "w-4/5")}</div><div className="flex items-end gap-2">DIAGNOSIS {renderLabTextField("diagnosis", "w-4/5")}</div></div>
                <div className="grid grid-cols-[1fr_190px] gap-4 pt-2"><div /><div className="text-center">_________________________<br /><strong>{appointment.doctorName || "—"}</strong><br />Lic. No. __________<br /><br />PTR NO. __________<br />LICENSE NO.: ________</div></div>
                <div className="flex items-end gap-2 border border-slate-700 p-2 text-base font-bold">RETURN APPOINTMENT: {renderLabTextField("return-appointment", "flex-1 text-base")}</div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-end">
            <Button variant="outline" onClick={() => setLabDialogOpen(false)}>Close</Button>
            <Button onClick={() => {
              setLabDialogOpen(false)
              printLabRequest()
            }}>Print Laboratory Form</Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>

        <Dialog open={prescriptionDialogOpen} onOpenChange={setPrescriptionDialogOpen}>
          <DialogContent className="max-w-4xl overflow-hidden rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold uppercase tracking-tight text-foreground">Prescription</DialogTitle>
              <DialogDescription>Enter or update the prescription details below. The content will be printed beneath the Rx mark.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[75vh] overflow-y-auto rounded-2xl border border-slate-300 bg-white p-5 text-slate-900">
              <div className="grid grid-cols-[1fr_90px_90px] gap-4 text-[11px]">
                <div className="border-b border-slate-500 pb-1">Patient's Name: <strong>{appointment.patientName || "—"}</strong></div>
                <div className="border-b border-slate-500 pb-1">Age: <strong>{appointment.patientAge || "—"}</strong></div>
                <div className="border-b border-slate-500 pb-1">Sex: <strong>{appointment.patientGender || "—"}</strong></div>
              </div>
              <div className="mt-3 border-b border-slate-500 pb-1 text-[11px]">Date: <strong>{appointment.date || todayIso()}</strong></div>
              <div className="mt-6 font-serif text-8xl font-bold leading-none">Rx</div>
              <textarea
                value={prescriptionText}
                onChange={(event) => setPrescriptionText(event.target.value)}
                placeholder="Type prescription details here..."
                aria-label="Prescription details"
                className="mt-3 min-h-[360px] w-full resize-y border-0 border-b border-slate-500 bg-transparent px-2 py-3 text-base leading-7 text-slate-900 outline-none focus:border-slate-900 focus:ring-0"
              />
              <div className="mt-8 ml-auto w-64 space-y-2 text-right text-sm">
                <div>Lic. No.: <span className="inline-block w-40 border-b border-slate-500" /></div>
                <div>PTR No.: <span className="inline-block w-40 border-b border-slate-500" /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPrescriptionDialogOpen(false)}>Close</Button>
              <Button onClick={printPrescription}>Print Prescription</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Drawer
          open={drawerOpen}
          onOpenChange={(open) => {
            setDrawerOpen(open)
            if (!open) resetCancelForm()
          }}
          direction="right"
        >
          <DrawerContent className="flex h-full max-h-[calc(100vh-4rem)] flex-col overflow-hidden">
            <DrawerHeader>
              <DrawerTitle>Cancel & Reschedule</DrawerTitle>
              <DrawerDescription>
                Add a reason for cancellation, then choose one of your available times.
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
              <div className="rounded-3xl border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">Current appointment</p>
                <p className="mt-2 text-base font-semibold">{appointment.date} at {appointment.time}</p>
                <p className="mt-1 text-sm text-muted-foreground">{appointment.patientName}</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor={`cancel-reason-${appointment.id}`}>Reason for cancellation</Label>
                <Textarea
                  id={`cancel-reason-${appointment.id}`}
                  value={cancelReason}
                  onChange={(event) => {
                    setCancelReason(event.target.value)
                    setError("")
                  }}
                  placeholder="Add a brief reason for the cancellation"
                  className="min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Your available date</Label>
                <Calendar
                  selected={selectedCalendarDate}
                  onSelect={(date) => {
                    if (!date) return
                    setSelectedDate(toIsoDate(date))
                    setSelectedSessionId("")
                    setSelectedTime("")
                    setError("")
                  }}
                  disabled={(date) => toIsoDate(date) < todayIso()}
                  getIndicator={(date) => getDateIndicator(toIsoDate(date))}
                />
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Available session
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-red-500" />
                    Session full or passed
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Your available time</Label>
                {loadingSessions ? (
                  <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Loading your available times...
                  </div>
                ) : sessionError ? (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                    {sessionError}
                  </div>
                ) : !selectedDate ? (
                  <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Select a date to view your available times.
                  </div>
                ) : loadingBookedTimes ? (
                  <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Checking booked times...
                  </div>
                ) : selectedDateSessions.length === 0 || selectedDateTimeSlots.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No available times on this date.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateSessions.map((session) => (
                      <div key={session.id} className="rounded-2xl border border-border p-3">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-sm font-medium">
                            {formatAppointmentTime(session.startTime)} – {formatAppointmentTime(session.endTime)}
                          </p>
                          <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold">
                            {session.id === appointment.sessionId
                              ? "Current"
                              : `${session.slots} slot${session.slots === 1 ? "" : "s"}`}
                          </span>
                        </div>
                        <div className="grid gap-2">
                          {selectedDateTimeSlots
                            .filter(([, slotSession]) => slotSession.id === session.id)
                            .map(([slot, slotSession]) => {
                              const isSelected = selectedSessionId === slotSession.id && selectedTime === slot
                              const isCurrent =
                                slotSession.id === appointment.sessionId &&
                                selectedDate === appointment.date &&
                                slot === (appointment.timeValue || "")
                              const isBooked = bookedTimeSet.has(slot) && !isCurrent
                              const isPast = !isSlotInFuture(selectedDate, slot)
                              const disabled = isBooked || isPast
                              return (
                                <button
                                  key={`${slotSession.id}-${slot}`}
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => {
                                    if (disabled) return
                                    setSelectedSessionId(slotSession.id)
                                    setSelectedTime(slot)
                                    setError("")
                                  }}
                                  className={
                                    `flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ` +
                                    (isSelected
                                      ? "border-primary bg-primary/10"
                                      : isBooked
                                        ? "cursor-not-allowed border-red-100 bg-red-50 text-red-600"
                                        : isPast
                                          ? "cursor-not-allowed border-border bg-muted/50 text-muted-foreground"
                                          : "border-border bg-background hover:border-primary/70")
                                  }
                                >
                                  <span>{formatAppointmentTime(slot)}</span>
                                  <span className="text-xs font-medium">
                                    {isCurrent
                                      ? "Current"
                                      : isBooked
                                        ? "Booked"
                                        : isPast
                                          ? "Time passed"
                                          : isSelected
                                            ? "Selected"
                                            : ""}
                                  </span>
                                </button>
                              )
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>

            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
              <Button onClick={handleSubmitCancel} disabled={loadingAction === "Reschedule"}>
                {loadingAction === "Reschedule" ? "Submitting..." : "Submit"}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </>
        )
    }

    export const columns: ColumnDef<DoctorAppointmentRow>[] = [
      {
        accessorKey: "patientName",
        header: "Patient",
        cell: ({ row }) => {
          const appointment = row.original
          return (
            <div className="flex items-center gap-3">
              <Avatar size="sm">
                {appointment.patientAvatar ? (
                  <AvatarImage src={appointment.patientAvatar} alt={appointment.patientName} />
                ) : (
                  <AvatarFallback>{appointment.patientName.split(" ").slice(0, 2).map((part) => part[0]).join("")}</AvatarFallback>
                )}
              </Avatar>
              <div className="min-w-0 space-y-1">
                <Link href={`/doctor/appointments/${appointment.id}`} className="text-primary hover:underline">
                  {String(row.getValue("patientName"))}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {appointment.patientAge} yrs · {appointment.patientGender}
                </p>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "specialty",
        header: "Appointment Type",
        cell: ({ row }) => row.getValue("specialty"),
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => row.getValue("date"),
      },
      {
        accessorKey: "time",
        header: "Time",
        cell: ({ row }) => row.getValue("time"),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = String(row.getValue("status"))
          const normalized = status.toLowerCase()
          let badgeClass = "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:ring-slate-700"

          if (normalized === "confirmed") {
            badgeClass = "bg-blue-100 text-blue-800 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800/60"
          } else if (normalized === "completed") {
            badgeClass = "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/60"
          } else if (normalized === "awaiting cancellation" || normalized === "cancel requested") {
            badgeClass = "bg-amber-100 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/60"
          } else if (normalized === "cancelled" || normalized === "canceled") {
            badgeClass = "bg-rose-100 text-rose-800 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800/60"
          } else if (normalized === "pending") {
            badgeClass = "bg-amber-100 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/60"
          }

          return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass}`}>{status}</span>
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => <DoctorAppointmentActionsCell appointment={row.original} />,
      },
    ]
