"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getDashboardPath, getRoleFromEmail } from "@/lib/user-role"
import { Eye, EyeOff } from "lucide-react"

const googleErrorMessages: Record<string, string> = {
  google_not_configured:
    "Google sign-in is not set up on this server. In Vercel, add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (the secret must start with GOCSPX-), then Redeploy with Build Cache turned off.",
  google_denied: "Google sign-in was cancelled.",
  google_state_mismatch: "That Google sign-in link expired. Please try again.",
  google_unverified_email: "Your Google account email is not verified.",
  google_failed: "We could not sign you in with Google. Please try again.",
  google_invalid_secret:
    "Google rejected this app's client secret. Check GOOGLE_CLIENT_SECRET in .env (it must start with GOCSPX-) and restart the server.",
  google_redirect_mismatch:
    "Google rejected the callback URL. Add http://localhost:3000/api/auth/google/callback in Authorized redirect URIs.",
  google_bad_origin:
    "Google sign-in only works on http://localhost:3000 or an https address. Open the app that way and try again.",
  account_inactive: "Your account is not active yet.",
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorCode = params.get("error")
    if (errorCode) {
      setError(googleErrorMessages[errorCode] ?? "Sign-in failed. Please try again.")
    } else if (params.get("reset") === "success") {
      setInfo("Your password was updated. You can sign in with the new password.")
    } else if (params.get("signup") === "success") {
      setInfo("Your account was created. You can sign in now.")
    }
    if (params.toString()) {
      window.history.replaceState(null, "", window.location.pathname)
    }
  }, [])

  function handleGoogleLogin() {
    setError(null)
    setGoogleLoading(true)
    window.location.href = "/api/auth/google"
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const body = {
      email: formData.get("email")?.toString() ?? "",
      password: formData.get("password")?.toString() ?? "",
    }

    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const result = await response.json()
    setLoading(false)

    if (!response.ok) {
      setError(result.error || "Login failed.")
      return
    }

    if (!result.success) {
      setError(result.error || "Login failed.")
      return
    }

    const email = body.email
    const role = result.role ?? getRoleFromEmail(email)
    const dashboardPath = getDashboardPath(role)
    window.location.href = dashboardPath
  }

  return (
    <div className={cn("flex flex-col gap-6 bg-white", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome</CardTitle>
          <CardDescription>
            Login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {error && (
                <div className="text-sm font-medium text-destructive text-center bg-destructive/10 p-2 rounded">
                  {error}
                </div>
              )}
              {info && !error && (
                <div className="rounded bg-primary/10 p-2 text-center text-sm font-medium text-foreground">
                  {info}
                </div>
              )}
              <Field className="flex justify-center">
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading || loading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  {googleLoading ? "Redirecting to Google..." : "Login with Google"}
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="/forgot-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </button>
                </div>
              </Field>
              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <a href="/signup" className="font-medium text-black dark:text-white">Sign up</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>{" "}
        and <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
