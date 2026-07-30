import { BookAppointmentContent } from "./content"

export default function BookAppointmentPage() {
  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground">Book Appointment</h1>
          <p className="mt-2 text-muted-foreground">
            Follow the steps below to schedule a new appointment with your preferred doctor.
          </p>
        </div>
        
        <BookAppointmentContent />
      </div>
    </div>
  )
}
