import { SignupForm } from "@/components/signup-form"
import { LoginDotWaves } from "@/components/login-dot-waves"

export default function SignupPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <LoginDotWaves />
      <div className="relative z-10 w-full max-w-md">
        <SignupForm />
      </div>
    </div>
  )
}
