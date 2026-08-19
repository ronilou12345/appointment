import Link from "next/link"

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground">
      <article className="mx-auto w-full max-w-3xl rounded-3xl border border-border bg-card p-8 shadow-lg md:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">C2M Family Clinic & Pharmacy</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: August 19, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">1. Information we collect</h2>
            <p>
              We collect the information you provide when you create an account or book an appointment, including your name,
              email address, contact number, appointment details, and health information related to your visit. If you sign in
              with Google, we receive your Google name, email, and profile photo.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">2. How we use your information</h2>
            <p>
              We use this information to create your account, schedule and confirm appointments, notify you by email or SMS,
              keep medical records for your care, and operate the clinic dashboard for authorized staff.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">3. Who can see your information</h2>
            <p>
              Your records are available to you and to authorized clinic staff involved in your care, such as your assigned
              doctor and administrators. We do not sell your personal information.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">4. Emails and messages</h2>
            <p>
              We send appointment updates to the active email on your account, including booking requests, confirmations,
              completions, cancellations, and password reset codes. Use an email address you can access.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">5. Data security</h2>
            <p>
              We take reasonable steps to protect account and medical information stored in this system. No method of
              transmission or storage is completely secure, so please keep your login details private.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">6. Your choices</h2>
            <p>
              You may update your profile details in Settings. For access, correction, or deletion of your records, contact the
              clinic using the email below.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">7. Contact</h2>
            <p>
              For privacy questions, email{" "}
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
          <Link href="/terms" className="font-medium text-primary underline-offset-4 hover:underline">
            Terms of Service
          </Link>
        </p>
      </article>
    </main>
  )
}
