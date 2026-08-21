"use client"

import * as React from "react"
import { useConfig, themes, grays, getThemeCss } from "@/hooks/use-config"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CheckIcon, MoonIcon, SunIcon, MonitorIcon } from "lucide-react"
import { cn } from "@/lib/utils"

function SectionLine() {
  return <div className="h-px w-full bg-border" role="separator" />
}

export function ThemeCustomizer() {
  const [config, setConfig] = useConfig()
  const { theme: mode, setTheme: setMode, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const isDark = resolvedTheme === "dark"

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    const selectedTheme = themes[config.theme]

    if (selectedTheme) {
      const colors = getThemeCss(selectedTheme, isDark)
      root.style.setProperty("--primary", colors.hsl)
      root.style.setProperty("--primary-foreground", colors.foreground)
      root.style.setProperty("--primary-gradient", colors.gradient)
      if (colors.gradient !== "none") {
        root.setAttribute("data-primary-gradient", "true")
      } else {
        root.removeAttribute("data-primary-gradient")
      }
    }

    root.style.setProperty("--radius", `${config.radius}rem`)
  }, [config, mounted, isDark])

  if (!mounted) return null

  const colorThemes = Object.entries(themes).filter(([name]) => name !== "primary")
  const blackTheme = themes.primary
  const isBlackTheme = config.theme === "primary"

  return (
    <div className="flex flex-col space-y-4 md:space-y-6">
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">Theme</Label>
        <div className="flex flex-wrap gap-2 py-1.5">
          <button
            type="button"
            onClick={() => setConfig({ theme: "primary" })}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border-2 bg-background px-3 py-1.5 text-sm font-medium transition-all",
              isBlackTheme ? "border-foreground" : "border-border hover:border-foreground/40"
            )}
            title={blackTheme.label}
          >
            <span
              className="size-4 shrink-0 rounded-full border border-black/15"
              style={{ background: blackTheme.gradient ?? blackTheme.activeColor }}
            />
            Black
          </button>
        </div>
      </div>

      <SectionLine />

      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">Primary Color</Label>
        <div className="grid grid-cols-7 gap-2 py-1.5">
          {colorThemes.map(([name, theme]) => {
            const isActive = config.theme === name
            return (
              <button
                key={name}
                onClick={() => setConfig({ theme: name as keyof typeof themes })}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 border-transparent transition-all hover:scale-110",
                  isActive && "border-primary"
                )}
                title={theme.label}
              >
                <span
                  className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full"
                  style={{ background: theme.activeColor }}
                >
                  {isActive && <CheckIcon className="size-3 text-white" />}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      
      <SectionLine />

      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">Gray Color</Label>
        <div className="grid grid-cols-7 gap-2 py-1.5">
          {Object.entries(grays).map(([name, gray]) => {
            const isActive = config.gray === name
            return (
              <button
                key={name}
                onClick={() => setConfig({ gray: name as keyof typeof grays })}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 border-transparent transition-all hover:scale-110",
                  isActive && "border-primary"
                )}
                title={gray.label}
              >
                <span
                  className="flex size-6 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: gray.activeColor }}
                >
                  {isActive && <CheckIcon className="size-3 text-white" />}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <SectionLine />

      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">Radius</Label>
        <div className="grid grid-cols-4 gap-2 py-1.5">
          {[0, 0.25, 0.375, 0.5, 0.625, 0.75, 1.0].map((value) => {
            return (
              <Button
                key={value}
                variant="outline"
                size="sm"
                onClick={() => setConfig({ radius: value })}
                className={cn(
                    "h-8 px-2",
                    config.radius === value && "border-2 border-primary ring-1 ring-primary"
                )}
              >
                {value}
              </Button>
            )
          })}
        </div>
      </div>
      
      <SectionLine />

      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">Mode</Label>
        <div className="grid grid-cols-3 gap-2 py-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMode("light")}
            className={cn("h-8 px-2", mode === "light" && "border-2 border-primary ring-1 ring-primary")}
          >
            <SunIcon className="mr-2 size-3.5" />
            Light
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMode("dark")}
            className={cn("h-8 px-2", mode === "dark" && "border-2 border-primary ring-1 ring-primary")}
          >
            <MoonIcon className="mr-2 size-3.5" />
            Dark
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMode("system")}
            className={cn("h-8 px-2", mode === "system" && "border-2 border-primary ring-1 ring-primary")}
          >
            <MonitorIcon className="mr-2 size-3.5" />
            System
          </Button>
        </div>
      </div>
    </div>
  )
}
