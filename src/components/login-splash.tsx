"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { LoginDotWaves } from "@/components/login-dot-waves"
import { Progress } from "@/components/ui/progress"

const SPLASH_MS = 2000

export function LoginSplash({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true)
  const [leaving, setLeaving] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let cancelled = false
    let frame = 0
    const start = performance.now()

    const tick = (now: number) => {
      if (cancelled) return

      const t = Math.min(1, (now - start) / SPLASH_MS)
      const eased = 1 - (1 - t) ** 3
      setProgress(eased * 100)

      if (t < 1) {
        frame = window.requestAnimationFrame(tick)
        return
      }

      setLeaving(true)
    }

    frame = window.requestAnimationFrame(tick)
    const hide = window.setTimeout(() => setVisible(false), SPLASH_MS + 550)

    return () => {
      cancelled = true
      window.cancelAnimationFrame(frame)
      window.clearTimeout(hide)
    }
  }, [])

  const percent = Math.round(progress)

  return (
    <>
      {visible ? (
        <div
          className={cn(
            "fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-background transition-all duration-500 ease-out",
            leaving ? "pointer-events-none scale-105 opacity-0" : "scale-100 opacity-100"
          )}
          aria-hidden={!visible}
        >
          <LoginDotWaves />
          <div className="relative z-10 flex w-full max-w-[16rem] flex-col items-center gap-5 px-6 text-center">
            <div className="relative flex size-28 items-center justify-center">
              <span className="splash-ring pointer-events-none absolute inset-0 rounded-[var(--radius)] border border-foreground/25" />
              <div className="splash-logo relative z-10 flex size-28 items-center justify-center overflow-hidden rounded-[var(--radius)] bg-white p-3 shadow-sm dark:bg-slate-900">
                <Image
                  src="/logo1.jpg"
                  alt="C2M Family Clinic & Pharmacy logo"
                  width={96}
                  height={96}
                  priority
                  className="size-full object-contain rounded-[var(--radius)]"
                />
              </div>
            </div>
            <div className="splash-text w-full">
              <p className="text-lg font-semibold tracking-tight text-foreground">
                C2M Family Clinic & Pharmacy
              </p>
              <div className="mt-5 w-full space-y-2">
                <Progress value={progress} className="h-1.5" />
                <p className="text-xs font-medium tabular-nums text-muted-foreground">
                  Loading {percent}%
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {children}
    </>
  )
}
