"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Stepper, type StepperItem } from "@/components/ui/stepper"
import { User, Calendar as CalendarIcon, FileText, CheckCircle } from "lucide-react"
import { Card } from "@/components/ui/card"

type DoctorOption = {
  id: number
  name: string
  credential: string
  specialty: string
  experience: string
}

type SessionOption = {
  id: string
  doctorId: string
  date: string
  startTime: string
  endTime: string
  slots: number
  appointmentType: string
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
  const [formData, setFormData] = useState({
    doctorId: "",
    date: "",
    time: "",
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

    const loadSessions = async () => {
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
        setLoadingSessions(false)
      }
    }

    loadDoctors()
    loadSessions()
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

  const hasActiveSessionOnDate = (dateValue: string) =>
    sessions.some((session) => session.doctorId === selectedDoctorId && session.date === dateValue)

  const selectedDateSessionRanges = selectedDateSessions
    .map((session) => `${formatTimeLabel(session.startTime)} - ${formatTimeLabel(session.endTime)}`)

  const selectedDateSessionSummary = selectedDateSessionRanges.length
    ? selectedDateSessionRanges.length === 1
      ? `Available ${selectedDateSessionRanges[0]}`
      : `Available ranges: ${selectedDateSessionRanges.join(", ")}`
    : ""

  const selectedDateTimeSummary = selectedDateTimeSlots.length
    ? `Showing ${selectedDateTimeSlots.length} times every 20 minutes for ${formatLocalDateLabel(formData.date)}`
    : ""

  const handleInputChange = (e: any) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    // TODO: Submit appointment to backend
    console.log("Appointment booked:", formData)
    toast.success("Appointment booked successfully!")
  }

  return (
    <div className="space-y-8">
      {/* Stepper */}
      <Stepper items={steps} currentStep={currentStep} onStepClick={setCurrentStep} />

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
                {doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        doctorId: doctor.id.toString(),
                      }))
                    }
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.doctorId === doctor.id.toString()
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {doctor.name
                          .split(" ")
                          .slice(1)
                          .map((part) => part[0])
                          .join("")}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {doctor.name}, {doctor.credential}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {doctor.specialty} · {doctor.experience} of experience
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
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
                              setFormData((prev) => ({ ...prev, date: dayObj.iso, time: "" }))
                            }
                          }}
                          className={`h-12 flex items-center justify-center rounded-lg transition-all ${isSelected ? 'bg-white text-black font-semibold' : dayObj.inMonth ? 'bg-transparent hover:bg-muted' : 'text-muted-foreground'} ${isPast ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className="relative w-full h-full flex items-center justify-center">
                            <span>{dayObj.day}</span>
                            {isToday && <span className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-white/70" />}
                            {selectedDoctorId && hasActiveSessionOnDate(dayObj.iso) && (
                              <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-emerald-500" />
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
                      {selectedDoctorId ? "Available sessions for this doctor are loaded from the database" : "Select a doctor first"}
                    </div>
                  </div>

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
                        <div>{selectedDateSessionSummary}</div>
                        <div className="text-[0.9rem] text-foreground/80 mt-1">{selectedDateTimeSummary}</div>
                      </div>
                      <div className="max-h-[420px] space-y-3 overflow-auto pr-2">
                      {selectedDateTimeSlots.map((slot) => {
                        const selected = formData.time === slot
                        const remaining = selectedDateTimeSlotAvailability[slot] ?? 0
                        return (
                          <button
                            key={slot}
                            onClick={() => setFormData((prev) => ({ ...prev, time: slot }))}
                            className={`w-full text-left flex items-center gap-4 p-3 rounded-xl border transition ${selected ? 'bg-primary text-white border-primary' : 'bg-transparent border-border hover:border-primary'}`}
                          >
                            <div className={`w-3 h-3 rounded-full ${selected ? 'bg-white' : 'bg-emerald-400'}`} />
                            <div className="flex-1">
                              <div className="font-medium">{formatTimeLabel(slot)}</div>
                              <div className="text-sm opacity-80">{remaining} slot{remaining === 1 ? '' : 's'} remaining</div>
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
                <Label htmlFor="reason">Reason for Visit</Label>
                <input
                  id="reason"
                  name="reason"
                  placeholder="e.g., Check-up, Follow-up, New concern"
                  value={formData.reason}
                  onChange={handleInputChange}
                  className="mt-2 h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                />
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
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <input
                    id="contactNumber"
                    name="contactNumber"
                    type="tel"
                    placeholder="e.g. 0917 123 4567"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    className="mt-2 h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
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
