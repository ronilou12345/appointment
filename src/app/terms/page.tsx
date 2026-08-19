import Link from "next/link"

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground">
      <article className="mx-auto w-full max-w-3xl rounded-3xl border border-border bg-card p-8 shadow-lg md:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">C2M Family Clinic & Pharmacy</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: August 19, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">1. Acceptance of these terms</h2>
            <p>
              By creating an account or using the C2M Family Clinic & Pharmacy appointment system, you agree to these Terms of Service.
              If you do not agree, please do not use this service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">2. Who this service is for</h2>
            <p>
              This platform is for patients, doctors, and authorized clinic staff to book, confirm, complete, and manage medical
              appointments. Public sign-up creates a patient account only.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">3. Your account</h2>
            <p>
              You must use an active email address that you can access. You are responsible for keeping your password private and
              for activity under your account. Notify the clinic if you believe your account was used without permission.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">4. Appointments</h2>
            <p>
              Booking an appointment sends a request that stays pending until a doctor confirms it. You may cancel or reschedule
              while the appointment is still pending. Once it is confirmed, you may no longer cancel or reschedule it through this
              system. Please arrive 10 to 15 minutes before a confirmed visit and bring any documents the clinic requests.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">5. Medical information</h2>
            <p>
              Information you submit, including visit reasons, symptoms, and clinical notes, is used to provide care and operate
              the clinic system. This platform does not replace emergency care. If you have a medical emergency, call local
              emergency services immediately.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">6. Acceptable use</h2>
            <p>
              You agree not to misuse the system, attempt to access another person&apos;s records, or submit false booking details.
              The clinic may suspend accounts that violate these terms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">7. Contact</h2>
            <p>
              For questions about these terms, email{" "}
              <a href="mailto:support@c2mclinic.com" className="font-medium text-foreground underline-offset-4 hover:underline">
                support@c2mclinic.com
              </a>
              .
            </p>
          </section>
        </div>

        <p className="mt-10 text-sm">
          <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
            Back to sign up
          </Link>
          <span className="mx-2 text-muted-foreground">·</span>
          <Link href="/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </article>
    </main>
  )
}
