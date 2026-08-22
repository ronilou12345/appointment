"use client"

import * as React from "react"
import { useTheme } from "@/components/theme-provider"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const TOAST_DURATION_MS = 4000

function ToastProgressBars() {
  React.useEffect(() => {
    const attach = (toastEl: Element) => {
      if (!(toastEl instanceof HTMLElement)) return
      if (toastEl.querySelector("[data-toast-progress]")) return

      toastEl.classList.add("cn-toast")

      const track = document.createElement("div")
      track.setAttribute("data-toast-progress", "")
      track.className = "toast-progress-track"

      const fill = document.createElement("div")
      fill.className = "toast-progress-fill"
      const type = toastEl.getAttribute("data-type") || ""
      if (type === "success") fill.dataset.variant = "success"
      else if (type === "error") fill.dataset.variant = "error"
      else if (type === "warning") fill.dataset.variant = "warning"
      else fill.dataset.variant = "default"

      track.appendChild(fill)
      toastEl.insertBefore(track, toastEl.firstChild)
    }

    const scan = () => {
      document.querySelectorAll("[data-sonner-toast], .cn-toast").forEach(attach)
    }

    scan()
    const observer = new MutationObserver(scan)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <>
      <Sonner
        theme={theme as ToasterProps["theme"]}
        className="toaster group"
        {...props}
        closeButton
        expand
        gap={12}
        visibleToasts={4}
        duration={TOAST_DURATION_MS}
        icons={{
          success: (
            <CircleCheckIcon className="size-5" />
          ),
          info: (
            <InfoIcon className="size-5" />
          ),
          warning: (
            <TriangleAlertIcon className="size-5" />
          ),
          error: (
            <OctagonXIcon className="size-5" />
          ),
          loading: (
            <Loader2Icon className="size-5 animate-spin" />
          ),
        }}
        style={
          {
            "--normal-bg": "var(--popover)",
            "--normal-text": "var(--popover-foreground)",
            "--normal-border": "var(--border)",
            "--border-radius": "var(--radius)",
          } as React.CSSProperties
        }
        toastOptions={{
          duration: TOAST_DURATION_MS,
          closeButton: true,
          classNames: {
            toast: "cn-toast",
            icon: "toast-icon",
            title: "toast-title",
          },
        }}
      />
      <ToastProgressBars />
    </>
  )
}

export { Toaster }
