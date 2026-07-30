"use client"

import * as React from "react"
import { useConfig, themes, grays } from "@/hooks/use-config"

export function ThemeApplier() {
  const [config] = useConfig()

  React.useEffect(() => {
    const theme = (themes as any)[config.theme]
    const gray = (grays as any)[config.gray]
    const root = document.documentElement
    
    // Apply primary color
    root.style.setProperty("--primary", theme.hsl)
    root.style.setProperty("--primary-foreground", theme.foreground)
    
    // Apply radius
    root.style.setProperty("--radius", `${config.radius}rem`)
    
    // Apply gray scale to relevant variables
    // We try to derive some basic shadcn-like variables from the base gray color
    root.style.setProperty("--muted-foreground", gray.hsl)
    root.style.setProperty("--border", gray.hsl) 
    root.style.setProperty("--input", gray.hsl)
    
    // For things like secondary/muted/accent, we'd ideally want a lighter version
    // For now, we use the base gray or a simple alpha version if using Tailwind v4
    // But setting them as raw HSL is safer for consistency.
    root.style.setProperty("--secondary", gray.hsl) 
    root.style.setProperty("--muted", gray.hsl)
    root.style.setProperty("--accent", gray.hsl)
    
  }, [config])

  return null
}
