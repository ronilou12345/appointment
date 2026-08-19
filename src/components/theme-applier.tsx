"use client"

import * as React from "react"
import { useConfig, themes, grays, getThemeCss } from "@/hooks/use-config"
import { useTheme } from "@/components/theme-provider"

export function ThemeApplier() {
  const [config] = useConfig()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  React.useEffect(() => {
    const theme = themes[config.theme] ?? themes.primary
    const gray = grays[config.gray] ?? grays.zinc
    const root = document.documentElement
    const colors = getThemeCss(theme, isDark)

    root.style.setProperty("--primary", colors.hsl)
    root.style.setProperty("--primary-foreground", colors.foreground)
    root.style.setProperty("--primary-gradient", colors.gradient)
    if (colors.gradient !== "none") {
      root.setAttribute("data-primary-gradient", "true")
    } else {
      root.removeAttribute("data-primary-gradient")
    }
    
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
    
  }, [config, isDark])

  return null
}
