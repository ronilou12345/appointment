import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-8 rounded-3xl border border-border bg-card p-8 shadow-lg md:flex-row md:p-12">
        <div className="max-w-md space-y-4 text-center md:text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">C2M Family Clinic & Pharmacy</p>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome</h1>
          <p className="text-sm leading-6 text-muted-foreground">
           Sign in to securely access your patient dashboard, manage your appointments, view your medical records, and stay connected with your healthcare provider.
          </p>
        </div>
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
