import { BookAppointmentContent } from "../client/book-appointment/content"

export default function BookAppointmentPage() {
  return (
    <div className="min-h-screen w-full bg-background p-6 text-foreground">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground">Walk In</h1>
        <p className="mt-2 text-muted-foreground">
          Register a walk-in appointment with the patient's preferred doctor.
        </p>
      </div>

      <BookAppointmentContent walkIn />
    </div>
  )
}