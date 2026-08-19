"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Stepper, type StepperItem } from "@/components/ui/stepper"
import { User, Calendar as CalendarIcon, FileText, CheckCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { normalizePhilippineMobile } from "@/lib/phone-utils"

type DoctorOption = {
  id: number
  name: string
  credential: string
  email?: string
  avatar?: string
  specialty: string
  specialties?: string[]
  boardCertificates?: string[]
  experience: string
  experienceYears?: number
}

type SessionOption = {
  id: string
  doctorId: string
  date: string
  startTime: string
  endTime: string
  slots: number
  appointmentType?: string
  appointmentTypes?: string[]
}

const steps: StepperItem[] = [
  {
    title: "Select Doctor",
    description: "Choose your preferred doctor",
    icon: <User className="w-4 h-4" />,
  },
  {
    title: "Date & Time",
    description: "Pick appointment date and time",
    icon: <CalendarIcon className="w-4 h-4" />,
  },
  {
    title: "Add Details",
    description: "Provide visit information",
    icon: <FileText className="w-4 h-4" />,
  },
  {
    title: "Confirmation",
    description: "Review and confirm",
    icon: <CheckCircle className="w-4 h-4" />,
  },
]

export function BookAppointmentContent() {
  const [currentStep, setCurrentStep] = useState(0)
  const [doctors, setDoctors] = useState<DoctorOption[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)
  const [doctorError, setDoctorError] = useState("")
  const [sessions, setSessions] = useState<SessionOption[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [sessionError, setSessionError] = useState("")
  const [dateConflictMessage, setDateConflictMessage] = useState("")
  const [checkingDateConflict, setCheckingDateConflict] = useState(false)
  const [bookedTimes, setBookedTimes] = useState<string[]>([])
  const [formData, setFormData] = useState({
    doctorId: "",
    sessionId: "",
    date: "",
    time: "",
    appointmentType: "",
    reason: "",
    patientRelationship: "",
    patientRelationshipOther: "",
    age: "",
    gender: "",
    contactNumber: "",
    symptoms: "",
    durationOfSymptoms: "",
    painLevel: "",
    notes: "",
  })

  const loadSessions = async (showLoading = true) => {
    if (showLoading) {
      setLoadingSessions(true)
    }

    try {
      const response = await fetch("/api/sessions")
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load sessions")
      }

      setSessions(result.sessions ?? [])
      setSessionError("")
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : "Unable to load sessions")
    } finally {
      if (showLoading) {
        setLoadingSessions(false)
      }
    }
  }

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const response = await fetch("/api/doctors")
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Unable to load doctors")
        }

        setDoctors(result.doctors ?? [])
        setDoctorError("")
      } catch (error) {
        setDoctorError(error instanceof Error ? error.message : "Unable to load doctors")
      } finally {
        setLoadingDoctors(false)
      }
    }

    void loadDoctors()
    void loadSessions(true)
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadSessions(false)
    }, 10000)

    return () => window.clearInterval(intervalId)
  }, [])

  // Calendar state and helpers for custom UI
  const [displayedMonth, setDisplayedMonth] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })

  const changeMonth = (delta: number) => {
    const m = new Date(displayedMonth)
    m.setMonth(m.getMonth() + delta)
    setDisplayedMonth(m)
  }

  const startOfDay = (d: Date) => {
    const n = new Date(d)
    n.setHours(0, 0, 0, 0)
    return n
  }

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const formatLocalDateValue = (date: Date) => {
    const year = date.getFullYear()
    const month = `${date.getMonth() + 1}`.padStart(2, "0")
    const day = `${date.getDate()}`.padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const monthMatrix = (monthDate: Date) => {
    const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
    const start = new Date(firstOfMonth)
    start.setDate(start.getDate() - start.getDay())
    const days: { iso: string; day: number; inMonth: boolean }[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      days.push({ iso: formatLocalDateValue(d), day: d.getDate(), inMonth: d.getMonth() === monthDate.getMonth() })
    }
    return days
  }

  const timeSlots: string[] = []
  ;(() => {
    // generate 09:00 to 17:00 every 30 minutes
    const startH = 9
    const endH = 17
    for (let h = startH; h <= endH; h++) {
      timeSlots.push(`${String(h).padStart(2, "0")}:00`)
      if (h !== endH) timeSlots.push(`${String(h).padStart(2, "0")}:30`)
    }
  })()

  const formatTimeLabel = (t: string) => {
    const [hh, mm] = t.split(":").map(Number)
    const suffix = hh >= 12 ? "PM" : "AM"
    const h12 = hh % 12 === 0 ? 12 : hh % 12
    return `${h12}:${String(mm).padStart(2, "0")} ${suffix}`
  }

  const parseTimeToMinutes = (time: string) => {
    const [hh, mm] = time.split(":").map(Number)
    return hh * 60 + mm
  }

  const isSlotInFuture = (isoDate: string, time: string) => {
    if (!isoDate || !time) return false
    const [year, month, day] = isoDate.split("-").map(Number)
    const [hh, mm] = time.split(":").map(Number)
    const dt = new Date(year, month - 1, day, hh, mm, 0)
    return dt.getTime() > Date.now()
  }

  const getDayIndicatorColor = (isoDate: string) => {
    if (!selectedDoctorId) return null
    const daySessions = sessions.filter((s) => s.doctorId === selectedDoctorId && s.date === isoDate)
    if (!daySessions.length) return null

    // If any slot in the day is in the future and has remaining slots -> green
    for (const s of daySessions) {
      const start = parseTimeToMinutes(s.startTime)
      const end = parseTimeToMinutes(s.endTime)
      for (let minutes = start; minutes < end; minutes += 20) {
        const hh = Math.floor(minutes / 60)
        const mm = minutes % 60
        const key = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
        const remaining = s.slots ?? 0
        if (remaining > 0 && isSlotInFuture(isoDate, key)) return "green"
      }
    }

    // Sessions exist but none available (either full or all past) -> red
    return "red"
  }

  const formatLocalDateLabel = (iso: string) => {
    const [year, month, day] = iso.split("-").map(Number)
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const selectedDoctorId = formData.doctorId
  const selectedDateSessions = sessions.filter(
    (session) => session.doctorId === selectedDoctorId && session.date === formData.date,
  )

  const selectedDateTimeSlotAvailability = selectedDateSessions.reduce<Record<string, number>>((acc, session) => {
    const start = parseTimeToMinutes(session.startTime)
    const end = parseTimeToMinutes(session.endTime)
    for (let minutes = start; minutes < end; minutes += 20) {
      const hh = Math.floor(minutes / 60)
      const mm = minutes % 60
      const key = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
      acc[key] = Math.max(acc[key] ?? 0, session.slots)
    }
    return acc
  }, {})

  const selectedDateTimeSlots = Object.keys(selectedDateTimeSlotAvailability).sort(
    (a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b),
  )

  const getSessionForSlot = (slot: string) => {
    const minutes = parseTimeToMinutes(slot)
    return selectedDateSessions.find((session) => {
      const start = parseTimeToMinutes(session.startTime)
      const end = parseTimeToMinutes(session.endTime)
      return minutes >= start && minutes < end && (session.slots ?? 0) > 0
    })
  }

  const hasActiveSessionOnDate = (dateValue: string) =>
    sessions.some((session) => session.doctorId === selectedDoctorId && session.date === dateValue)

  const selectedDateSessionRanges = selectedDateSessions
    .map((session) => `${formatTimeLabel(session.startTime)} - ${formatTimeLabel(session.endTime)}`)

  const totalSelectedDateRemainingSlots = selectedDateSessions.reduce((sum, session) => {
    const remaining = Number(session.slots ?? 0)
    return sum + (Number.isFinite(remaining) ? remaining : 0)
  }, 0)

  const selectedDateSessionSummary = selectedDateSessionRanges.length
    ? totalSelectedDateRemainingSlots > 0
      ? selectedDateSessionRanges.length === 1
        ? `Available Time: ${selectedDateSessionRanges[0]} * ${totalSelectedDateRemainingSlots} ${totalSelectedDateRemainingSlots === 1 ? "Slot" : "Slots"} Remaining`
        : `Available Time: ${selectedDateSessionRanges.join(", ")} * ${totalSelectedDateRemainingSlots} ${totalSelectedDateRemainingSlots === 1 ? "Slot" : "Slots"} Remaining`
      : "No slot available"
    : ""

  const selectedDateTimeSummary = selectedDateTimeSlots.length
    ? selectedDateSessionSummary
    : ""

  const checkDateConflict = async (doctorId: string, selectedDate: string) => {
    if (!doctorId || !selectedDate) {
      setDateConflictMessage("")
      setBookedTimes([])
      return
    }

    setCheckingDateConflict(true)
    try {
      const response = await fetch(`/api/appointments?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(selectedDate)}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to check appointment availability")
      }

      setBookedTimes(Array.isArray(result.bookedTimes) ? result.bookedTimes : [])

      if (result.hasAppointment) {
        setDateConflictMessage("You already have an appointment for this date")
      } else {
        setDateConflictMessage("")
      }
    } catch {
      setBookedTimes([])
      setDateConflictMessage("")
    } finally {
      setCheckingDateConflict(false)
    }
  }

  const handleInputChange = (e: any) => {
    const { name, value } = e.target
    const nextValue = name === "contactNumber" ? value.replace(/[^\d+\s-]/g, "").slice(0, 18) : value

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }))
  }

  const todayIso = formatLocalDateValue(new Date())

  const doctorIsAvailableToday = (doctorId: number) => {
    const doctorSessions = sessions.filter((s) => String(s.doctorId) === String(doctorId) && s.date === todayIso)
    if (!doctorSessions.length) return false

    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    return doctorSessions.some((session) => {
      const end = parseTimeToMinutes(session.endTime)
      if ((session.slots ?? 0) <= 0) return false

      return currentMinutes < end
    })
  }

  const getDoctorSlotCount = (doctorId: number) => {
    const doctorSessions = sessions.filter((s) => String(s.doctorId) === String(doctorId) && s.date === todayIso)
    return doctorSessions.reduce((sum, session) => sum + (Number(session.slots ?? 0) > 0 ? Number(session.slots ?? 0) : 0), 0)
  }

  const getDoctorMonthSessionCount = (doctorId: number) => {
    return sessions.filter((session) => {
      if (String(session.doctorId) !== String(doctorId)) return false
      if (Number(session.slots ?? 0) <= 0) return false

      const [year, month] = String(session.date).split("-").map(Number)
      return year === displayedMonth.getFullYear() && month === displayedMonth.getMonth() + 1
    }).length
  }

  const doctorAppointmentTypes = Array.from(
    new Set(
      sessions
        .filter((s) => String(s.doctorId) === String(selectedDoctorId) && s.date === formData.date)
        .flatMap((s) => {
          const single = (s as any).appointmentType
          const arr = (s as any).appointmentTypes
          if (single) return [single]
          if (Array.isArray(arr)) return arr.filter(Boolean)
          return []
        }),
    ),
  )

  const handleNext = () => {
    const ok = canAdvance(currentStep)
    if (!ok.success) {
      toast.error(ok.message)
      return
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canAdvance = (stepIndex: number): { success: true } | { success: false; message: string } => {
    if (stepIndex === 0) {
      if (!formData.doctorId) return { success: false, message: "Please select a doctor before continuing." }
      return { success: true }
    }

    if (stepIndex === 1) {
      if (!formData.date) return { success: false, message: "Please choose a date before continuing." }
      if (!formData.time) return { success: false, message: "Please choose a time before continuing." }
      return { success: true }
    }

    if (stepIndex === 2) {
      // Basic required fields in Add Details
      if (!formData.patientRelationship) return { success: false, message: "Please select who the patient is." }
      if (formData.patientRelationship === "Other" && !formData.patientRelationshipOther)
        return { success: false, message: "Please enter the patient's relationship." }
      if (!formData.reason) return { success: false, message: "Please enter the reason for the visit." }
      return { success: true }
    }

    return { success: true }
  }

  const handleStepClick = (index: number) => {
    if (index === currentStep) return
    if (index < currentStep) {
      setCurrentStep(index)
      return
    }

    // moving forward: ensure each intermediate step is valid
    for (let i = currentStep; i < index; i++) {
      const ok = canAdvance(i)
      if (!ok.success) {
        toast.error(ok.message)
        return
      }
    }

    setCurrentStep(index)
  }

  const handleSubmit = async () => {
    if (!formData.sessionId) {
      toast.error("Please select a valid session time.")
      return
    }

    const cleanedContactNumber = normalizePhilippineMobile(formData.contactNumber)
    if (formData.contactNumber.trim() && !cleanedContactNumber) {
      toast.error("Please enter a valid Philippine mobile number before confirming.")
      return
    }

    const payload = {
      doctorId: Number(formData.doctorId),
      sessionId: Number(formData.sessionId),
      appointmentDate: formData.date || undefined,
      appointmentTime: formData.time || undefined,
      appointmentType: formData.appointmentType || "General Consultation",
      reasonForVisit: formData.reason,
      relationship: formData.patientRelationship === "Other" ? formData.patientRelationshipOther || "Other" : formData.patientRelationship,
      age: formData.age ? Number(formData.age) : undefined,
      gender: formData.gender || undefined,
      contactNumber: cleanedContactNumber || undefined,
      symptoms: formData.symptoms || undefined,
      durationOfSymptoms: formData.durationOfSymptoms || undefined,
      painLevel: formData.painLevel ? Number(formData.painLevel) : undefined,
      additionalNotes: formData.notes || undefined,
    }

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to book appointment")
      }

      toast.success(
        result.emailSent
          ? "Appointment booked! Confirmation details were emailed to you."
          : "Appointment booked successfully!"
      )
      await loadSessions(false)
      setCurrentStep(0)
      setFormData({
        doctorId: "",
        sessionId: "",
        date: "",
        time: "",
        appointmentType: "",
        reason: "",
        patientRelationship: "",
        patientRelationshipOther: "",
        age: "",
        gender: "",
        contactNumber: "",
        symptoms: "",
        durationOfSymptoms: "",
        painLevel: "",
        notes: "",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to book appointment"
      toast.error(message.includes("already have an appointment") ? "Appointment conflict\nYou already have an appointment for this date" : message)
    }
  }

  return (
    <div className="space-y-8">
      {/* Stepper */}
      <Stepper items={steps} currentStep={currentStep} onStepClick={handleStepClick} />

      {/* Step Content */}
      <Card className="p-8">
        {/* Step 1: Select Doctor */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Select Doctor</h2>
              <p className="text-muted-foreground">
                Choose the doctor you would like to book an appointment with.
              </p>
            </div>

            {loadingDoctors ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
                Loading doctors...
              </div>
            ) : doctorError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {doctorError}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctors.map((doctor) => {
                  const availableToday = doctorIsAvailableToday(doctor.id)
                  const slotCount = getDoctorSlotCount(doctor.id)

                  return (
                    <div
                      key={doctor.id}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          doctorId: doctor.id.toString(),
                          date: "",
                          time: "",
                          sessionId: "",
                        }))
                      }
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.doctorId === doctor.id.toString()
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11 border border-border bg-primary/5">
                          {doctor.avatar ? <AvatarImage src={doctor.avatar} alt={doctor.name} /> : null}
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {doctor.name
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join("")
                              .toUpperCase() || "DR"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground">
                            {doctor.name}, {doctor.credential}
                          </h3>
                          <p className="text-xs text-muted-foreground/90">
                            {doctor.email || "No email available"}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                              Specialties: {doctor.specialties?.length ? doctor.specialties.join(", ") : doctor.specialty?.trim() || "No specialties"}
                            </span>
                            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                              Board Certificate: {doctor.boardCertificates?.length ? doctor.boardCertificates.join(", ") : "Not available"}
                              {doctor.experienceYears && doctor.experienceYears > 0 ? ` • ${doctor.experience} of experience` : ""}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                availableToday
                                  ? "border border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200"
                                  : "border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
                              }`}
                            >
                              <span className={`mr-1 h-2 w-2 rounded-full ${availableToday ? "bg-emerald-500" : "bg-slate-500 dark:bg-slate-300"}`} />
                              {availableToday ? "Available today" : "Not available today"}
                            </span>
                            <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                              {slotCount} slot{slotCount === 1 ? "" : "s"} available
                            </span>
                            {!availableToday && getDoctorMonthSessionCount(doctor.id) > 0 ? (
                              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                {getDoctorMonthSessionCount(doctor.id)} session{getDoctorMonthSessionCount(doctor.id) === 1 ? "" : "s"} this month
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Date & Time (custom calendar + timeslots) */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Choose Date & Time</h2>
              <p className="text-muted-foreground">
                Select your preferred appointment date and time.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Calendar Column */}
              <div className="w-full">
                <div className="rounded-xl border border-border/60 bg-background/70 p-4 shadow-sm">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {displayedMonth.toLocaleString(undefined, { month: "long", year: "numeric" })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        aria-label="Previous month"
                        onClick={() => changeMonth(-1)}
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-lg transition hover:bg-muted"
                      >
                        ‹
                      </button>
                      <button
                        aria-label="Next month"
                        onClick={() => changeMonth(1)}
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-lg transition hover:bg-muted"
                      >
                        ›
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground mb-2">
                    {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d) => (
                      <div key={d} className="py-2">{d}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {monthMatrix(displayedMonth).map((dayObj) => {
                      const isPast = new Date(`${dayObj.iso}T00:00:00`) < startOfDay(new Date())
                      const isSelected = formData.date === dayObj.iso
                      const isToday = isSameDay(new Date(`${dayObj.iso}T00:00:00`), new Date())
                      return (
                        <button
                          key={dayObj.iso}
                          onClick={() => {
                            if (!isPast) {
                              const nextDate = dayObj.iso
                              setFormData((prev) => ({ ...prev, date: nextDate, time: "", sessionId: "" }))
                              void checkDateConflict(selectedDoctorId, nextDate)
                            }
                          }}
                          className={`h-12 flex items-center justify-center rounded-lg transition-all ${isSelected ? 'bg-white text-black font-semibold' : dayObj.inMonth ? 'bg-transparent hover:bg-muted' : 'text-muted-foreground'} ${isPast ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className="relative w-full h-full flex items-center justify-center">
                            <span>{dayObj.day}</span>
                            {isToday && <span className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-white/70" />}
                            {selectedDoctorId && getDayIndicatorColor(dayObj.iso) === "green" && (
                              <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-emerald-500" />
                            )}
                            {selectedDoctorId && getDayIndicatorColor(dayObj.iso) === "red" && (
                              <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  
                </div>
              </div>

              {/* Time Slots Column */}
              <div className="w-full">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-medium">Available Times</h3>
                    <div className="text-sm text-muted-foreground">
                      {selectedDoctorId ? "Select an available time to book an appointment with this doctor." : "Select a doctor first"}
                    </div>
                  </div>

                  {dateConflictMessage ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 shadow-sm">
                      <div className="font-medium">Appointment conflict</div>
                      <div className="mt-1">{dateConflictMessage}</div>
                    </div>
                  ) : null}

                  {!selectedDoctorId ? (
                    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      Choose a doctor to see available session times.
                    </div>
                  ) : loadingSessions ? (
                    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      Loading available sessions...
                    </div>
                  ) : sessionError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                      {sessionError}
                    </div>
                  ) : !formData.date ? (
                    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      Select a highlighted date to view available session times.
                    </div>
                  ) : selectedDateSessions.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      No active sessions for this date.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                        <div>{selectedDateTimeSummary}</div>
                      </div>
                      <div className="max-h-[420px] space-y-3 overflow-auto pr-2">
                      {selectedDateTimeSlots.map((slot) => {
                        const selected = formData.time === slot
                        const remaining = selectedDateTimeSlotAvailability[slot] ?? 0
                        const isPast = !isSlotInFuture(formData.date, slot)
                        const alreadyBooked = bookedTimes.includes(slot)
                        const available = remaining > 0 && !isPast && !alreadyBooked
                        const disabled = !available || selected
                        const baseClass = selected
                          ? 'bg-primary text-white border-primary opacity-90'
                          : available
                            ? 'bg-transparent border-border hover:border-primary'
                            : 'bg-red-50 text-red-600 border-red-100 cursor-not-allowed'

                        return (
                          <button
                            key={slot}
                            onClick={() => {
                              if (disabled) return
                              const session = getSessionForSlot(slot)
                              setFormData((prev) => ({
                                ...prev,
                                time: slot,
                                sessionId: session?.id ?? "",
                              }))
                            }}
                            disabled={disabled}
                            className={`w-full text-left flex items-center gap-4 p-3 rounded-xl border transition ${baseClass}`}
                          >
                            <div className={`w-3 h-3 rounded-full ${selected ? 'bg-white' : available ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            <div className="flex-1">
                              <div className="font-medium">{formatTimeLabel(slot)}</div>
                              {selected ? (
                                <div className="text-xs font-medium opacity-90">Selected</div>
                              ) : !available ? (
                                <div className="text-xs font-medium text-red-600">
                                  {alreadyBooked ? "Booked" : isPast ? "Time passed" : "No slot available"}
                                </div>
                              ) : null}
                            </div>
                          </button>
                        )
                      })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Add Details */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Add Visit Details</h2>
              <p className="text-muted-foreground">
                Tell us about your visit to help the doctor prepare.
              </p>
            </div>

            <div className="space-y-4">
                <div>
                  <Label htmlFor="appointmentType">Appointment Type</Label>
                  <select
                    id="appointmentType"
                    name="appointmentType"
                    value={formData.appointmentType}
                    onChange={handleInputChange}
                    className="mt-2 h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="">Select appointment type</option>
                    {doctorAppointmentTypes.length === 0 ? (
                      <option value="General Consultation">General Consultation</option>
                    ) : (
                      doctorAppointmentTypes.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))
                    )}
                  </select>
                </div>
              <div>
                <Label htmlFor="patientRelationship">Who is the Patient?</Label>
                <select
                  id="patientRelationship"
                  name="patientRelationship"
                  value={formData.patientRelationship}
                  onChange={handleInputChange}
                  className="mt-2 h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">Select relationship</option>
                  <option value="Myself">Myself</option>
                  <option value="My Child">My Child</option>
                  <option value="My Father">My Father</option>
                  <option value="My Mother">My Mother</option>
                  <option value="My Spouse">My Spouse</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {formData.patientRelationship === "Other" && (
                <div>
                  <Label htmlFor="patientRelationshipOther">Relationship</Label>
                  <input
                    id="patientRelationshipOther"
                    name="patientRelationshipOther"
                    placeholder="Enter relationship"
                    value={formData.patientRelationshipOther || ""}
                    onChange={handleInputChange}
                    className="mt-2 h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="reason">Reason for Visit</Label>
                <input
                  id="reason"
                  name="reason"
                  placeholder="e.g., Check-up, Follow-up, New concern"
                  value={formData.reason}
                  onChange={handleInputChange}
                  className="mt-2 h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    min="1"
                    placeholder="e.g. 32"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="mt-2 h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="mt-2 h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="contactNumber">Contact Number (Philippine Format)</Label>
                  <input
                    id="contactNumber"
                    name="contactNumber"
                    type="tel"
                    placeholder="e.g. 0917 123 4567 or 09616203914"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    className="mt-2 h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Use Philippine mobile number format: 09XX-XXX-XXXX or 09XXXXXXXXX. We'll send your appointment confirmation via SMS.
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="symptoms">Symptoms (Optional)</Label>
                <textarea
                  id="symptoms"
                  name="symptoms"
                  placeholder="Describe your symptoms..."
                  value={formData.symptoms}
                  onChange={handleInputChange}
                  className="mt-2 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="durationOfSymptoms">Duration of Symptoms</Label>
                  <input
                    id="durationOfSymptoms"
                    name="durationOfSymptoms"
                    placeholder="e.g. 3 days"
                    value={formData.durationOfSymptoms}
                    onChange={handleInputChange}
                    className="mt-2 h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </div>

                <div>
                  <Label htmlFor="painLevel">Pain Level (Optional)</Label>
                  <select
                    id="painLevel"
                    name="painLevel"
                    value={formData.painLevel}
                    onChange={handleInputChange}
                    className="mt-2 h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="">Select</option>
                    <option value="0">0 - No pain</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10 - Severe pain</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  placeholder="Any additional information for the doctor..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="mt-2 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Confirm Appointment</h2>
              <p className="text-muted-foreground">
                Please review your appointment details before confirming.
              </p>
            </div>

            <div className="space-y-4 bg-muted/50 p-6 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Doctor</p>
                <p className="font-semibold">
                  {doctors.find((d) => d.id.toString() === formData.doctorId)?.name || "Not selected"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Appointment Type</p>
                <p className="font-semibold">
                  {formData.appointmentType || "Not selected"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-semibold">
                    {formData.date || "Not selected"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-semibold">
                    {formData.time || "Not selected"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Reason for Visit</p>
                <p className="font-semibold">{formData.reason || "Not provided"}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Who is the Patient?</p>
                <p className="font-semibold">{formData.patientRelationship || "Not selected"}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="font-semibold">{formData.age || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-semibold">{formData.gender || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact Number</p>
                  <p className="font-semibold">{formData.contactNumber || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pain Level</p>
                  <p className="font-semibold">{formData.painLevel ? `Level ${formData.painLevel}` : "Not provided"}</p>
                </div>
              </div>

              {formData.symptoms && (
                <div>
                  <p className="text-sm text-muted-foreground">Symptoms</p>
                  <p className="font-semibold">{formData.symptoms}</p>
                </div>
              )}

              {formData.durationOfSymptoms && (
                <div>
                  <p className="text-sm text-muted-foreground">Duration of Symptoms</p>
                  <p className="font-semibold">{formData.durationOfSymptoms}</p>
                </div>
              )}

              {formData.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Additional Notes</p>
                  <p className="font-semibold">{formData.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          Previous
        </Button>

        <div className="flex gap-2">
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={
                (currentStep === 0 && !formData.doctorId) ||
                (currentStep === 1 && (!formData.date || !formData.time)) ||
                (currentStep === 2 && !formData.reason)
              }
              className="bg-orange-500 hover:bg-orange-600"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Confirm Appointment
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
