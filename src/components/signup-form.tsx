"use client"

import { useEffect, useState, type ComponentProps, type FormEvent } from "react"
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
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { registerUser } from "@/lib/actions/auth"
import { Eye, EyeOff, Mail } from "lucide-react"

export function SignupForm({
  className,
  ...props
}: ComponentProps<'div'>) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordValue, setPasswordValue] = useState("")
  const [emailValue, setEmailValue] = useState("")
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [verificationSentTo, setVerificationSentTo] = useState("")
  const router = useRouter()

  useEffect(() => {
    const email = emailValue.trim().toLowerCase()

    if (!email || !email.includes("@")) {
      setEmailStatus("idle")
      return
    }

    const timeout = window.setTimeout(async () => {
      setEmailStatus("checking")

      try {
        const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`)
        const result = await response.json()

        if (!response.ok || !result.success) {
          setEmailStatus("idle")
          return
        }

        setEmailStatus(result.exists ? "taken" : "available")
      } catch {
        setEmailStatus("idle")
      }
    }, 400)

    return () => window.clearTimeout(timeout)
  }, [emailValue])

  const passwordProgressValue = Math.min(100, Math.round((passwordValue.length / 16) * 100))
  const passwordProgressVariant = passwordValue.length === 0
    ? "default"
    : passwordValue.length < 8
    ? "danger"
    : passwordValue.length < 12
    ? "warning"
    : "success"

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)

    if (emailStatus === "taken") {
      setError("This email is already registered. Please sign in or use a different email.")
      setLoading(false)
      return
    }

    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy to continue.")
      setLoading(false)
      return
    }

    const result = await registerUser(formData)

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      setVerificationSentTo(emailValue.trim().toLowerCase())
    }
  }

  return (
    <div className={cn("flex flex-col gap-6 bg-white px-4 py-6 text-foreground sm:px-6 dark:bg-slate-950 dark:text-white", className)} {...props}>
      <Card className="border-border bg-white/95 text-foreground shadow-2xl dark:border-white/10 dark:bg-zinc-950/95 dark:text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{verificationSentTo ? "Verify your email" : "Create your account"}</CardTitle>
          <CardDescription>
            {verificationSentTo
              ? "We sent a verification link to your email"
              : "Enter your email below to create your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verificationSentTo ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Mail className="size-6" />
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                We sent a verification email to{" "}
                <span className="font-medium text-foreground">{verificationSentTo}</span>.
                Open that email and click <span className="font-medium text-foreground">Verify your account</span>.
                After you verify, you can sign in.
              </p>
              <Button type="button" className="w-full" onClick={() => router.push("/login")}>
                Go to login
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => setVerificationSentTo("")}>
                Resend verification email
              </Button>
              <FieldDescription className="text-center">
                Didn&apos;t get the email? Check your spam folder, then resend it.
              </FieldDescription>
            </div>
          ) : (
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {error && (
                <div className="text-sm font-medium text-destructive text-center bg-destructive/10 p-2 rounded">
                  {error}
                </div>
              )}
              <Field>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input id="name" name="name" type="text" placeholder="Juan Dela Cruz" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  value={emailValue}
                  onChange={(event) => setEmailValue(event.target.value)}
                  aria-invalid={emailStatus === "taken"}
                  required
                />
                <FieldDescription>Use your active email account. This is where we will send appointment updates.</FieldDescription>
                {emailStatus === "checking" ? (
                  <FieldDescription>Checking if this email is available...</FieldDescription>
                ) : null}
                {emailStatus === "taken" ? (
                  <FieldDescription className="text-destructive">
                    This email is already registered. Please{" "}
                    <a href="/login" className="font-medium underline-offset-4 hover:underline">
                      sign in
                    </a>{" "}
                    or use a different email.
                  </FieldDescription>
                ) : null}
                {emailStatus === "available" ? (
                  <FieldDescription className="text-emerald-600">This email is available.</FieldDescription>
                ) : null}
              </Field>
              <Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={passwordValue}
                        onChange={(event) => setPasswordValue(event.target.value)}
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
                    <div className="mt-2">
                      <Progress value={passwordProgressValue} variant={passwordProgressVariant} />
                    </div>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">
                      Confirm Password
                    </FieldLabel>
                    <div className="relative">
                      <Input 
                        id="confirm-password" 
                        name="confirm-password" 
                        type={showConfirmPassword ? "text" : "password"} 
                        required 
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="size-5" />
                        ) : (
                          <Eye className="size-5" />
                        )}
                      </button>
                    </div>
                  </Field>
                </div>
                <FieldDescription>
                  Must be at least 8 characters long.
                </FieldDescription>
              </Field>
              <Field>
                <div className="flex items-start gap-2.5">
                  <Checkbox
                    id="agree-terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                    className="mt-1"
                  />
                  <label
                    htmlFor="agree-terms"
                    className="min-w-0 flex-1 text-left text-sm font-normal leading-5 text-muted-foreground"
                  >
                    By clicking Continue, you agree to our{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="whitespace-nowrap font-medium text-black underline-offset-4 hover:underline dark:text-white"
                      onClick={(event) => event.stopPropagation()}
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="whitespace-nowrap font-medium text-black underline-offset-4 hover:underline dark:text-white"
                      onClick={(event) => event.stopPropagation()}
                    >
                      Privacy Policy
                    </a>
                    .
                  </label>
                </div>
              </Field>
              <Field>
                <Button type="submit" disabled={loading || emailStatus === "taken" || emailStatus === "checking" || !agreedToTerms}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
                <FieldDescription className="text-center">
                  Already have an account? <a href="/login" className="font-medium text-black underline-offset-4 hover:underline dark:text-white">Sign in</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
