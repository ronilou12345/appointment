"use client"

import { useState, type ComponentProps, type FormEvent } from "react"
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
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { registerUser } from "@/lib/actions/auth"
import { Eye, EyeOff } from "lucide-react"

export function SignupForm({
  className,
  ...props
}: ComponentProps<'div'>) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordValue, setPasswordValue] = useState("")
  const router = useRouter()

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
    const result = await registerUser(formData)

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      router.push("/login")
    }
  }

  return (
    <div className={cn("flex flex-col gap-6 bg-white px-4 py-6 text-foreground sm:px-6 dark:bg-slate-950 dark:text-white", className)} {...props}>
      <Card className="border-border bg-white/95 text-foreground shadow-2xl dark:border-white/10 dark:bg-zinc-950/95 dark:text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-white">Create your account</CardTitle>
          <CardDescription className="text-white/70">
            Enter your email below to create your account
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
                  required
                />
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
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
                <FieldDescription className="text-center text-white/70">
                  Already have an account? <a href="/login" className="font-medium text-white underline-offset-4 hover:underline">Sign in</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <Label className="flex-wrap justify-center gap-1 px-6 text-center text-sm font-normal leading-6 text-white/70">
        By clicking continue, you agree to our{" "}
        <a href="#" className="font-medium text-white underline-offset-4 hover:underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="font-medium text-white underline-offset-4 hover:underline">
          Privacy Policy
        </a>
        .
      </Label>
    </div>
  )
}
