import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { LoginForm } from "@/components/login-form"
import { LoginSplash } from "@/components/login-splash"
import { LoginDotWaves } from "@/components/login-dot-waves"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  return (
    <LoginSplash>
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12 text-foreground">
        <LoginDotWaves />
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="absolute left-4 top-4 z-10 size-8 rounded-full border border-border bg-background/80 shadow-sm backdrop-blur-sm"
        >
          <Link href="/" aria-label="Back to home">
            <ArrowLeft className="h-[1.2rem] w-[1.2rem]" />
          </Link>
        </Button>
        <ThemeToggle className="absolute right-4 top-4 z-10 border border-border bg-background/80 shadow-sm backdrop-blur-sm" />
        <div className="relative z-10 w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">C2M Family Clinic & Pharmacy</p>
            <h1 className="text-3xl font-semibold tracking-tight">Welcome back!</h1>
            <p className="text-sm leading-6 text-muted-foreground">
            Sign in to securely access your account and manage your healthcare needs.
            </p>
          </div>
          <LoginForm />
        </div>
      </main>
    </LoginSplash>
  )
}
