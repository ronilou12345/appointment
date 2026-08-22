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
    if (isDark) {
      root.style.setProperty("--muted", "0 0% 14.9%")
      root.style.setProperty("--muted-foreground", "0 0% 63.9%")
      root.style.setProperty("--secondary", "0 0% 14.9%")
      root.style.setProperty("--secondary-foreground", "0 0% 98%")
      root.style.setProperty("--accent", "0 0% 14.9%")
      root.style.setProperty("--accent-foreground", "0 0% 98%")
      root.style.setProperty("--border", gray.hsl)
      root.style.setProperty("--input", gray.hsl)
    } else {
      root.style.setProperty("--muted", "0 0% 96.1%")
      root.style.setProperty("--muted-foreground", "0 0% 45.1%")
      root.style.setProperty("--secondary", "0 0% 96.1%")
      root.style.setProperty("--secondary-foreground", "0 0% 9%")
      root.style.setProperty("--accent", "0 0% 96.1%")
      root.style.setProperty("--accent-foreground", "0 0% 9%")
      root.style.setProperty("--border", "0 0% 89.8%")
      root.style.setProperty("--input", "0 0% 89.8%")
    }
    
  }, [config, isDark])

  return null
}
