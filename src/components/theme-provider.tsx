"use client"

import * as React from "react"

type Theme = string

type Attribute = "class" | `data-${string}`

type ThemeProviderProps = React.PropsWithChildren<{
  themes?: Theme[]
  forcedTheme?: Theme
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
  enableColorScheme?: boolean
  storageKey?: string
  defaultTheme?: Theme
  attribute?: Attribute
  value?: Record<Theme, string>
}>

type UseThemeProps = {
  themes: Theme[]
  forcedTheme?: Theme
  setTheme: React.Dispatch<React.SetStateAction<Theme>>
  theme: Theme
  resolvedTheme: Theme
  systemTheme?: "light" | "dark"
}

const ThemeContext = React.createContext<UseThemeProps | undefined>(undefined)

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(
  theme: Theme,
  resolvedTheme: Theme,
  attribute: Attribute,
  themes: Theme[],
  value?: Record<Theme, string>,
  enableColorScheme = true,
) {
  const root = document.documentElement
  const activeTheme = value?.[resolvedTheme] ?? resolvedTheme
  const themeValues = value ? Object.values(value) : themes

  if (attribute === "class") {
    root.classList.remove(...themeValues.filter(Boolean))
    root.classList.add(activeTheme)
  } else {
    if (activeTheme) {
      root.setAttribute(attribute, activeTheme)
    } else {
      root.removeAttribute(attribute)
    }
  }

  if (enableColorScheme) {
    root.style.colorScheme = resolvedTheme === "system" ? getSystemTheme() : resolvedTheme
  }
}

function disableTransitionOnChange() {
  const style = document.createElement("style")
  style.textContent = "*,*::before,*::after{transition:none!important;animation:none!important;}"
  document.head.appendChild(style)
  window.getComputedStyle(document.body)
  window.setTimeout(() => {
    document.head.removeChild(style)
  }, 1)
}

export function ThemeProvider({
  children,
  themes = ["light", "dark"],
  enableSystem = true,
  disableTransitionOnChange: disableTransition = false,
  enableColorScheme = true,
  storageKey = "theme",
  defaultTheme,
  attribute = "class",
  value,
}: ThemeProviderProps) {
  const normalizedDefaultTheme = defaultTheme ?? (enableSystem ? "system" : "light")
  const themeList = enableSystem ? [...themes, "system"] : themes
  const [theme, setTheme] = React.useState<Theme>(normalizedDefaultTheme)
  const [systemTheme, setSystemTheme] = React.useState<"light" | "dark">("light")
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const updateSystemTheme = () => setSystemTheme(media.matches ? "dark" : "light")

    updateSystemTheme()
    media.addEventListener("change", updateSystemTheme)
    return () => media.removeEventListener("change", updateSystemTheme)
  }, [])

  React.useEffect(() => {
    try {
      const storedTheme = localStorage.getItem(storageKey)
      const initialTheme = storedTheme && themeList.includes(storedTheme) ? storedTheme : normalizedDefaultTheme
      setTheme(initialTheme)
    } catch (error) {
      setTheme(normalizedDefaultTheme)
    }
    setMounted(true)
  }, [normalizedDefaultTheme, storageKey, themeList])

  const resolvedTheme = React.useMemo(() => {
    if (theme === "system") {
      return enableSystem ? systemTheme : normalizedDefaultTheme
    }
    return theme
  }, [enableSystem, normalizedDefaultTheme, systemTheme, theme])

  React.useEffect(() => {
    if (!mounted) {
      return
    }

    applyTheme(theme, resolvedTheme, attribute, themes, value, enableColorScheme)

    if (disableTransition) {
      disableTransitionOnChange()
    }
  }, [attribute, disableTransition, enableColorScheme, mounted, resolvedTheme, theme, themes, value])

  const setThemeState = React.useCallback<React.Dispatch<React.SetStateAction<Theme>>>(
    (nextTheme) => {
      setTheme((currentTheme) => {
        const updatedTheme = typeof nextTheme === "function" ? nextTheme(currentTheme) : nextTheme
        try {
          localStorage.setItem(storageKey, updatedTheme)
        } catch (error) {
          // Ignore localStorage errors in restricted environments
        }
        return updatedTheme
      })
    },
    [storageKey],
  )

  const contextValue = React.useMemo(
    () => ({
      themes: themeList,
      forcedTheme: undefined,
      setTheme: setThemeState,
      theme,
      resolvedTheme,
      systemTheme,
    }),
    [setThemeState, theme, resolvedTheme, systemTheme, themeList],
  )

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
