import { BookAppointmentContent } from "./content"

export default function BookAppointmentPage() {
  return (
    <div className="min-h-screen w-full bg-background p-6 text-foreground">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground">Book Appointment</h1>
        <p className="mt-2 text-muted-foreground">
          Follow the steps below to schedule a new appointment with your preferred doctor.
        </p>
      </div>

      <BookAppointmentContent />
    </div>
  )
}
