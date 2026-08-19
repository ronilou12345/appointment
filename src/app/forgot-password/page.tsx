import { ForgotPasswordForm } from "@/components/forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-8 rounded-3xl border border-border bg-card p-8 shadow-lg md:flex-row md:p-12">
        <div className="max-w-md space-y-4 text-center md:text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">C2M Family Clinic & Pharmacy</p>
          <h1 className="text-3xl font-semibold tracking-tight">Reset your password</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Enter the email on your account. We will send a 6-digit code so you can choose a new password.
          </p>
        </div>
        <div className="w-full max-w-md">
          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  )
}
