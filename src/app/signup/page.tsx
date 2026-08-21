import { SignupForm } from "@/components/signup-form"

export default function SignupPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12 text-foreground dark:bg-black">
      <div className="relative z-10 w-full max-w-md">
        <SignupForm />
      </div>
    </div>
  )
}
