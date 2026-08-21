"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export function PageLoadProgress({
  duration = 1400,
  className,
}: {
  duration?: number
  className?: string
}) {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let cancelled = false
    let frame = 0
    let hide = 0
    const start = performance.now()

    setVisible(true)
    setProgress(0)

    const tick = (now: number) => {
      if (cancelled) return

      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      setProgress(eased * 100)

      if (t < 1) {
        frame = window.requestAnimationFrame(tick)
        return
      }

      hide = window.setTimeout(() => {
        if (!cancelled) setVisible(false)
      }, 280)
    }

    frame = window.requestAnimationFrame(tick)

    return () => {
      cancelled = true
      window.cancelAnimationFrame(frame)
      window.clearTimeout(hide)
    }
  }, [duration, pathname])

  if (!visible) return null

  return (
    <Progress
      value={progress}
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 rounded-none",
        className
      )}
    />
  )
}
