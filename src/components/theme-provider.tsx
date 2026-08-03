"use client"

import * as React from "react"

type ThemeProviderProps = {
  children: React.ReactNode
  [key: string]: unknown
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  React.useEffect(() => {
    const storedTheme = window.localStorage.getItem("theme")
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const activeTheme = storedTheme === "dark" || storedTheme === "light"
      ? storedTheme
      : systemPrefersDark
        ? "dark"
        : "light"

    document.documentElement.classList.toggle("dark", activeTheme === "dark")
  }, [])

  return <>{children}</>
}
